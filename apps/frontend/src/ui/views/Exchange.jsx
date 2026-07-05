import React from 'react';
import { Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import { formatStickerList, getMissingStickers, getRepeatedStickers } from '../../domain/albumState.js';
import { EmptyState } from '../components/Layout.jsx';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function Exchange({ state }) {
  const missing = getMissingStickers(state);
  const repeated = getRepeatedStickers(state);
  const missingText = `Me faltan:\n${formatStickerList(missing) || 'Ninguna'}`;
  const repeatedText = `Tengo repetidas:\n${formatStickerList(repeated) || 'Ninguna'}`;

  return (
    <section className="view-stack">
      <div className="exchange-list-grid">
        <SharePanel title="Faltantes" text={missingText} empty={!missing.length && 'No tienes faltantes activos.'} />
        <SharePanel title="Repetidas" text={repeatedText} empty={!repeated.length && 'No tienes repetidas activas.'} />
      </div>
      <section className="summary-panel">
        <h2>Últimos cambios</h2>
        {!(state.activityLog || []).length && <EmptyState text="Aún no hay cambios registrados." />}
        {(state.activityLog || []).map((entry) => (
          <div className="summary-row activity-row" key={entry.id}>
            <div>
              <strong>{entry.message}</strong>
            </div>
            <time dateTime={entry.createdAt}>{formatActivityDate(entry.createdAt)}</time>
          </div>
        ))}
      </section>
    </section>
  );
}

function formatActivityDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return date.toLocaleString([], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function SharePanel({ title, text, empty }) {
  return (
    <section className="summary-panel">
      <h2>{title}</h2>
      {empty && <EmptyState text={empty} />}
      <Textarea className="exchange-share-textarea" readOnly value={text} />
      <div className="settings-actions">
        <Button type="button" variant="outline" onClick={() => copyText(text)}>
          <Copy aria-hidden="true" />
          Copiar
        </Button>
        <Button type="button" onClick={() => downloadText(title, text)}>
          <Download aria-hidden="true" />
          Exportar TXT
        </Button>
      </div>
    </section>
  );
}

function copyText(text) {
  navigator.clipboard?.writeText(text);
  toast.success('Texto copiado');
}

function downloadText(title, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.toLowerCase()}-album-2026.txt`;
  link.click();
  URL.revokeObjectURL(url);
}
