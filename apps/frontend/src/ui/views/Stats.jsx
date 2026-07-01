import React, { useState } from 'react';
import { CountryRow } from '../components/Country.jsx';
import { Toolbar } from '../components/Layout.jsx';
import { Stat } from '../components/Progress.jsx';
import { pct } from '../formatters.js';

export function Stats({ albumStats, countryStats, costStats }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const normalized = query.trim().toLowerCase();
  const countries = countryStats
    .filter((team) => !normalized || team.name.toLowerCase().includes(normalized) || team.code.toLowerCase().includes(normalized))
    .filter((team) => filter === 'all' || (filter === 'completed' && team.complete) || (filter === 'missing' && team.missing > 0) || (filter === 'repeated' && team.hasRepeated))
    .sort((a, b) => b.percent - a.percent);

  return (
    <section className="view-stack">
      <div className="metric-grid">
        <Stat label="Total registradas" value={albumStats.owned + albumStats.repeated} helper="incluye repetidas" />
        <Stat label="Completado" value={pct(albumStats.percent)} helper={`${albumStats.owned}/${albumStats.activeTotal}`} />
        <Stat label="Faltantes" value={albumStats.missing} helper="pendientes" />
        <Stat label="Repetidas" value={albumStats.repeated} helper="copias extra" />
        <Stat label="Promedio repetidas" value={albumStats.owned ? (albumStats.repeated / albumStats.owned).toFixed(2) : '0.00'} helper="por unica" />
        <Stat label="Eficiencia" value={pct(costStats.openingEfficiency)} helper="apertura estimada" />
      </div>
      <Toolbar>
        <input value={query} placeholder="Buscar..." onChange={(event) => setQuery(event.target.value)} />
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">Todos</option>
          <option value="completed">Completos</option>
          <option value="missing">Faltantes</option>
          <option value="repeated">Repetidas</option>
        </select>
      </Toolbar>
      <div className="table-list">
        {countries.map((team) => (
          <CountryRow key={team.id} team={team} />
        ))}
      </div>
    </section>
  );
}
