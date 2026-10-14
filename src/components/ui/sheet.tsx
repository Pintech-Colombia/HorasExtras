import * as React from 'react';
import { Dialog as SheetPrimitive } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { touchSafeOpenAutoFocus } from '@/components/ui/dialog';

const Sheet = SheetPrimitive.Root;
const SheetClose = SheetPrimitive.Close;

// Panel que entra desde un borde de la pantalla (derecha en PC, abajo en celular)
function SheetContent({
  className,
  children,
  side = 'right',
  onOpenAutoFocus,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & { side?: 'right' | 'bottom' }) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          'fixed z-50 flex flex-col bg-card text-card-foreground shadow-vercel-modal outline-none',
          side === 'right' && 'inset-y-0 right-0 h-full w-full border-l sm:max-w-md',
          side === 'bottom' && 'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl border-t',
          className
        )}
        onOpenAutoFocus={touchSafeOpenAutoFocus(onOpenAutoFocus)}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground opacity-80 outline-none transition hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50">
          <X className="size-4" />
          <span className="sr-only">Cerrar</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1 border-b p-5 pr-12', className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title className={cn('text-base font-semibold', className)} {...props} />;
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return <SheetPrimitive.Description className={cn('text-xs text-muted-foreground', className)} {...props} />;
}

export { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetDescription };
