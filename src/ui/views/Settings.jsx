import React, { useRef, useState } from 'react';
import { emptyState, sanitizeState } from '../../domain/albumState.js';
import { catalog } from '../../domain/catalog.js';

export function Settings({ state, update }) {
  const inputRef = useRef(null);
  const [message, setMessage] = useState('');

  function exportJson() {
    const payload = JSON.stringify({ app: 'panini-world-cup-2026-mx', version: 2, exportedAt: new Date().toISOString(), state }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `album-mundial-2026-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Progreso exportado.');
  }

  function importJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const imported = sanitizeState(parsed.state || parsed);
        update(imported, 'Progreso importado.');
        setMessage('Progreso importado.');
      } catch {
        setMessage('No pude importar ese JSON.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function reset() {
    if (!window.confirm('¿Resetear todo el album? Se borraran figuritas, cracks personalizados y compras.')) return;
    update(emptyState(), 'Album reiniciado.');
    setMessage('Album reiniciado.');
  }

  return (
    <section className="view-stack narrow">
      <article className="settings-card">
        <h2>Cuenta y respaldos</h2>
        <p>Esta version es local-first. Tus datos viven en este navegador hasta que exportes o importes un respaldo.</p>
        <div className="settings-actions">
          <button type="button" onClick={exportJson}>Exportar JSON</button>
          <button type="button" className="secondary" onClick={() => inputRef.current?.click()}>Importar JSON</button>
          <input ref={inputRef} type="file" accept="application/json" onChange={importJson} hidden />
        </div>
        {message && <p className="notice">{message}</p>}
      </article>
      <article className="settings-card danger-zone">
        <h2>Zona peligrosa</h2>
        <p>Se borraran las {catalog.baseTotal} figuritas base, Coca-Cola, cracks personalizados y compras.</p>
        <button type="button" className="danger" onClick={reset}>Resetear album</button>
      </article>
    </section>
  );
}
