/**
 * Deletes stale unverified Firebase Auth users, optionally removing matching
 * Firestore user docs in the same pass.
 *
 * Usage:
 *   npx tsx scripts/cleanup-unverified-users.ts --dry-run
 *   npx tsx scripts/cleanup-unverified-users.ts --days 7
 *   npx tsx scripts/cleanup-unverified-users.ts --days 14 --delete-firestore-docs
 */

import { getAuth, UserRecord } from "firebase-admin/auth";
import { getAdminApp, getAdminDb } from "../src/lib/firebase-admin";

function parseArgs() {
  const args = process.argv.slice(2);
  const getArg = (flag: string) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
  };

  const days = Number.parseInt(getArg("--days") ?? "7", 10);
  if (!Number.isFinite(days) || days < 1) {
    throw new Error("--days must be a positive integer");
  }

  return {
    days,
    dryRun: args.includes("--dry-run"),
    deleteFirestoreDocs: args.includes("--delete-firestore-docs"),
  };
}

function isStaleUnverifiedUser(user: UserRecord, cutoffMs: number) {
  if (user.emailVerified) return false;
  const creationMs = Date.parse(user.metadata.creationTime);
  if (!Number.isFinite(creationMs) || creationMs > cutoffMs) return false;

  const lastSignInMs = user.metadata.lastSignInTime
    ? Date.parse(user.metadata.lastSignInTime)
    : Number.NaN;

  return !Number.isFinite(lastSignInMs) || lastSignInMs <= cutoffMs;
}

function hasMeaningfulUserData(data: Record<string, unknown> | undefined) {
  if (!data) return false;

  const meaningfulKeys = [
    "startDate",
    "startWeight",
    "startPictureUrl",
    "workoutTier",
    "workoutDays",
    "currentLevelId",
    "trialEndsAt",
    "isPro",
    "stripeCustomerId",
    "stripeSubscriptionId",
    "subscriptionStatus",
    "workoutStats",
  ] as const;

  if (meaningfulKeys.some((key) => data[key] !== undefined && data[key] !== null)) {
    return true;
  }

  if (Array.isArray(data.workoutLogs) && data.workoutLogs.length > 0) {
    return true;
  }

  return false;
}

async function main() {
  const { days, dryRun, deleteFirestoreDocs } = parseArgs();
  const auth = getAuth(getAdminApp());
  const db = getAdminDb();
  const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;

  const allUsers: UserRecord[] = [];
  let pageToken: string | undefined;
  do {
    const result = await auth.listUsers(1000, pageToken);
    allUsers.push(...result.users);
    pageToken = result.pageToken;
  } while (pageToken);

  const staleUsers: UserRecord[] = [];
  const skippedUsers: { uid: string; email: string | undefined }[] = [];

  for (const user of allUsers) {
    if (!isStaleUnverifiedUser(user, cutoffMs)) continue;
    const userDoc = await db.collection("users").doc(user.uid).get();
    if (hasMeaningfulUserData(userDoc.data())) {
      skippedUsers.push({ uid: user.uid, email: user.email });
      continue;
    }
    staleUsers.push(user);
  }

  console.log(
    `${dryRun ? "[dry-run] " : ""}Found ${staleUsers.length} stale unverified user${staleUsers.length === 1 ? "" : "s"} older than ${days} day${days === 1 ? "" : "s"}.`,
  );

  if (skippedUsers.length > 0) {
    console.log(
      `${dryRun ? "[dry-run] " : ""}Skipped ${skippedUsers.length} stale unverified user${skippedUsers.length === 1 ? "" : "s"} because they have meaningful Firestore data.`,
    );
    skippedUsers.forEach((user) => {
      console.log(
        `${dryRun ? "[dry-run] " : ""}skipped ${user.uid} ${user.email ?? "(no email)"}`,
      );
    });
  }

  if (staleUsers.length === 0) {
    return;
  }

  staleUsers.forEach((user) => {
    console.log(
      `${dryRun ? "[dry-run] " : ""}${user.uid} ${user.email ?? "(no email)"} created=${user.metadata.creationTime} lastSignIn=${user.metadata.lastSignInTime ?? "never"}`,
    );
  });

  if (dryRun) {
    return;
  }

  for (const user of staleUsers) {
    await auth.deleteUser(user.uid);
    if (deleteFirestoreDocs) {
      await db.collection("users").doc(user.uid).delete().catch((err: unknown) => {
        console.error(`Failed to delete Firestore doc for ${user.uid}:`, err);
      });
    }
  }

  console.log(
    `Deleted ${staleUsers.length} Firebase Auth user${staleUsers.length === 1 ? "" : "s"}${deleteFirestoreDocs ? " and matching Firestore docs" : ""}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
