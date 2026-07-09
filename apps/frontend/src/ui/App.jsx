import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
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
import { Exchange } from './views/Exchange.jsx';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const PRIMARY_ROUTE_TABS = [
  ['inicio', '/', 'Inicio'],
  ['album', '/album', 'Álbum'],
  ['intercambio', '/intercambio', 'Intercambio'],
  ['costos', '/costos', 'Costos'],
  ['estadisticas', '/estadisticas', 'Estadísticas'],
  ['configuracion', '/configuracion', 'Configuración']
];

const ALBUM_ROUTE_TABS = [
  ['album', '/album', 'Completo'],
  ['paises', '/paises', 'Países'],
  ['especiales', '/especiales', 'Especiales'],
  ['cracks', '/cracks', 'Cracks'],
  ['coca-cola', '/coca-cola', 'Coca-Cola']
];

const ROUTE_TABS = [...PRIMARY_ROUTE_TABS, ...ALBUM_ROUTE_TABS.filter(([id]) => !PRIMARY_ROUTE_TABS.some(([primaryId]) => primaryId === id))];
const ALBUM_PATHS = new Set(ALBUM_ROUTE_TABS.map(([, path]) => path));

const REPOSITORY_URL = 'https://github.com/FrcGustavo/album2026';

export function App({ createAlbumRepository, tokenStorage }) {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuthSession({ createAlbumRepository, tokenStorage });
  const album = useRemoteAlbumState(auth);
  const { token, user, notice, setNotice, authenticate, remoteAlbumRepository } = auth;
  const { state, patch, update, syncStatus, conflict, migrationRequired, migrationBusy, migrationError, migrateAlbum, retrySave, reloadRemote, resetLocalState } = album;
  const [theme, setTheme] = useState(() => globalThis.localStorage?.getItem('album-theme') || 'light');
  const [showOnboarding, setShowOnboarding] = useState(false);

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
    conflict,
    retrySave,
    reloadRemote,
    theme,
    setTheme,
    logout,
    remoteAlbumRepository
  };

  const activePrimaryTab = ALBUM_PATHS.has(location.pathname) ? 'album' : PRIMARY_ROUTE_TABS.find(([, path]) => path === location.pathname)?.[0] || 'inicio';
  const activeAlbumTab = ALBUM_ROUTE_TABS.find(([, path]) => path === location.pathname)?.[0] || 'album';

  useEffect(() => {
    if (location.pathname !== '/' || !location.hash) return;
    const legacyTab = location.hash.replace('#', '');
    const nextPath = ROUTE_TABS.find(([id]) => id === legacyTab)?.[1];
    if (nextPath && nextPath !== '/') navigate(nextPath, { replace: true });
  }, [location.hash, location.pathname, navigate]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    globalThis.localStorage?.setItem('album-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!user || migrationRequired) return;
    const key = 'album-onboarding-seen';
    if (globalThis.localStorage?.getItem(key)) return;
    setShowOnboarding(true);
    globalThis.localStorage?.setItem(key, '1');
  }, [user, migrationRequired]);

  const isAuthRoute = location.pathname === '/login' || location.pathname === '/registro';

  if (auth.authStatus === 'loading' && !user) {
    return (
      <main className="app-shell auth-shell">
        <AuthLoadingScreen />
        <Toaster />
      </main>
    );
  }

  if (isAuthRoute) {
    if (user) return <Navigate to="/" replace />;
    return (
      <main className="app-shell auth-shell">
        <AuthScreen mode={location.pathname === '/registro' ? 'register' : 'login'} onAuthenticate={authenticate} syncStatus={auth.authStatus} notice={notice} />
        <Toaster />
      </main>
    );
  }

  if (!token || !user) return <Navigate to="/login" replace />;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <div className="hero-title-block">
            <p className="eyebrow">Álbum Mundial 2026 México</p>
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
          value={activePrimaryTab}
          onValueChange={(tab) => {
            const nextPath = PRIMARY_ROUTE_TABS.find(([id]) => id === tab)?.[1] || '/';
            navigate(nextPath);
          }}
        >
          <SelectTrigger className="mobile-section-select" aria-label="Seccion actual">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIMARY_ROUTE_TABS.map(([id, , label]) => (
              <SelectItem value={id} key={id}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs
          value={activePrimaryTab}
          onValueChange={(tab) => {
            const nextPath = PRIMARY_ROUTE_TABS.find(([id]) => id === tab)?.[1] || '/';
            navigate(nextPath);
          }}
          className="tabs-shell"
        >
          <TabsList className="tabs-list">
            {PRIMARY_ROUTE_TABS.map(([id, , label]) => (
              <TabsTrigger value={id} key={id}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </nav>

      {ALBUM_PATHS.has(location.pathname) && (
        <nav className="section-nav section-subnav" aria-label="Secciones del álbum">
          <Select
            value={activeAlbumTab}
            onValueChange={(tab) => {
              const nextPath = ALBUM_ROUTE_TABS.find(([id]) => id === tab)?.[1] || '/album';
              navigate(nextPath);
            }}
          >
            <SelectTrigger className="mobile-section-select" aria-label="Seccion del album">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALBUM_ROUTE_TABS.map(([id, , label]) => (
                <SelectItem value={id} key={id}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tabs
            value={activeAlbumTab}
            onValueChange={(tab) => {
              const nextPath = ALBUM_ROUTE_TABS.find(([id]) => id === tab)?.[1] || '/album';
              navigate(nextPath);
            }}
            className="tabs-shell"
          >
            <TabsList className="tabs-list sub-tabs-list">
              {ALBUM_ROUTE_TABS.map(([id, , label]) => (
                <TabsTrigger value={id} key={id}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </nav>
      )}

      {((syncStatus === 'error' && !migrationRequired) || syncStatus === 'conflict') && (
        <Alert variant="destructive" className="sync-alert">
          <AlertDescription>
            {syncStatus === 'conflict' ? conflict || 'El álbum cambió en otra pestaña o dispositivo.' : 'No se pudo guardar. Tus cambios siguen en este navegador.'}
            <span className="sync-alert-actions">
              <Button type="button" size="sm" variant="outline" onClick={retrySave}>Reintentar</Button>
              {syncStatus === 'conflict' && <Button type="button" size="sm" variant="outline" onClick={reloadRemote}>Recargar remoto</Button>}
            </span>
          </AlertDescription>
        </Alert>
      )}

      <Routes>
        <Route path="/" element={<Dashboard {...context} />} />
        <Route path="/paises" element={<Countries {...context} />} />
        <Route path="/album" element={<FullAlbum {...context} />} />
        <Route path="/especiales" element={<Specials {...context} />} />
        <Route path="/cracks" element={<Cracks {...context} />} />
        <Route path="/coca-cola" element={<CocaCola {...context} />} />
        <Route path="/intercambio" element={<Exchange {...context} />} />
        <Route path="/costos" element={<Costs {...context} />} />
        <Route path="/estadisticas" element={<Stats {...context} />} />
        <Route path="/configuracion" element={<Settings {...context} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bienvenido a tu álbum</DialogTitle>
            <DialogDescription>
              Registra varios códigos juntos, usa los botones de cada figurita para sumar o restar, y revisa Intercambio para compartir faltantes y repetidas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => setShowOnboarding(false)}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={migrationRequired} onOpenChange={(open) => open && migrationRequired}>
        <DialogContent
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Actualización de seguridad del álbum</DialogTitle>
            <DialogDescription>
              Vamos a mover tu progreso a una estructura más segura y organizada. Conservaremos tus estampas, repetidas, compras, cracks e historial.
            </DialogDescription>
          </DialogHeader>
          {migrationError && (
            <Alert variant="destructive">
              <AlertDescription>No pude completar la migración. Tu información anterior sigue segura. Intenta de nuevo.</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={logout} disabled={migrationBusy}>Cerrar sesión</Button>
            <Button type="button" onClick={migrateAlbum} disabled={migrationBusy}>
              {migrationBusy ? 'Migrando...' : 'Migrar ahora'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster />
    </main>
  );
}

function syncLabel(status, user) {
  if (!user) return 'Sin sesión';
  if (status === 'synced') return user.name;
  if (status === 'saving') return `Guardando cambios: ${user.name}`;
  if (status === 'loading') return 'Cargando tu álbum';
  if (status === 'conflict') return 'Conflicto de sincronización';
  if (status === 'error') return 'No se pudo sincronizar';
  return 'Sin sesión';
}

function AuthLoadingScreen() {
  return (
    <section className="auth-layout">
      <div className="auth-hero" />
      <Card className="auth-card">
        <CardHeader>
          <CardTitle className="auth-title">Cargando tu álbum</CardTitle>
          <CardDescription>Estamos revisando tu sesión antes de mostrar el inicio.</CardDescription>
        </CardHeader>
      </Card>
    </section>
  );
}

function AuthScreen({ mode, onAuthenticate, syncStatus, notice }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
          <CardTitle className="auth-title">{isRegister ? 'Crear cuenta' : 'Iniciar sesión'}</CardTitle>
          <CardDescription>
            {notice.endsWith('.') ? notice : `${notice}.`}
            {!isRegister && ' Si aún no tienes cuenta, primero crea una.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="auth-card-content">
          <form className="auth-form" onSubmit={submit}>
            <label className="settings-field">
              <span>Email</span>
              <Input type="email" value={email} placeholder="mora@mail.com" onChange={(event) => setEmail(event.target.value)} required />
            </label>
            {isRegister && (
              <label className="settings-field">
              <span>Nombre</span>
                <Input value={name} placeholder="Mora" onChange={(event) => setName(event.target.value)} required />
              </label>
            )}
            <label className="settings-field">
              <span>Contraseña</span>
              <div className="password-row">
                <Input type={showPassword ? 'text' : 'password'} minLength={8} value={password} placeholder="••••••••" onChange={(event) => setPassword(event.target.value)} required />
                <Button type="button" variant="outline" size="icon" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </Button>
              </div>
            </label>
            <div className="auth-actions">
              <Button type="submit" disabled={disabled}>
                {disabled ? 'Conectando...' : isRegister ? 'Crear cuenta' : 'Entrar'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(isRegister ? '/login' : '/registro')}>
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
