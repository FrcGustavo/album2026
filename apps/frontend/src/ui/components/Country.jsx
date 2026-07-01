import React from 'react';
import { ProgressBar } from './Progress.jsx';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CountryCard({ team }) {
  return (
    <Card className="country-card">
      <CardHeader>
        <div className="team-title">
          <img src={team.flagUrl} alt="" />
          <div>
            <CardTitle>{team.name}</CardTitle>
            <span>Grupo {team.group} - {team.code}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ProgressBar percent={team.percent} />
        <div className="mini-stats">
          <Badge variant="leaf">{team.owned}/{team.total}</Badge>
          <Badge variant={team.repeated ? 'trophy' : 'secondary'}>{team.repeated} rep.</Badge>
          {team.withoutShield && <Badge variant="outline">sin escudo</Badge>}
          {team.withoutTeamPhoto && <Badge variant="outline">sin equipo</Badge>}
        </div>
      </CardContent>
    </Card>
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
    <Card className="panel">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="ranking-list">
          {teams.map((team) => (
            <CountryRow key={team.id} team={team} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
