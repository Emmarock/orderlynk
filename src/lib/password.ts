// Password policy shared across registration and seller signup. Mirrors the backend
// @StrongPassword constraint so client-side feedback matches server-side enforcement.

export const PASSWORD_RULE =
  'At least 8 characters with an uppercase letter, a lowercase letter, a number, and a special character.'

/** Returns a human-readable error if the password is too weak, or null when it satisfies the policy. */
export function passwordError(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters.'
  if (pw.length > 100) return 'Password must be at most 100 characters.'
  if (!/[A-Z]/.test(pw)) return 'Password must include an uppercase letter.'
  if (!/[a-z]/.test(pw)) return 'Password must include a lowercase letter.'
  if (!/[0-9]/.test(pw)) return 'Password must include a number.'
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Password must include a special character.'
  return null
}

/** Validate strength then confirmation match; returns the first error, or null when both pass. */
export function validateNewPassword(pw: string, confirm: string): string | null {
  return passwordError(pw) ?? (pw !== confirm ? 'Password and confirmation do not match.' : null)
}