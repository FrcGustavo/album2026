import { useState } from 'react';
import { copiesFor, getCracks } from '../../domain/albumState.js';
import { catalog, stickerByCode, teamById } from '../../domain/catalog.js';
import { Toolbar } from '../components/Layout.jsx';

export function Cracks({ state, patch }) {
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({ player: '', teamId: catalog.teams[0].id, number: 10 });
  const cracks = getCracks(state);
  const normalized = query.trim().toLowerCase();
  const visible = cracks.filter((crack) => {
    const team = teamById[crack.teamId];
    return !normalized || crack.player.toLowerCase().includes(normalized) || team?.name.toLowerCase().includes(normalized) || crack.stickerCode.toLowerCase().includes(normalized);
  });

  function addCrack(event) {
    event.preventDefault();
    const number = Number(form.number);
    const stickerCode = `${form.teamId}${number}`;
    if (!form.player.trim() || number < 1 || number > 20 || !stickerByCode[stickerCode]) return;
    if (cracks.some((crack) => crack.stickerCode === stickerCode)) return;
    patch((current) => ({
      ...current,
      customCracks: [
        ...current.customCracks,
        {
          id: crypto.randomUUID(),
          player: form.player.trim(),
          teamId: form.teamId,
          stickerCode,
          official: false
        }
      ]
    }), 'Crack personalizado agregado.');
    setForm({ player: '', teamId: form.teamId, number: 10 });
  }

  return (
    <section className="view-stack">
      <Toolbar>
        <input value={query} placeholder="Buscar por nombre, seleccion o codigo..." onChange={(event) => setQuery(event.target.value)} />
      </Toolbar>
      <form className="inline-form" onSubmit={addCrack}>
        <input value={form.player} placeholder="Nombre del jugador" onChange={(event) => setForm({ ...form, player: event.target.value })} />
        <select value={form.teamId} onChange={(event) => setForm({ ...form, teamId: event.target.value })}>
          {catalog.teams.map((team) => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
        <input min="1" max="20" type="number" value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} />
        <button type="submit">Agregar crack</button>
      </form>
      <div className="crack-grid">
        {visible.map((crack) => {
          const sticker = stickerByCode[crack.stickerCode];
          const found = sticker && copiesFor(state, sticker) > 0;
          return (
            <article className={`crack-card ${found ? 'found' : ''}`} key={crack.id}>
              <div>
                <strong>{crack.player}</strong>
                <span>{teamById[crack.teamId]?.name} - {crack.stickerCode}</span>
              </div>
              <small>{crack.official ? 'Crack oficial' : 'Personalizado'}</small>
              <b>{found ? 'Encontrado' : 'Pendiente'}</b>
              {!crack.official && (
                <button
                  type="button"
                  className="ghost danger"
                  onClick={() => patch((current) => ({ ...current, customCracks: current.customCracks.filter((item) => item.id !== crack.id) }), 'Crack eliminado.')}
                >
                  Eliminar
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
