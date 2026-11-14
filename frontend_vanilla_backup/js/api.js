// ============================================================================
// FRONTEND API CLIENT MODULE (Vanilla ES6+)
// ============================================================================
// Purpose: Standardized Fetch wrapper for interacting with Express REST APIs.
// Features: Automatic base URL detection, JSON serialization, and error handling.
// ============================================================================

const API_BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? `${window.location.origin}/api`
  : 'http://localhost:5000/api';

/**
 * Performs an HTTP request and unwraps JSON response safely.
 * @param {string} endpoint - API path (e.g. '/applications')
 * @param {object} options - Fetch options (method, headers, body)
 * @returns {Promise<any>}
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
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
    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || data.error || `HTTP ${response.status} Error`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`API Error on [${config.method || 'GET'} ${endpoint}]:`, error.message);
    throw error;
  }
}

// Export global helper for Vanilla JS scripts
window.API = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' })
};

