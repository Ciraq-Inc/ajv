/**
 * Returns `value` only if it is a same-origin path ("/admin/..."), otherwise null.
 * Used before navigating to a path read from storage or the URL, so a tampered value
 * cannot send an admin to another site after login.
 */
export const safeInternalPath = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string' || !value.startsWith('/')) return null
  // "//host" and "/\host" are protocol-relative to browsers; control characters get stripped by URL parsers.
  if (value.startsWith('//') || value.startsWith('/\\')) return null
  if (/[\u0000-\u001f\u007f]/.test(value)) return null
  return value
}
