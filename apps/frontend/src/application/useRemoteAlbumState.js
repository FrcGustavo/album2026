import { useEffect, useRef, useState } from 'react';
import { emptyState } from '../domain/albumState.js';

const PENDING_STATE_KEY = 'album-world-cup-2026-mx-pending-state';

export function useRemoteAlbumState({ token, user, setUser, setNotice, setAuthStatus, remoteAlbumRepository }) {
  const [state, setState] = useState(() => emptyState());
  const [syncStatus, setSyncStatus] = useState(token ? 'loading' : 'signed-out');
  const [revision, setRevision] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [migrationBusy, setMigrationBusy] = useState(false);
  const [migrationError, setMigrationError] = useState('');
  const hydratedRemote = useRef(false);
  const saveTimer = useRef(null);
  const stateRef = useRef(state);
  const revisionRef = useRef(revision);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    revisionRef.current = revision;
  }, [revision]);

  useEffect(() => {
    if (!token) {
      hydratedRemote.current = false;
      setUser(null);
      setState(emptyState());
      setMigrationRequired(false);
      setMigrationStatus(null);
      setMigrationBusy(false);
      setMigrationError('');
      setSyncStatus('signed-out');
      setAuthStatus('signed-out');
      return;
    }
    let cancelled = false;
    setSyncStatus('loading');
    setAuthStatus('loading');
    Promise.all([remoteAlbumRepository.getMe(), remoteAlbumRepository.loadAlbum()])
      .then(([nextUser, remoteAlbum]) => {
        if (cancelled) return;
        setUser(nextUser);
        hydratedRemote.current = true;
        const pending = remoteAlbum.migrationRequired ? null : readPendingState();
        setState(pending || remoteAlbum.state);
        setRevision(remoteAlbum.revision);
        setMigrationRequired(Boolean(remoteAlbum.migrationRequired));
        setMigrationStatus({
          required: Boolean(remoteAlbum.migrationRequired),
          storageVersion: remoteAlbum.storageVersion || 'normalized',
          legacyRevision: remoteAlbum.storageVersion === 'legacy' ? Number(remoteAlbum.revision) || null : null,
          normalizedRevision: remoteAlbum.storageVersion === 'normalized' ? Number(remoteAlbum.revision) || null : null
        });
        setSyncStatus('synced');
        setAuthStatus('authenticated');
        setNotice(
          remoteAlbum.migrationRequired
            ? 'Tu álbum necesita una actualización de seguridad antes de continuar.'
            : pending
              ? 'Recuperé cambios pendientes guardados en este navegador.'
              : `Álbum cargado para ${nextUser.name}.`
        );
      })
      .catch((error) => {
        if (cancelled) return;
        hydratedRemote.current = true;
        setMigrationRequired(false);
        setMigrationStatus(null);
        setSyncStatus(error.status === 401 ? 'signed-out' : 'error');
        setAuthStatus('signed-out');
        setNotice(error.status === 401 ? 'Accede para continuar con tu álbum.' : 'No pude conectar con el backend.');
      });
    return () => {
      cancelled = true;
    };
  }, [token, remoteAlbumRepository, setAuthStatus, setNotice, setUser]);

  useEffect(() => {
    if (!token || !user || !hydratedRemote.current || migrationRequired || migrationBusy) return undefined;
    setSyncStatus('saving');
    writePendingState(state);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      remoteAlbumRepository
        .saveAlbum(state, { revision: revisionRef.current })
        .then((saved) => {
          setRevision(saved.revision);
          clearPendingState();
          setConflict(null);
          setSyncStatus('synced');
          setNotice('Cambios guardados.');
        })
        .catch((error) => {
          if (error.status === 409) {
            setConflict(error.message);
            setSyncStatus('conflict');
            setNotice('El álbum cambió en otra pestaña o dispositivo.');
            return;
          }
          setSyncStatus('error');
          setNotice('No pude guardar los cambios en el backend.');
        });
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [state, token, user, migrationRequired, migrationBusy, remoteAlbumRepository, setNotice]);

  useEffect(() => {
    function warnIfPending(event) {
      if (syncStatus !== 'saving' && syncStatus !== 'error' && syncStatus !== 'conflict') return;
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', warnIfPending);
    return () => window.removeEventListener('beforeunload', warnIfPending);
  }, [syncStatus]);

  function update(nextState, nextNotice) {
    setState(nextState);
    if (nextNotice) setNotice(nextNotice);
  }

  function patch(updater, nextNotice) {
    setState((current) => updater(current));
    if (nextNotice) setNotice(nextNotice);
  }

  function retrySave() {
    if (!token || !user) return;
    setSyncStatus('saving');
    remoteAlbumRepository
      .saveAlbum(stateRef.current, { revision: revisionRef.current })
      .then((saved) => {
        setRevision(saved.revision);
        clearPendingState();
        setConflict(null);
        setSyncStatus('synced');
        setNotice('Cambios guardados.');
      })
      .catch((error) => {
        setSyncStatus(error.status === 409 ? 'conflict' : 'error');
        setNotice(error.status === 409 ? 'El álbum cambió en otra pestaña o dispositivo.' : 'No pude guardar los cambios en el backend.');
      });
  }

  function reloadRemote() {
    setSyncStatus('loading');
    remoteAlbumRepository
      .loadAlbum()
      .then((remoteAlbum) => {
        setState(remoteAlbum.state);
        setRevision(remoteAlbum.revision);
        setMigrationRequired(Boolean(remoteAlbum.migrationRequired));
        setMigrationStatus({
          required: Boolean(remoteAlbum.migrationRequired),
          storageVersion: remoteAlbum.storageVersion || 'normalized',
          legacyRevision: remoteAlbum.storageVersion === 'legacy' ? Number(remoteAlbum.revision) || null : null,
          normalizedRevision: remoteAlbum.storageVersion === 'normalized' ? Number(remoteAlbum.revision) || null : null
        });
        setConflict(null);
        clearPendingState();
        setSyncStatus('synced');
        setNotice('Álbum remoto recargado.');
      })
      .catch((error) => {
        setSyncStatus(error.status === 401 ? 'signed-out' : 'error');
        setNotice(error.status === 401 ? 'Accede para continuar con tu álbum.' : 'No pude recargar el álbum remoto.');
      });
  }

  function resetLocalState() {
    hydratedRemote.current = false;
    setState(emptyState());
    setMigrationRequired(false);
    setMigrationStatus(null);
    setMigrationBusy(false);
    setMigrationError('');
    clearPendingState();
  }

  function migrateAlbum() {
    if (!token || !user || migrationBusy) return Promise.resolve(null);
    setMigrationBusy(true);
    setMigrationError('');
    setSyncStatus('loading');
    return remoteAlbumRepository
      .migrateAlbum()
      .then((remoteAlbum) => {
        setState(remoteAlbum.state);
        setRevision(remoteAlbum.revision);
        setMigrationRequired(Boolean(remoteAlbum.migrationRequired));
        setMigrationStatus({
          required: Boolean(remoteAlbum.migrationRequired),
          storageVersion: remoteAlbum.storageVersion || 'normalized',
          legacyRevision: null,
          normalizedRevision: Number(remoteAlbum.revision) || null
        });
        setConflict(null);
        clearPendingState();
        setSyncStatus('synced');
        setNotice('Tu álbum fue migrado correctamente.');
        return remoteAlbum;
      })
      .catch((error) => {
        const message = error.message || 'No pude completar la migración. Tu información anterior sigue segura. Intenta de nuevo.';
        setMigrationError(message);
        setSyncStatus('error');
        setNotice('No pude completar la migración. Tu información anterior sigue segura.');
        return null;
      })
      .finally(() => setMigrationBusy(false));
  }

  return {
    state,
    patch,
    update,
    syncStatus,
    conflict,
    migrationRequired,
    migrationStatus,
    migrationBusy,
    migrationError,
    migrateAlbum,
    retrySave,
    reloadRemote,
    resetLocalState
  };
}

function readPendingState() {
  try {
    const raw = globalThis.localStorage?.getItem(PENDING_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writePendingState(state) {
  try {
    globalThis.localStorage?.setItem(PENDING_STATE_KEY, JSON.stringify(state));
  } catch {
    // Local drafts are best-effort only.
  }
}

function clearPendingState() {
  try {
    globalThis.localStorage?.removeItem(PENDING_STATE_KEY);
  } catch {
    // Local drafts are best-effort only.
  }
}
