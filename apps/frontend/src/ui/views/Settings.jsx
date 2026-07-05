import React, { useRef, useState } from 'react';
import { Download, Upload, LogOut, RotateCcw, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { appendActivity, emptyState, getImportPreview } from '../../domain/albumState.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function Settings({ state, update, user, syncStatus, logout, theme, setTheme }) {
  const inputRef = useRef(null);
  const [message, setMessage] = useState('');
  const [importPreview, setImportPreview] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  function exportJson() {
    const payload = JSON.stringify({ app: 'album-world-cup-2026-mx', version: 2, exportedAt: new Date().toISOString(), state }, null, 2);
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
        setImportPreview(getImportPreview(parsed));
      } catch {
        setMessage('No pude importar ese JSON.');
        toast.error('No pude importar ese JSON');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function reset() {
    update(appendActivity(emptyState(), 'reset', 'Reiniciaste el álbum.'), 'Álbum reiniciado.');
    setMessage('Álbum reiniciado.');
    setConfirmReset(false);
    toast.success('Álbum reiniciado');
  }

  function applyImport() {
    update(appendActivity(importPreview.state, 'import', 'Importaste un respaldo JSON.'), 'Progreso importado.');
    setMessage('Progreso importado.');
    setImportPreview(null);
    toast.success('Progreso importado');
  }

  return (
    <section className="view-stack narrow">
      <Card className="settings-card">
        <CardHeader>
          <CardTitle>Cuenta y respaldos</CardTitle>
          <CardDescription>{user ? `${user.name} (${user.email}). Estado: ${syncLabel(syncStatus)}.` : 'Inicia sesión para cargar tu álbum.'}</CardDescription>
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
                Cerrar sesión
              </Button>
              <Button type="button" variant="outline" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
                {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
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
          <CardDescription>Esto borrará tu progreso guardado en esta cuenta. Esta acción no se puede deshacer, excepto si tienes un respaldo JSON.</CardDescription>
        </CardHeader>
        <CardContent className="settings-danger-content">
          <Button type="button" variant="destructive" onClick={() => setConfirmReset(true)}>
            <RotateCcw aria-hidden="true" />
            Resetear álbum
          </Button>
        </CardContent>
      </Card>
      <Dialog open={Boolean(importPreview)} onOpenChange={(open) => !open && setImportPreview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar respaldo</DialogTitle>
            <DialogDescription>
              Este respaldo contiene {importPreview?.owned} figuritas obtenidas, {importPreview?.repeated} repetidas, {importPreview?.cracks} cracks personalizados y {importPreview?.purchases} movimientos de costos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setImportPreview(null)}>Cancelar</Button>
            <Button type="button" onClick={applyImport}>Reemplazar progreso</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetear álbum</DialogTitle>
            <DialogDescription>Esto borrará figuritas, Coca-Cola, cracks personalizados y compras guardadas en esta cuenta.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmReset(false)}>Cancelar</Button>
            <Button type="button" variant="destructive" onClick={reset}>Resetear álbum</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function syncLabel(status) {
  if (status === 'synced') return 'sincronizado';
  if (status === 'saving') return 'guardando';
  if (status === 'loading') return 'cargando';
  if (status === 'conflict') return 'con conflicto';
  if (status === 'error') return 'sin sincronizar';
  return 'sin sesión';
}
