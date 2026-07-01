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
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuthSession();
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
          <p className="eyebrow">Album Panini Mundial 2026 - Mexico</p>
          <h1>Control total de figuritas</h1>
          <p className="header-copy">Progreso, repetidas, intercambios, costos y respaldos guardados en tu cuenta.</p>
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
  if (!user) return 'Sin sesion';
  if (status === 'synced') return `Sincronizado: ${user.name}`;
  if (status === 'saving') return `Guardando: ${user.name}`;
  if (status === 'loading') return 'Cargando desde backend';
  if (status === 'error') return 'Error de backend';
  return 'Sin sesion';
}

function AuthScreen({ onAuthenticate, syncStatus, notice }) {
  const [mode, setMode] = useState('register');
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
      <div className="auth-hero">
        <p className="eyebrow">Album Panini Mundial 2026 - Mexico</p>
        <h1>Tu album vive en el backend</h1>
        <p className="header-copy">Inicia sesion para guardar progreso, compras, cracks y respaldos directamente en la base de datos.</p>
      </div>
      <Card className="auth-card">
        <CardHeader>
          <CardTitle>{isRegister ? 'Crear cuenta' : 'Iniciar sesion'}</CardTitle>
          <CardDescription>
            {notice.endsWith('.') ? notice : `${notice}.`}
            {!isRegister && ' Si aun no tienes cuenta, primero crea una.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </section>
  );
}
