import "server-only";

function parseEmailList(value: string | undefined): string[] {
  return value?.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean) ?? [];
}

export function getServerAdminEmails(): string[] {
  return parseEmailList(process.env.ADMIN_EMAILS);
}

export function isServerAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return getServerAdminEmails().includes(email.toLowerCase());
}
