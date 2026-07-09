import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { emptyState } from '../domain/albumState.js';
import { App } from './App.jsx';

vi.mock('sonner', () => ({ Toaster: () => null, toast: { error: vi.fn(), success: vi.fn() } }));

describe('App migration modal', () => {
  it('requires legacy users to migrate before continuing', async () => {
    const migrateAlbum = vi.fn().mockResolvedValue({
      state: emptyState(),
      revision: '8',
      storageVersion: 'normalized',
      migrationRequired: false
    });
    const repository = {
      getMe: vi.fn().mockResolvedValue({ id: 1, name: 'Gus', email: 'gus@example.com' }),
      loadAlbum: vi.fn().mockResolvedValue({
        state: { ...emptyState(), stickers: { MEX1: 2 } },
        revision: '7',
        storageVersion: 'legacy',
        migrationRequired: true
      }),
      migrateAlbum,
      saveAlbum: vi.fn(),
      logout: vi.fn()
    };

    render(
      <MemoryRouter>
        <App createAlbumRepository={() => repository} />
      </MemoryRouter>
    );

    expect(await screen.findByText('Actualización de seguridad del álbum')).toBeInTheDocument();
    expect(screen.getByText(/Conservaremos tus estampas/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Migrar ahora' }));

    await waitFor(() => expect(migrateAlbum).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByText('Actualización de seguridad del álbum')).not.toBeInTheDocument());
    expect(repository.saveAlbum).not.toHaveBeenCalled();
  });
});
