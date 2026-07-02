import { useMemo, useState } from 'react';

const TOKEN_KEY = 'album-world-cup-2026-mx-token';

const browserTokenStorage = {
  getItem: (key) => globalThis.localStorage?.getItem(key),
  setItem: (key, value) => globalThis.localStorage?.setItem(key, value),
  removeItem: (key) => globalThis.localStorage?.removeItem(key)
};

export function useAuthSession({ createAlbumRepository, tokenStorage = browserTokenStorage } = {}) {
  const [token, setToken] = useState(() => tokenStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(null);
  const [notice, setNotice] = useState('Accede para continuar con tu album.');
  const [authStatus, setAuthStatus] = useState(token ? 'loading' : 'signed-out');

  const remoteAlbumRepository = useMemo(
    () =>
      createAlbumRepository({
        getToken: () => tokenStorage.getItem(TOKEN_KEY),
        onUnauthorized: () => {
          tokenStorage.removeItem(TOKEN_KEY);
          setToken('');
          setUser(null);
          setAuthStatus('signed-out');
          setNotice('Sesion expirada. Inicia sesion de nuevo.');
        }
      }),
    [createAlbumRepository, tokenStorage]
  );

  async function authenticate(mode, payload) {
    setAuthStatus('loading');
    try {
      const session = mode === 'register' ? await remoteAlbumRepository.register(payload) : await remoteAlbumRepository.login(payload);
      tokenStorage.setItem(TOKEN_KEY, session.access_token);
      setToken(session.access_token);
      setUser(session.user);
      setNotice(`Sesion iniciada para ${session.user.name}.`);
      return session;
    } catch (error) {
      setAuthStatus('signed-out');
      setNotice(error.message || 'No pude iniciar sesion con esos datos.');
    }
  }

  function logout() {
    tokenStorage.removeItem(TOKEN_KEY);
    setToken('');
    setUser(null);
    setAuthStatus('signed-out');
    setNotice('Sesion cerrada.');
  }

  return {
    token,
    user,
    setUser,
    notice,
    setNotice,
    authStatus,
    setAuthStatus,
    authenticate,
    logout,
    remoteAlbumRepository
  };
}
