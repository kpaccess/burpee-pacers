import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminApp } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { isServerAdmin } from "@/lib/admin-emails";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /api/analytics/visit
 * Atomically increments the page-view counter in Firestore.
 * Called client-side from LandingPage on every mount.
 * If the request includes a valid ID token belonging to an admin, the visit
 * is silently skipped so admin page-loads don't inflate the counter.
 */
export async function POST(req: NextRequest) {
  try {
    // Skip counting if the request comes from an admin user.
    const authHeader = req.headers.get("authorization") ?? "";
    const idToken = authHeader.replace("Bearer ", "").trim();
    if (idToken) {
      try {
        const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
        if (isServerAdmin(decoded.email)) {
          return NextResponse.json({ ok: true, skipped: true });
        }
      } catch {
        // Invalid token — treat as anonymous visitor and count normally.
      }
    }

    const db = getAdminDb();
    const statsRef = db.collection("analytics").doc("stats");
    const today = new Date().toISOString().slice(0, 10);
    await statsRef.set({
      pageViews: FieldValue.increment(1),
      dailyViews: { [today]: FieldValue.increment(1) },
    }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error recording page view:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
