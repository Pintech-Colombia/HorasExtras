import { UserRole } from '@/types';
import { useAuth } from './AuthProvider';

// Permisos de interfaz por rol. La base de datos (RLS) aplica las mismas reglas:
// esto solo decide qué se muestra.
export function getPermissions(role: UserRole) {
  const isOffice = role !== 'supervisor'; // Jefa, Contador y Admin
  return {
    canRegister: role === 'supervisor' || role === 'manager' || role === 'admin',
    canApprove: role === 'manager' || role === 'admin',
    canEditRecords: role === 'manager' || role === 'admin',
    canSeeMoney: isOffice,
    canEditEmployees: role === 'manager' || role === 'admin',
    canEditRates: isOffice,
    canEditSettings: isOffice,
    canAccessOffice: isOffice,
  };
}

export type Permissions = ReturnType<typeof getPermissions>;

export function usePermissions(): Permissions & { role: UserRole } {
  const { role } = useAuth();
  return { ...getPermissions(role), role };
}
