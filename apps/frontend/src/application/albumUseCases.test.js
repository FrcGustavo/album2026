import { describe, expect, it } from 'vitest';
import { addEntryToAlbum, parseEntry } from './albumUseCases.js';
import { emptyState } from '../domain/albumState.js';

describe('albumUseCases', () => {
  it('parses sticker codes, numbers and separated entries', () => {
    expect(parseEntry('mex1, 2; CC1 nope').map((item) => item.sticker?.code || item.token)).toEqual(['MEX1', 'FWC1', 'CC1', 'NOPE']);
  });

  it('adds valid parsed stickers and reports invalid tokens', () => {
    const result = addEntryToAlbum(emptyState(), 'MEX1 MEX1 CC1 unknown');

    expect(result.added).toBe(3);
    expect(result.invalidTokens).toEqual(['UNKNOWN']);
    expect(result.state.stickers.MEX1).toBe(2);
    expect(result.state.cocaCola.CC1).toBe(1);
    expect(result.state.activityLog.map((entry) => entry.stickerCode)).toEqual(['MEX1', 'MEX1', 'CC1']);
  });
});
