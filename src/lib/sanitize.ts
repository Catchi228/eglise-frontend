/** Retire les balises HTML et normalise les espaces (mitigation XSS stockage). */
export function sanitizeText(input: string, maxLen = 10_000): string {
  const stripped = input
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
  return stripped.length > maxLen ? stripped.slice(0, maxLen) : stripped;
}

export function sanitizeEmail(input: string): string {
  return sanitizeText(input, 190).toLowerCase();
}
