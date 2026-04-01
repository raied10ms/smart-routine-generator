/**
 * Convert Arabic numerals to Bangla numerals.
 * Usage: toBanglaNum(12) → "১২"
 */
export const toBanglaNum = (n: number): string =>
  String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);
