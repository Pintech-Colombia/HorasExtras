import React, { useState } from 'react';
import { Building2, Mail, ShieldCheck, Save, RefreshCw, CheckCircle } from 'lucide-react';
import { CompanySettings } from '../types';

interface CompanySettingsViewProps {
  settings: CompanySettings;
  onSaveSettings: (s: CompanySettings) => void;
  onResetDefaults: () => void;
}

export const CompanySettingsView: React.FC<CompanySettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetDefaults,
}) => {
  const [formData, setFormData] = useState<CompanySettings>({ ...settings });
  const [savedStatus, setSavedStatus] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            Configuración de Empresa, Encargado y Contador
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Personaliza los datos de la empresa y correos que aparecerán en los reportes de Gmail para contabilidad.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
        {/* Section 1: Company Details */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            1. Datos de la Empresa
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre de la Empresa *</label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">NIT / Identificación Fiscal</label>
              <input
                type="text"
                value={formData.companyNIT}
                onChange={(e) => setFormData({ ...formData, companyNIT: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Accountant Details */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            2. Datos del Contador (Destinatario del Correo)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre del Contador *</label>
              <input
                type="text"
                required
                value={formData.accountantName}
                onChange={(e) => setFormData({ ...formData, accountantName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico (Gmail) *</label>
              <input
                type="email"
                required
                value={formData.accountantEmail}
                onChange={(e) => setFormData({ ...formData, accountantEmail: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Manager Details */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            3. Encargado de Marcar y Revisar Extras
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre del Encargado *</label>
              <input
                type="text"
                required
                value={formData.managerName}
                onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Cargo / Título del Encargado</label>
              <input
                type="text"
                value={formData.managerTitle}
                onChange={(e) => setFormData({ ...formData, managerTitle: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onResetDefaults}
            className="text-xs text-slate-500 hover:text-red-600 font-semibold flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restablecer Datos de Ejemplo</span>
          </button>

          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition shadow-sm"
          >
            {savedStatus ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>¡Guardado Correctamente!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Configuración</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
