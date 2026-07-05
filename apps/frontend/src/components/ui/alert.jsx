import * as React from 'react';
import { cn } from '@/lib/utils';

export function Alert({ className, variant = 'default', ...props }) {
  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-lg border px-4 py-3 text-sm',
        variant === 'destructive' ? 'border-destructive/50 text-destructive' : 'border-border text-foreground',
        className
      )}
      {...props}
    />
  );
}

export function AlertTitle({ className, ...props }) {
  return <h5 className={cn('mb-1 font-medium leading-none tracking-normal', className)} {...props} />;
}

export function AlertDescription({ className, ...props }) {
  return <div className={cn('text-sm opacity-90', className)} {...props} />;
}
