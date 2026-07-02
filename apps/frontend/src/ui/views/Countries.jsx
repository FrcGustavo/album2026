import React, { useState } from 'react';
import { GROUPS } from '../../domain/catalog.js';
import { getTeamStickers } from '../../domain/albumState.js';
import { CountryCard } from '../components/Country.jsx';
import { Toolbar } from '../components/Layout.jsx';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
        <Input value={query} placeholder="Buscar por pais, codigo o figurita" onChange={(event) => setQuery(event.target.value)} />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger aria-label="Filtro de selecciones">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="missing">Faltantes</SelectItem>
            <SelectItem value="repeated">Repetidas</SelectItem>
            <SelectItem value="completed">Completas</SelectItem>
            <SelectItem value="shields">Sin escudo</SelectItem>
            <SelectItem value="teams">Sin equipo</SelectItem>
          </SelectContent>
        </Select>
      </Toolbar>
      {GROUPS.map((group) => {
        const teams = visible
          .filter((team) => team.group === group)
          .sort((a, b) => a.groupPosition - b.groupPosition);
        if (!teams.length) return null;
        return (
          <section className="group-section" key={group}>
            <h2>Grupo {group}</h2>
            <div className="country-grid countries-card-grid">
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
