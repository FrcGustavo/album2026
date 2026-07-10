import { catalog, stickerByCode, stickerByNumber } from '../domain/catalog.js';
import { appendActivities, copiesFor, setStickerCopies } from '../domain/albumState.js';

export function parseEntry(value) {
  return value
    .split(/[\s,;]+/)
    .map((token) => token.trim().toUpperCase())
    .filter(Boolean)
    .map((token) => ({
      token,
      sticker: stickerByCode[token] || stickerByNumber[token] || catalog.addons.cocaCola.stickers.find((sticker) => sticker.code === token) || null
    }));
}

export function addEntryToAlbum(state, entry) {
  const parsed = parseEntry(entry);
  const valid = parsed.filter((item) => item.sticker);
  const invalidTokens = parsed.filter((item) => !item.sticker).map((item) => item.token);
  const next = valid.reduce((current, { sticker }) => setStickerCopies(current, sticker, copiesFor(current, sticker) + 1), state);
  return {
    state: valid.length
      ? appendActivities(
          next,
          valid.map(({ sticker }) => ({
            type: 'stickers',
            stickerCode: sticker.code,
            message: `Registraste ${sticker.code}.`
          }))
        )
      : next,
    added: valid.length,
    count: valid.length,
    invalidTokens
  };
}
