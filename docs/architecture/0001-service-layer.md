# 0001 — Service layer for HTTP access

- Status: Accepted
- Date: 2026-05-15
- Sprint: 2 (frontend-service-layer)
- Repo: `ajv` (Nuxt 3 customer/admin app)

## Context

Today, most Pinia stores in `stores/` and several pages/components call
`fetch(...)` directly with a hand-rolled `Bearer <token>` header and
inline envelope parsing. The sibling app `rOS-v2` has already converged
on a service layer (`app/services/*.ts`) where stores hold reactive
state and orchestrate, and HTTP details live in single-file-per-domain
services. The audit at the time of this ADR shows 95 direct
`fetch(`/`$fetch(`/`useFetch(` hits across 41 files in `ajv` — the
report is produced by `scripts/check-service-layer.mjs`.

This ADR locks in the target architecture and migrates one domain
end-to-end as a worked example. Subsequent domains follow the same
template incrementally; doing the whole repo in one PR is unmergeable.

## Decision

### 1. Layering

```
Pages/Components  ──▶  Composables  ──▶  Pinia Stores  ──▶  Services  ──▶  useApi (single fetch wrapper)
```

Rules:

- **Components are thin.** They never call `fetch`, `$fetch`,
  `useFetch`, or a service directly. They read state from a store or a
  composable and call store actions / composable functions.
- **Stores are orchestrators.** They hold reactive state, manage
  `isLoading` / `error`, do auth guards, and call services. They never
  call `fetch` directly.
- **Composables** are the cross-store bridge layer (Nuxt-idiomatic).
  They may call services and stores; they should not call `fetch`
  directly either.
- **Services** are the single home for HTTP details (path, method,
  payload shape, query-string assembly). They never touch Pinia state.
- **`useApi`** in `composables/useApi.js` is the single fetch wrapper.
  It owns base URL resolution (`runtimeConfig.public.apiBase`), token
  injection from the appropriate auth store, and HTTP-level error
  surfacing. It is the *only* file allowed to call `fetch(` directly.

### 2. Service file shape

One file per domain at `services/<domain>/<domain>Service.js`. Each
service is a small **factory function** that takes an `api` (the
`useApi()` wrapper) and returns a plain object of async functions:

```js
// services/orders/ordersService.js
export const createOrdersService = (api) => ({
  create({ companyId, items, notes }) {
    return api.post('/api/orders', { company_id: companyId, items, notes });
  },
  cancel(orderId, { companyId } = {}) {
    return api.put(`/api/orders/${orderId}/cancel`, { company_id: companyId });
  },
  // ...
});
```

Conventions:

- **No classes, no singletons.** Just named exports / a factory.
- **No envelope handling in the service.** The server returns
  `{ success, data, message }`; the *store* inspects that and throws on
  `success === false`. This keeps services trivially testable and lets
  multiple callers attach different recovery behavior.
- **camelCase in service args**, `snake_case` only at the wire boundary.
  The service converts.
