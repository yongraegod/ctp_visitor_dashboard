/**
 * Automatically formats Korean phone number inputs into standardized hyphenated format (e.g., 010-0000-0000, 02-0000-0000)
 */
export function formatPhoneNumber(value: string): string {
  if (!value) return '';

  // Extract digits only
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length === 0) return '';

  // Special handling for Seoul landline numbers starting with '02'
  if (digits.startsWith('02')) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) {
      return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    }
    if (digits.length <= 9) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    }
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  // Standard mobile (010, 011, 016, 017, 018, 019) & regional numbers (031, 032, 042, etc.)
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  if (digits.length <= 10) {
    // 10 digits: e.g. 010-1234-567 or 031-123-4567
    // If it starts with mobile prefix (010, 011, 016, 017, 018, 019), format as 010-1234-567 while typing towards 11
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  // 11 digits: 010-1234-5678
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}
