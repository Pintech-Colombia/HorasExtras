import React, { useState, useEffect, useCallback } from 'react';
import { Employee, OvertimeRecord, CompanySettings, UserProfile, UserRole, PeriodType, applyOvertimeRules } from './types';
import { getEmployees, createEmployee, createMultipleEmployees, updateEmployee, deleteEmployee } from './services/employeesService';
import { getRecords, createRecords, updateRecord, deleteRecord, verifyAllMonthRecords } from './services/recordsService';
import { getCompanySettings, updateCompanySettings } from './services/companyService';
import { INITIAL_SETTINGS } from './data/defaults';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Navbar } from './components/Navbar';
import { CalendarView } from './components/CalendarView';
import { ManagerReviewView } from './components/ManagerReviewView';
import { GmailReportBuilder } from './components/GmailReportBuilder';
import { EmployeeManager } from './components/EmployeeManager';
import { CompanySettingsView } from './components/CompanySettingsView';
import { AddOvertimeModal } from './components/AddOvertimeModal';
import { LoginScreen } from './components/LoginScreen';
import { PintechLogo } from './components/PintechLogo';

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<OvertimeRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('manager');
  // Modo demostración: solo en desarrollo local y sin Supabase configurado
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [settings, setSettings] = useState<CompanySettings>(INITIAL_SETTINGS);

  // Las etiquetas y multiplicadores de recargos siguen la configuración de la empresa
  applyOvertimeRules(settings.overtimeRules);

  // Current Month selector YYYY-MM
  const today = new Date();
  const defaultMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonthStr);

  // Period Type selector ('full_month' | 'first_half' | 'second_half')
  const [periodType, setPeriodType] = useState<PeriodType>('full_month');

  // Active Tab
  const [currentTab, setCurrentTab] = useState<'calendar' | 'review' | 'gmail' | 'employees' | 'settings'>('calendar');

  // Aplica el rol y regresa al calendario si la pestaña actual no está permitida
  const applyRole = (newRole: UserRole) => {
    setActiveRole(newRole);
    if (newRole === 'supervisor') {
      setCurrentTab('calendar');
    } else if (newRole === 'manager') {
      setCurrentTab((tab) => (tab === 'settings' ? 'calendar' : tab));
    }
  };

  // Add Overtime Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>(undefined);

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme_mode');
    if (saved) return saved === 'dark';
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('theme_mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('theme_mode', 'light');
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Helper para consultar perfil del usuario desde Supabase
  const fetchUserProfile = async (authUser: any) => {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      // El rol SOLO se toma de la base de datos; sin perfil se trata como supervisor (mínimo privilegio)
      const role: UserRole = (data?.role as UserRole) || 'supervisor';
      setUserProfile({
        id: authUser.id,
        email: data?.email || authUser.email || '',
        fullName: data?.full_name || authUser.email?.split('@')[0] || 'Usuario',
        role,
        companyId: data?.company_id,
      });
      applyRole(role);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error al cargar perfil de usuario:', err);
      }
      applyRole('supervisor');
    }
  };

  // Ejecuta una operación contra el servidor; si falla, muestra el error y recarga el estado real
  const runAction = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Ocurrió un error inesperado. Intente de nuevo.');
      loadInitialData();
    }
  };

  // Carga inicial asíncrona de datos desde Supabase
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [fetchedEmployees, fetchedRecords, fetchedSettings] = await Promise.all([
        getEmployees(),
        getRecords(),
        getCompanySettings(),
      ]);
      setEmployees(fetchedEmployees);
      setRecords(fetchedRecords);
      setSettings(fetchedSettings);
    } catch (error: any) {
      setLoadError(error?.message || 'No se pudieron cargar los datos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Escuchar sesión de Supabase Auth
  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          await fetchUserProfile(session.user);
        }
        setIsAuthChecking(false);
        if (session) loadInitialData();
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setSession(session);
        if (session?.user) {
          await fetchUserProfile(session.user);
          loadInitialData();
        } else {
          setUserProfile(null);
          setEmployees([]);
          setRecords([]);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      setIsAuthChecking(false);
      loadInitialData();
    }
  }, [loadInitialData]);

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setSession(null);
      setUserProfile(null);
      setEmployees([]);
      setRecords([]);
    }
  };

  // Handlers de Registro de Horas Extras
  const handleOpenModalForDate = (dateStr: string) => {
    setModalInitialDate(dateStr);
    setIsModalOpen(true);
  };

  const handleOpenModalGeneral = () => {
    setModalInitialDate(undefined);
    setIsModalOpen(true);
  };

  const handleSaveNewRecords = async (newRecordsData: Omit<OvertimeRecord, 'id' | 'createdAt'>[]): Promise<boolean> => {
    try {
      const created = await createRecords(newRecordsData);
      setRecords((prev) => [...created, ...prev]);
      return true;
    } catch (err: any) {
      setErrorMsg(err?.message || 'No se pudieron guardar las horas extras.');
      return false;
    }
  };

  const handleToggleVerifyRecord = async (id: string) => {
    const target = records.find((r) => r.id === id);
    if (!target) return;

    const nextVerified = !target.verifiedByManager;
    const partial: Partial<OvertimeRecord> = {
      verifiedByManager: nextVerified,
      status: nextVerified ? 'verified_manager' : 'pending_review',
      verifiedAt: nextVerified ? new Date().toISOString() : undefined,
    };

    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...partial } : r))
    );

    await runAction(() => updateRecord(id, partial).then(() => undefined));
  };

  const handleVerifyAllMonth = async () => {
    const now = new Date().toISOString();
    setRecords((prev) =>
      prev.map((r) => {
        if (r.date.startsWith(selectedMonth) && !r.verifiedByManager) {
          return {
            ...r,
            verifiedByManager: true,
            status: 'verified_manager',
            verifiedAt: now,
          };
        }
        return r;
      })
    );

    await runAction(() => verifyAllMonthRecords(selectedMonth));
  };

  const handleDeleteRecord = async (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    await runAction(() => deleteRecord(id));
  };

  const handleUpdateRecord = async (id: string, partial: Partial<OvertimeRecord>) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...partial } : r))
    );
    await runAction(() => updateRecord(id, partial).then(() => undefined));
  };

  // Handlers de Empleados
  const handleAddEmployee = async (newEmp: Omit<Employee, 'id'>) => {
    await runAction(async () => {
      const created = await createEmployee(newEmp);
      setEmployees((prev) => [...prev, created]);
    });
  };

  const handleAddMultipleEmployees = async (newEmps: Omit<Employee, 'id'>[]): Promise<boolean> => {
    try {
      const createdList = await createMultipleEmployees(newEmps);
      setEmployees((prev) => [...createdList, ...prev]);
      return true;
    } catch (err: any) {
      setErrorMsg(err?.message || 'No se pudieron importar los empleados.');
      return false;
    }
  };

  const handleUpdateEmployee = async (id: string, partial: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...partial } : e))
    );
    await runAction(() => updateEmployee(id, partial));
  };

  const handleDeleteEmployee = async (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    await runAction(() => deleteEmployee(id));
  };

  // Configuración de la Empresa
  const handleUpdateSettings = async (newSettings: CompanySettings) => {
    setSettings(newSettings);
    await runAction(() => updateCompanySettings(newSettings));
  };

  const handleResetDefaults = () => {
    if (window.confirm('¿Deseas restablecer los parámetros de la empresa a los valores iniciales?')) {
      handleUpdateSettings(INITIAL_SETTINGS);
    }
  };

  // Filtrado de registros por Mes y Periodo Quincenal
  const monthRecords = records.filter((r) => {
    if (!r.date.startsWith(selectedMonth)) return false;
    if (periodType === 'full_month') return true;
    const day = parseInt(r.date.split('-')[2], 10);
    if (periodType === 'first_half') return day <= 15;
    if (periodType === 'second_half') return day >= 16;
    return true;
  });

  const pendingCount = monthRecords.filter((r) => !r.verifiedByManager).length;
  const verifiedCount = monthRecords.filter((r) => r.verifiedByManager).length;

  // Pantalla de Carga de Autenticación
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute w-96 h-96 bg-vercel-mesh opacity-15 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center">
          <PintechLogo size="lg" showSubtitle={false} />
          <div className="mt-8 flex items-center gap-2 caption-mono text-neutral-400 text-xs animate-pulse">
            <span>Sincronizando credenciales de seguridad...</span>
          </div>
        </div>
      </div>
    );
  }

  // Producción sin Supabase configurado: no se permite operar con datos locales
  if (!isSupabaseConfigured() && !import.meta.env.DEV) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <PintechLogo size="lg" showSubtitle={false} />
        <p className="mt-8 text-sm text-neutral-300 max-w-md">
          La aplicación no está conectada a la base de datos. El administrador debe configurar
          VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel y volver a desplegar.
        </p>
      </div>
    );
  }

  // Auth Gate: sin sesión se muestra el login (el modo demo solo existe en desarrollo sin Supabase)
  if (!session && !isDemoMode) {
    return (
      <LoginScreen
        onLoginSuccess={loadInitialData}
        onContinueOffline={
          import.meta.env.DEV && !isSupabaseConfigured()
            ? () => {
                setIsDemoMode(true);
                applyRole('admin');
                loadInitialData();
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-neutral-100 font-sans antialiased selection:bg-[#171717] selection:text-white dark:selection:bg-white dark:selection:text-[#171717] pb-16">
      {/* Navbar con marca Pintech, selector de quincena y estado de sesión */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        pendingCount={pendingCount}
        verifiedCount={verifiedCount}
        settings={settings}
        onOpenNewRecordModal={handleOpenModalGeneral}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        userEmail={session?.user?.email || (isDemoMode ? 'Modo Local' : null)}
        userName={userProfile?.fullName || null}
        userRole={activeRole}
        onRoleSwitch={isDemoMode ? applyRole : undefined}
        periodType={periodType}
        onPeriodChange={setPeriodType}
        onOpenAuth={() => setIsDemoMode(false)}
        onSignOut={handleSignOut}
      />

      {/* Main View Container con Guardias de Seguridad por Rol */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {errorMsg && (
          <div className="mb-4 flex items-start justify-between gap-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 rounded-[8px] text-xs text-red-800 dark:text-red-200">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="font-semibold underline shrink-0">
              Cerrar
            </button>
          </div>
        )}

        {loadError && (
          <div className="mb-4 flex items-start justify-between gap-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 rounded-[8px] text-xs text-red-800 dark:text-red-200">
            <span>{loadError}</span>
            <button onClick={loadInitialData} className="font-semibold underline shrink-0">
              Reintentar
            </button>
          </div>
        )}

        {isLoading && (
          <div className="mb-4 flex items-center justify-center p-3 bg-white dark:bg-[#111111] border border-[#ebebeb] dark:border-[#262626] rounded-[8px] caption-mono text-xs text-neutral-500 dark:text-neutral-400 shadow-vercel-subtle animate-pulse">
            Sincronizando registros de nómina...
          </div>
        )}

        {/* 1. Calendario: Accesible por todos los roles */}
        {currentTab === 'calendar' && (
          <CalendarView
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            records={records}
            employees={employees}
            userRole={activeRole}
            onAddForDate={handleOpenModalForDate}
            onDeleteRecord={handleDeleteRecord}
            onToggleVerifyRecord={handleToggleVerifyRecord}
            currentUserId={userProfile?.id}
          />
        )}

        {/* 2. Auditoría: Accesible por Jefa y Contador */}
        {currentTab === 'review' && activeRole !== 'supervisor' && (
          <ManagerReviewView
            records={monthRecords}
            employees={employees}
            settings={settings}
            selectedMonth={selectedMonth}
            userRole={activeRole}
            onToggleVerify={handleToggleVerifyRecord}
            onVerifyAllMonth={handleVerifyAllMonth}
            onDeleteRecord={handleDeleteRecord}
            onUpdateRecord={handleUpdateRecord}
            onGoToGmailReport={() => setCurrentTab('gmail')}
          />
        )}

        {/* 3. Formato Gmail & Nómina: Accesible por Jefa y Contador */}
        {currentTab === 'gmail' && activeRole !== 'supervisor' && (
          <GmailReportBuilder
            records={monthRecords}
            employees={employees}
            settings={settings}
            selectedMonth={selectedMonth}
          />
        )}

        {/* 4. Personal de Planta: Accesible por Jefa y Contador */}
        {currentTab === 'employees' && activeRole !== 'supervisor' && (
          <EmployeeManager
            employees={employees}
            userRole={activeRole}
            onAddEmployee={handleAddEmployee}
            onAddMultipleEmployees={handleAddMultipleEmployees}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
          />
        )}

        {/* 5. Configuración: Exclusivo para Contador y Administrador */}
        {currentTab === 'settings' && (activeRole === 'accountant' || activeRole === 'admin') && (
          <CompanySettingsView
            settings={settings}
            userRole={activeRole}
            onSaveSettings={handleUpdateSettings}
            onResetDefaults={handleResetDefaults}
          />
        )}
      </main>

      {/* Modal de Registro de Horas Extras */}
      <AddOvertimeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employees={employees.filter((e) => e.active)}
        initialDate={modalInitialDate}
        onSaveRecords={handleSaveNewRecords}
        rules={settings.overtimeRules}
        canVerify={activeRole === 'manager' || activeRole === 'admin'}
      />

    </div>
  );
}
