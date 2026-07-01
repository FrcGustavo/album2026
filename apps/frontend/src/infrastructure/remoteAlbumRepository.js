import { sanitizeState } from '../domain/albumState.js';

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000/api';

export function createRemoteAlbumRepository(baseUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL) {
  async function request(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    if (!response.ok) throw new Error((await response.text()) || `HTTP ${response.status}`);
    if (response.status === 204) return null;
    return response.json();
  }

  return {
    createOrGetUser(name) {
      return request('/users', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
    },
    getUser(userId) {
      return request(`/users/${userId}`);
    },
    async loadAlbum(userId) {
      return sanitizeState(await request(`/users/${userId}/album`));
    },
    async saveAlbum(userId, state) {
      return sanitizeState(
        await request(`/users/${userId}/album`, {
          method: 'PUT',
          body: JSON.stringify(state)
        })
      );
    },
    async importAlbum(userId, state) {
      return sanitizeState(
        await request(`/users/${userId}/album/import`, {
          method: 'POST',
          body: JSON.stringify(state)
        })
      );
    }
  };
}
