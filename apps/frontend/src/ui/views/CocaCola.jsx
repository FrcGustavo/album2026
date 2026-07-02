import React from 'react';
import { catalog } from '../../domain/catalog.js';
import { EmptyState } from '../components/Layout.jsx';
import { ProgressHero } from '../components/Progress.jsx';
import { StickerTile } from '../components/StickerTile.jsx';
import { Switch } from '@/components/ui/switch';

export function CocaCola({ state, patch, albumStats }) {
  function toggleCocaCola() {
    patch(
      (current) => ({ ...current, cocaColaEnabled: !current.cocaColaEnabled }),
      state.cocaColaEnabled ? 'Coca-Cola desactivada.' : 'Coca-Cola activada.'
    );
  }

  return (
    <section className="view-stack">
      <article className="switch-panel">
        <div>
          <h2>Coca-Cola</h2>
          <p>Seccion opcional. Si la activas, suma {catalog.addons.cocaCola.stickers.length} figuritas al total del album.</p>
        </div>
        <div className="coca-toggle">
          <span className={`coca-toggle-status ${state.cocaColaEnabled ? 'active' : 'inactive'}`}>{state.cocaColaEnabled ? 'Activada' : 'Desactivada'}</span>
          <Switch
            checked={state.cocaColaEnabled}
            aria-label="Activar seccion Coca-Cola"
            onCheckedChange={toggleCocaCola}
          />
        </div>
      </article>
      <ProgressHero title="Progreso Coca-Cola" summary={albumStats.cocaCola} helper={state.cocaColaEnabled ? 'Activa' : 'Desactivada'} />
      {state.cocaColaEnabled ? (
        <div className="sticker-tile-grid wide">
          {catalog.addons.cocaCola.stickers.map((sticker) => (
            <StickerTile key={sticker.code} sticker={sticker} state={state} patch={patch} />
          ))}
        </div>
      ) : (
        <EmptyState text="Activa la seccion para empezar a registrar CC1, CC2 y el resto del set." />
      )}
    </section>
  );
}
