/**
 * One-off migration: remap Advanced track level IDs from the old 8-level
 * scheme (1A, 1B, 1C, 1D, 2, 3, 4, grad) to the new 6-level scheme
 * (F, 1, 2, 3, 4, E) — Foundation, Level 1-4, Elite.
 *
 * Updates, for every user with workoutTier === "advanced":
 *  - currentLevelId
 *  - the level portion of each workoutLogs[].levelCompleted string,
 *    e.g. "1C(N)" -> "1(N)"
 *
 * Usage:
 *   npx tsx scripts/migrate-advanced-levels.ts --dry-run
 *   npx tsx scripts/migrate-advanced-levels.ts
 *
 * Requires the same env vars as the app (FIREBASE_SERVICE_ACCOUNT_KEY or
 * default credentials) — see src/lib/firebase-admin.ts.
 */

import { getAdminDb } from "../src/lib/firebase-admin";

const LEVEL_ID_MAP: Record<string, string> = {
  "1A": "F",
  "1B": "F",
  "1C": "1",
  "1D": "2",
  "2": "3",
  "3": "4",
  "4": "E",
  "grad": "E",
};

const LEVEL_COMPLETED_PATTERN = /^(.+)\(([NCH])\)$/;

function remapLevelId(levelId: string): string {
  return LEVEL_ID_MAP[levelId] ?? levelId;
}

function remapLevelCompleted(levelCompleted: string): string {
  const match = levelCompleted.match(LEVEL_COMPLETED_PATTERN);
  if (!match) return levelCompleted;
  const [, levelId, mode] = match;
  return `${remapLevelId(levelId)}(${mode})`;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const db = getAdminDb();

  const snapshot = await db
    .collection("users")
    .where("workoutTier", "==", "advanced")
    .get();

  console.log(`Found ${snapshot.size} advanced-track users.`);

  let batch = db.batch();
  let batchCount = 0;
  let updatedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const update: Record<string, unknown> = {};

    if (typeof data.currentLevelId === "string") {
      const remapped = remapLevelId(data.currentLevelId);
      if (remapped !== data.currentLevelId) {
        update.currentLevelId = remapped;
      }
    }

    const logs = Array.isArray(data.workoutLogs) ? data.workoutLogs : [];
    let logsChanged = false;
    const remappedLogs = logs.map((log) => {
      if (typeof log?.levelCompleted !== "string") return log;
      const remapped = remapLevelCompleted(log.levelCompleted);
      if (remapped !== log.levelCompleted) {
        logsChanged = true;
        return { ...log, levelCompleted: remapped };
      }
      return log;
    });
    if (logsChanged) {
      update.workoutLogs = remappedLogs;
    }

    if (Object.keys(update).length === 0) continue;

    updatedCount++;
    if (dryRun) {
      console.log(`[dry-run] ${doc.id}:`, update);
      continue;
    }

    batch.update(doc.ref, update);
    batchCount++;
    if (batchCount === 500) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (!dryRun && batchCount > 0) {
    await batch.commit();
  }

  console.log(
    `${dryRun ? "[dry-run] " : ""}Updated ${updatedCount} of ${snapshot.size} advanced-track users.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
