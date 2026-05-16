// composables/useApi.js
// Composable for making authenticated API calls to the backend

export const useApi = () => {
  const config = useRuntimeConfig();
  const baseURL = config.public.apiBase || '';

  /**
   * Make an authenticated API request
   * @param {string} endpoint - The API endpoint (e.g., '/api/orders')
   * @param {Object} options - Fetch options
   * @returns {Promise} - The response data
   */
  const apiRequest = async (endpoint, options = {}) => {
    try {
      // Get the auth token from localStorage or store
      let token = null;
      if (process.client) {
        // First, check localStorage for company-specific tokens
        const companyDomain = window.location.pathname.match(/\/([^\/]+)\/services/)?.[1];
        if (companyDomain) {
          token = localStorage.getItem(`company_${companyDomain}_token`);
          console.log('Checking company token for domain:', companyDomain, 'Found:', !!token);
        }

        // Try to get token from store (for company users)
        if (!token) {
          try {
            const companyStore = useCompanyStore();
            if (companyStore && companyStore.companyAuthToken) {
              token = companyStore.companyAuthToken;
              console.log('Found token in company store:', !!token);
            }
          } catch (e) {
            // Store might not be available, continue
            console.log('Company store not available:', e.message);
          }
        }

        // Fallback to other token types
        if (!token) {
          if (endpoint.startsWith('/api/driver')) {
            token = localStorage.getItem('driver_token');
          } else if (endpoint.startsWith('/api/dispatch')) {
            token = localStorage.getItem('dispatch_token');
          } else if (endpoint.startsWith('/api/admin')) {
            token = localStorage.getItem('adminToken');
          }
          
          if (!token) {
            token = localStorage.getItem('adminToken') ||
              localStorage.getItem('driver_token') ||
              localStorage.getItem('customerAuthToken') ||
              localStorage.getItem('token') ||
              localStorage.getItem('companyAuthToken');
          }
          console.log('Checked fallback tokens, found:', !!token);
        }
      }

      console.log('Final token for request:', endpoint, '- Token present:', !!token);

      // Set up headers
      // For FormData bodies we must let the browser set Content-Type so it can
      // emit the correct multipart boundary; injecting `application/json` here
      // would corrupt the upload. Caller-supplied headers still win on merge.
      const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
      const headers = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      };

      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Make the request
      const response = await fetch(`${baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      // Parse the response
      const data = await response.json();

      // Handle errors
      if (!response.ok) {
        const err = new Error(data.message || `API request failed with status ${response.status}`);
        err.status = response.status;
        throw err;
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  };

  /**
   * GET request
   */
  const get = (endpoint, options = {}) => {
    // Handle query parameters
    let url = endpoint;
    if (options.params) {
      const queryParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url = `${endpoint}?${queryString}`;
      }
      // Remove params from options so it doesn't get passed to fetch
      const { params, ...fetchOptions } = options;
      return apiRequest(url, {
        method: 'GET',
        ...fetchOptions,
      });
    }
    return apiRequest(url, {
      method: 'GET',
      ...options,
    });
  };

  /**
   * POST request
   */
  const post = (endpoint, data, options = {}) => {
    return apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  };

  /**
   * PUT request
   */
  const put = (endpoint, data, options = {}) => {
    return apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  };

  /**
   * DELETE request
   */
  const del = (endpoint, options = {}) => {
    return apiRequest(endpoint, {
      method: 'DELETE',
      ...options,
    });
  };

  /**
   * GET request returning a Blob (for file/CSV downloads).
   *
   * Mirrors `get()` for query-param handling and reuses the same auth/header
   * injection as `apiRequest` (token lookup, FormData detection, etc.). Does
   * NOT parse the response as JSON — returns the raw Blob so callers can
   * trigger a browser download. Throws on non-2xx with the same error shape
   * as `apiRequest` (best-effort message extraction from a JSON or text body).
   */
  const getBlob = async (endpoint, options = {}) => {
    // Reuse the same query-param assembly as get()
    let url = endpoint;
    let restOptions = options;
    if (options.params) {
      const queryParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url = `${endpoint}?${queryString}`;
      }
      const { params, ...rest } = options;
      restOptions = rest;
    }

    // Inline auth/header logic to mirror apiRequest without forcing JSON parse.
    let token = null;
    if (process.client) {
      const companyDomain = window.location.pathname.match(/\/([^\/]+)\/services/)?.[1];
      if (companyDomain) {
        token = localStorage.getItem(`company_${companyDomain}_token`);
      }
      if (!token) {
        try {
          const companyStore = useCompanyStore();
          if (companyStore && companyStore.companyAuthToken) {
            token = companyStore.companyAuthToken;
          }
        } catch (e) {
          // store not available
        }
      }
      if (!token) {
        if (url.startsWith('/api/driver')) {
          token = localStorage.getItem('driver_token');
        } else if (url.startsWith('/api/dispatch')) {
          token = localStorage.getItem('dispatch_token');
        } else if (url.startsWith('/api/admin')) {
          token = localStorage.getItem('adminToken');
        }
        if (!token) {
          token = localStorage.getItem('adminToken') ||
            localStorage.getItem('driver_token') ||
            localStorage.getItem('customerAuthToken') ||
            localStorage.getItem('token') ||
            localStorage.getItem('companyAuthToken');
        }
      }
    }

    const headers = { ...(restOptions.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${baseURL}${url}`, {
      method: 'GET',
      ...restOptions,
      headers,
    });

    if (!response.ok) {
      // Best-effort error message extraction.
      let message = `API request failed with status ${response.status}`;
      try {
        const text = await response.text();
        try {
          const parsed = JSON.parse(text);
          if (parsed && parsed.message) message = parsed.message;
        } catch {
          if (text) message = text;
        }
      } catch {
        // ignore
      }
      const err = new Error(message);
      err.status = response.status;
      throw err;
    }

    return await response.blob();
  };

  return {
    get,
    post,
    put,
    delete: del,
    request: apiRequest,
    getBlob,
  };
};
