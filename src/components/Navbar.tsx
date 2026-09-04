import React from 'react';
import { Calendar, CheckCircle2, Mail, Users, Plus, Settings, Sun, Moon, Cloud, Database, LogOut, LogIn, ChevronDown } from 'lucide-react';
import { CompanySettings, UserRole, PeriodType } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import { PintechLogo } from './PintechLogo';

interface NavbarProps {
  currentTab: 'calendar' | 'review' | 'gmail' | 'employees' | 'settings';
  setCurrentTab: (tab: 'calendar' | 'review' | 'gmail' | 'employees' | 'settings') => void;
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (m: string) => void;
  pendingCount: number;
  verifiedCount: number;
  settings: CompanySettings;
  onOpenNewRecordModal: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  userEmail?: string | null;
  userName?: string | null;
  userRole?: UserRole | null;
  onRoleSwitch?: (role: UserRole) => void;
  periodType?: PeriodType;
  onPeriodChange?: (p: PeriodType) => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  selectedMonth,
  setSelectedMonth,
  pendingCount,
  verifiedCount,
  settings,
  onOpenNewRecordModal,
  isDarkMode,
  onToggleTheme,
  userEmail,
  userName,
  userRole,
  onRoleSwitch,
  periodType = 'full_month',
  onPeriodChange,
  onOpenAuth,
  onSignOut,
}) => {
  const isCloudActive = isSupabaseConfigured();
  const effectiveRole: UserRole = userRole || 'supervisor';

  const roleLabelMap: Record<UserRole, string> = {
    supervisor: 'Supervisor Planta',
    manager: 'Jefa de Planta',
    accountant: 'Contador / Nómina',
    admin: 'Administrador',
  };

  // Permisos de pestañas según rol
  const canSeeReview = effectiveRole === 'manager' || effectiveRole === 'accountant' || effectiveRole === 'admin';
  const canSeeGmail = effectiveRole === 'manager' || effectiveRole === 'accountant' || effectiveRole === 'admin';
  const canSeeEmployees = effectiveRole === 'manager' || effectiveRole === 'accountant' || effectiveRole === 'admin';
  const canSeeSettings = effectiveRole === 'accountant' || effectiveRole === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-[#ebebeb] dark:border-[#262626] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top 64px Bar (Vercel Standard Height) */}
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <PintechLogo size="sm" showSubtitle={false} />

            {/* Cloud Status Pill (Vercel style micro-badge) */}
            <button
              onClick={onOpenAuth}
              className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono-tech text-[11px] font-medium border transition-colors cursor-pointer ${
                isCloudActive
                  ? 'bg-[#fafafa] dark:bg-[#111111] text-[#171717] dark:text-[#ededed] border-[#ebebeb] dark:border-[#262626] hover:border-[#a1a1a1]'
                  : 'bg-[#f5f5f5] text-[#888888] border-[#ebebeb] dark:border-[#262626]'
              }`}
              title={isCloudActive ? 'Servidor Corporativo en Línea' : 'Modo Local'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isCloudActive ? 'bg-[#0070f3]' : 'bg-[#888888]'}`} />
              <span>{isCloudActive ? 'en línea' : 'local'}</span>
            </button>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2">
            {/* Period Selector (Geist Mono) */}
            <div className="hidden md:flex items-center bg-[#fafafa] dark:bg-[#111111] border border-[#ebebeb] dark:border-[#262626] rounded-[6px] px-2 h-8 text-xs font-mono-tech">
              <span className="text-[#888888] mr-1 text-[11px]">Periodo:</span>
              <select
                value={periodType}
                onChange={(e) => onPeriodChange?.(e.target.value as PeriodType)}
                className="bg-transparent text-[#171717] dark:text-[#ededed] font-medium border-none focus:outline-none cursor-pointer"
              >
                <option value="full_month" className="bg-white dark:bg-[#111111]">Mes Completo</option>
                <option value="first_half" className="bg-white dark:bg-[#111111]">1ra Quincena (1-15)</option>
                <option value="second_half" className="bg-white dark:bg-[#111111]">2da Quincena (16-Fin)</option>
              </select>
            </div>

            {/* Month Input (Geist Mono) */}
            <div className="flex items-center bg-[#fafafa] dark:bg-[#111111] border border-[#ebebeb] dark:border-[#262626] rounded-[6px] px-2 h-8 text-xs font-mono-tech">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
                className="bg-transparent text-[#171717] dark:text-[#ededed] font-medium border-none focus:outline-none cursor-pointer text-xs"
              />
            </div>

            {/* Verification Stats Badge (Pill) - Solo visible para Jefa y Contador */}
            {canSeeReview && (
              <div className="hidden lg:flex items-center gap-1.5 font-mono-tech text-[11px] text-[#666666] dark:text-[#888888] bg-[#fafafa] dark:bg-[#111111] border border-[#ebebeb] dark:border-[#262626] rounded-[6px] px-2.5 h-8">
                <span className="text-[#f5a623] font-semibold">{pendingCount}</span>
                <span>pendientes</span>
                <span className="text-[#ebebeb] dark:text-[#333333]">/</span>
                <span className="text-[#171717] dark:text-white font-semibold">{verifiedCount}</span>
                <span>auditadas</span>
              </div>
            )}

            {/* Selector de Vista de Rol (Para Presentaciones a Jefes) */}
            {onRoleSwitch && (
              <div className="flex items-center bg-[#fafafa] dark:bg-[#111111] border border-[#ebebeb] dark:border-[#262626] rounded-[6px] px-2 h-8 text-xs font-mono-tech">
                <span className="text-[#888888] mr-1 text-[11px] hidden sm:inline">Vista:</span>
                <select
                  value={effectiveRole}
                  onChange={(e) => onRoleSwitch(e.target.value as UserRole)}
                  className="bg-transparent text-[#171717] dark:text-[#ededed] font-semibold border-none focus:outline-none cursor-pointer text-xs"
                  title="Cambiar vista de rol para demostración"
                >
                  <option value="supervisor" className="bg-white dark:bg-[#111111]">1. Supervisor (Planta)</option>
                  <option value="manager" className="bg-white dark:bg-[#111111]">2. Jefa (Operaciones)</option>
                  <option value="accountant" className="bg-white dark:bg-[#111111]">3. Contador (Nómina)</option>
                  <option value="admin" className="bg-white dark:bg-[#111111]">Admin (Total)</option>
                </select>
              </div>
            )}

            {/* Dark / Light Mode Toggle Button (6px radius) */}
            <button
              onClick={onToggleTheme}
              className="h-8 w-8 rounded-[6px] border border-[#ebebeb] dark:border-[#262626] bg-[#fafafa] dark:bg-[#111111] hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] flex items-center justify-center text-[#666666] dark:text-[#a1a1a1] transition-colors"
              title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-[#f9cb28]" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* User Session or Login Button */}
            {userEmail ? (
              <div className="flex items-center gap-2 h-8 px-2.5 rounded-[6px] border border-[#ebebeb] dark:border-[#262626] bg-[#fafafa] dark:bg-[#111111] text-xs">
                <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[#888888]">
                  {roleLabelMap[effectiveRole]}
                </span>
                <span className="font-medium text-[#171717] dark:text-white max-w-[110px] truncate hidden md:inline">
                  {userName || userEmail}
                </span>
                <button
                  onClick={onSignOut}
                  className="text-[#888888] hover:text-[#ee0000] transition-colors ml-1"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="h-8 px-3 rounded-[6px] border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#111111] hover:bg-[#f5f5f5] dark:hover:bg-[#1f1f1f] text-[#171717] dark:text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-[#888888]" />
                <span>Acceder</span>
              </button>
            )}

            {/* Primary Action Button (Vercel 100px Pill) */}
            <button
              onClick={onOpenNewRecordModal}
              className="h-8 sm:h-9 px-3.5 sm:px-4 rounded-full bg-[#171717] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#ededed] text-white dark:text-[#171717] text-xs font-medium transition-colors flex items-center gap-1.5 shadow-vercel-subtle cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Registrar Horas</span>
              <span className="sm:hidden">Registrar</span>
            </button>
          </div>
        </div>

        {/* Vercel Navigation Bar (Filtrada por Rol) */}
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none text-xs border-t border-[#ebebeb] dark:border-[#262626] py-1.5">
          {/* 1. Calendario: Visible para todos (Supervisor, Jefa, Contador) */}
          <button
            onClick={() => setCurrentTab('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] font-medium whitespace-nowrap transition-colors ${
              currentTab === 'calendar'
                ? 'bg-[#171717] text-white dark:bg-white dark:text-[#171717] font-semibold'
                : 'text-[#666666] dark:text-[#888888] hover:text-[#171717] dark:hover:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#171717]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>1. Calendario</span>
          </button>

          {/* 2. Auditoría Encargado: Visible solo para Jefa y Contador */}
          {canSeeReview && (
            <button
              onClick={() => setCurrentTab('review')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] font-medium whitespace-nowrap transition-colors ${
                currentTab === 'review'
                  ? 'bg-[#171717] text-white dark:bg-white dark:text-[#171717] font-semibold'
                  : 'text-[#666666] dark:text-[#888888] hover:text-[#171717] dark:hover:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#171717]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{effectiveRole === 'manager' ? '2. Auditoría Jefa' : '2. Auditoría y Control'}</span>
              {pendingCount > 0 && (
                <span className="font-mono-tech ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#f5a623] text-black">
                  {pendingCount}
                </span>
              )}
            </button>
          )}

          {/* 3. Formato Gmail & Nómina: Visible solo para Jefa y Contador */}
          {canSeeGmail && (
            <button
              onClick={() => setCurrentTab('gmail')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] font-medium whitespace-nowrap transition-colors ${
                currentTab === 'gmail'
                  ? 'bg-[#171717] text-white dark:bg-white dark:text-[#171717] font-semibold'
                  : 'text-[#666666] dark:text-[#888888] hover:text-[#171717] dark:hover:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#171717]'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{effectiveRole === 'manager' ? '3. Enviar a Contabilidad' : '3. Formato Gmail & Nómina'}</span>
            </button>
          )}

          {/* 4. Personal & Tarifas: Visible solo para Jefa y Contador */}
          {canSeeEmployees && (
            <button
              onClick={() => setCurrentTab('employees')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] font-medium whitespace-nowrap transition-colors ${
                currentTab === 'employees'
                  ? 'bg-[#171717] text-white dark:bg-white dark:text-[#171717] font-semibold'
                  : 'text-[#666666] dark:text-[#888888] hover:text-[#171717] dark:hover:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#171717]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{effectiveRole === 'manager' ? 'Personal de Planta' : 'Personal & Tarifas'}</span>
            </button>
          )}

          {/* 5. Configuración: Visible solo para Contador y Administrador */}
          {canSeeSettings && (
            <button
              onClick={() => setCurrentTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] font-medium whitespace-nowrap transition-colors ${
                currentTab === 'settings'
                  ? 'bg-[#171717] text-white dark:bg-white dark:text-[#171717] font-semibold'
                  : 'text-[#666666] dark:text-[#888888] hover:text-[#171717] dark:hover:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#171717]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configuración</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
