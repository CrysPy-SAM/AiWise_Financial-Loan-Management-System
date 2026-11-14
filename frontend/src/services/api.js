// ============================================================================
// REACT API CLIENT SERVICE
// ============================================================================
// Purpose: Centralized Fetch wrapper for interacting with Express REST APIs.
// Features: Environment-aware base URL, automatic JSON parsing, and unified error handling.
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Performs an HTTP request and safely unwraps the JSON response.
 * @param {string} endpoint - API path (e.g. '/applications')
 * @param {object} options - Fetch options (method, headers, body)
 * @returns {Promise<any>}
 */
async function apiRequest(endpoint, options = {}) {
  // Normalize endpoint slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || data.error || `HTTP ${response.status} Error`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`API Error on [${config.method || 'GET'} ${cleanEndpoint}]:`, error.message);
    throw error;
  }
}

export const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' })
};

export default api;
