import { Navigate, Outlet, useLocation } from 'react-router';
import { usePermissions } from './permissions';

// Rutas solo para Jefa, Contador y Admin. El supervisor vuelve al calendario.
export function RequireOffice() {
  const { canAccessOffice } = usePermissions();
  const { search } = useLocation();
  if (!canAccessOffice) return <Navigate to={{ pathname: '/calendario', search }} replace />;
  return <Outlet />;
}
