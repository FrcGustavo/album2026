import React from 'react';
import { catalog } from '../../domain/catalog.js';
import { ProgressHero } from '../components/Progress.jsx';
import { StickerTile } from '../components/StickerTile.jsx';

export function Specials({ state, patch, albumStats }) {
  return (
    <section className="view-stack">
      <ProgressHero title="Figuritas Especiales" summary={albumStats.specials} helper="00 + FWC1 a FWC19" />
      <div className="sticker-tile-grid showcase-grid">
        {catalog.specials.map((sticker) => (
          <StickerTile key={sticker.code} sticker={sticker} state={state} patch={patch} />
        ))}
      </div>
    </section>
  );
}
