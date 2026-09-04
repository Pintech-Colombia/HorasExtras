import React, { useState, useEffect, useCallback } from 'react';
import { Employee, OvertimeRecord, CompanySettings, UserProfile, UserRole, PeriodType } from './types';
import { getEmployees, createEmployee, createMultipleEmployees, updateEmployee, deleteEmployee } from './services/employeesService';
import { getRecords, createRecords, updateRecord, deleteRecord, verifyAllMonthRecords } from './services/recordsService';
import { getCompanySettings, updateCompanySettings } from './services/companyService';
import { resetDataToDefaults } from './utils/storage';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Navbar } from './components/Navbar';
import { CalendarView } from './components/CalendarView';
import { ManagerReviewView } from './components/ManagerReviewView';
import { GmailReportBuilder } from './components/GmailReportBuilder';
import { EmployeeManager } from './components/EmployeeManager';
import { CompanySettingsView } from './components/CompanySettingsView';
import { AddOvertimeModal } from './components/AddOvertimeModal';
import { LoginScreen } from './components/LoginScreen';
import { AuthModal } from './components/AuthModal';
import { PintechLogo } from './components/PintechLogo';

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<OvertimeRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('manager');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const [settings, setSettings] = useState<CompanySettings>({
    companyName: 'Pintech Colombia S.A.S.',
    companyNIT: '901.456.789-0',
    accountantName: 'Dpto. Contabilidad & Nómina',
    accountantEmail: 'contabilidad@pintech.co',
    managerName: 'Jefe de Operaciones & Planta',
    managerTitle: 'Operaciones y Producción Pintech',
    currencySymbol: '$',
  });

  // Current Month selector YYYY-MM
  const today = new Date();
  const defaultMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonthStr);

  // Period Type selector ('full_month' | 'first_half' | 'second_half')
  const [periodType, setPeriodType] = useState<PeriodType>('full_month');

  // Active Tab
  const [currentTab, setCurrentTab] = useState<'calendar' | 'review' | 'gmail' | 'employees' | 'settings'>('calendar');

  // Cambiar rol activo y aplicar guardias de pestaña
  const handleRoleSwitch = (newRole: UserRole) => {
    setActiveRole(newRole);
    if (newRole === 'supervisor' && currentTab !== 'calendar') {
      setCurrentTab('calendar');
    } else if (newRole === 'manager' && currentTab === 'settings') {
      setCurrentTab('calendar');
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

      if (data) {
        const role = (data.role as UserRole) || 'supervisor';
        setUserProfile({
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          role,
          companyId: data.company_id,
        });
        setActiveRole(role);
      } else {
        // Fallback perfil basado en metadata de Auth
        const role = (authUser.user_metadata?.role as UserRole) || 'supervisor';
        setUserProfile({
          id: authUser.id,
          email: authUser.email || '',
          fullName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuario Pintech',
          role,
        });
        setActiveRole(role);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error al cargar perfil de usuario:', err);
      }
    }
  };

  // Carga inicial asíncrona de datos desde Supabase
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedEmployees, fetchedRecords, fetchedSettings] = await Promise.all([
        getEmployees(),
        getRecords(),
        getCompanySettings(),
      ]);
      setEmployees(fetchedEmployees);
      setRecords(fetchedRecords);
      setSettings(fetchedSettings);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error al cargar datos iniciales:', error);
      }
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
        loadInitialData();
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setSession(session);
        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setUserProfile(null);
        }
        loadInitialData();
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

  const handleSaveNewRecords = async (newRecordsData: Omit<OvertimeRecord, 'id' | 'createdAt'>[]) => {
    const created = await createRecords(newRecordsData, userProfile?.companyId, userProfile?.id);
    setRecords((prev) => [...created, ...prev]);
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

    await updateRecord(id, partial);
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

    await verifyAllMonthRecords(selectedMonth);
  };

  const handleDeleteRecord = async (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    await deleteRecord(id);
  };

  const handleUpdateRecord = async (id: string, partial: Partial<OvertimeRecord>) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...partial } : r))
    );
    await updateRecord(id, partial);
  };

  // Handlers de Empleados
  const handleAddEmployee = async (newEmp: Omit<Employee, 'id'>) => {
    const created = await createEmployee(newEmp, userProfile?.companyId);
    setEmployees((prev) => [...prev, created]);
  };

  const handleAddMultipleEmployees = async (newEmps: Omit<Employee, 'id'>[]) => {
    const createdList = await createMultipleEmployees(newEmps, userProfile?.companyId);
    setEmployees((prev) => [...createdList, ...prev]);
  };

  const handleUpdateEmployee = async (id: string, partial: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...partial } : e))
    );
    await updateEmployee(id, partial);
  };

  const handleDeleteEmployee = async (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    await deleteEmployee(id);
  };

  // Configuración de la Empresa
  const handleUpdateSettings = async (newSettings: CompanySettings) => {
    setSettings(newSettings);
    await updateCompanySettings(newSettings, userProfile?.companyId);
  };

  const handleResetDefaults = () => {
    if (window.confirm('¿Deseas restablecer los parámetros de la empresa a los valores iniciales?')) {
      setSettings(INITIAL_SETTINGS);
      updateCompanySettings(INITIAL_SETTINGS, userProfile?.companyId);
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

  // Auth Gate: Si no está autenticado y no está en modo demo, mostrar Login
  if (!session && !isDemoMode && isSupabaseConfigured()) {
    return (
      <LoginScreen
        onLoginSuccess={loadInitialData}
        onContinueOffline={import.meta.env.DEV ? () => setIsDemoMode(true) : undefined}
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
        onRoleSwitch={handleRoleSwitch}
        periodType={periodType}
        onPeriodChange={setPeriodType}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main View Container con Guardias de Seguridad por Rol */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
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
      />

      {/* Modal de Autenticación de respaldo */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={loadInitialData}
      />
    </div>
  );
}
