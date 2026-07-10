import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { appendActivity, copiesFor, getCracks, setStickerCopies } from '../../domain/albumState.js';
import { Button } from '@/components/ui/button';

export function StickerTile({ sticker, state, patch }) {
  const copies = copiesFor(state, sticker);
  const crack = getCracks(state).find((item) => item.stickerCode === sticker.code);
  const className = copies > 2 ? 'many' : copies > 1 ? 'duplicate' : copies > 0 ? 'owned' : 'missing';
  const playerName = crack?.player || (sticker.type === 'jugador' ? 'Jugador por confirmar' : '');
  const stateLabel = copies > 1 ? `${copies}x` : copies === 1 ? 'OK' : 'Falta';

  function change(delta) {
    patch((current) => {
      const currentCopies = copiesFor(current, sticker);
      const nextCopies = Math.max(0, currentCopies + delta);
      if (nextCopies === currentCopies) return current;
      return appendActivity(setStickerCopies(current, sticker, nextCopies), 'stickers', `${delta > 0 ? 'Agregaste' : 'Restaste'} ${sticker.code}.`, { stickerCode: sticker.code });
    });
  }

  function handleKeyDown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    change(1);
  }

  return (
    <article
      className={`sticker-tile ${className} ${crack ? 'crack-border' : ''}`}
      title={`${playerName || sticker.title} - ${copies} copia(s)`}
      role="button"
      aria-label={`Agregar copia de ${sticker.code}`}
      tabIndex={0}
      onClick={() => change(1)}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={handleKeyDown}
    >
      <div className="sticker-tile-header">
        <strong>{sticker.code}</strong>
      </div>
      <p className="sticker-tile-player">{playerName}</p>
      <div className="sticker-tile-footer">
        <span>{stateLabel}</span>
        <div className="sticker-controls">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Restar ${sticker.code}`}
          onClick={(event) => {
            event.stopPropagation();
            change(-1);
          }}
          onContextMenu={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <Minus aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Sumar ${sticker.code}`}
          onClick={(event) => {
            event.stopPropagation();
            change(1);
          }}
        >
          <Plus aria-hidden="true" />
        </Button>
        </div>
      </div>
    </article>
  );
}
