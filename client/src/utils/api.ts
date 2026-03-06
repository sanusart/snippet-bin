import { useAuth } from '../context/AuthContext';

export function useApi() {
  const { token } = useAuth();

  const handleResponse = async (response: Response) => {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }
    if (response.status === 204) {
      return null;
    }
    return response.json();
  };

  const getHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }
    return headers;
  };

  return {
    get: (url: string) => fetch(url, { headers: getHeaders() }).then(handleResponse),
    post: (url: string, body?: unknown) =>
      fetch(url, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(
        handleResponse
      ),
    patch: (url: string, body?: unknown) =>
      fetch(url, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(body) }).then(
        handleResponse
      ),
    delete: (url: string) =>
      fetch(url, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
    rawDelete: (url: string) => fetch(url, { method: 'DELETE', headers: getHeaders() }),
  };
}

export { useAuth };

export function apiFetch(url: string, token: string | null, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
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
