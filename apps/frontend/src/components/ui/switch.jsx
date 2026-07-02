import React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

function Switch({ className, ...props }) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'ui-switch peer inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-input transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn('pointer-events-none block size-7 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0')}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
