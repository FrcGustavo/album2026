import { catalog, officialCracks, stickerByCode, stickerByNumber } from './catalog.js';

export function emptyState() {
  return {
    version: 2,
    stickers: {},
    specials: {},
    cocaColaEnabled: catalog.addons.cocaCola.enabledDefault,
    cocaCola: {},
    customCracks: [],
    purchases: []
  };
}

export function normalizeCopies(value) {
  const copies = Number.parseInt(value, 10);
  return Number.isFinite(copies) && copies > 0 ? copies : 0;
}

export function sanitizeState(value) {
  const next = emptyState();
  if (!value || typeof value !== 'object') return next;

  for (const [code, copies] of Object.entries(value.stickers || {})) {
    const normalized = normalizeCopies(copies);
    if (normalized && stickerByCode[code] && !stickerByCode[code].isSpecial) next.stickers[code] = normalized;
  }
  for (const [code, copies] of Object.entries(value.specials || {})) {
    const normalized = normalizeCopies(copies);
    if (normalized && catalog.specials.some((sticker) => sticker.code === code)) next.specials[code] = normalized;
  }
  for (const [code, copies] of Object.entries(value.cocaCola || {})) {
    const normalized = normalizeCopies(copies);
    if (normalized && catalog.addons.cocaCola.stickers.some((sticker) => sticker.code === code)) next.cocaCola[code] = normalized;
  }

  next.cocaColaEnabled = Boolean(value.cocaColaEnabled);
  next.customCracks = Array.isArray(value.customCracks)
    ? value.customCracks
        .filter((crack) => crack.player && crack.teamId && stickerByCode[crack.stickerCode])
        .map((crack) => ({
          id: crack.id || crypto.randomUUID(),
          player: String(crack.player),
          teamId: String(crack.teamId),
          stickerCode: String(crack.stickerCode),
          official: false
        }))
    : [];
  next.purchases = Array.isArray(value.purchases)
    ? value.purchases
        .filter((purchase) => purchase.type && Number.isFinite(Number(purchase.price)))
        .map((purchase) => ({
          id: purchase.id || crypto.randomUUID(),
          type: String(purchase.type),
          date: purchase.date || new Date().toISOString().slice(0, 10),
          quantity: Number(purchase.quantity) || 1,
          price: Number(purchase.price) || 0,
          packsPerBox: Number(purchase.packsPerBox) || 0,
          stickersPerPack: Number(purchase.stickersPerPack) || 7,
          notes: purchase.notes || ''
        }))
    : [];

  return next;
}

export function migrateV1(value) {
  const next = emptyState();
  if (!value || typeof value !== 'object') return next;
  for (const [number, copies] of Object.entries(value)) {
    const sticker = stickerByNumber[number];
    const normalized = normalizeCopies(copies);
    if (!sticker || !normalized) continue;
    if (sticker.isSpecial) next.specials[sticker.code] = normalized;
    else next.stickers[sticker.code] = normalized;
  }
  return next;
}

export function collectionForSticker(state, sticker) {
  if (sticker.type === 'coca-cola') return state.cocaCola;
  if (sticker.isSpecial) return state.specials;
  return state.stickers;
}

export function copiesFor(state, sticker) {
  return collectionForSticker(state, sticker)[sticker.code] || 0;
}

export function setStickerCopies(state, sticker, copies) {
  const next = {
    ...state,
    stickers: { ...state.stickers },
    specials: { ...state.specials },
    cocaCola: { ...state.cocaCola }
  };
  const bucket = collectionForSticker(next, sticker);
  if (copies <= 0) delete bucket[sticker.code];
  else bucket[sticker.code] = copies;
  return next;
}

export function summarizeList(stickers, state) {
  const owned = stickers.filter((sticker) => copiesFor(state, sticker) > 0).length;
  const repeated = stickers.reduce((sum, sticker) => sum + Math.max(0, copiesFor(state, sticker) - 1), 0);
  return {
    total: stickers.length,
    owned,
    missing: stickers.length - owned,
    repeated,
    percent: stickers.length ? Math.round((owned / stickers.length) * 1000) / 10 : 0
  };
}

