import { useMemo, useState } from 'react';
import { createRemoteAlbumRepository } from '../infrastructure/remoteAlbumRepository.js';

const TOKEN_KEY = 'panini-world-cup-2026-mx-token';

export function useAuthSession() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(null);
  const [notice, setNotice] = useState('Inicia sesion para cargar tu album desde la base de datos.');
  const [authStatus, setAuthStatus] = useState(token ? 'loading' : 'signed-out');

  const remoteAlbumRepository = useMemo(
    () =>
      createRemoteAlbumRepository({
        getToken: () => localStorage.getItem(TOKEN_KEY),
        onUnauthorized: () => {
          localStorage.removeItem(TOKEN_KEY);
          setToken('');
          setUser(null);
          setAuthStatus('signed-out');
          setNotice('Sesion expirada. Inicia sesion de nuevo.');
        }
      }),
    []
  );

  async function authenticate(mode, payload) {
    setAuthStatus('loading');
    try {
      const session = mode === 'register' ? await remoteAlbumRepository.register(payload) : await remoteAlbumRepository.login(payload);
      localStorage.setItem(TOKEN_KEY, session.access_token);
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
    localStorage.removeItem(TOKEN_KEY);
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
