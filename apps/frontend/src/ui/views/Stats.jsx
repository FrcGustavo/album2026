import React, { useState } from 'react';
import { CountryRow } from '../components/Country.jsx';
import { Toolbar } from '../components/Layout.jsx';
import { Stat } from '../components/Progress.jsx';
import { pct } from '../formatters.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function Stats({ albumStats, countryStats, costStats }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const normalized = query.trim().toLowerCase();
  const countries = countryStats
    .filter((team) => !normalized || team.name.toLowerCase().includes(normalized) || team.code.toLowerCase().includes(normalized))
    .filter((team) => filter === 'all' || (filter === 'completed' && team.complete) || (filter === 'missing' && team.missing > 0) || (filter === 'repeated' && team.hasRepeated))
    .sort((a, b) => b.percent - a.percent);
  const leaders = [...countryStats].sort((a, b) => b.percent - a.percent).slice(0, 5);
  const lagging = [...countryStats].sort((a, b) => a.percent - b.percent).slice(0, 5);

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
      <div className="stats-top-grid">
        <StatsTop title="Top 5 mas completos" description="Selecciones con mejor avance" teams={leaders} />
        <StatsTop title="Top 5 mas atrasados" description="Prioridad para completar" teams={lagging} />
      </div>
      <Toolbar>
        <Input value={query} placeholder="Buscar..." onChange={(event) => setQuery(event.target.value)} />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger aria-label="Filtro de estadisticas">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="completed">Completos</SelectItem>
            <SelectItem value="missing">Faltantes</SelectItem>
            <SelectItem value="repeated">Repetidas</SelectItem>
          </SelectContent>
        </Select>
      </Toolbar>
      <div className="table-list">
        {countries.map((team) => (
          <CountryRow key={team.id} team={team} />
        ))}
      </div>
    </section>
  );
}

function StatsTop({ title, description, teams }) {
  return (
    <Card className="stats-top-card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
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
