import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminApp } from "@/lib/firebase-admin";
import { isServerAdmin, logAdminCheckFailure } from "@/lib/admin-emails";
import { getAuth } from "firebase-admin/auth";

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const idToken = authHeader.replace("Bearer ", "").trim();

    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
    if (!decoded.email_verified || !isServerAdmin(decoded.email)) {
      logAdminCheckFailure(decoded.email, decoded.email_verified);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { uid, isTestUser } = await req.json();
    if (typeof uid !== "string" || typeof isTestUser !== "boolean") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await getAdminDb().collection("users").doc(uid).update({ isTestUser });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error toggling test user:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
