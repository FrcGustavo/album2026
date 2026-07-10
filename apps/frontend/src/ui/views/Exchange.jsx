import React, { useState } from 'react';
import { Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import { formatStickerList, getMissingStickers, getRepeatedStickers } from '../../domain/albumState.js';
import { includesSearch } from '../../domain/text.js';
import { EmptyState } from '../components/Layout.jsx';
import { SubTabsList } from '../components/SectionTabs.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent } from '@/components/ui/tabs';

export function Exchange({ state }) {
  const missing = getMissingStickers(state);
  const repeated = getRepeatedStickers(state);

  return (
    <section className="view-stack">
      <Tabs defaultValue="repeated" className="exchange-tabs">
        <SubTabsList
          ariaLabel="Listas de intercambio"
          tabs={[
            { value: 'repeated', label: 'Repetidas' },
            { value: 'missing', label: 'Faltantes' }
          ]}
        />
        <TabsContent value="repeated">
          <SharePanel
            title="Repetidas"
            textPrefix="Tengo repetidas:"
            items={repeated}
            kind="repeated"
            empty={!repeated.length && 'No tienes repetidas activas.'}
          />
        </TabsContent>
        <TabsContent value="missing">
          <SharePanel
            title="Faltantes"
            textPrefix="Me faltan:"
            items={missing}
            kind="missing"
            empty={!missing.length && 'No tienes faltantes activos.'}
          />
        </TabsContent>
      </Tabs>
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

function SharePanel({ title, textPrefix, items, kind, empty }) {
  const [query, setQuery] = useState('');
  const filteredItems = items.filter((item) => {
    const sticker = item.sticker || item;
    return includesSearch(sticker.code, query) || includesSearch(sticker.title, query) || includesSearch(sticker.number, query);
  });
  const text = `${textPrefix}\n${formatStickerList(filteredItems) || 'Ninguna'}`;
  const emptySearch = !!items.length && !filteredItems.length;

  return (
    <section className="summary-panel">
      <div className="exchange-panel-header">
        <h2>{title}</h2>
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
      </div>
      {!!items.length && (
        <Input
          className="exchange-search"
          value={query}
          placeholder={`Buscar ${kind === 'repeated' ? 'repetidas' : 'faltantes'} por código o nombre`}
          onChange={(event) => setQuery(event.target.value)}
        />
      )}
      {empty && <EmptyState text={empty} />}
      {emptySearch && <EmptyState text="No encontré figuritas con esa búsqueda." />}
      {!!filteredItems.length && <StickerExchangeList items={filteredItems} kind={kind} />}
    </section>
  );
}

function StickerExchangeList({ items, kind }) {
  return (
    <ul className="exchange-sticker-list" aria-label={`Lista de ${kind === 'repeated' ? 'repetidas' : 'faltantes'}`}>
      {items.map((item) => {
        const sticker = item.sticker || item;
        return (
          <li className="exchange-sticker-row" key={sticker.code}>
            <div>
              <strong>{sticker.code}</strong>
              <span>{sticker.title}</span>
            </div>
            {kind === 'repeated' && <em>{item.extraCopies} extra</em>}
          </li>
        );
      })}
    </ul>
  );
}

async function copyText(text) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
    await navigator.clipboard.writeText(text);
    toast.success('Texto copiado');
  } catch {
    toast.error('No pude copiar el texto');
  }
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
