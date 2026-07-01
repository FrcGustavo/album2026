import React from 'react';
import { pct } from '../formatters.js';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function ProgressHero({ title, summary, helper }) {
  return (
    <article className="progress-hero">
      <div>
        <h2>{title}</h2>
        <p>{helper}</p>
      </div>
      <div className="progress-hero-summary">
        <strong>{pct(summary.percent)}</strong>
        <span>{summary.owned} obtenidas - {summary.repeated} repetidas - {summary.missing} faltantes</span>
      </div>
    </article>
  );
}

export function ProgressCard({ title, summary, disabled = false }) {
  return (
    <Card className={`progress-card ${disabled ? 'disabled' : ''}`}>
      <CardHeader>
        <div className="progress-card-heading">
          <CardTitle>{title}</CardTitle>
          <Badge variant={disabled ? 'secondary' : 'leaf'}>{disabled ? 'Off' : pct(summary.percent)}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ProgressBar percent={disabled ? 0 : summary.percent} />
        <small>{summary.owned}/{summary.total} obtenidas</small>
      </CardContent>
    </Card>
  );
}

export function ProgressBar({ percent }) {
  return <Progress value={percent} indicatorClassName="bg-gradient-to-r from-primary to-[var(--leaf)]" />;
}

export function Stat({ label, value, helper }) {
  return (
    <Card className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </Card>
  );
}
