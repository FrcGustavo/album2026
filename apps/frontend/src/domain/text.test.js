import { describe, expect, it } from 'vitest';
import { includesSearch, normalizeSearch } from './text.js';

describe('text search helpers', () => {
  it('matches text with and without accents', () => {
    expect(normalizeSearch('México')).toBe('mexico');
    expect(includesSearch('Países Bajos', 'Paises')).toBe(true);
  });
});
