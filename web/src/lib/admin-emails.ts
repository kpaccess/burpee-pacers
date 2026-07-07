import "server-only";

function parseEmailList(value: string | undefined): string[] {
  return value?.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean) ?? [];
}

/**
 * ADMIN_EMAILS is the server-authoritative admin list. If it's unset in a
 * deployment (misconfiguration), fall back to NEXT_PUBLIC_ADMIN_EMAILS
 * rather than failing closed for everyone — that var is already shipped in
 * the client JS bundle, so this fallback doesn't expose anything new. Both
 * vars are expected to hold the same emails; keep them in sync.
 */
export function getServerAdminEmails(): string[] {
  const serverEmails = parseEmailList(process.env.ADMIN_EMAILS);
  if (serverEmails.length > 0) return serverEmails;

  const publicEmails = parseEmailList(process.env.NEXT_PUBLIC_ADMIN_EMAILS);
  if (publicEmails.length > 0) {
    console.warn(
      "ADMIN_EMAILS is not set — falling back to NEXT_PUBLIC_ADMIN_EMAILS. Set ADMIN_EMAILS in this deployment's environment to silence this warning.",
    );
  }
  return publicEmails;
}

export function isServerAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return getServerAdminEmails().includes(email.toLowerCase());
}

/**
 * Server-log-only diagnostic for a rejected admin request. Never exposed to
 * the client — the API routes still return a generic 403. Lets a real admin
 * confirm from Vercel function logs whether the rejection is a missing
 * email_verified flag or an ADMIN_EMAILS list mismatch, without having to
 * guess at a "Sensitive" env var's contents.
 */
export function logAdminCheckFailure(
  email: string | null | undefined,
  emailVerified: boolean | undefined,
): void {
  const configured = getServerAdminEmails();
  console.warn(
    `[admin-auth] rejected — signed-in email: ${email ?? "(none)"}, email_verified: ${emailVerified}, ` +
      `configured admin count: ${configured.length}, match found: ${
        email ? configured.includes(email.toLowerCase()) : false
      }`,
  );
}
