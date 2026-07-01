export function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export function pct(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

export function purchaseLabel(type) {
  return {
    box: 'Caja de sobres',
    pack: 'Sobres individuales',
    single: 'Figuritas sueltas',
    exchange: 'Intercambio pagado',
    shipping: 'Envio',
    income: 'Ingreso a favor'
  }[type] || type;
}
