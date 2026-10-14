import * as React from 'react';
import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-16 w-full rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-xs outline-none md:text-sm',
        'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-60',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
