import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { catalog, GROUPS } from '../../domain/catalog.js';
import { copiesFor, getCracks, getTeamStickers } from '../../domain/albumState.js';
import { includesSearch } from '../../domain/text.js';
import { StickerTile } from '../components/StickerTile.jsx';
import { EmptyState, Toolbar } from '../components/Layout.jsx';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function FullAlbum({ state, patch }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchParams] = useSearchParams();
  const selectedTeam = searchParams.get('team');
  const cracks = getCracks(state);
  const matchesSticker = (sticker) =>
    includesSearch(sticker.code, query) ||
    includesSearch(sticker.number, query) ||
    includesSearch(sticker.title, query) ||
    cracks.some((crack) => crack.stickerCode === sticker.code && includesSearch(crack.player, query));
  const stickerMatchesFilter = (sticker) => {
    const copies = copiesFor(state, sticker);
    const isCrack = cracks.some((crack) => crack.stickerCode === sticker.code);
    if (filter === 'missing') return copies === 0;
    if (filter === 'owned') return copies > 0;
    if (filter === 'repeated') return copies > 1;
    if (filter === 'cracks') return isCrack;
    return true;
  };
  const teams = catalog.teams.filter((team) => {
    if (selectedTeam && team.code !== selectedTeam) return false;
    const teamStickers = getTeamStickers(team.id);
    const teamMatch = includesSearch(team.name, query) || includesSearch(team.code, query);
    return teamStickers.some((sticker) => stickerMatchesFilter(sticker) && (teamMatch || !query || matchesSticker(sticker)));
  });

  return (
    <section className="view-stack">
      <Toolbar>
        <Input value={query} placeholder="Buscar selección, código, número o jugador" onChange={(event) => setQuery(event.target.value)} />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger aria-label="Filtro de figuritas">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="missing">Faltantes</SelectItem>
            <SelectItem value="owned">Obtenidas</SelectItem>
            <SelectItem value="repeated">Repetidas</SelectItem>
            <SelectItem value="cracks">Cracks</SelectItem>
          </SelectContent>
        </Select>
      </Toolbar>
      {!teams.length && <EmptyState text="No encontré figuritas con esa búsqueda." />}
      {GROUPS.map((group) => {
        const groupTeams = teams
          .filter((team) => team.group === group)
          .sort((a, b) => a.groupPosition - b.groupPosition);
        if (!groupTeams.length) return null;
        return (
          <section className="group-section" key={group}>
            <h2>Grupo {group}</h2>
            <div className="album-team-grid">
              {groupTeams.map((team) => (
                <TeamAlbum key={team.id} team={team} state={state} patch={patch} matchesSticker={matchesSticker} stickerMatchesFilter={stickerMatchesFilter} query={query} />
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}

function TeamAlbum({ team, state, patch, matchesSticker, stickerMatchesFilter, query }) {
  const stickers = getTeamStickers(team.id).filter((sticker) => stickerMatchesFilter(sticker) && (!query || matchesSticker(sticker) || includesSearch(team.name, query) || includesSearch(team.code, query)));
  return (
    <article className="team-album">
      <div className="team-title">
        <img src={team.flagUrl} alt="" />
        <div>
          <strong>{team.name}</strong>
          <span>{team.code}</span>
        </div>
      </div>
      <div className="sticker-tile-grid">
        {stickers.map((sticker) => (
          <StickerTile key={sticker.code} sticker={sticker} state={state} patch={patch} />
        ))}
      </div>
    </article>
  );
}
