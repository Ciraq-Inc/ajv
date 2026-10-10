// utils/emailLinkToken.ts
//
// Emailed verification and reset links carry their one-time token in the URL
// FRAGMENT (`#token=...`), never the query string. Browsers do not send the
// fragment to any server, so the token stays out of proxy access logs and
// Referer headers. The landing page reads it here, POSTs it to the API, and
// removes it from the address bar.

// Matches what the backend issues (base64url) and accepts.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,128}$/

/** Read the token from `location.hash`. Returns null unless exactly one well-formed token is present. */
export function readTokenFromHash(hash: string): string | null {
  const fragment = String(hash ?? '').replace(/^#/, '')
  if (!fragment) return null

  const values: string[] = []
  for (const part of fragment.split('&')) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    if (part.slice(0, eq) === 'token') values.push(part.slice(eq + 1))
  }

  if (values.length !== 1) return null
  return TOKEN_PATTERN.test(values[0]) ? values[0] : null
}

interface ScrubTarget {
  location: { pathname: string; search: string; hash: string }
  history: { state: unknown; replaceState: (state: unknown, unused: string, url: string) => void }
}

/**
 * Remove the fragment from the address bar (replacing the entry, not adding one) so the
 * token does not linger in history, screenshots or a copied URL. Never throws.
 */
export function scrubTokenFromUrl(target: ScrubTarget): void {
  if (!target.location.hash) return
  try {
    target.history.replaceState(target.history.state, '', target.location.pathname + target.location.search)
  } catch {
    // Cosmetic hardening only; the page must still work if the browser refuses.
  }
}
