import { useEffect, useMemo, useRef, useState } from 'react';

export function useAuthSession({ createAlbumRepository } = {}) {
  const [token, setToken] = useState('cookie-session');
  const [user, setUser] = useState(null);
  const [notice, setNotice] = useState('Accede para continuar con tu álbum.');
  const [authStatus, setAuthStatus] = useState(token ? 'loading' : 'signed-out');
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const remoteAlbumRepository = useMemo(
    () =>
      createAlbumRepository({
        getToken: () => (token && token !== 'cookie-session' ? token : null),
        onUnauthorized: () => {
          setToken('');
          setUser(null);
          setAuthStatus('signed-out');
          setNotice(userRef.current ? 'Tu sesión expiró. Inicia sesión de nuevo para continuar.' : 'Accede para continuar con tu álbum.');
        }
      }),
    [createAlbumRepository, token]
  );

  async function authenticate(mode, payload) {
    setAuthStatus('loading');
    try {
      const session = mode === 'register' ? await remoteAlbumRepository.register(payload) : await remoteAlbumRepository.login(payload);
      setToken(session.access_token || 'cookie-session');
      setUser(session.user);
      setNotice(`Sesión iniciada para ${session.user.name}.`);
      return session;
    } catch (error) {
      setAuthStatus('signed-out');
      setNotice(error.message || 'No pude iniciar sesión con esos datos.');
    }
  }

  function logout() {
    remoteAlbumRepository.logout().catch(() => {});
    setToken('');
    setUser(null);
    setAuthStatus('signed-out');
    setNotice('Sesión cerrada.');
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
