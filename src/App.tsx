import React, { useState, useEffect, useCallback } from 'react';
import { Employee, OvertimeRecord, CompanySettings } from './types';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from './services/employeesService';
import { getRecords, createRecords, updateRecord, deleteRecord, verifyAllMonthRecords } from './services/recordsService';
import { getCompanySettings, updateCompanySettings } from './services/companyService';
import { resetDataToDefaults } from './utils/storage';
import { supabase } from './lib/supabase';
import { Navbar } from './components/Navbar';
import { CalendarView } from './components/CalendarView';
import { ManagerReviewView } from './components/ManagerReviewView';
import { GmailReportBuilder } from './components/GmailReportBuilder';
import { EmployeeManager } from './components/EmployeeManager';
import { CompanySettingsView } from './components/CompanySettingsView';
import { AddOvertimeModal } from './components/AddOvertimeModal';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<OvertimeRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<CompanySettings>({
    companyName: 'Industrias y Suministros S.A.S.',
    companyNIT: '900.123.456-7',
    accountantName: 'Dr. Roberto Suárez (Contador)',
    accountantEmail: 'contabilidad@empresa.com',
    managerName: 'Ing. Fernando Morales',
    managerTitle: 'Encargado de Operaciones y Planta',
    currencySymbol: '$',
  });

  // Supabase Auth State
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Current Month selector YYYY-MM
  const today = new Date();
  const defaultMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonthStr);

  // Active Tab
  const [currentTab, setCurrentTab] = useState<'calendar' | 'review' | 'gmail' | 'employees' | 'settings'>('calendar');

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

  // Carga inicial asíncrona de datos desde Supabase (con fallback local)
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
      console.error('Error al cargar datos iniciales:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Escuchar sesión de Supabase Auth
  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUserEmail(session?.user?.email || null);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUserEmail(session?.user?.email || null);
        loadInitialData();
      });

      return () => subscription.unsubscribe();
    } else {
      loadInitialData();
    }
  }, [loadInitialData]);

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setUserEmail(null);
      loadInitialData();
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
    const created = await createRecords(newRecordsData);
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

    // Actualización optimista en UI
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...partial } : r))
    );

    await updateRecord(id, partial);
  };

  const handleVerifyAllMonth = async () => {
    // Actualización optimista
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
    const created = await createEmployee(newEmp);
    setEmployees((prev) => [...prev, created]);
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
    await updateCompanySettings(newSettings);
  };

  const handleResetDefaults = () => {
    if (window.confirm('¿Estás seguro de que deseas restablecer los datos de ejemplo predeterminados?')) {
      const reseted = resetDataToDefaults();
      setEmployees(reseted.employees);
      setRecords(reseted.records);
      setSettings(reseted.settings);
    }
  };

  // Estadísticas del mes seleccionado
  const monthRecords = records.filter((r) => r.date.startsWith(selectedMonth));
  const pendingCount = monthRecords.filter((r) => !r.verifiedByManager).length;
  const verifiedCount = monthRecords.filter((r) => r.verifiedByManager).length;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-blue-500 selection:text-white pb-16">
      {/* Navbar con estado de conexión y sesión */}
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
        userEmail={userEmail}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {isLoading && (
          <div className="mb-4 flex items-center justify-center p-3 bg-slate-200 dark:bg-slate-900 rounded-xl text-xs text-slate-600 dark:text-slate-400 animate-pulse">
            Sincronizando datos...
          </div>
        )}

        {currentTab === 'calendar' && (
          <CalendarView
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            records={records}
            employees={employees}
            onAddForDate={handleOpenModalForDate}
            onDeleteRecord={handleDeleteRecord}
            onToggleVerifyRecord={handleToggleVerifyRecord}
          />
        )}

        {currentTab === 'review' && (
          <ManagerReviewView
            records={records}
            employees={employees}
            settings={settings}
            selectedMonth={selectedMonth}
            onToggleVerify={handleToggleVerifyRecord}
            onVerifyAllMonth={handleVerifyAllMonth}
            onDeleteRecord={handleDeleteRecord}
            onUpdateRecord={handleUpdateRecord}
            onGoToGmailReport={() => setCurrentTab('gmail')}
          />
        )}

        {currentTab === 'gmail' && (
          <GmailReportBuilder
            records={records}
            employees={employees}
            settings={settings}
            selectedMonth={selectedMonth}
          />
        )}

        {currentTab === 'employees' && (
          <EmployeeManager
            employees={employees}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
          />
        )}

        {currentTab === 'settings' && (
          <CompanySettingsView
            settings={settings}
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

      {/* Modal de Autenticación Supabase */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={loadInitialData}
      />
    </div>
  );
}
