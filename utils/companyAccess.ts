// What each kind of pharmacy staff sees in the portal. Mirrors the server's role ladder
// (rigel-medsgh src/middlewares/companyRole.js). The server is the real gate; this keeps the
// menu and landing page honest so nobody is sent to a screen that will only say "denied".

const ROLE_RANK: Record<string, number> = {
  user: 1,
  cashier: 1,
  assistant: 1,
  pharmacist: 2,
  third_party_poster: 2,
  manager: 3,
  owner: 4,
  company: 4,
  admin: 5,
  super_admin: 6,
}

const normalizeRole = (role: unknown): string =>
  String(role ?? '').trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')

export const companyRoleRank = (role: unknown): number => ROLE_RANK[normalizeRole(role)] || 0

// Pages that change how the pharmacy runs (its riders, its staff, its hours, its storefront, its API keys).
const MANAGER_PAGES = new Set(['riders', 'user-access', 'store-hours', 'store-settings', 'developers'])
// A recruiter account belongs to the hiring board and the wallet, nothing else.
const POSTER_PAGES = new Set(['rigel-boards', 'sms-billing'])
const ALWAYS_OPEN = new Set(['login', 'support'])

export const serviceSlugOf = (path: string): string => {
  const match = /\/services(?:\/([^/?#]+))?/.exec(path || '')
  return match?.[1] ?? ''
}

export const canOpenServicePage = (role: unknown, slug: string): boolean => {
  if (ALWAYS_OPEN.has(slug)) return true
  if (normalizeRole(role) === 'third_party_poster') return POSTER_PAGES.has(slug)
  if (MANAGER_PAGES.has(slug)) return companyRoleRank(role) >= ROLE_RANK.manager!
  return true
}

export const defaultServicePage = (role: unknown): string =>
  normalizeRole(role) === 'third_party_poster' ? 'rigel-boards' : 'orders'

const atLeastManager = (role: unknown): boolean => companyRoleRank(role) >= ROLE_RANK.manager!

// Starting, resuming, resending or deleting a campaign spends the pharmacy's credits.
export const canSendSmsCampaigns = (role: unknown): boolean => atLeastManager(role)

// Buying credits: managers for the pharmacy, and a recruiter account for its own wallet.
export const canBuySmsCredits = (role: unknown): boolean =>
  atLeastManager(role) || normalizeRole(role) === 'third_party_poster'
