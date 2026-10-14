import { Outlet } from 'react-router';
import { Button } from '@/components/ui/button';
import { useEmployees } from '@/features/employees/queries';
import { useMonthRecords } from '@/features/records/queries';
import { useCompanySettings } from '@/features/settings/queries';
import { useSelectedMonth } from '@/hooks/useSelectedMonth';
import { Navbar } from './Navbar';

// Estructura común de todas las pantallas: barra superior + contenido de la ruta
export function AppLayout() {
  const [month] = useSelectedMonth();
  const records = useMonthRecords(month);
  const employees = useEmployees();
  const settings = useCompanySettings();

  const failed = [records, employees, settings].find((q) => q.isError);
  const isLoading = records.isLoading || employees.isLoading || settings.isLoading;

  return (
    <div className="min-h-dvh bg-background pb-16 font-sans text-foreground antialiased">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {failed && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <span>{failed.error instanceof Error ? failed.error.message : 'No se pudieron cargar los datos.'}</span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-destructive"
              onClick={() => [records, employees, settings].forEach((q) => q.refetch())}
            >
              Reintentar
            </Button>
          </div>
        )}
        {isLoading && (
          <div className="mb-4 animate-pulse rounded-lg border bg-card p-3 text-center font-mono text-xs text-muted-foreground">
            Sincronizando registros de nómina...
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
