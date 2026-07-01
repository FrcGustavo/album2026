import React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

function Progress({ className, value, indicatorClassName, ...props }) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <ProgressPrimitive.Root className={cn('relative h-2.5 w-full overflow-hidden rounded-full bg-muted', className)} {...props}>
      <ProgressPrimitive.Indicator
        className={cn('h-full w-full flex-1 bg-primary transition-all', indicatorClassName)}
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
