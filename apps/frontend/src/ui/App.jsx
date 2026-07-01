import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';

const albumRepository = createLocalAlbumRepository();
const remoteAlbumRepository = createRemoteAlbumRepository();
const USER_ID_KEY = 'panini-world-cup-2026-mx-user-id';
const USER_NAME_KEY = 'panini-world-cup-2026-mx-user-name';
const ROUTE_TABS = [
  ['inicio', '/', 'Inicio'],
  ['paises', '/paises', 'Paises'],
  ['album', '/album', 'Album completo'],
  ['especiales', '/especiales', 'Especiales'],
  ['cracks', '/cracks', 'Cracks'],
  ['coca-cola', '/coca-cola', 'Coca-Cola'],
  ['costos', '/costos', 'Costos'],
  ['estadisticas', '/estadisticas', 'Estadisticas'],
  ['configuracion', '/configuracion', 'Configuracion']
];

export function App() {
  const [state, setState] = useState(() => albumRepository.load());
  const [notice, setNotice] = useState('MVP local-first: el catalogo es editable y se podra reemplazar con el checklist oficial.');
  const [user, setUser] = useState(() => {
    const id = Number(localStorage.getItem(USER_ID_KEY));
    const name = localStorage.getItem(USER_NAME_KEY) || '';
    return id && name ? { id, name } : null;
  });
  const [syncStatus, setSyncStatus] = useState(user ? 'syncing' : 'local');
  const hydratedRemote = useRef(false);
  const saveTimer = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const albumStats = useMemo(() => getAlbumStats(state), [state]);
  const countryStats = useMemo(() => getCountryStats(state), [state]);
  const costStats = useMemo(() => getCostStats(state, albumStats), [state, albumStats]);

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

  const activeTab = ROUTE_TABS.find(([, path]) => path === location.pathname)?.[0] || 'inicio';

  useEffect(() => {
    if (location.pathname !== '/' || !location.hash) return;
    const legacyTab = location.hash.replace('#', '');
    const nextPath = ROUTE_TABS.find(([id]) => id === legacyTab)?.[1];
    if (nextPath && nextPath !== '/') navigate(nextPath, { replace: true });
  }, [location.hash, location.pathname, navigate]);

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

      <Tabs
        value={activeTab}
        onValueChange={(tab) => {
          const nextPath = ROUTE_TABS.find(([id]) => id === tab)?.[1] || '/';
          navigate(nextPath);
        }}
        className="tabs-shell"
      >
        <TabsList className="tabs-list" aria-label="Secciones">
          {ROUTE_TABS.map(([id, , label]) => (
            <TabsTrigger value={id} key={id}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Routes>
        <Route path="/" element={<Dashboard {...context} />} />
        <Route path="/paises" element={<Countries {...context} />} />
        <Route path="/album" element={<FullAlbum {...context} />} />
        <Route path="/especiales" element={<Specials {...context} />} />
        <Route path="/cracks" element={<Cracks {...context} />} />
        <Route path="/coca-cola" element={<CocaCola {...context} />} />
        <Route path="/costos" element={<Costs {...context} />} />
        <Route path="/estadisticas" element={<Stats {...context} />} />
        <Route path="/configuracion" element={<Settings {...context} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
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
