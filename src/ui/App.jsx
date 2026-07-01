import { useEffect, useMemo, useState } from 'react';
import { getAlbumStats, getCostStats, getCountryStats } from '../domain/albumState.js';
import { createLocalAlbumRepository } from '../infrastructure/localAlbumRepository.js';
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

export function App() {
  const [state, setState] = useState(() => albumRepository.load());
  const [activeTab, setActiveTab] = useState(() => window.location.hash.replace('#', '') || 'inicio');
  const [notice, setNotice] = useState('MVP local-first: el catalogo es editable y se podra reemplazar con el checklist oficial.');

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
    costStats
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Album Panini Mundial 2026 - Mexico</p>
          <h1>Control total de figuritas</h1>
          <p className="header-copy">Progreso, repetidas, intercambios, costos y respaldos en una app local.</p>
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
