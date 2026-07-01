export function getAdminEmails(): string[] {
  // Client-only helper for UI affordances such as showing the admin button.
  // Server-side authorization must use ADMIN_EMAILS via src/lib/admin-emails.ts.
  return (
    process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) ?? []
  );
}

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

/**
 * Sync check — only looks at env vars. Safe to call client-side or in
 * contexts where Firestore is unavailable (e.g. middleware).
 */
export function isAllowlisted(email: string | null | undefined): boolean {
  if (!email) return false;
  const lower = email.toLowerCase();
  const adminEmails = getAdminEmails();
  const allowlistedEmails =
    process.env.ALLOWLISTED_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) ?? [];
  return adminEmails.includes(lower) || allowlistedEmails.includes(lower);
}
