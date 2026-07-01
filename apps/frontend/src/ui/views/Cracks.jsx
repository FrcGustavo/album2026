import React, { useState } from 'react';
import { copiesFor, getCracks } from '../../domain/albumState.js';
import { catalog, stickerByCode, teamById } from '../../domain/catalog.js';
import { Toolbar } from '../components/Layout.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

export function Cracks({ state, patch }) {
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({ teamId: catalog.teams[0].id, stickerCode: `${catalog.teams[0].id}1` });
  const cracks = getCracks(state);
  const teamStickers = catalog.stickers.filter((sticker) => sticker.teamId === form.teamId);
  const normalized = query.trim().toLowerCase();
  const visible = cracks.filter((crack) => {
    const team = teamById[crack.teamId];
    return !normalized || crack.player.toLowerCase().includes(normalized) || team?.name.toLowerCase().includes(normalized) || crack.stickerCode.toLowerCase().includes(normalized);
  });

  function addCrack(event) {
    event.preventDefault();
    const sticker = stickerByCode[form.stickerCode];
    if (!sticker || sticker.teamId !== form.teamId) return;
    if (cracks.some((crack) => crack.stickerCode === sticker.code)) return;
    patch((current) => ({
      ...current,
      customCracks: [
        ...current.customCracks,
        {
          id: crypto.randomUUID(),
          player: sticker.title,
          teamId: form.teamId,
          stickerCode: sticker.code,
          official: false
        }
      ]
    }), 'Crack personalizado agregado.');
  }

  function selectTeam(teamId) {
    setForm({ teamId, stickerCode: `${teamId}1` });
  }

  return (
    <section className="view-stack cracks-view">
      <Toolbar>
        <Input value={query} placeholder="Buscar por nombre, seleccion o codigo..." onChange={(event) => setQuery(event.target.value)} />
      </Toolbar>
      <form className="crack-form" onSubmit={addCrack}>
        <Select value={form.teamId} onValueChange={selectTeam}>
          <SelectTrigger aria-label="Seleccion">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {catalog.teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={form.stickerCode} onValueChange={(stickerCode) => setForm({ ...form, stickerCode })}>
          <SelectTrigger className="crack-code-select" aria-label="Identificador de jugador">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {teamStickers.map((sticker) => (
              <SelectItem key={sticker.code} value={sticker.code}>{sticker.code} - {sticker.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="crack-form-action">
          <Button type="submit">
            <Plus />
            Agregar crack
          </Button>
        </div>
      </form>
      <div className="crack-grid">
        {visible.map((crack) => {
          const sticker = stickerByCode[crack.stickerCode];
          const found = sticker && copiesFor(state, sticker) > 0;
          return (
            <article className={`crack-card ${found ? 'found' : ''}`} key={crack.id}>
              <div className="crack-card-main">
                <strong>{crack.stickerCode}</strong>
                <span>{crack.player} - {teamById[crack.teamId]?.name}</span>
              </div>
              <div className="crack-card-meta">
                <small>{crack.official ? 'Crack oficial' : 'Personalizado'}</small>
                <b>{found ? 'Encontrado' : 'Pendiente'}</b>
                {!crack.official && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => patch((current) => ({ ...current, customCracks: current.customCracks.filter((item) => item.id !== crack.id) }), 'Crack eliminado.')}
                  >
                    <Trash2 />
                    Eliminar
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
