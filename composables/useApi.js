// composables/useApi.js
// Composable for making authenticated API calls to the backend

export const useApi = () => {
  const config = useRuntimeConfig();
  const baseURL = config.public.apiBase;

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

        // Fallback to other token types (admin and customer tokens)
        if (!token) {
          token = localStorage.getItem('adminToken') || 
                  localStorage.getItem('customerAuthToken') ||
                  localStorage.getItem('token') ||
                  localStorage.getItem('companyAuthToken');
          console.log('Checked fallback tokens, found:', !!token);
        }
      }

      console.log('Final token for request:', endpoint, '- Token present:', !!token);

      // Set up headers
      const headers = {
        'Content-Type': 'application/json',
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
        throw new Error(data.message || `API request failed with status ${response.status}`);
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
    return apiRequest(endpoint, {
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

  return {
    get,
    post,
    put,
    delete: del,
    request: apiRequest,
  };
};
