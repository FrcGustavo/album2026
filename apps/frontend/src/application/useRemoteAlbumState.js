import { useEffect, useRef, useState } from 'react';
import { emptyState } from '../domain/albumState.js';

export function useRemoteAlbumState({ token, user, setUser, setNotice, setAuthStatus, remoteAlbumRepository }) {
  const [state, setState] = useState(() => emptyState());
  const [syncStatus, setSyncStatus] = useState(token ? 'loading' : 'signed-out');
  const hydratedRemote = useRef(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    if (!token) {
      hydratedRemote.current = false;
      setUser(null);
      setState(emptyState());
      setSyncStatus('signed-out');
      setAuthStatus('signed-out');
      return;
    }
    let cancelled = false;
    setSyncStatus('loading');
    setAuthStatus('loading');
    Promise.all([remoteAlbumRepository.getMe(), remoteAlbumRepository.loadAlbum()])
      .then(([nextUser, remoteState]) => {
        if (cancelled) return;
        setUser(nextUser);
        hydratedRemote.current = true;
        setState(remoteState);
        setSyncStatus('synced');
        setAuthStatus('authenticated');
        setNotice(`Album cargado para ${nextUser.name}.`);
      })
      .catch(() => {
        if (cancelled) return;
        hydratedRemote.current = true;
        setSyncStatus('error');
        setAuthStatus('signed-out');
        setNotice('No pude conectar con el backend.');
      });
    return () => {
      cancelled = true;
    };
  }, [token, remoteAlbumRepository, setAuthStatus, setNotice, setUser]);

  useEffect(() => {
    if (!token || !user || !hydratedRemote.current) return undefined;
    setSyncStatus('saving');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      remoteAlbumRepository
        .saveAlbum(state)
        .then(() => setSyncStatus('synced'))
        .catch(() => {
          setSyncStatus('error');
          setNotice('No pude guardar los cambios en el backend.');
        });
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [state, token, user, remoteAlbumRepository, setNotice]);

  function update(nextState, nextNotice) {
    setState(nextState);
    if (nextNotice) setNotice(nextNotice);
  }

  function patch(updater, nextNotice) {
    setState((current) => updater(current));
    if (nextNotice) setNotice(nextNotice);
  }

  function resetLocalState() {
    hydratedRemote.current = false;
    setState(emptyState());
  }

  return {
    state,
    patch,
    update,
    syncStatus,
    resetLocalState
  };
}
