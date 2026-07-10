import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { getAdminApp } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";

function sanitizeRedirectUrl(
  candidate: unknown,
  fallbackPath: string,
  baseUrl: string,
): string {
  if (typeof candidate !== "string" || !candidate.trim()) {
    return `${baseUrl}${fallbackPath}`;
  }

  try {
    const parsed = new URL(candidate, baseUrl);
    return parsed.origin === baseUrl ? parsed.toString() : `${baseUrl}${fallbackPath}`;
  } catch {
    return `${baseUrl}${fallbackPath}`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userEmail, plan, successUrl: customSuccessUrl, cancelUrl: customCancelUrl } = await req.json();

    const priceId = plan === "yearly"
      ? process.env.STRIPE_PRO_YEARLY_PRICE_ID
      : process.env.STRIPE_PRO_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price ID not configured" },
        { status: 500 },
      );
    }

    // Use env var if set (production), otherwise derive from the incoming request origin (local dev)
    const { origin } = new URL(req.url);
    const baseUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || origin).origin;

    const successUrl = sanitizeRedirectUrl(
      customSuccessUrl,
      "/success?session_id={CHECKOUT_SESSION_ID}",
      baseUrl,
    );
    const cancelUrl = sanitizeRedirectUrl(customCancelUrl, "/pricing", baseUrl);

    // Determine authenticated userId from token if present
    const authHeader = req.headers.get("authorization") ?? "";
    const idToken = authHeader.replace("Bearer ", "").trim();
    let verifiedUserId: string | null = null;
    if (idToken) {
      try {
        const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
        verifiedUserId = decoded.uid;
      } catch {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Build session differently depending on whether the user is already logged in.
    // Avoids conditional spread, which can break Stripe's strict TS types.
    let session;
    if (verifiedUserId) {
      // Logged-in: attach Firebase UID so the webhook updates their Firestore doc directly
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        customer_email: userEmail ?? undefined,
        metadata: { firebaseUserId: verifiedUserId },
        subscription_data: { metadata: { firebaseUserId: verifiedUserId } },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
    } else {
      // Guest: no Firebase UID — Stripe collects the email, webhook stores a
      // pending_subscription by email that gets claimed at signup
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Stripe checkout error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
