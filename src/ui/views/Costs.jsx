import { useState } from 'react';
import { EmptyState } from '../components/Layout.jsx';
import { Stat } from '../components/Progress.jsx';
import { money, pct, purchaseLabel } from '../formatters.js';

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
        <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
          <option value="box">Caja de sobres</option>
          <option value="pack">Sobres individuales</option>
          <option value="single">Figuritas sueltas</option>
          <option value="exchange">Intercambio pagado</option>
          <option value="shipping">Envio</option>
          <option value="income">Ingreso a favor</option>
        </select>
        <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
        <input type="number" min="0" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} placeholder="Cantidad" />
        <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="Monto total" />
        <input type="number" min="0" value={form.packsPerBox} onChange={(event) => setForm({ ...form, packsPerBox: event.target.value })} placeholder="Sobres por caja" />
        <input type="number" min="1" value={form.stickersPerPack} onChange={(event) => setForm({ ...form, stickersPerPack: event.target.value })} placeholder="Figuras por sobre" />
        <input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Notas" />
        <button type="submit">Registrar movimiento</button>
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
