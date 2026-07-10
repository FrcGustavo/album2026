import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { addEntryToAlbum } from '../../application/albumUseCases.js';
import { money } from '../formatters.js';
import { Ranking } from '../components/Country.jsx';
import { ProgressCard, Stat } from '../components/Progress.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function Dashboard({ state, update, notice, albumStats, countryStats, costStats }) {
  const [entry, setEntry] = useState('');
  const leaders = [...countryStats].sort((a, b) => b.percent - a.percent).slice(0, 5);
  const lagging = [...countryStats].sort((a, b) => a.percent - b.percent).slice(0, 5);
  const visibleNotice = notice === 'Cambios guardados.' ? '' : notice;

  function addEntry(event) {
    event.preventDefault();
    const result = addEntryToAlbum(state, entry);
    if (!result.added) {
      if (!result.invalidTokens.length) return;
      const message = 'No encontré ninguna figurita con ese código. Revisa si escribiste MEX1, FWC1, CC1 o el número correcto.';
      update(result.state, message);
      toast.error('Código no encontrado', { description: result.invalidTokens.join(', ') });
      return;
    }
    const invalid = result.invalidTokens.length ? ` No encontré: ${result.invalidTokens.join(', ')}.` : '';
    update(result.state, `Se agregaron ${result.added} figurita(s).${invalid}`);
    toast.success('Figuritas registradas', {
      description: `${result.added} entrada(s) agregadas al álbum.${invalid}`
    });
    if (!result.invalidTokens.length) setEntry('');
  }

  return (
    <section className="view-stack">
      <div className="entry-panel">
        <Card className="quick-entry">
          <CardHeader>
            <CardTitle>Registro rápido</CardTitle>
            <CardDescription>Captura una o varias figuritas sin salir del inicio.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addEntry}>
              <Label htmlFor="entry">Código o número</Label>
              <div className="entry-row">
                <Input id="entry" value={entry} placeholder="Ej. MEX1, ARG10, 21, FWC1, CC1" onChange={(event) => setEntry(event.target.value)} />
                <Button type="submit">
                  <Plus aria-hidden="true" />
                  Agregar
                </Button>
              </div>
            </form>
            <p className="quick-entry-help">Puedes escribir códigos separados por espacios, comas o saltos de línea.</p>
            {visibleNotice && <p className="notice">{visibleNotice}</p>}
          </CardContent>
        </Card>
        <div className="stats-grid">
          <Stat label="Obtenidas" value={albumStats.owned} helper={`de ${albumStats.activeTotal}`} />
          <Stat label="Faltantes" value={albumStats.missing} helper="sin registrar" />
          <Stat label="Repetidas" value={albumStats.repeated} helper="copias extra" />
          <Stat label="Gasto neto" value={money(costStats.net)} helper="invertido" />
        </div>
      </div>

      <div className="metric-grid dashboard-metric-grid">
        <ProgressCard title="Escudos y equipos" summary={albumStats.shieldsAndTeamPhotos} />
        <ProgressCard title="Selecciones completas" summary={albumStats.completedTeams} label="completas" />
        <ProgressCard title="Especiales" summary={albumStats.specials} />
        <ProgressCard title="Cracks" summary={albumStats.cracks} />
        <ProgressCard title="Coca-Cola" summary={albumStats.cocaCola} disabled={!state.cocaColaEnabled} />
      </div>

      <div className="split-grid dashboard-top-grid">
        <Ranking title="Top 5 más completos" teams={leaders} />
        <Ranking title="Top 5 más atrasados" teams={lagging} />
      </div>
    </section>
  );
}
