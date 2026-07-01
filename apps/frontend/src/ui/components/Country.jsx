import React from 'react';
import { ProgressBar } from './Progress.jsx';

export function CountryCard({ team }) {
  return (
    <article className="country-card">
      <div className="team-title">
        <img src={team.flagUrl} alt="" />
        <div>
          <strong>{team.name}</strong>
          <span>Grupo {team.group} - {team.code}</span>
        </div>
      </div>
      <ProgressBar percent={team.percent} />
      <div className="mini-stats">
        <span>{team.owned}/{team.total}</span>
        <span>{team.repeated} rep.</span>
        {team.withoutShield && <span>sin escudo</span>}
        {team.withoutTeamPhoto && <span>sin equipo</span>}
      </div>
    </article>
  );
}

export function CountryRow({ team }) {
  return (
    <article className="country-row">
      <img src={team.flagUrl} alt="" />
      <strong>{team.name}</strong>
      <ProgressBar percent={team.percent} />
      <span>{team.owned}/{team.total}</span>
      <span>{team.missing} faltan</span>
      <span>{team.repeated} rep.</span>
    </article>
  );
}

export function Ranking({ title, teams }) {
  return (
    <article className="panel">
      <h2>{title}</h2>
      <div className="ranking-list">
        {teams.map((team) => (
          <CountryRow key={team.id} team={team} />
        ))}
      </div>
    </article>
  );
}
