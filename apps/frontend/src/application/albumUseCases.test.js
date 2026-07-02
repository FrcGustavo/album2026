import { describe, expect, it } from 'vitest';
import { addEntryToAlbum, parseEntry } from './albumUseCases.js';
import { emptyState } from '../domain/albumState.js';

describe('albumUseCases', () => {
  it('parses sticker codes, numbers and separated entries', () => {
    expect(parseEntry('mex1, 2; CC1 nope').map((sticker) => sticker.code)).toEqual(['MEX1', 'FWC1', 'CC1']);
  });

  it('adds valid parsed stickers to the album', () => {
    const result = addEntryToAlbum(emptyState(), 'MEX1 MEX1 CC1 unknown');

    expect(result.count).toBe(3);
    expect(result.state.stickers.MEX1).toBe(2);
    expect(result.state.cocaCola.CC1).toBe(1);
  });
});
