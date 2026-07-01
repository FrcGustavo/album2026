import React, { useState } from 'react';
import { GROUPS } from '../../domain/catalog.js';
import { getTeamStickers } from '../../domain/albumState.js';
import { CountryCard } from '../components/Country.jsx';
import { Toolbar } from '../components/Layout.jsx';

export function Countries({ countryStats }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const normalized = query.trim().toLowerCase();
  const visible = countryStats.filter((team) => {
    const match =
      !normalized ||
      team.name.toLowerCase().includes(normalized) ||
      team.code.toLowerCase().includes(normalized) ||
      getTeamStickers(team.id).some((sticker) => sticker.code.toLowerCase().includes(normalized));
    const filterMatch =
      filter === 'all' ||
      (filter === 'missing' && team.missing > 0) ||
      (filter === 'repeated' && team.hasRepeated) ||
      (filter === 'completed' && team.complete) ||
      (filter === 'shields' && team.withoutShield) ||
      (filter === 'teams' && team.withoutTeamPhoto);
    return match && filterMatch;
  });

  return (
    <section className="view-stack">
      <Toolbar>
        <input value={query} placeholder="Buscar por pais, codigo o figurita" onChange={(event) => setQuery(event.target.value)} />
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">Todas</option>
          <option value="missing">Faltantes</option>
          <option value="repeated">Repetidas</option>
          <option value="completed">Completas</option>
          <option value="shields">Sin escudo</option>
          <option value="teams">Sin equipo</option>
        </select>
      </Toolbar>
      {GROUPS.map((group) => {
        const teams = visible.filter((team) => team.group === group);
        if (!teams.length) return null;
        return (
          <section className="group-section" key={group}>
            <h2>Grupo {group}</h2>
            <div className="country-grid">
              {teams.map((team) => (
                <CountryCard key={team.id} team={team} />
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}
