// composables/useApi.ts
// Composable for making authenticated API calls to the backend

import type { ApiEnvelope } from '~/services/types'

// ---------------------------------------------------------------------------
// Augmented error type so we can attach an HTTP status code to thrown errors
// without casting to `any`.
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  status: number
  body?: unknown
  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

// ---------------------------------------------------------------------------
// Option shapes
// ---------------------------------------------------------------------------

/** Options accepted by the `get()` and `getBlob()` methods. */
export interface GetOptions {
  /** Query-string parameters appended to the URL. */
  params?: Record<string, unknown>
  headers?: Record<string, string>
  [key: string]: unknown
}

/** Options accepted by the mutation methods (post/put/patch/delete). */
export interface MutationOptions {
  headers?: Record<string, string>
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// The object returned by useApi()
// ---------------------------------------------------------------------------

export interface ApiInstance {
  get: <T = unknown>(endpoint: string, options?: GetOptions) => Promise<ApiEnvelope<T>>
  post: <T = unknown>(endpoint: string, data?: unknown, options?: MutationOptions) => Promise<ApiEnvelope<T>>
  put: <T = unknown>(endpoint: string, data?: unknown, options?: MutationOptions) => Promise<ApiEnvelope<T>>
  delete: <T = unknown>(endpoint: string, options?: MutationOptions) => Promise<ApiEnvelope<T>>
  request: <T = unknown>(endpoint: string, options?: RequestInit) => Promise<ApiEnvelope<T>>
  getBlob: (endpoint: string, options?: GetOptions) => Promise<Blob>
}

// ---------------------------------------------------------------------------
// Module-level refresh state (safe: SSR is disabled for this app)
// ---------------------------------------------------------------------------

let refreshPromise: Promise<string | null> | null = null

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

/** Resolve the bearer token to inject, following the same priority as before. */
function resolveToken(endpoint: string): string | null {
  if (!process.client) return null

  // Company-domain token (highest priority)
  const companyDomain = window.location.pathname.match(/\/([^/]+)\/services/)?.[1]
  if (companyDomain) {
    const domainToken = localStorage.getItem(`company_${companyDomain}_token`)
    if (domainToken) return domainToken
  }

  // Company store token
  try {
    const companyStore = useCompanyStore()
    if (companyStore?.companyAuthToken) return companyStore.companyAuthToken
  } catch {
    // store not available yet
  }

  // Endpoint-prefix-specific fallbacks
  if (endpoint.startsWith('/api/driver')) {
    const t = localStorage.getItem('driver_token')
    if (t) return t
  } else if (endpoint.startsWith('/api/dispatch')) {
    const t = localStorage.getItem('dispatch_token')
    if (t) return t
  } else if (endpoint.startsWith('/api/admin') || endpoint.startsWith('/api/professionals/admin')) {
    const t = localStorage.getItem('adminToken')
    if (t) return t
  } else if (
    endpoint.startsWith('/api/auth/customer') ||
    endpoint.startsWith('/api/order-requests/customer') ||
    endpoint.startsWith('/api/wallet') ||
    endpoint.startsWith('/api/customer') ||
    endpoint.startsWith('/api/professionals/customer')
  ) {
    const t = localStorage.getItem('customerAuthToken')
    if (t) return t
  }

  // Generic fallback chain
  return (
    localStorage.getItem('adminToken') ??
    localStorage.getItem('driver_token') ??
    localStorage.getItem('customerAuthToken') ??
    localStorage.getItem('token') ??
    localStorage.getItem('companyAuthToken') ??
    null
  )
}

// Decode the `type` claim from a JWT payload without verifying the signature.
// Used to route refreshed tokens to the correct localStorage key when the
// endpoint URL prefix alone isn't enough (e.g. /api/order-requests/admin).
function getTokenType(accessToken: string): string | null {
  try {
    const part = accessToken.split('.')[1]
    if (!part) return null
    const payload = JSON.parse(atob(part)) as { type?: string }
    return payload.type ?? null
  } catch {
    return null
  }
}

function resolveRefreshToken(endpoint: string): string | null {
  if (!process.client) return null

  const companyDomain = window.location.pathname.match(/\/([^/]+)\/services/)?.[1]
  if (companyDomain) {
    return localStorage.getItem(`company_${companyDomain}_refresh_token`)
  }

  if (endpoint.startsWith('/api/admin') || endpoint.startsWith('/api/professionals/admin')) {
    return localStorage.getItem('adminRefreshToken')
  }

  if (
    endpoint.startsWith('/api/auth/customer') ||
    endpoint.startsWith('/api/order-requests/customer') ||
    endpoint.startsWith('/api/wallet') ||
    endpoint.startsWith('/api/customer') ||
    endpoint.startsWith('/api/professionals/customer')
  ) {
    return localStorage.getItem('customerRefreshToken')
  }

  // Unknown endpoint prefix: infer from which access token is currently stored.
  // Admin token takes priority since customers can't reach admin endpoints.
  const currentAdminToken = localStorage.getItem('adminToken')
  if (currentAdminToken) return localStorage.getItem('adminRefreshToken')
  return localStorage.getItem('customerRefreshToken') ?? null
}

function updateStoredTokens(endpoint: string, accessToken: string, refreshToken: string | null): void {
  if (!process.client) return

  const companyDomain = window.location.pathname.match(/\/([^/]+)\/services/)?.[1]
  if (companyDomain) {
    localStorage.setItem(`company_${companyDomain}_token`, accessToken)
    if (refreshToken) localStorage.setItem(`company_${companyDomain}_refresh_token`, refreshToken)
    return
  }

  if (endpoint.startsWith('/api/admin') || endpoint.startsWith('/api/professionals/admin')) {
    localStorage.setItem('adminToken', accessToken)
    if (refreshToken) localStorage.setItem('adminRefreshToken', refreshToken)
    return
  }

  // For endpoints whose URL prefix doesn't indicate the audience (e.g.
  // /api/order-requests/admin, /api/fulfillment/*), decode the refreshed
  // token to determine where to store it. Without this, an admin token
  // refreshed via a non-/api/admin/* URL is stored under customerAuthToken,
  // invalidating the adminRefreshToken on the very next poll cycle.
  const tokenType = getTokenType(accessToken)
  if (tokenType === 'admin') {
    localStorage.setItem('adminToken', accessToken)
    if (refreshToken) localStorage.setItem('adminRefreshToken', refreshToken)
    return
  }

  localStorage.setItem('customerAuthToken', accessToken)
  if (refreshToken) localStorage.setItem('customerRefreshToken', refreshToken)
}

function clearAuthForEndpoint(endpoint: string): void {
  if (!process.client) return

  const companyDomain = window.location.pathname.match(/\/([^/]+)\/services/)?.[1]
  if (companyDomain) {
    localStorage.removeItem(`company_${companyDomain}_token`)
    localStorage.removeItem(`company_${companyDomain}_refresh_token`)
    return
  }

  if (endpoint.startsWith('/api/admin') || endpoint.startsWith('/api/professionals/admin')) {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminRefreshToken')
    return
  }

  if (
    endpoint.startsWith('/api/auth/customer') ||
    endpoint.startsWith('/api/order-requests/customer') ||
    endpoint.startsWith('/api/wallet') ||
    endpoint.startsWith('/api/customer') ||
    endpoint.startsWith('/api/professionals/customer')
  ) {
    localStorage.removeItem('customerAuthToken')
    localStorage.removeItem('customerRefreshToken')
    return
  }

  // Unknown prefix — clear everything so no stale credential remains.
  ;['adminToken', 'adminRefreshToken', 'customerAuthToken', 'customerRefreshToken'].forEach(k =>
    localStorage.removeItem(k)
  )
}

function getLoginUrl(): string {
  if (!process.client) return '/'
  const path = window.location.pathname

  if (path.startsWith('/admin')) return '/admin/login'

  const companyMatch = path.match(/^\/([^/]+)\/services/)
  if (companyMatch) return `/${companyMatch[1]}/services/login`

  const pharmacyMatch = path.match(/^\/([^/]+)/)
  const pharmacySlug = pharmacyMatch?.[1]
  if (pharmacySlug && !['customer', 'jobs', 'data', 'admin'].includes(pharmacySlug)) {
    return `/${pharmacySlug}`
  }

  return '/'
}

// ---------------------------------------------------------------------------
// Refresh-then-retry
// ---------------------------------------------------------------------------

async function tryRefresh(baseURL: string, endpoint: string): Promise<string | null> {
  // Deduplicate concurrent 401s — all latch onto the same in-flight refresh.
  if (refreshPromise) return refreshPromise

  const rawRefreshToken = resolveRefreshToken(endpoint)
  if (!rawRefreshToken) return null

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rawRefreshToken }),
      })
      if (!response.ok) return null
      const data = await response.json() as {
        success: boolean
        access_token?: string
        refresh_token?: string
      }
      if (!data.success || !data.access_token) return null
      updateStoredTokens(endpoint, data.access_token, data.refresh_token ?? null)
      return data.access_token
    } catch {
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build query-string and return the final URL + stripped options. */
function buildGetUrl(
  endpoint: string,
  options: GetOptions,
): { url: string; rest: Omit<GetOptions, 'params'> } {
  if (!options.params) return { url: endpoint, rest: options }

  const qp = new URLSearchParams()
  for (const [key, value] of Object.entries(options.params)) {
    if (value !== undefined && value !== null && value !== '') {
      qp.append(key, String(value as string | number | boolean))
    }
  }
  const qs = qp.toString()
  const { params: _params, ...rest } = options
  return { url: qs ? `${endpoint}?${qs}` : endpoint, rest }
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export const useApi = (): ApiInstance => {
  const config = useRuntimeConfig()
  const baseURL: string = (config.public['apiBase'] as string | undefined) ?? ''

  /**
   * Make an authenticated API request and return the parsed JSON envelope.
   * Pass `_isRetry = true` to skip the 401 refresh-and-retry path (prevents loops).
   */
  const apiRequest = async <T = unknown>(
    endpoint: string,
    options: RequestInit = {},
    _isRetry = false,
  ): Promise<ApiEnvelope<T>> => {
    const token = resolveToken(endpoint)

    const isFormData =
      typeof FormData !== 'undefined' && options.body instanceof FormData

    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers as Record<string, string> | undefined),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${baseURL}${endpoint}`, {
      ...options,
      headers,
    })

    // 401: attempt a silent token refresh, then retry once.
    if (response.status === 401 && !_isRetry && !endpoint.startsWith('/api/auth/refresh')) {
      const newToken = await tryRefresh(baseURL, endpoint)
      if (newToken) {
        return apiRequest<T>(endpoint, options, true)
      }
      // Refresh failed — clear stale credentials and take user to login.
      clearAuthForEndpoint(endpoint)
      if (process.client) {
        window.location.href = getLoginUrl()
      }
      throw new ApiError('Session expired. Please log in again.', 401)
    }

    const data = (await response.json()) as ApiEnvelope<T>

    if (!response.ok) {
      throw new ApiError(
        (data as { message?: string }).message ?? `API request failed with status ${response.status}`,
        response.status,
        data,
      )
    }

    return data
  }

  // -------------------------------------------------------------------------
  // Verb helpers
  // -------------------------------------------------------------------------

  const get = <T = unknown>(endpoint: string, options: GetOptions = {}): Promise<ApiEnvelope<T>> => {
    const { url, rest } = buildGetUrl(endpoint, options)
    return apiRequest<T>(url, { method: 'GET', ...(rest as RequestInit) })
  }

  const post = <T = unknown>(
    endpoint: string,
    data?: unknown,
    options: MutationOptions = {},
  ): Promise<ApiEnvelope<T>> =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...(options as RequestInit),
    })

  const put = <T = unknown>(
    endpoint: string,
    data?: unknown,
    options: MutationOptions = {},
  ): Promise<ApiEnvelope<T>> =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...(options as RequestInit),
    })

  const del = <T = unknown>(endpoint: string, options: MutationOptions = {}): Promise<ApiEnvelope<T>> =>
    apiRequest<T>(endpoint, { method: 'DELETE', ...(options as RequestInit) })

  /**
   * GET request returning a raw Blob (CSV / file downloads).
   * Mirrors the auth logic of apiRequest but skips JSON parsing.
   */
  const getBlob = async (endpoint: string, options: GetOptions = {}): Promise<Blob> => {
    const { url, rest } = buildGetUrl(endpoint, options)
    const fullUrl = `${baseURL}${url}`

    const token = resolveToken(url)

    const headers: Record<string, string> = {
      ...(rest.headers as Record<string, string> | undefined),
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await fetch(fullUrl, {
      method: 'GET',
      ...(rest as RequestInit),
      headers,
    })

    if (!response.ok) {
      let message = `API request failed with status ${response.status}`
      try {
        const text = await response.text()
        try {
          const parsed: unknown = JSON.parse(text)
          if (
            parsed !== null &&
            typeof parsed === 'object' &&
            'message' in parsed &&
            typeof (parsed as { message: unknown }).message === 'string'
          ) {
            message = (parsed as { message: string }).message
          }
        } catch {
          if (text) message = text
        }
      } catch {
        // ignore body-read errors
      }
      throw new ApiError(message, response.status)
    }

    return response.blob()
  }

  return {
    get,
    post,
    put,
    delete: del,
    request: apiRequest,
    getBlob,
  }
}
