import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { appendActivity } from '../../domain/albumState.js';
import { EmptyState } from '../components/Layout.jsx';
import { Stat } from '../components/Progress.jsx';
import { money, pct, purchaseLabel } from '../formatters.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PURCHASE_HELP = {
  box: 'Compra de cajas completas. Sirve para estimar sobres y figuritas abiertas.',
  pack: 'Compra de sobres sueltos. La cantidad representa sobres.',
  single: 'Figuritas compradas una por una. La cantidad representa figuritas.',
  exchange: 'Dinero pagado para completar un intercambio.',
  shipping: 'Costo de envío, entrega o comisión. No suma sobres ni figuritas.',
  income: 'Dinero recuperado por ventas, reembolsos o aportes. Resta al gasto neto.'
};

const QUANTITY_HELP = {
  box: 'Número de cajas compradas.',
  pack: 'Número de sobres comprados.',
  single: 'Número de figuritas sueltas.',
  exchange: 'Número de figuritas recibidas o intercambiadas.',
  shipping: 'Usa 1 si es un solo envío.',
  income: 'Usa 1 si es un solo ingreso.'
};

const PRICE_HELP = {
  income: 'Monto que recuperaste o recibiste.',
  default: 'Monto total pagado, no precio unitario.'
};

export function Costs({ state, patch, costStats, albumStats }) {
  const [form, setForm] = useState({
    type: 'box',
    date: new Date().toISOString().slice(0, 10),
    quantity: 1,
    price: 0,
    packsPerBox: 50,
    stickersPerPack: 7,
    notes: '',
    source: ''
  });
  const showPackDetails = form.type === 'box' || form.type === 'pack';
  const showPacksPerBox = form.type === 'box';

  function addPurchase(event) {
    event.preventDefault();
    patch((current) =>
      appendActivity(
        {
          ...current,
          purchases: [
            {
              ...form,
              id: crypto.randomUUID(),
              quantity: Number(form.quantity) || 1,
              price: Number(form.price) || 0,
              packsPerBox: Number(form.packsPerBox) || 0,
              stickersPerPack: Number(form.stickersPerPack) || 7
            },
            ...current.purchases
          ]
        },
        'purchase',
        form.type === 'income' ? 'Registraste un ingreso.' : 'Registraste un gasto.'
      ), form.type === 'income' ? 'Ingreso registrado.' : 'Gasto registrado.');
  }

  function deletePurchase(purchase) {
    const purchaseIndex = state.purchases.findIndex((item) => item.id === purchase.id);
    patch((current) => appendActivity({ ...current, purchases: current.purchases.filter((item) => item.id !== purchase.id) }, 'purchase', 'Eliminaste un movimiento.'), 'Movimiento eliminado.');
    toast('Movimiento eliminado.', {
      action: {
        label: 'Deshacer',
        onClick: () =>
          patch((current) => {
            const nextPurchases = [...current.purchases];
            const restoreIndex = purchaseIndex >= 0 ? Math.min(purchaseIndex, nextPurchases.length) : nextPurchases.length;
            nextPurchases.splice(restoreIndex, 0, purchase);
            return { ...current, purchases: nextPurchases };
          }, 'Movimiento restaurado.')
      }
    });
  }

  return (
    <section className="view-stack">
      <div className="metric-grid">
        <Stat label="Gasto bruto" value={money(costStats.spent)} helper="compras y envíos" />
        <Stat label="Ingresos" value={money(costStats.income)} helper="ventas/reembolsos" />
        <Stat label="Gasto neto" value={money(costStats.net)} helper="balance real" />
        <Stat label="Costo por sobre" value={money(costStats.avgPerPack)} helper={`${costStats.packs} sobres`} />
        <Stat label="Costo por nueva" value={money(costStats.avgPerNew)} helper={`${albumStats.owned} únicas`} />
        <Stat label="Eficiencia" value={pct(costStats.openingEfficiency)} helper="únicas vs estimadas" />
      </div>

      <form className="cost-form" onSubmit={addPurchase}>
        <label className="cost-field cost-field-wide">
          <span>Tipo de movimiento</span>
          <Select value={form.type} onValueChange={(type) => setForm({ ...form, type })}>
            <SelectTrigger aria-label="Tipo de movimiento">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="box">Caja de sobres</SelectItem>
              <SelectItem value="pack">Sobres individuales</SelectItem>
              <SelectItem value="single">Figuritas sueltas</SelectItem>
              <SelectItem value="exchange">Intercambio pagado</SelectItem>
              <SelectItem value="shipping">Envío</SelectItem>
              <SelectItem value="income">Ingreso a favor</SelectItem>
            </SelectContent>
          </Select>
          <small>{PURCHASE_HELP[form.type]}</small>
        </label>

        <label className="cost-field">
          <span>Fecha</span>
          <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          <small>Día en que pagaste o recibiste el dinero.</small>
        </label>

        <label className="cost-field">
          <span>Cantidad</span>
          <Input type="number" min="0" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} placeholder="Ej. 1" />
          <small>{QUANTITY_HELP[form.type]}</small>
        </label>

        <label className="cost-field">
          <span>Monto total</span>
          <Input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="Ej. 950" />
          <small>{PRICE_HELP[form.type] || PRICE_HELP.default}</small>
        </label>

        {showPacksPerBox && (
          <label className="cost-field">
            <span>Sobres por caja</span>
            <Input type="number" min="0" value={form.packsPerBox} onChange={(event) => setForm({ ...form, packsPerBox: event.target.value })} placeholder="Ej. 50" />
            <small>Se usa para calcular costo por sobre.</small>
          </label>
        )}

        {showPackDetails && (
          <label className="cost-field">
            <span>Figuritas por sobre</span>
            <Input type="number" min="1" value={form.stickersPerPack} onChange={(event) => setForm({ ...form, stickersPerPack: event.target.value })} placeholder="Ej. 7" />
            <small>Ayuda a estimar cuántas figuritas abriste.</small>
          </label>
        )}

        <label className="cost-field">
          <span>Tienda o persona</span>
          <Input value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} placeholder="Ej. Oxxo, Panini Store, Carlos" />
          <small>Opcional, útil para recordar dónde fue el movimiento.</small>
        </label>

        <label className="cost-field cost-field-wide">
          <span>Notas</span>
          <Input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Ej. promo, envío o detalle del intercambio" />
          <small>Opcional, aparece en el historial.</small>
        </label>

        <div className="cost-form-actions">
          <Button type="submit">
            <Plus aria-hidden="true" />
            Registrar movimiento
          </Button>
        </div>
      </form>

      <div className="history-list">
        {state.purchases.length === 0 && <EmptyState text="Aún no registraste movimientos." />}
        {state.purchases.map((purchase) => (
          <article className="history-item" key={purchase.id}>
            <div className="history-item-main">
              <strong>{purchaseLabel(purchase.type)}</strong>
              <span>{purchase.date} - {purchase.quantity} unidad(es) {purchase.source ? `- ${purchase.source}` : ''} {purchase.notes ? `- ${purchase.notes}` : ''}</span>
            </div>
            <b>{purchase.type === 'income' ? '+' : '-'}{money(purchase.price)}</b>
            <Button type="button" variant="destructive" size="sm" onClick={() => deletePurchase(purchase)}>
              <Trash2 aria-hidden="true" />
              Eliminar
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
