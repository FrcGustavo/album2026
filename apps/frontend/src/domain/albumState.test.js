import { describe, expect, it } from 'vitest';
import {
  emptyState,
  getAlbumStats,
  getCostStats,
  sanitizeState,
  setStickerCopies
} from './albumState.js';
import { catalog, stickerByCode, teamById } from './catalog.js';

describe('albumState domain', () => {
  it('creates the canonical empty state', () => {
    expect(emptyState()).toMatchObject({
      version: 2,
      stickers: {},
      specials: {},
      cocaCola: {},
      customCracks: [],
      purchases: []
    });
  });

  it('includes Bosnia and Herzegovina in the 980-sticker base catalog', () => {
    expect(teamById.BIH).toMatchObject({
      code: 'BIH',
      name: 'Bosnia y Herzegovina'
    });
    expect(stickerByCode.BIH1).toMatchObject({
      code: 'BIH1',
      teamId: 'BIH',
      title: 'Escudo Bosnia y Herzegovina'
    });
    expect(catalog.stickers).toHaveLength(980);
  });

  it('includes DR Congo in the 980-sticker base catalog', () => {
    expect(teamById.COD).toMatchObject({
      code: 'COD',
      name: 'Congo RD'
    });
    expect(stickerByCode.COD1).toMatchObject({
      code: 'COD1',
      teamId: 'COD',
      title: 'Escudo Congo RD'
    });
    expect(catalog.stickers).toHaveLength(980);
  });

  it('sanitizes unknown codes and normalizes copy counts', () => {
    const state = sanitizeState({
      stickers: { MEX1: '2', NOPE: 3, MEX2: -1 },
      specials: { '00': '1' },
      cocaCola: { CC1: 1 }
    });

    expect(state.stickers).toEqual({ MEX1: 2 });
    expect(state.specials).toEqual({ '00': 1 });
    expect(state.cocaCola).toEqual({ CC1: 1 });
  });

  it('increments and removes copies without mutating the previous state', () => {
    const first = setStickerCopies(emptyState(), stickerByCode.MEX1, 1);
    const second = setStickerCopies(first, stickerByCode.MEX1, 0);

    expect(first.stickers.MEX1).toBe(1);
    expect(second.stickers.MEX1).toBeUndefined();
  });

  it('calculates repeated stickers and Coca-Cola active totals', () => {
    const state = setStickerCopies(emptyState(), stickerByCode.MEX1, 2);
    const disabled = getAlbumStats(state);
    const enabled = getAlbumStats({ ...state, cocaColaEnabled: true });

    expect(disabled.owned).toBe(1);
    expect(disabled.repeated).toBe(1);
    expect(enabled.activeTotal).toBe(disabled.activeTotal + 14);
  });

  it('calculates purchase costs with income offsets', () => {
    const state = sanitizeState({
      purchases: [
        { type: 'box', quantity: 1, price: 100, packsPerBox: 10, stickersPerPack: 7 },
        { type: 'income', price: 25 }
      ]
    });

    expect(getCostStats(state, getAlbumStats(state))).toMatchObject({
      spent: 100,
      income: 25,
      net: 75,
      packs: 10,
      estimatedStickers: 70
    });
  });
});
