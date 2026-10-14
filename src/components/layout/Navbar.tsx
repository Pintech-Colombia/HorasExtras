import { NavLink, useLocation } from 'react-router';
import { Calendar, CheckCircle2, LogOut, Mail, Moon, Plus, Settings, Sun, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { useAuth } from '@/features/auth/AuthProvider';
import { usePermissions } from '@/features/auth/permissions';
import { useMonthRecords } from '@/features/records/queries';
import { useRecordDialog } from '@/features/records/RecordDialogProvider';
import { useSelectedMonth } from '@/hooks/useSelectedMonth';
import { cn } from '@/lib/utils';
import { useTheme } from './ThemeProvider';
import { PintechLogo } from './PintechLogo';

const ROLE_LABELS: Record<UserRole, string> = {
  supervisor: 'Supervisor Planta',
  manager: 'Jefa de Planta',
  accountant: 'Contador / Nómina',
  admin: 'Administrador',
};

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  officeOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/calendario', label: 'Calendario', icon: Calendar },
  { to: '/auditoria', label: 'Auditoría', icon: CheckCircle2, officeOnly: true },
  { to: '/reporte', label: 'Reporte y Nómina', icon: Mail, officeOnly: true },
  { to: '/empleados', label: 'Personal', icon: Users, officeOnly: true },
  { to: '/configuracion', label: 'Configuración', icon: Settings, officeOnly: true },
];

export function Navbar() {
  const { profile, isDemo, setDemoRole, signOut } = useAuth();
  const { role, canRegister, canAccessOffice } = usePermissions();
  const { isDark, toggleTheme } = useTheme();
  const [month, setMonth] = useSelectedMonth();
  const { records } = useMonthRecords(month);
  const openRecordDialog = useRecordDialog();
  const { search, pathname } = useLocation(); // conserva ?mes= al cambiar de pestaña
  // En el calendario del celular se usa el botón flotante
  const hideRegisterOnMobile = pathname === '/calendario';

  const pendingCount = records.filter((r) => !r.verifiedByManager).length;
  const verifiedCount = records.length - pendingCount;
  const displayName = isDemo ? 'Modo Local' : profile?.fullName || profile?.email;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-2 py-2">
          <PintechLogo size="sm" showSubtitle={false} />

          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <Input
              type="month"
              aria-label="Mes"
              value={month}
              onChange={(e) => e.target.value && setMonth(e.target.value)}
              className="h-8 w-auto font-mono text-xs"
            />

            {canAccessOffice && (
              <div className="hidden h-8 items-center gap-1.5 rounded-md border bg-card px-2.5 font-mono text-[11px] text-muted-foreground lg:flex">
                <span className="font-semibold text-warning">{pendingCount}</span>
                <span>pendientes</span>
                <span className="text-border">/</span>
                <span className="font-semibold text-foreground">{verifiedCount}</span>
                <span>auditadas</span>
              </div>
            )}

            {/* Solo en modo demostración (desarrollo local): probar cada rol */}
            {setDemoRole && (
              <NativeSelect
                aria-label="Vista de rol"
                value={role}
                onChange={(e) => setDemoRole(e.target.value as UserRole)}
                className="h-8 text-xs"
              >
                <option value="supervisor">1. Supervisor (Planta)</option>
                <option value="manager">2. Jefa (Operaciones)</option>
                <option value="accountant">3. Contador (Nómina)</option>
                <option value="admin">Admin (Total)</option>
              </NativeSelect>
            )}

            <Button
              variant="outline"
              size="icon-sm"
              onClick={toggleTheme}
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDark ? <Sun className="text-warning" /> : <Moon />}
            </Button>

            <div className="flex h-8 items-center gap-2 rounded-md border bg-card px-2.5 text-xs">
              <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
                {ROLE_LABELS[role]}
              </span>
              <span className="hidden max-w-[110px] truncate font-medium md:inline">{displayName}</span>
              <button
                onClick={signOut}
                className="ml-1 text-muted-foreground transition-colors hover:text-destructive"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>

            {canRegister && (
              <Button
                size="sm"
                className={cn('rounded-full', hideRegisterOnMobile && 'max-md:hidden')}
                onClick={() => openRecordDialog()}
              >
                <Plus />
                <span className="hidden sm:inline">Registrar Horas</span>
                <span className="sm:hidden">Registrar</span>
              </Button>
            )}
          </div>
        </div>

        <nav className="scrollbar-none flex items-center gap-1 overflow-x-auto border-t py-1.5 text-xs">
          {NAV_ITEMS.filter((item) => !item.officeOnly || canAccessOffice).map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={{ pathname: to, search }}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 font-medium transition-colors',
                  isActive
                    ? 'bg-primary font-semibold text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )
              }
            >
              <Icon className="size-3.5" />
              <span>{label}</span>
              {to === '/auditoria' && pendingCount > 0 && (
                <span className="rounded-full bg-warning px-1.5 text-[10px] font-semibold text-black">{pendingCount}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
