import React, { useState } from 'react';
import { EmptyState } from '../components/Layout.jsx';
import { Stat } from '../components/Progress.jsx';
import { money, pct, purchaseLabel } from '../formatters.js';

const PURCHASE_HELP = {
  box: 'Compra de cajas completas. Sirve para estimar sobres y figuritas abiertas.',
  pack: 'Compra de sobres sueltos. La cantidad representa sobres.',
  single: 'Figuritas compradas una por una. La cantidad representa figuritas.',
  exchange: 'Dinero pagado para completar un intercambio.',
  shipping: 'Costo de envio, entrega o comision. No suma sobres ni figuritas.',
  income: 'Dinero recuperado por ventas, reembolsos o aportes. Resta al gasto neto.'
};

const QUANTITY_HELP = {
  box: 'Numero de cajas compradas.',
  pack: 'Numero de sobres comprados.',
  single: 'Numero de figuritas sueltas.',
  exchange: 'Numero de figuritas recibidas o intercambiadas.',
  shipping: 'Usa 1 si es un solo envio.',
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
    notes: ''
  });
  const showPackDetails = form.type === 'box' || form.type === 'pack';
  const showPacksPerBox = form.type === 'box';

  function addPurchase(event) {
    event.preventDefault();
    patch((current) => ({
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
    }), form.type === 'income' ? 'Ingreso registrado.' : 'Gasto registrado.');
  }

  return (
    <section className="view-stack">
      <div className="metric-grid">
        <Stat label="Gasto bruto" value={money(costStats.spent)} helper="compras y envios" />
        <Stat label="Ingresos" value={money(costStats.income)} helper="ventas/reembolsos" />
        <Stat label="Gasto neto" value={money(costStats.net)} helper="balance real" />
        <Stat label="Costo por sobre" value={money(costStats.avgPerPack)} helper={`${costStats.packs} sobres`} />
        <Stat label="Costo por nueva" value={money(costStats.avgPerNew)} helper={`${albumStats.owned} unicas`} />
        <Stat label="Eficiencia" value={pct(costStats.openingEfficiency)} helper="unicas vs estimadas" />
      </div>

      <form className="cost-form" onSubmit={addPurchase}>
        <label className="cost-field cost-field-wide">
          <span>Tipo de movimiento</span>
          <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
            <option value="box">Caja de sobres</option>
            <option value="pack">Sobres individuales</option>
            <option value="single">Figuritas sueltas</option>
            <option value="exchange">Intercambio pagado</option>
            <option value="shipping">Envio</option>
            <option value="income">Ingreso a favor</option>
          </select>
          <small>{PURCHASE_HELP[form.type]}</small>
        </label>

        <label className="cost-field">
          <span>Fecha</span>
          <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          <small>Dia en que pagaste o recibiste el dinero.</small>
        </label>

        <label className="cost-field">
          <span>Cantidad</span>
          <input type="number" min="0" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} placeholder="Ej. 1" />
          <small>{QUANTITY_HELP[form.type]}</small>
        </label>

        <label className="cost-field">
          <span>Monto total</span>
          <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="Ej. 950" />
          <small>{PRICE_HELP[form.type] || PRICE_HELP.default}</small>
        </label>

        {showPacksPerBox && (
          <label className="cost-field">
            <span>Sobres por caja</span>
            <input type="number" min="0" value={form.packsPerBox} onChange={(event) => setForm({ ...form, packsPerBox: event.target.value })} placeholder="Ej. 50" />
            <small>Se usa para calcular costo por sobre.</small>
          </label>
        )}

        {showPackDetails && (
          <label className="cost-field">
            <span>Figuritas por sobre</span>
            <input type="number" min="1" value={form.stickersPerPack} onChange={(event) => setForm({ ...form, stickersPerPack: event.target.value })} placeholder="Ej. 7" />
            <small>Ayuda a estimar cuantas figuritas abriste.</small>
          </label>
        )}

        <label className="cost-field cost-field-wide">
          <span>Notas</span>
          <input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Ej. tienda, envio, promo o con quien cambiaste" />
          <small>Opcional, aparece en el historial.</small>
        </label>

        <div className="cost-form-actions">
          <button type="submit">Registrar movimiento</button>
        </div>
      </form>

      <div className="history-list">
        {state.purchases.length === 0 && <EmptyState text="Aun no registraste movimientos." />}
        {state.purchases.map((purchase) => (
          <article className="history-item" key={purchase.id}>
            <div>
              <strong>{purchaseLabel(purchase.type)}</strong>
              <span>{purchase.date} - {purchase.quantity} unidad(es) {purchase.notes ? `- ${purchase.notes}` : ''}</span>
            </div>
            <b>{purchase.type === 'income' ? '+' : '-'}{money(purchase.price)}</b>
            <button type="button" className="ghost danger" onClick={() => patch((current) => ({ ...current, purchases: current.purchases.filter((item) => item.id !== purchase.id) }), 'Movimiento eliminado.')}>
              Eliminar
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
