import React, { useRef, useState } from 'react';
import { Download, Upload, LogOut, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { emptyState, sanitizeState } from '../../domain/albumState.js';
import { catalog } from '../../domain/catalog.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function Settings({ state, update, user, syncStatus, logout }) {
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
    toast.success('Progreso exportado');
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
        toast.success('Progreso importado');
      } catch {
        setMessage('No pude importar ese JSON.');
        toast.error('No pude importar ese JSON');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function reset() {
    if (!window.confirm('¿Resetear todo el album? Se borraran figuritas, cracks personalizados y compras.')) return;
    update(emptyState(), 'Album reiniciado.');
    setMessage('Album reiniciado.');
    toast.success('Album reiniciado');
  }

  return (
    <section className="view-stack narrow">
      <Card className="settings-card">
        <CardHeader>
          <CardTitle>Cuenta y respaldos</CardTitle>
          <CardDescription>{user ? `${user.name} (${user.email}). Estado: ${syncLabel(syncStatus)}.` : 'Inicia sesion para cargar tu album.'}</CardDescription>
        </CardHeader>
        <CardContent className="settings-content">
          <section className="settings-section settings-account-section">
            <div className="settings-section-heading">
              <h3>Cuenta</h3>
              <p>Tus cambios se guardan en tu cuenta y se recuperan al volver a entrar.</p>
            </div>
            <div className="settings-form-actions">
              <Button type="button" variant="outline" onClick={logout}>
                <LogOut aria-hidden="true" />
                Cerrar sesion
              </Button>
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section-heading">
              <h3>Respaldo local</h3>
              <p>Exporta una copia manual o importa un archivo JSON guardado antes.</p>
            </div>
            <div className="settings-actions">
              <Button type="button" onClick={exportJson}>
                <Download aria-hidden="true" />
                Exportar JSON
              </Button>
              <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
                <Upload aria-hidden="true" />
                Importar JSON
              </Button>
              <input ref={inputRef} type="file" accept="application/json" onChange={importJson} hidden />
            </div>
          </section>

          {message && <p className="notice">{message}</p>}
        </CardContent>
      </Card>
      <Card className="settings-card danger-zone">
        <CardHeader>
          <CardTitle>Zona peligrosa</CardTitle>
          <CardDescription>Se borraran las {catalog.baseTotal} figuritas base, Coca-Cola, cracks personalizados y compras.</CardDescription>
        </CardHeader>
        <CardContent className="settings-danger-content">
          <Button type="button" variant="destructive" onClick={reset}>
            <RotateCcw aria-hidden="true" />
            Resetear album
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

function syncLabel(status) {
  if (status === 'synced') return 'sincronizado';
  if (status === 'saving') return 'guardando';
  if (status === 'loading') return 'cargando';
  if (status === 'error') return 'sin sincronizar';
  return 'sin sesion';
}
