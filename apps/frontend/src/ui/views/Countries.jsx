import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GROUPS } from '../../domain/catalog.js';
import { getTeamStickers } from '../../domain/albumState.js';
import { includesSearch } from '../../domain/text.js';
import { CountryCard } from '../components/Country.jsx';
import { EmptyState, Toolbar } from '../components/Layout.jsx';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function Countries({ countryStats }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const visible = countryStats.filter((team) => {
    const match =
      !query ||
      includesSearch(team.name, query) ||
      includesSearch(team.code, query) ||
      getTeamStickers(team.id).some((sticker) => includesSearch(sticker.code, query) || includesSearch(sticker.title, query));
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
        <Input value={query} placeholder="Buscar por país, código o figurita" onChange={(event) => setQuery(event.target.value)} />
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
      {!visible.length && <EmptyState text="No hay selecciones que coincidan con este filtro." />}
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
                <button type="button" className="country-card-button" onClick={() => navigate(`/album?team=${team.code}`)}>
                  <CountryCard key={team.id} team={team} />
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}
