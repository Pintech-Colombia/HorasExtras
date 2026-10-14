import { Toaster as Sonner, type ToasterProps } from 'sonner';

// Avisos flotantes ("Guardado", errores). Se usan con: import { toast } from 'sonner'
function Toaster({ theme, ...props }: ToasterProps) {
  return (
    <Sonner
      theme={theme}
      position="top-center"
      richColors
      closeButton
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
