import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { EnvironmentBanner } from '@/components/layout/EnvironmentBanner';
import { AppProviders } from '@/app/providers';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <EnvironmentBanner />
      <App />
    </AppProviders>
  </StrictMode>
);

// App instalable: el service worker solo se registra en producción
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // si falla, la app sigue funcionando igual (solo no es instalable)
    });
  });
}
