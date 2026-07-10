import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { emptyState } from '../../domain/albumState.js';
import { stickerByCode } from '../../domain/catalog.js';
import { StickerTile } from './StickerTile.jsx';

describe('StickerTile', () => {
  it('increments and decrements with visible controls', () => {
    const patch = vi.fn((updater) => updater(emptyState()));
    render(<StickerTile sticker={stickerByCode.MEX1} state={emptyState()} patch={patch} />);

    fireEvent.click(screen.getByRole('button', { name: 'Sumar MEX1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Restar MEX1' }));

    expect(patch).toHaveBeenCalledTimes(2);
  });
});