- Optional query params are stripped (don't send `undefined`).
- No `try/catch` inside services. Let errors propagate so the store /
  composable can attach context.

### 3. Error handling

- `useApi` throws on `!response.ok` with the parsed `message`.
- Service functions let that throw bubble.
- Store actions wrap each call in `try/catch`, set `this.error =
  err.message`, then re-throw so the caller (component) can react.
- Components display `store.error` reactively; they do not re-implement
  error parsing.

### 4. State lives in the store, not the service

Services return raw response payloads. Stores own arrays/objects of
domain entities (`orders`, `currentOrder`, etc.) when caching is
needed. Until a domain explicitly needs caching, services can be
stateless and the store can pass results straight back to consumers
(this is what `user.js` does for orders today and we kept it that way).

### 5. Migration cadence

This ADR's PR migrates one domain (orders) as the template. Future PRs
migrate one domain each, ideally < 300-line diffs. After each PR,
`scripts/check-service-layer.mjs` total decreases.

The script is **report-only** today (exits 0). Once stores hit zero
direct calls, flip its scope to error (gate). Components & pages will
take longer; they often have a mix of UI-state mutations and fetch and
need a composable extraction first.

## Worked example: orders domain

Before:

- `stores/user.js` had 5 `fetch(` calls inline:
  `processDirectOrder`, `getOrderHistory`, `getAllOrders`,
  `getOrderDetails`, `cancelOrder`. Each built headers, stringified the
  body, parsed JSON, and threw on `!data.success`.

After:

- New `services/orders/ordersService.js` (factory; ~60 LOC) owns the
  HTTP details for all five operations.
- `stores/user.js` keeps the same public action names and return
  shapes; each action now builds the args, delegates to the service via
  `this._ordersService()`, and keeps the envelope + auth-guard logic.
- Consumers (`components/CartSidebar.vue`, `components/UserProfile.vue`,
  `components/CancelOrderModal.vue`, `components/customers/orders.vue`,
  `pages/customer/index.vue`, `pages/[pharmacy]/orders.vue`) are
  unchanged — they still call `userStore.<method>` exactly as before.

Lint-script before/after:

- Stores with direct `fetch(`: 4 files, 37 hits  →  4 files, 32 hits.
- `stores/user.js`: 18 hits  →  13 hits (-5, matching the 5 order calls
  pulled out).
- Whole-repo total: ~100 hits  →  95 hits.

## Next-up domains

Rough difficulty assessment to plan future PRs (smallest first
recommended so reviewers internalize the template):

| Domain          | Where           | Hits | Difficulty | Notes |
|-----------------|-----------------|-----:|------------|-------|
| pharmacy        | `stores/pharmacy.js` | 3 | **Easy** | 3 GETs (`/api/companies/:id`, `/api/products`, `/api/companies/domain/:slug`). No auth header needed for two of them — service factory still fine. Smallest follow-up; good "second example" PR. |
| customer auth   | `stores/user.js` (remaining 13) | 13 | Medium | `/api/auth/customer/*`. Touches token persistence on login / `applyCustomerAuthPayload`. Keep the side-effects in the store; service is pure HTTP. |
| company auth    | `stores/company.js` | 11 | Medium | Mirror of customer auth on `/api/company-auth/*`. Do this right after user-auth so the pattern is identical. |
| admin           | `stores/admin.js` | 5 | Medium | Auth + profile + password reset + a generic `apiCall(endpoint)` helper at L180 — the generic helper should be deleted in favor of `useApi`. |
| company misc    | `stores/company.js` L480/L501 | 2 | Easy | Two stragglers outside the auth block — likely a recruiter / job-post call. Roll into the same PR as company auth. |
| wallet + order-requests | `pages/customer/index.vue` | 2 | Easy | Pull into a new `services/wallet/walletService.js` + `services/orderRequests/orderRequestsService.js`. May warrant a `useCustomerDashboard` composable so the page stops doing fetch at all. |
| admin orders    | `pages/admin/orders-new.vue` | 4 | Medium | All four are the same domain — start the admin-orders service. |
| products/drugs  | `pages/drugs.vue` | 2 | Easy | Public product search; lives next to `services/jobs/`. |
| master products | `pages/admin/masterlist.vue` | 1 | Easy | Image upload endpoint; new `services/masterProducts/`. |
| signups         | `pages/admin/signups.vue` | 1 | Easy | One call; fold into `services/admin/`. |
| admin platform  | `pages/admin/{platform-settings,fulfillment/screen}.vue` | ~2 | Medium | Both already use a small `api(url, opts)` helper that re-implements `useApi`. Replace the helper, then convert callers. |
| sales reports   | `pages/data/consumer/sales-reports.vue` | 1 | Easy | Lone call; new `services/reports/`. |
| sms settings    | `pages/admin/sms-settings.vue` | 1 | Easy | Lone call; co-locate in existing `services/sms/`. |
| jobs apply      | `pages/jobs/[id]/apply.vue` | 1 | Easy | `$fetch` to upload-document; service already exists (`services/jobs/applicationsService.js`) — just add `uploadDocument` and wire. |

Do **not** combine multiple domains in one PR. The diffs add up fast
and become unreviewable.

## Consequences

Positive:
- Auth-header / base-URL / error handling fixed in one place.
- Stores shrink and their tests stop needing `fetch` mocks.
- Mocking a service in unit tests is one function pointer.
- Bundle: trivially tree-shakable since services are pure modules.

Negative / costs:
- Net new files (~one per domain).
- Stores grow a `_xxxService()` helper line; minor cognitive cost.
- The lint script is report-only until stores hit zero; until then
  reviewers must enforce the rule by eye on incoming PRs.

## References

- Sibling app reference: `C:/Users/r/Desktop/Directory/rOS-v2/CLAUDE.md`
  and `rOS-v2/app/services/*.ts` (TypeScript; same pattern).
- Existing in-repo examples: `services/jobs/jobsService.js`,
  `services/jobs/applicationsService.js`, `services/sms/*.js`.
- Lint script: `scripts/check-service-layer.mjs`.
