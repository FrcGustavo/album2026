import { describe, expect, it } from 'vitest';
import {
  emptyState,
  getAlbumStats,
  getCostStats,
  sanitizeState,
  setStickerCopies
} from './albumState.js';
import { catalog, FIFA_GROUPS, stickerByCode, teamById } from './catalog.js';

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

  it('includes Panama in the 980-sticker base catalog', () => {
    expect(teamById.PAN).toMatchObject({
      code: 'PAN',
      name: 'Panama'
    });
    expect(stickerByCode.PAN1).toMatchObject({
      code: 'PAN1',
      teamId: 'PAN',
      title: 'Escudo Panama'
    });
    expect(catalog.stickers).toHaveLength(980);
  });

  it('uses the FIFA draw groups instead of catalog insertion order', () => {
    const groupA = catalog.teams
      .filter((team) => team.group === 'A')
      .sort((a, b) => a.groupPosition - b.groupPosition)
      .map((team) => team.id);

    expect(groupA).toEqual(['MEX', 'RSA', 'KOR', 'CZE']);
    expect(Object.values(FIFA_GROUPS).every((teamIds) => teamIds.length === 4)).toBe(true);
    expect(new Set(Object.values(FIFA_GROUPS).flat()).size).toBe(48);
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

  it('summarizes shield and team photo stickers together', () => {
    const withShieldAndTeam = [stickerByCode.MEX1, stickerByCode.MEX2].reduce(
      (state, sticker) => setStickerCopies(state, sticker, 1),
      emptyState()
    );

    expect(getAlbumStats(withShieldAndTeam).shieldsAndTeamPhotos).toMatchObject({
      total: 96,
      owned: 2,
      missing: 94
    });
  });

  it('counts completed teams only when all team stickers are owned', () => {
    const partial = setStickerCopies(emptyState(), stickerByCode.MEX2, 1);
    const complete = Array.from({ length: 20 }, (_, index) => stickerByCode[`MEX${index + 1}`]).reduce(
      (state, sticker) => setStickerCopies(state, sticker, 1),
      emptyState()
    );

    expect(getAlbumStats(emptyState()).completedTeams.owned).toBe(0);
    expect(getAlbumStats(partial).completedTeams.owned).toBe(0);
    expect(getAlbumStats(partial).teamPhotos.owned).toBe(1);
    expect(getAlbumStats(complete).completedTeams.owned).toBe(1);
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
