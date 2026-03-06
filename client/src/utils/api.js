import { useAuth } from '../context/AuthContext';

export function useApi() {
  const { token } = useAuth();
  
  const handleResponse = async (response) => {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }
    if (response.status === 204) {
      return null;
    }
    return response.json();
  };
  
  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }
    return headers;
  };
  
  return {
    get: (url) => fetch(url, { headers: getHeaders() }).then(handleResponse),
    post: (url, body) => fetch(url, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
    patch: (url, body) => fetch(url, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
    delete: (url) => fetch(url, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
    rawDelete: (url) => fetch(url, { method: 'DELETE', headers: getHeaders() })
  };
}

export { useAuth };

export function apiFetch(url, token, options = {}) {
  const headers = {
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  
  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  
  return fetch(url, { ...options, headers });
}
