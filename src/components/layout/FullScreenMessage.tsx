import * as React from 'react';
import { PintechLogo } from './PintechLogo';

// Pantalla completa con el logo: carga inicial o avisos de configuración
export function FullScreenMessage({ children, pulse }: { children: React.ReactNode; pulse?: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-black p-6 text-center">
      <PintechLogo size="lg" showSubtitle={false} />
      <div className={`mt-8 max-w-md font-mono text-xs text-neutral-400 ${pulse ? 'animate-pulse' : ''}`}>{children}</div>
    </div>
  );
}
