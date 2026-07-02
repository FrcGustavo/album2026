import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuthSession } from '../application/useAuthSession.js';
import { useRemoteAlbumState } from '../application/useRemoteAlbumState.js';
import { getAlbumStats, getCostStats, getCountryStats } from '../domain/albumState.js';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

const REPOSITORY_URL = 'https://github.com/FrcGustavo/album2026';

export function App({ createAlbumRepository, tokenStorage }) {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuthSession({ createAlbumRepository, tokenStorage });
  const album = useRemoteAlbumState(auth);
  const { token, user, notice, setNotice, authenticate, remoteAlbumRepository } = auth;
  const { state, patch, update, syncStatus, resetLocalState } = album;

  const albumStats = useMemo(() => getAlbumStats(state), [state]);
  const countryStats = useMemo(() => getCountryStats(state), [state]);
  const costStats = useMemo(() => getCostStats(state, albumStats), [state, albumStats]);

  function logout() {
    auth.logout();
    resetLocalState();
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
    logout,
    remoteAlbumRepository
  };

  const activeTab = ROUTE_TABS.find(([, path]) => path === location.pathname)?.[0] || 'inicio';

  useEffect(() => {
    if (location.pathname !== '/' || !location.hash) return;
    const legacyTab = location.hash.replace('#', '');
    const nextPath = ROUTE_TABS.find(([id]) => id === legacyTab)?.[1];
    if (nextPath && nextPath !== '/') navigate(nextPath, { replace: true });
  }, [location.hash, location.pathname, navigate]);

  if (!token || !user) {
    return (
      <main className="app-shell auth-shell">
        <AuthScreen onAuthenticate={authenticate} syncStatus={auth.authStatus} notice={notice} />
        <Toaster />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <div className="hero-title-block">
            <p className="eyebrow">Album Mundial 2026 - Mexico</p>
          </div>
          <div className="hero-status-block">
            <p className={`sync-pill ${syncStatus}`}>{syncLabel(syncStatus, user)}</p>
            <RepositoryLink className="hero-repository-link" />
          </div>
        </div>
        <div className="progress-ring" style={{ '--progress': `${albumStats.percent}%` }} aria-label={`Progreso ${albumStats.percent}%`}>
          <span>{pct(albumStats.percent)}</span>
          <small>{albumStats.owned}/{albumStats.activeTotal}</small>
        </div>
      </header>

      <nav className="section-nav" aria-label="Secciones">
        <Select
          value={activeTab}
          onValueChange={(tab) => {
            const nextPath = ROUTE_TABS.find(([id]) => id === tab)?.[1] || '/';
            navigate(nextPath);
          }}
        >
          <SelectTrigger className="mobile-section-select" aria-label="Seccion actual">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROUTE_TABS.map(([id, , label]) => (
              <SelectItem value={id} key={id}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs
          value={activeTab}
          onValueChange={(tab) => {
            const nextPath = ROUTE_TABS.find(([id]) => id === tab)?.[1] || '/';
            navigate(nextPath);
          }}
          className="tabs-shell"
        >
          <TabsList className="tabs-list">
            {ROUTE_TABS.map(([id, , label]) => (
              <TabsTrigger value={id} key={id}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </nav>

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
  if (!user) return 'Sin sesion';
  if (status === 'synced') return `Sincronizado: ${user.name}`;
  if (status === 'saving') return `Guardando: ${user.name}`;
  if (status === 'loading') return 'Cargando tu album';
  if (status === 'error') return 'No se pudo sincronizar';
  return 'Sin sesion';
}

function AuthScreen({ onAuthenticate, syncStatus, notice }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const isRegister = mode === 'register';
  const disabled = syncStatus === 'loading';

  function submit(event) {
    event.preventDefault();
    onAuthenticate(mode, { email: email.trim(), name: name.trim(), password });
  }

  return (
    <section className="auth-layout">
      <div className="auth-hero" />
      <Card className="auth-card">
        <CardHeader>
          <CardTitle className="auth-title">{isRegister ? 'Crear cuenta' : 'Iniciar sesion'}</CardTitle>
          <CardDescription>
            {notice.endsWith('.') ? notice : `${notice}.`}
            {!isRegister && ' Si aun no tienes cuenta, primero crea una.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="auth-card-content">
          <form className="auth-form" onSubmit={submit}>
            <label className="settings-field">
              <span>Email</span>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            {isRegister && (
              <label className="settings-field">
                <span>Nombre</span>
                <Input value={name} onChange={(event) => setName(event.target.value)} required />
              </label>
            )}
            <label className="settings-field">
              <span>Contrasena</span>
              <Input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            <div className="auth-actions">
              <Button type="submit" disabled={disabled}>
                {disabled ? 'Conectando...' : isRegister ? 'Crear cuenta' : 'Entrar'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setMode(isRegister ? 'login' : 'register')}>
                {isRegister ? 'Ya tengo cuenta' : 'Crear cuenta'}
              </Button>
            </div>
          </form>
          <RepositoryLink className="auth-repository-link" />
        </CardContent>
      </Card>
    </section>
  );
}

function RepositoryLink({ className = '' }) {
  return (
    <a className={`repository-link ${className}`} href={REPOSITORY_URL} target="_blank" rel="noreferrer">
      <GitHubIcon />
      <span>GitHub</span>
    </a>
  );
}

function GitHubIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 7c.85 0 1.7.12 2.5.35 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.56 5.05.36.32.68.94.68 1.9 0 1.38-.01 2.49-.01 2.83 0 .27.18.59.69.49A10.08 10.08 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z"
      />
    </svg>
  );
}
