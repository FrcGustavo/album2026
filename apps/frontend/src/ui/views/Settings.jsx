import React, { useEffect, useRef, useState } from 'react';
import { Download, Upload, UserRound, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { emptyState, sanitizeState } from '../../domain/albumState.js';
import { catalog } from '../../domain/catalog.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function Settings({ state, update, user, syncStatus, connectUser, disconnectUser }) {
  const inputRef = useRef(null);
  const [message, setMessage] = useState('');
  const [name, setName] = useState(user?.name || '');

  useEffect(() => {
    setName(user?.name || '');
  }, [user]);

  function submitUser(event) {
    event.preventDefault();
    if (!name.trim()) return;
    connectUser(name.trim());
  }

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
          <CardDescription>{user ? `Usuario actual: ${user.name}. ${syncStatus === 'offline' ? 'Modo local, no sincronizado.' : 'Sincronizacion activa.'}` : 'Sin usuario remoto. Tus datos viven en este navegador.'}</CardDescription>
        </CardHeader>
        <CardContent>
        <form className="inline-form" onSubmit={submitUser}>
          <Input value={name} placeholder="Tu nombre" onChange={(event) => setName(event.target.value)} />
          <Button type="submit">
            <UserRound aria-hidden="true" />
            {user ? 'Cambiar usuario' : 'Sincronizar'}
          </Button>
          {user && <Button type="button" variant="outline" onClick={disconnectUser}>Usar solo local</Button>}
        </form>
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
        {message && <p className="notice">{message}</p>}
        </CardContent>
      </Card>
      <Card className="settings-card danger-zone">
        <CardHeader>
          <CardTitle>Zona peligrosa</CardTitle>
          <CardDescription>Se borraran las {catalog.baseTotal} figuritas base, Coca-Cola, cracks personalizados y compras.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="destructive" onClick={reset}>
            <RotateCcw aria-hidden="true" />
            Resetear album
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
