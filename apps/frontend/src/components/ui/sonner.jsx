import React from 'react';
import { Toaster as Sonner } from 'sonner';

function Toaster(props) {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        classNames: {
          toast: 'border-border bg-card text-card-foreground',
          title: 'font-extrabold',
          description: 'text-muted-foreground'
        }
      }}
      {...props}
    />
  );
}

export { Toaster };
