import React from 'react';
import { catalog } from '../../domain/catalog.js';
import { EmptyState } from '../components/Layout.jsx';
import { ProgressHero } from '../components/Progress.jsx';
import { StickerTile } from '../components/StickerTile.jsx';
import { Switch } from '@/components/ui/switch';

export function CocaCola({ state, patch, albumStats }) {
  return (
    <section className="view-stack">
      <article className="switch-panel">
        <div>
          <h2>Coca-Cola</h2>
          <p>Seccion opcional. Si la activas, suma {catalog.addons.cocaCola.stickers.length} figuritas al total del album.</p>
        </div>
        <Switch
          checked={state.cocaColaEnabled}
          onCheckedChange={(checked) => patch((current) => ({ ...current, cocaColaEnabled: checked }), checked ? 'Coca-Cola activada.' : 'Coca-Cola desactivada.')}
          aria-label="Activar seccion Coca-Cola"
        />
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
