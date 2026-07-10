import React from 'react';
import { appendActivity } from '../../domain/albumState.js';
import { catalog } from '../../domain/catalog.js';
import { EmptyState } from '../components/Layout.jsx';
import { ProgressHero } from '../components/Progress.jsx';
import { StickerTile } from '../components/StickerTile.jsx';
import { Switch } from '@/components/ui/switch';

export function CocaCola({ state, patch, albumStats }) {
  function toggleCocaCola() {
    patch(
      (current) => appendActivity({ ...current, cocaColaEnabled: !current.cocaColaEnabled }, 'coca-cola', current.cocaColaEnabled ? 'Desactivaste Coca-Cola.' : 'Activaste Coca-Cola.'),
      state.cocaColaEnabled ? 'Coca-Cola desactivada.' : 'Coca-Cola activada.'
    );
  }

  return (
    <section className="view-stack">
      <article className="switch-panel">
        <div>
          <h2>Coca-Cola</h2>
          <p>Sección opcional. Si la activas, suma {catalog.addons.cocaCola.stickers.length} figuritas al total del álbum.</p>
        </div>
        <div className="coca-toggle">
          <span className={`coca-toggle-status ${state.cocaColaEnabled ? 'active' : 'inactive'}`}>{state.cocaColaEnabled ? 'Activada' : 'Desactivada'}</span>
          <Switch
            checked={state.cocaColaEnabled}
            aria-label="Activar sección Coca-Cola"
            onCheckedChange={toggleCocaCola}
          />
        </div>
      </article>
      <ProgressHero title="Progreso Coca-Cola" summary={albumStats.cocaCola} helper={state.cocaColaEnabled ? 'Activa' : 'Desactivada'} />
      {state.cocaColaEnabled ? (
        <div className="sticker-tile-grid showcase-grid">
          {catalog.addons.cocaCola.stickers.map((sticker) => (
            <StickerTile key={sticker.code} sticker={sticker} state={state} patch={patch} />
          ))}
        </div>
      ) : (
        <EmptyState text="Activa la sección para empezar a registrar CC1, CC2 y el resto del set." />
      )}
    </section>
  );
}