export function getActiveAlbumStickers(state) {
  return state.cocaColaEnabled ? [...catalog.stickers, ...catalog.addons.cocaCola.stickers] : catalog.stickers;
}

export function getAlbumStats(state) {
  const active = getActiveAlbumStickers(state);
  const base = summarizeList(catalog.stickers, state);
  const all = summarizeList(active, state);
  const shields = summarizeList(catalog.stickers.filter((sticker) => sticker.isShield), state);
  const teamPhotos = summarizeList(catalog.stickers.filter((sticker) => sticker.isTeamPhoto), state);
  const specials = summarizeList(catalog.specials, state);
  const cocaCola = summarizeList(catalog.addons.cocaCola.stickers, state);
  const cracks = getCracks(state);
  const foundCracks = cracks.filter((crack) => copiesFor(state, stickerByCode[crack.stickerCode]) > 0).length;

  return {
    ...all,
    baseTotal: base.total,
    activeTotal: active.length,
    shields,
    teamPhotos,
    specials,
    cocaCola,
    cracks: {
      total: cracks.length,
      owned: foundCracks,
      missing: cracks.length - foundCracks,
      percent: cracks.length ? Math.round((foundCracks / cracks.length) * 1000) / 10 : 0
    }
  };
}

export function getTeamStickers(teamId) {
  return catalog.stickers.filter((sticker) => sticker.teamId === teamId);
}

export function getCountryStats(state) {
  return catalog.teams.map((team) => {
    const stickers = getTeamStickers(team.id);
    const summary = summarizeList(stickers, state);
    const shield = stickers.find((sticker) => sticker.isShield);
    const teamPhoto = stickers.find((sticker) => sticker.isTeamPhoto);
    return {
      ...team,
      ...summary,
      complete: summary.owned === summary.total,
      withoutShield: shield ? copiesFor(state, shield) === 0 : false,
      withoutTeamPhoto: teamPhoto ? copiesFor(state, teamPhoto) === 0 : false,
      hasRepeated: summary.repeated > 0
    };
  });
}

export function getCracks(state) {
  return [...officialCracks, ...state.customCracks];
}

export function getCostStats(state, albumStats) {
  return state.purchases.reduce(
    (stats, purchase) => {
      const price = Number(purchase.price) || 0;
      const quantity = Number(purchase.quantity) || 0;
      const packsPerBox = Number(purchase.packsPerBox) || 0;
      const stickersPerPack = Number(purchase.stickersPerPack) || 7;
      const isIncome = purchase.type === 'income';
      const packs =
        purchase.type === 'box'
          ? quantity * packsPerBox
          : purchase.type === 'pack'
            ? quantity
            : 0;
      const estimatedStickers =
        purchase.type === 'box' || purchase.type === 'pack'
          ? packs * stickersPerPack
          : purchase.type === 'single' || purchase.type === 'exchange'
            ? quantity
            : 0;

      stats.spent += isIncome ? 0 : price;
      stats.income += isIncome ? price : 0;
      stats.packs += packs;
      stats.estimatedStickers += estimatedStickers;
      return stats;
    },
    {
      spent: 0,
      income: 0,
      packs: 0,
      estimatedStickers: 0,
      get net() {
        return this.spent - this.income;
      },
      get avgPerPack() {
        return this.packs ? this.net / this.packs : 0;
      },
      get avgPerSticker() {
        return this.estimatedStickers ? this.net / this.estimatedStickers : 0;
      },
      get avgPerNew() {
        return albumStats.owned ? this.net / albumStats.owned : 0;
      },
      get openingEfficiency() {
        return this.estimatedStickers ? Math.round((albumStats.owned / this.estimatedStickers) * 1000) / 10 : 0;
      }
    }
  );
}
