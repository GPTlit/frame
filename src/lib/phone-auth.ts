/** Keeps only digits so "+222 22 33 44 55" and "22233445 5" match. */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Internal sign-in address derived from the phone number (never shown, never emailed). */
export function phoneLoginEmail(digits: string): string {
  return `p${digits}@members.frame-ceo.app`;
}
