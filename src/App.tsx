import React, { useState, useEffect } from 'react';
import { Employee, OvertimeRecord, CompanySettings } from './types';
import { loadEmployees, saveEmployees, loadRecords, saveRecords, loadSettings, saveSettings, resetDataToDefaults } from './utils/storage';
import { Navbar } from './components/Navbar';
import { CalendarView } from './components/CalendarView';
import { ManagerReviewView } from './components/ManagerReviewView';
import { GmailReportBuilder } from './components/GmailReportBuilder';
import { EmployeeManager } from './components/EmployeeManager';
import { CompanySettingsView } from './components/CompanySettingsView';
import { AddOvertimeModal } from './components/AddOvertimeModal';

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<OvertimeRecord[]>([]);
  const [settings, setSettings] = useState<CompanySettings>({
    companyName: 'Industrias y Suministros S.A.S.',
    companyNIT: '900.123.456-7',
    accountantName: 'Dr. Roberto Suárez (Contador)',
    accountantEmail: 'contabilidad@empresa.com',
    managerName: 'Ing. Fernando Morales',
    managerTitle: 'Encargado de Operaciones y Planta',
    currencySymbol: '$',
  });

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
    return false; // Default to clean light mode as requested
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

  // Load initial persisted data on mount
  useEffect(() => {
    setEmployees(loadEmployees());
    setRecords(loadRecords());
    setSettings(loadSettings());
  }, []);

  // Save changes
  const updateEmployeesState = (newEmployees: Employee[]) => {
    setEmployees(newEmployees);
    saveEmployees(newEmployees);
  };

  const updateRecordsState = (newRecords: OvertimeRecord[]) => {
    setRecords(newRecords);
    saveRecords(newRecords);
  };

  const updateSettingsState = (newSettings: CompanySettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Handlers
  const handleOpenModalForDate = (dateStr: string) => {
    setModalInitialDate(dateStr);
    setIsModalOpen(true);
  };

  const handleOpenModalGeneral = () => {
    setModalInitialDate(undefined);
    setIsModalOpen(true);
  };

  const handleSaveNewRecords = (newRecordsData: Omit<OvertimeRecord, 'id' | 'createdAt'>[]) => {
    const created: OvertimeRecord[] = newRecordsData.map((rec, idx) => ({
      ...rec,
      id: `rec-${Date.now()}-${idx}`,
      createdAt: new Date().toISOString(),
    }));

    const updated = [...created, ...records];
    updateRecordsState(updated);
  };

  const handleToggleVerifyRecord = (id: string) => {
    const updated = records.map((r) => {
      if (r.id === id) {
        const nextVerified = !r.verifiedByManager;
        return {
          ...r,
          verifiedByManager: nextVerified,
          status: (nextVerified ? 'verified_manager' : 'pending_review') as OvertimeRecord['status'],
          verifiedAt: nextVerified ? new Date().toISOString() : undefined,
        };
      }
      return r;
    });
    updateRecordsState(updated);
  };

  const handleVerifyAllMonth = () => {
    const updated = records.map((r) => {
      if (r.date.startsWith(selectedMonth) && !r.verifiedByManager) {
        return {
          ...r,
          verifiedByManager: true,
          status: 'verified_manager' as OvertimeRecord['status'],
          verifiedAt: new Date().toISOString(),
        };
      }
      return r;
    });
    updateRecordsState(updated);
  };

  const handleDeleteRecord = (id: string) => {
    const updated = records.filter((r) => r.id !== id);
    updateRecordsState(updated);
  };

  const handleUpdateRecord = (id: string, partial: Partial<OvertimeRecord>) => {
    const updated = records.map((r) => {
      if (r.id === id) {
        return { ...r, ...partial };
      }
      return r;
    });
    updateRecordsState(updated);
  };

  // Employee Handlers
  const handleAddEmployee = (newEmp: Omit<Employee, 'id'>) => {
    const emp: Employee = {
      ...newEmp,
      id: `emp-${Date.now()}`,
    };
    updateEmployeesState([...employees, emp]);
  };

  const handleUpdateEmployee = (id: string, partial: Partial<Employee>) => {
    const updated = employees.map((e) => (e.id === id ? { ...e, ...partial } : e));
    updateEmployeesState(updated);
  };

  const handleDeleteEmployee = (id: string) => {
    const updated = employees.filter((e) => e.id !== id);
    updateEmployeesState(updated);
  };

  const handleResetDefaults = () => {
    if (window.confirm('¿Estás seguro de que deseas restablecer los datos de ejemplo predeterminados?')) {
      const reseted = resetDataToDefaults();
      setEmployees(reseted.employees);
      setRecords(reseted.records);
      setSettings(reseted.settings);
    }
  };

  // Count stats for selected month
  const monthRecords = records.filter((r) => r.date.startsWith(selectedMonth));
  const pendingCount = monthRecords.filter((r) => !r.verifiedByManager).length;
  const verifiedCount = monthRecords.filter((r) => r.verifiedByManager).length;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-blue-500 selection:text-white pb-16">
      {/* Navbar */}
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
      />

      {/* Main View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
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
            onSaveSettings={updateSettingsState}
            onResetDefaults={handleResetDefaults}
          />
        )}
      </main>

      {/* Add Overtime Modal */}
      <AddOvertimeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employees={employees.filter((e) => e.active)}
        initialDate={modalInitialDate}
        onSaveRecords={handleSaveNewRecords}
      />
    </div>
  );
}
