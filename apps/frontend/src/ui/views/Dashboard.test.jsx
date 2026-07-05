import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { emptyState } from '../../domain/albumState.js';
import { Dashboard } from './Dashboard.jsx';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('Dashboard', () => {
  it('reports invalid quick-entry codes', () => {
    const update = vi.fn();
    render(
      <Dashboard
        state={emptyState()}
        update={update}
        notice="Listo."
        albumStats={{ owned: 0, activeTotal: 980, missing: 980, repeated: 0, shieldsAndTeamPhotos: {}, completedTeams: {}, specials: {}, cracks: {}, cocaCola: {} }}
        countryStats={[]}
        costStats={{ net: 0 }}
      />
    );

    fireEvent.change(screen.getByLabelText('Código o número'), { target: { value: 'NOPE' } });
    fireEvent.click(screen.getByRole('button', { name: /agregar/i }));

    expect(update).toHaveBeenCalledWith(expect.any(Object), expect.stringContaining('No encontré ninguna figurita'));
  });
});
