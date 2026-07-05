import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRemoteAlbumRepository } from './remoteAlbumRepository.js';

describe('remoteAlbumRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the bearer token on authenticated requests', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ id: 1, name: 'Gus' }));
    const repository = createRemoteAlbumRepository({ baseUrl: 'https://api.test', getToken: () => 'abc123' });

    await repository.getMe();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/auth/me',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({ Authorization: 'Bearer abc123' })
      })
    );
  });

  it('calls onUnauthorized when the backend returns 401', async () => {
    const onUnauthorized = vi.fn();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ detail: 'Token invalido' }, { ok: false, status: 401 }));
    const repository = createRemoteAlbumRepository({ baseUrl: 'https://api.test', onUnauthorized });

    await expect(repository.getMe()).rejects.toThrow('Token invalido');

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('sanitizes loaded album state', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ stickers: { MEX1: '2', NOPE: 9 } }));
    const repository = createRemoteAlbumRepository({ baseUrl: 'https://api.test' });

    await expect(repository.loadAlbum()).resolves.toMatchObject({ state: { stickers: { MEX1: 2 } } });
  });

  it('throws backend detail messages for failed requests', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ detail: 'Payload invalido' }, { ok: false, status: 422 }));
    const repository = createRemoteAlbumRepository({ baseUrl: 'https://api.test' });

    await expect(repository.saveAlbum({})).rejects.toThrow('Payload invalido');
  });

  it('sends If-Match when saving with a revision', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ stickers: {} }, { headers: { 'X-Album-Revision': '3' } }));
    const repository = createRemoteAlbumRepository({ baseUrl: 'https://api.test' });

    await repository.saveAlbum({}, { revision: '2' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/me/album',
      expect.objectContaining({
        headers: expect.objectContaining({ 'If-Match': '"2"' })
      })
    );
  });

  it('uses a same-origin API URL by default', async () => {
    vi.stubGlobal('location', { hostname: 'localhost' });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ id: 1, name: 'Gus' }));
    const repository = createRemoteAlbumRepository();

    await repository.getMe();

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', expect.any(Object));
    vi.unstubAllGlobals();
  });
});

function jsonResponse(payload, { ok = true, status = 200, headers = {} } = {}) {
  return {
    ok,
    status,
    headers: { get: (name) => headers[name] || null },
    text: () => Promise.resolve(JSON.stringify(payload)),
    json: () => Promise.resolve(payload)
  };
}
