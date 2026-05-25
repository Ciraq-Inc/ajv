# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server on port 4000 (0.0.0.0)
npm run build        # Production build
npm run clean-build  # Wipe .nuxt/.output then build
npm run preview      # Preview production build
node scripts/check-service-layer.mjs  # Lint for direct fetch() calls outside services/
```

**Playwright tests** (requires dev server running on port 4000 and `tests/auth-state.json`):
```bash
npx playwright test                                    # All tests
npx playwright test tests/professional-feature.test.js # Single file
```

**Environment:** copy `.env.example` to `.env` and set:
- `NUXT_PUBLIC_API_BASE` / `API_BASE_URL` — backend URL (e.g. `http://localhost:3009`)
- Firebase env vars (`FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, etc.)
- `NUXT_PUBLIC_PAYSTACK_PUBLIC_KEY`

---

## Architecture

### Data flow

```
Pages/Components → Composables → Pinia Stores → Services → useApi (single fetch wrapper)
```

**SSR is disabled** (`ssr: false`). All code runs client-side only.

### `composables/useApi.ts` — the only fetch wrapper

Every HTTP call in the app must flow through `useApi()`. It owns:
- Base URL from `runtimeConfig.public.apiBase`
- Token injection: resolves the correct Bearer token by inspecting the URL prefix and localStorage (`adminToken`, `customerAuthToken`, `company_<domain>_token`, etc.)
- `{ success, data, message }` envelope parsing
- `ApiError` with `.status` for HTTP failures
- `getBlob()` for CSV/file downloads

**Do not call `fetch`, `$fetch`, or `useFetch` anywhere outside `useApi.ts`.** Run `node scripts/check-service-layer.mjs` to find violations.

### `services/` — HTTP details live here

One factory function per domain at `services/<domain>/<domain>Service.ts` (some have parallel `.js` files during migration). Services:
- Accept an `api` instance (from `useApi()`) as their sole parameter
- Return plain objects of async functions; no classes, no singletons
- Map camelCase args to `snake_case` wire fields
- Never inspect `result.success` or touch Pinia state — that's the store's job
- Never `try/catch` — let errors propagate to the store

```ts
// Pattern
export const createOrdersService = (api: ApiInstance) => ({
  create({ companyId, items }) {
    return api.post('/api/orders', { company_id: companyId, items });
  },
});
```

Stores instantiate services via private `_xxxService()` helpers that call `createXxxService(useApi())`.

### `stores/` — orchestration and reactive state

Five stores: `admin.ts`, `cart.ts`, `company.ts`, `pharmacy.ts`, `user.ts`.

| Store | Manages |
|-------|---------|
| `admin` | Platform admin session (JWT, TOTP/WebAuthn MFA, role hierarchy) |
| `company` | Company-portal user session (`/[domain]/services/*` routes) |
| `user` | Customer (end-user) session, orders, location |
| `pharmacy` | Active pharmacy context resolved from URL slug |
| `cart` | Cart items scoped to an active pharmacy |

All stores: set `isLoading`/`error`, call services, persist tokens to localStorage, re-throw errors so components can react.

### `middleware/` — route guards

| File | Protects |
|------|---------|
| `adminAuth.js` | `/admin/*` — requires `adminStore.isAuthenticated` + valid token |
| `dataConsumerAuth.js` | `/data/*` — same as admin but enforces `role === 'data_consumer'` |
| `companyAuth.js` | `/[domain]/services/*` — requires `companyStore.isLoggedIn` |
| `pharmacy.js` | `[pharmacy]` routes — resolves slug → ID, sets pharmacy + cart context |
| `admin.js` | Pharmacy-level admin check (separate from platform admin) |

### `plugins/init-stores.js`

Runs on `app:created`. Rehydrates all stores from localStorage, initializes auth state, and resolves the pharmacy slug from the URL if present.

### Route structure

- `/` — pharmacy selection homepage
- `/[pharmacy]/*` — customer-facing pharmacy storefront (products, orders, services)
- `/admin/*` — platform admin portal (requires `adminAuth` middleware)
- `/admin/login` — TOTP/WebAuthn MFA login (branches on `response.mfa_method`)
- `/[domain]/services/*` — company portal for pharmacy staff (requires `companyAuth` middleware)
- `/customer/*` — customer account pages
- `/data/*` — data consumer reports (requires `dataConsumerAuth` middleware)
- `/jobs` — job board

### Token storage in localStorage

| Key | Used by |
|-----|---------|
| `adminToken` | Admin portal |
| `customerAuthToken` | Customer sessions |
| `company_<domain>_token` | Company portal (domain-scoped) |
| `companyAuthToken` | Company portal fallback |
| `driver_token` / `dispatch_token` | Driver/dispatch endpoints |

`useApi.ts` resolves these in priority order based on the endpoint path prefix.

### `services/types.ts`

Single source of truth for all shared TypeScript interfaces (`ApiEnvelope<T>`, `ApiInstance`, domain models). Import shared types from here; do not duplicate.

### Ongoing service-layer migration

The repo is mid-migration from direct `fetch()` calls to the service pattern. `scripts/check-service-layer.mjs` reports remaining violations (exits 0 — report only, not a gate yet). Migrate one domain per PR following the pattern in `docs/architecture/0001-service-layer.md`. Do **not** combine domains.
