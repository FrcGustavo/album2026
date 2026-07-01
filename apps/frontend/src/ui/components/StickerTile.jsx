import React from 'react';
import { copiesFor, getCracks, setStickerCopies } from '../../domain/albumState.js';

export function StickerTile({ sticker, state, patch }) {
  const copies = copiesFor(state, sticker);
  const crack = getCracks(state).find((item) => item.stickerCode === sticker.code);
  const className = copies > 2 ? 'many' : copies > 1 ? 'duplicate' : copies > 0 ? 'owned' : 'missing';
  const playerName = crack?.player || (sticker.type === 'jugador' ? 'Jugador por confirmar' : '');

  function change(delta) {
    patch((current) => setStickerCopies(current, sticker, Math.max(0, copiesFor(current, sticker) + delta)));
  }

  return (
    <article className={`sticker-tile ${className} ${crack ? 'crack-border' : ''}`} title={`${playerName || sticker.title} - ${copies} copia(s)`}>
      <div className="sticker-tile-header">
        <strong>{sticker.code}</strong>
      </div>
      {playerName && <p className="sticker-tile-player">{playerName}</p>}
      <button
        type="button"
        className="sticker-tile-main"
        onClick={() => change(1)}
        onContextMenu={(event) => {
          event.preventDefault();
          change(-1);
        }}
      >
        <span className="sr-only">Agregar copia de {sticker.code}</span>
      </button>
      <div className="sticker-tile-footer">
        <span>{copies > 1 ? `${copies}x` : copies === 1 ? 'OK' : 'Falta'}</span>
        <button
          type="button"
          className="sticker-tile-minus"
          aria-label={`Restar ${sticker.code}`}
          onClick={() => change(-1)}
        >
          -
        </button>
      </div>
    </article>
  );
}
