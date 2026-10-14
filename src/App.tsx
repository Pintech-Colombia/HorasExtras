import { Navigate, Route, Routes } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { FullScreenMessage } from '@/components/layout/FullScreenMessage';
import { useAuth } from '@/features/auth/AuthProvider';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { RequireOffice } from '@/features/auth/RequireOffice';
import { SetPasswordScreen } from '@/features/auth/SetPasswordScreen';
import { CalendarPage } from '@/features/calendar/CalendarPage';
import { EmployeesPage } from '@/features/employees/EmployeesPage';
import { RecordDialogProvider } from '@/features/records/RecordDialogProvider';
import { ReportPage } from '@/features/report/ReportPage';
import { ReviewPage } from '@/features/review/ReviewPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function App() {
  const { status, session, isRecovery, enterDemo, refreshProfile, signOut } = useAuth();

  // Producción sin Supabase configurado: no se permite operar con datos locales
  if (!isSupabaseConfigured() && !import.meta.env.DEV) {
    return (
      <FullScreenMessage>
        La aplicación no está conectada a la base de datos. El administrador debe configurar VITE_SUPABASE_URL y
        VITE_SUPABASE_ANON_KEY en Vercel y volver a desplegar.
      </FullScreenMessage>
    );
  }

  if (status === 'loading') {
    return <FullScreenMessage pulse>Sincronizando credenciales de seguridad...</FullScreenMessage>;
  }

  if (status === 'signedOut') {
    return <LoginScreen onContinueOffline={enterDemo} />;
  }

  // Contraseña propia obligatoria: primer ingreso o enlace de recuperación
  if (status === 'mustSetPassword') {
    return (
      <SetPasswordScreen
        email={session?.user?.email}
        isRecovery={isRecovery}
        onSignOut={signOut}
        onDone={refreshProfile}
      />
    );
  }

  return (
    <RecordDialogProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/calendario" element={<CalendarPage />} />
          <Route element={<RequireOffice />}>
            <Route path="/auditoria" element={<ReviewPage />} />
            <Route path="/reporte" element={<ReportPage />} />
            <Route path="/empleados" element={<EmployeesPage />} />
            <Route path="/configuracion" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/calendario" replace />} />
        </Route>
      </Routes>
    </RecordDialogProvider>
  );
}
