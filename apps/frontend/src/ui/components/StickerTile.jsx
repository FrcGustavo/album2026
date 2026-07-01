import React from 'react';
import { copiesFor, getCracks, setStickerCopies } from '../../domain/albumState.js';

export function StickerTile({ sticker, state, patch }) {
  const copies = copiesFor(state, sticker);
  const crack = getCracks(state).find((item) => item.stickerCode === sticker.code);
  const className = copies > 2 ? 'many' : copies > 1 ? 'duplicate' : copies > 0 ? 'owned' : 'missing';

  function change(delta) {
    patch((current) => setStickerCopies(current, sticker, Math.max(0, copiesFor(current, sticker) + delta)));
  }

  return (
    <button
      type="button"
      className={`sticker-tile ${className} ${crack ? 'crack-border' : ''}`}
      onClick={() => change(1)}
      onContextMenu={(event) => {
        event.preventDefault();
        change(-1);
      }}
      title={`${sticker.title} - ${copies} copia(s)`}
    >
      <strong>{sticker.code}</strong>
      <span>{copies > 1 ? `${copies}x` : copies === 1 ? 'OK' : 'Falta'}</span>
      {crack && <small>{crack.player}</small>}
      <i
        role="button"
        tabIndex={0}
        aria-label={`Restar ${sticker.code}`}
        onClick={(event) => {
          event.stopPropagation();
          change(-1);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            change(-1);
          }
        }}
      >
        -
      </i>
    </button>
  );
}
