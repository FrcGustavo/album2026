import React, { useState } from 'react';
import { addEntryToAlbum } from '../../application/albumUseCases.js';
import { money } from '../formatters.js';
import { Ranking } from '../components/Country.jsx';
import { ProgressCard, Stat } from '../components/Progress.jsx';

export function Dashboard({ state, update, notice, albumStats, countryStats, costStats }) {
  const [entry, setEntry] = useState('');
  const leaders = [...countryStats].sort((a, b) => b.percent - a.percent).slice(0, 5);
  const lagging = [...countryStats].sort((a, b) => a.percent - b.percent).slice(0, 5);

  function addEntry(event) {
    event.preventDefault();
    const result = addEntryToAlbum(state, entry);
    if (!result.count) return;
    update(result.state, `${result.count} figurita(s) registradas.`);
    setEntry('');
  }

  return (
    <section className="view-stack">
      <div className="entry-panel">
        <form className="quick-entry" onSubmit={addEntry}>
          <label htmlFor="entry">Registro rapido</label>
          <div className="entry-row">
            <input id="entry" value={entry} placeholder="Ej. MEX1, ARG10, 21, FWC1, CC1" onChange={(event) => setEntry(event.target.value)} />
            <button type="submit">Agregar</button>
          </div>
          <p>{notice}</p>
        </form>
        <div className="stats-grid">
          <Stat label="Obtenidas" value={albumStats.owned} helper={`de ${albumStats.activeTotal}`} />
          <Stat label="Faltantes" value={albumStats.missing} helper="sin registrar" />
          <Stat label="Repetidas" value={albumStats.repeated} helper="copias extra" />
          <Stat label="Gasto neto" value={money(costStats.net)} helper="invertido" />
        </div>
      </div>

      <div className="metric-grid">
        <ProgressCard title="Escudos" summary={albumStats.shields} />
        <ProgressCard title="Equipos completos" summary={albumStats.teamPhotos} />
        <ProgressCard title="Especiales" summary={albumStats.specials} />
        <ProgressCard title="Cracks" summary={albumStats.cracks} />
        <ProgressCard title="Coca-Cola" summary={albumStats.cocaCola} disabled={!state.cocaColaEnabled} />
      </div>

      <div className="split-grid">
        <Ranking title="Top 5 mas completos" teams={leaders} />
        <Ranking title="Top 5 mas atrasados" teams={lagging} />
      </div>
    </section>
  );
}
