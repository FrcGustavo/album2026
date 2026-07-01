import { pct } from '../formatters.js';

export function ProgressHero({ title, summary, helper }) {
  return (
    <article className="progress-hero">
      <div>
        <h2>{title}</h2>
        <p>{helper}</p>
      </div>
      <strong>{pct(summary.percent)}</strong>
      <span>{summary.owned} obtenidas - {summary.repeated} repetidas - {summary.missing} faltantes</span>
    </article>
  );
}

export function ProgressCard({ title, summary, disabled = false }) {
  return (
    <article className={`progress-card ${disabled ? 'disabled' : ''}`}>
      <span>{title}</span>
      <strong>{disabled ? 'Off' : pct(summary.percent)}</strong>
      <ProgressBar percent={disabled ? 0 : summary.percent} />
      <small>{summary.owned}/{summary.total} obtenidas</small>
    </article>
  );
}

export function ProgressBar({ percent }) {
  return (
    <div className="progress-bar">
      <span style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
    </div>
  );
}

export function Stat({ label, value, helper }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </div>
  );
}
