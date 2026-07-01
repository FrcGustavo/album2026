import { sanitizeState } from '../domain/albumState.js';

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000/api';

export function createRemoteAlbumRepository({
  baseUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL,
  getToken = () => null,
  onUnauthorized = () => {}
} = {}) {
  async function request(path, options = {}) {
    const token = getToken();
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });
    if (response.status === 401) onUnauthorized();
    if (!response.ok) {
      const message = await response.text();
      let detail = message;
      try {
        const parsed = JSON.parse(message);
        detail = parsed.detail || message;
      } catch {
        detail = message;
      }
      throw new Error(detail || `HTTP ${response.status}`);
    }
    if (response.status === 204) return null;
    return response.json();
  }

  return {
    register({ email, name, password }) {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, name, password })
      });
    },
    login({ email, password }) {
      return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    },
    getMe() {
      return request('/auth/me');
    },
    async loadAlbum() {
      return sanitizeState(await request('/me/album'));
    },
    async saveAlbum(state) {
      return sanitizeState(
        await request('/me/album', {
          method: 'PUT',
          body: JSON.stringify(state)
        })
      );
    },
    async importAlbum(state) {
      return sanitizeState(
        await request('/me/album/import', {
          method: 'POST',
          body: JSON.stringify(state)
        })
      );
    }
  };
}
