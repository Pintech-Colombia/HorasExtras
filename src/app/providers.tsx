import * as React from 'react';
import { BrowserRouter } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ConfirmProvider } from '@/components/ui/confirm';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider, useTheme } from '@/components/layout/ThemeProvider';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { queryClient } from '@/lib/queryClient';

function ThemedToaster() {
  const { isDark } = useTheme();
  return <Toaster theme={isDark ? 'dark' : 'light'} />;
}

// Todos los proveedores globales de la app en un solo lugar
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <ConfirmProvider>
              {children}
              <ThemedToaster />
            </ConfirmProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
