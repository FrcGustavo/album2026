import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getAlbumStats, getCostStats, getCountryStats } from '../domain/albumState.js';
import { createLocalAlbumRepository } from '../infrastructure/localAlbumRepository.js';
import { createRemoteAlbumRepository } from '../infrastructure/remoteAlbumRepository.js';
import { pct } from './formatters.js';
import { FullAlbum } from './views/Album.jsx';
import { CocaCola } from './views/CocaCola.jsx';
import { Costs } from './views/Costs.jsx';
import { Countries } from './views/Countries.jsx';
import { Cracks } from './views/Cracks.jsx';
import { Dashboard } from './views/Dashboard.jsx';
import { Settings } from './views/Settings.jsx';
import { Specials } from './views/Specials.jsx';
import { Stats } from './views/Stats.jsx';

const albumRepository = createLocalAlbumRepository();
const remoteAlbumRepository = createRemoteAlbumRepository();
const USER_ID_KEY = 'panini-world-cup-2026-mx-user-id';
const USER_NAME_KEY = 'panini-world-cup-2026-mx-user-name';

export function App() {
  const [state, setState] = useState(() => albumRepository.load());
  const [activeTab, setActiveTab] = useState(() => window.location.hash.replace('#', '') || 'inicio');
  const [notice, setNotice] = useState('MVP local-first: el catalogo es editable y se podra reemplazar con el checklist oficial.');
  const [user, setUser] = useState(() => {
    const id = Number(localStorage.getItem(USER_ID_KEY));
    const name = localStorage.getItem(USER_NAME_KEY) || '';
    return id && name ? { id, name } : null;
  });
  const [syncStatus, setSyncStatus] = useState(user ? 'syncing' : 'local');
  const hydratedRemote = useRef(false);
  const saveTimer = useRef(null);

  const albumStats = useMemo(() => getAlbumStats(state), [state]);
  const countryStats = useMemo(() => getCountryStats(state), [state]);
  const costStats = useMemo(() => getCostStats(state, albumStats), [state, albumStats]);

  useEffect(() => {
    function syncHash() {
      setActiveTab(window.location.hash.replace('#', '') || 'inicio');
    }
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  useEffect(() => {
    if (!user) {
      hydratedRemote.current = false;
      setSyncStatus('local');
      return;
    }
    let cancelled = false;
    setSyncStatus('syncing');
    remoteAlbumRepository
      .loadAlbum(user.id)
      .then((remoteState) => {
        if (cancelled) return;
        hydratedRemote.current = true;
        setState(remoteState);
        albumRepository.save(remoteState);
        setSyncStatus('synced');
        setNotice(`Album sincronizado para ${user.name}.`);
      })
      .catch(() => {
        if (cancelled) return;
        hydratedRemote.current = true;
        setSyncStatus('offline');
        setNotice('Modo local, no sincronizado.');
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !hydratedRemote.current) return undefined;
    setSyncStatus('syncing');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      remoteAlbumRepository
        .saveAlbum(user.id, state)
        .then(() => setSyncStatus('synced'))
        .catch(() => {
          setSyncStatus('offline');
          setNotice('Modo local, no sincronizado.');
        });
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [state, user]);

  async function connectUser(name) {
    setSyncStatus('syncing');
    try {
      const nextUser = await remoteAlbumRepository.createOrGetUser(name);
      localStorage.setItem(USER_ID_KEY, String(nextUser.id));
      localStorage.setItem(USER_NAME_KEY, nextUser.name);
      hydratedRemote.current = false;
      setUser(nextUser);
      setNotice(`Usuario activo: ${nextUser.name}.`);
    } catch {
      setSyncStatus('offline');
      setNotice('Modo local, no sincronizado.');
    }
  }

  function disconnectUser() {
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    setUser(null);
    setNotice('Modo local activado.');
  }

  function update(nextState, nextNotice) {
    setState(nextState);
    albumRepository.save(nextState);
    if (nextNotice) setNotice(nextNotice);
  }

  function patch(updater, nextNotice) {
    setState((current) => {
      const nextState = updater(current);
      albumRepository.save(nextState);
      return nextState;
    });
    if (nextNotice) setNotice(nextNotice);
  }

  function setTab(tab) {
    setActiveTab(tab);
    window.location.hash = tab;
  }

  const context = {
    state,
    patch,
    update,
    notice,
    setNotice,
    albumStats,
    countryStats,
    costStats,
    user,
    syncStatus,
    connectUser,
    disconnectUser
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Album Panini Mundial 2026 - Mexico</p>
          <h1>Control total de figuritas</h1>
          <p className="header-copy">Progreso, repetidas, intercambios, costos y respaldos en una app local-first.</p>
          <p className={`sync-pill ${syncStatus}`}>{syncLabel(syncStatus, user)}</p>
        </div>
        <div className="progress-ring" aria-label={`Progreso ${albumStats.percent}%`}>
          <span>{pct(albumStats.percent)}</span>
          <small>{albumStats.owned}/{albumStats.activeTotal}</small>
        </div>
      </header>

      <nav className="tabs" aria-label="Secciones">
        {[
          ['inicio', 'Inicio'],
          ['paises', 'Paises'],
          ['album', 'Album completo'],
          ['especiales', 'Especiales'],
          ['cracks', 'Cracks'],
          ['coca-cola', 'Coca-Cola'],
          ['costos', 'Costos'],
          ['estadisticas', 'Estadisticas'],
          ['configuracion', 'Configuracion']
        ].map(([id, label]) => (
          <button className={activeTab === id ? 'active' : ''} type="button" key={id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      {activeTab === 'inicio' && <Dashboard {...context} />}
      {activeTab === 'paises' && <Countries {...context} />}
      {activeTab === 'album' && <FullAlbum {...context} />}
      {activeTab === 'especiales' && <Specials {...context} />}
      {activeTab === 'cracks' && <Cracks {...context} />}
      {activeTab === 'coca-cola' && <CocaCola {...context} />}
      {activeTab === 'costos' && <Costs {...context} />}
      {activeTab === 'estadisticas' && <Stats {...context} />}
      {activeTab === 'configuracion' && <Settings {...context} />}
    </main>
  );
}

function syncLabel(status, user) {
  if (!user) return 'Modo local';
  if (status === 'synced') return `Sincronizado: ${user.name}`;
  if (status === 'syncing') return `Sincronizando: ${user.name}`;
  if (status === 'offline') return 'Modo local, no sincronizado';
  return 'Modo local';
}
