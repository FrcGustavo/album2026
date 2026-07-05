import { sanitizeState } from '../domain/albumState.js';

function defaultApiBaseUrl() {
  const hostname = globalThis.location?.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return `http://${hostname}:8000/api`;
  return 'http://127.0.0.1:8000/api';
}

export function createRemoteAlbumRepository({
  baseUrl = import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl(),
  getToken = () => null,
  onUnauthorized = () => {}
} = {}) {
  async function request(path, options = {}) {
    const token = getToken();
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });
    if (response.status === 401) onUnauthorized();
    if (!response.ok) {
      const message = await response.text();
      const detail = parseErrorDetail(message);
      const error = new Error(detail || `HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    if (response.status === 204) return null;
    const payload = await response.json();
    return {
      payload,
      revision: response.headers?.get?.('X-Album-Revision') || response.headers?.get?.('ETag')?.replaceAll('"', '') || null,
      updatedAt: response.headers?.get?.('X-Album-Updated-At') || null
    };
  }

  function parseErrorDetail(message) {
    try {
      const parsed = JSON.parse(message);
      return parsed.detail || message;
    } catch {
      return message;
    }
  }

  return {
    register({ email, name, password }) {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, name, password })
      }).then((result) => result.payload);
    },
    login({ email, password }) {
      return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }).then((result) => result.payload);
    },
    logout() {
      return request('/auth/logout', { method: 'POST' });
    },
    getMe() {
      return request('/auth/me').then((result) => result.payload);
    },
    async loadAlbum() {
      const result = await request('/me/album');
      return { state: sanitizeState(result.payload), revision: result.revision, updatedAt: result.updatedAt };
    },
    async saveAlbum(state, { revision } = {}) {
      const result = await request('/me/album', {
          method: 'PUT',
          headers: revision ? { 'If-Match': `"${revision}"` } : {},
          body: JSON.stringify(state)
        });
      return { state: sanitizeState(result.payload), revision: result.revision, updatedAt: result.updatedAt };
    },
    async importAlbum(state) {
      const result = await request('/me/album/import', {
          method: 'POST',
          body: JSON.stringify(state)
        });
      return sanitizeState(result.payload);
    }
  };
}
