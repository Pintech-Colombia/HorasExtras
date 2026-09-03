import React from 'react';
import { Calendar, CheckCircle2, Mail, Users, PlusCircle, Settings, Building2, Sun, Moon, Cloud, Database, User as UserIcon, LogOut, LogIn } from 'lucide-react';
import { CompanySettings } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

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
  onOpenAuth,
  onSignOut,
}) => {
  const isCloudActive = isSupabaseConfigured();

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Brand & App Name */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white shrink-0">
                <Calendar className="w-4 h-4 text-slate-200" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  Control de Horas Extras
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                    Nómina & Gmail
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  {settings.companyName}
                </p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={onToggleTheme}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition border border-slate-700"
                title={isDarkMode ? 'Cambiar a Fondo Claro' : 'Cambiar a Modo Oscuro'}
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-300" />}
              </button>

              <button
                onClick={onOpenAuth}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition border border-slate-700"
                title="Cuenta / Conexión"
              >
                <UserIcon className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenNewRecordModal}
                className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition border border-slate-700"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Month Selector & Quick Stats */}
          <div className="flex flex-wrap items-center gap-2.5 justify-between md:justify-end">
            {/* Supabase Cloud Connection Status Badge */}
            <button
              onClick={onOpenAuth}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                isCloudActive
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title={isCloudActive ? 'Conectado a Supabase PostgreSQL' : 'Modo local activo. Clic para conectar Supabase'}
            >
              {isCloudActive ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Supabase Nube</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 text-slate-400" />
                  <span>Modo Local</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-xs">
              <span className="text-slate-400 font-medium">Mes:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
                className="bg-transparent text-white font-semibold text-xs border-none focus:outline-none cursor-pointer"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setCurrentTab('review')}
                className="bg-slate-800 hover:bg-slate-700/80 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition"
                title="Ver pendientes de revisión con el encargado"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="font-bold text-amber-300">{pendingCount}</span>
                <span className="hidden sm:inline text-slate-400">por revisar</span>
              </button>

              <button
                onClick={() => setCurrentTab('review')}
                className="bg-slate-800 hover:bg-slate-700/80 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition"
                title="Horas extras verificadas"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-200">{verifiedCount}</span>
                <span className="hidden sm:inline text-slate-400">verificadas</span>
              </button>
            </div>

            {/* User Session Button / Auth Modal trigger */}
            {userEmail ? (
              <div className="hidden sm:flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
                <span className="text-slate-300 max-w-[120px] truncate" title={userEmail}>
                  {userEmail}
                </span>
                <button
                  onClick={onSignOut}
                  className="text-slate-400 hover:text-red-400 transition"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-300" />
                <span>Acceder</span>
              </button>
            )}

            {/* Light / Dark Mode Toggle Button (Desktop) */}
            <button
              onClick={onToggleTheme}
              className="hidden md:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
              title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  <span className="text-slate-200">Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-300" />
                  <span className="text-slate-300">Modo Oscuro</span>
                </>
              )}
            </button>

            {/* Desktop New Record Button */}
            <button
              onClick={onOpenNewRecordModal}
              className="hidden md:flex bg-white hover:bg-slate-100 text-slate-900 px-3.5 py-1.5 rounded-lg text-xs font-bold items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-slate-900" />
              <span>Registrar Horas Extras</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto pt-1 pb-2 scrollbar-none text-xs border-t border-slate-800/80">
          <button
            onClick={() => setCurrentTab('calendar')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              currentTab === 'calendar'
                ? 'bg-slate-800 text-white border border-slate-700 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-slate-300" />
            <span>1. Calendario de Horas Extras</span>
          </button>

          <button
            onClick={() => setCurrentTab('review')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              currentTab === 'review'
                ? 'bg-slate-800 text-white border border-slate-700 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />
            <span>2. Revisar con Encargado</span>
            {pendingCount > 0 && (
              <span className="bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('gmail')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              currentTab === 'gmail'
                ? 'bg-slate-800 text-white border border-slate-700 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-slate-300" />
            <span>3. Formato para Gmail & Contador</span>
          </button>

          <button
            onClick={() => setCurrentTab('employees')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              currentTab === 'employees'
                ? 'bg-slate-800 text-white border border-slate-700 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Empleados</span>
          </button>

          <button
            onClick={() => setCurrentTab('settings')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              currentTab === 'settings'
                ? 'bg-slate-800 text-white border border-slate-700 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Configuración Empresa</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
