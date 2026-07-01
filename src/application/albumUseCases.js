import { catalog, stickerByCode, stickerByNumber } from '../domain/catalog.js';
import { copiesFor, setStickerCopies } from '../domain/albumState.js';

export function parseEntry(value) {
  return value
    .split(/[\s,;]+/)
    .map((token) => token.trim().toUpperCase())
    .filter(Boolean)
    .map((token) => stickerByCode[token] || stickerByNumber[token] || catalog.addons.cocaCola.stickers.find((sticker) => sticker.code === token))
    .filter(Boolean);
}

export function addEntryToAlbum(state, entry) {
  const stickers = parseEntry(entry);
  const next = stickers.reduce((current, sticker) => setStickerCopies(current, sticker, copiesFor(current, sticker) + 1), state);
  return {
    state: next,
    count: stickers.length
  };
}
