import { MutationCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      /** Aviso que se muestra cuando la operación termina bien */
      successMessage?: string;
    };
  }
}

// Avisos estándar para todas las operaciones de guardado:
// - error: siempre se muestra el mensaje (ya traducido por lib/errors.ts)
// - éxito: solo si la mutación define meta.successMessage
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
  mutationCache: new MutationCache({
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Ocurrió un error inesperado. Intente de nuevo.');
    },
    onSuccess: (_data, _variables, _context, mutation) => {
      const message = mutation.meta?.successMessage;
      if (message) toast.success(message);
    },
  }),
});
