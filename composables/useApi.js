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
      // Get the auth token from localStorage
      const token = process.client ? localStorage.getItem('customerAuthToken') : null;

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
