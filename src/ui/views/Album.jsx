import { useState } from 'react';
import { catalog, GROUPS } from '../../domain/catalog.js';
import { getTeamStickers } from '../../domain/albumState.js';
import { StickerTile } from '../components/StickerTile.jsx';
import { Toolbar } from '../components/Layout.jsx';

export function FullAlbum({ state, patch }) {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();
  const teams = catalog.teams.filter((team) => !normalized || team.name.toLowerCase().includes(normalized) || team.code.toLowerCase().includes(normalized));

  return (
    <section className="view-stack">
      <Toolbar>
        <input value={query} placeholder="Buscar seleccion..." onChange={(event) => setQuery(event.target.value)} />
      </Toolbar>
      {GROUPS.map((group) => {
        const groupTeams = teams.filter((team) => team.group === group);
        if (!groupTeams.length) return null;
        return (
          <section className="group-section" key={group}>
            <h2>Grupo {group}</h2>
            <div className="album-team-grid">
              {groupTeams.map((team) => (
                <TeamAlbum key={team.id} team={team} state={state} patch={patch} />
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}

function TeamAlbum({ team, state, patch }) {
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
        {getTeamStickers(team.id).map((sticker) => (
          <StickerTile key={sticker.code} sticker={sticker} state={state} patch={patch} />
        ))}
      </div>
    </article>
  );
}
