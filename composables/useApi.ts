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
// Helpers
// ---------------------------------------------------------------------------

/** Resolve the bearer token to inject, following the same priority as before. */
function resolveToken(endpoint: string): string | null {
  if (!process.client) return null

  // Company-domain token (highest priority)
  const companyDomain = window.location.pathname.match(/\/([^/]+)\/services/)?.[1]
  if (companyDomain) {
    const domainToken = localStorage.getItem(`company_${companyDomain}_token`)
    if (domainToken) {
      console.log('Checking company token for domain:', companyDomain, 'Found:', true)
      return domainToken
    }
    console.log('Checking company token for domain:', companyDomain, 'Found:', false)
  }

  // Company store token
  try {
    const companyStore = useCompanyStore()
    if (companyStore?.companyAuthToken) {
      console.log('Found token in company store:', true)
      return companyStore.companyAuthToken
    }
  } catch (e) {
    console.log('Company store not available:', e instanceof Error ? e.message : String(e))
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
    endpoint.startsWith('/api/order-requests/customer') ||
    endpoint.startsWith('/api/wallet') ||
    endpoint.startsWith('/api/customer') ||
    endpoint.startsWith('/api/professionals/customer')
  ) {
    const t = localStorage.getItem('customerAuthToken')
    if (t) return t
  }

  // Generic fallback chain
  const fallback =
    localStorage.getItem('adminToken') ??
    localStorage.getItem('driver_token') ??
    localStorage.getItem('customerAuthToken') ??
    localStorage.getItem('token') ??
    localStorage.getItem('companyAuthToken')

  console.log('Checked fallback tokens, found:', !!fallback)
  return fallback
}

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
   */
  const apiRequest = async <T = unknown>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiEnvelope<T>> => {
    try {
      const token = resolveToken(endpoint)
      console.log('Final token for request:', endpoint, '- Token present:', !!token)

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

      const data = (await response.json()) as ApiEnvelope<T>

      if (!response.ok) {
        throw new ApiError(
          (data as { message?: string }).message ?? `API request failed with status ${response.status}`,
          response.status,
          data,
        )
      }

      return data
    } catch (error) {
      console.error('API Request Error:', error)
      throw error
    }
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
