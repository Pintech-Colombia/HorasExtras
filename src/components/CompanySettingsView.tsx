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
      <div className="bg-white dark:bg-[#111111] rounded-[12px] p-6 border border-[#ebebeb] dark:border-[#262626] shadow-vercel-card flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="caption-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[11px] px-2.5 py-0.5 rounded-[6px] border border-neutral-200 dark:border-neutral-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
              Parámetros de Nómina
            </span>
          </div>
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mt-2 tracking-display-md">
            Configuración de Empresa
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-sans">
            Personaliza los datos de la empresa y correos que aparecerán en los reportes de Gmail para contabilidad.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111111] rounded-[12px] border border-[#ebebeb] dark:border-[#262626] p-6 shadow-vercel-card space-y-6">
        {/* Section 1: Company Details */}
        <div className="space-y-4">
          <h3 className="caption-mono text-xs text-neutral-500 dark:text-neutral-400 pb-2 border-b border-[#ebebeb] dark:border-[#262626] flex items-center gap-2 uppercase tracking-[0.06em]">
            <Building2 className="w-3.5 h-3.5 text-neutral-400" />
            1. Datos de la Empresa
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="caption-mono block text-neutral-600 dark:text-neutral-300 mb-1">Nombre de la Empresa *</label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="form-input w-full text-xs h-9 px-3 rounded-[6px]"
              />
            </div>

            <div>
              <label className="caption-mono block text-neutral-600 dark:text-neutral-300 mb-1">NIT / Identificación Fiscal</label>
              <input
                type="text"
                value={formData.companyNIT}
                onChange={(e) => setFormData({ ...formData, companyNIT: e.target.value })}
                className="form-input w-full text-xs h-9 px-3 rounded-[6px] font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Accountant Details */}
        <div className="space-y-4">
          <h3 className="caption-mono text-xs text-neutral-500 dark:text-neutral-400 pb-2 border-b border-[#ebebeb] dark:border-[#262626] flex items-center gap-2 uppercase tracking-[0.06em]">
            <Mail className="w-3.5 h-3.5 text-neutral-400" />
            2. Datos del Contador (Destinatario del Correo)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="caption-mono block text-neutral-600 dark:text-neutral-300 mb-1">Nombre del Contador *</label>
              <input
                type="text"
                required
                value={formData.accountantName}
                onChange={(e) => setFormData({ ...formData, accountantName: e.target.value })}
                className="form-input w-full text-xs h-9 px-3 rounded-[6px]"
              />
            </div>

            <div>
              <label className="caption-mono block text-neutral-600 dark:text-neutral-300 mb-1">Correo Electrónico (Gmail) *</label>
              <input
                type="email"
                required
                value={formData.accountantEmail}
                onChange={(e) => setFormData({ ...formData, accountantEmail: e.target.value })}
                className="form-input w-full text-xs h-9 px-3 rounded-[6px] font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Manager Details */}
        <div className="space-y-4">
          <h3 className="caption-mono text-xs text-neutral-500 dark:text-neutral-400 pb-2 border-b border-[#ebebeb] dark:border-[#262626] flex items-center gap-2 uppercase tracking-[0.06em]">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
            3. Encargado de Marcar y Revisar Extras
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="caption-mono block text-neutral-600 dark:text-neutral-300 mb-1">Nombre del Encargado *</label>
              <input
                type="text"
                required
                value={formData.managerName}
                onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                className="form-input w-full text-xs h-9 px-3 rounded-[6px]"
              />
            </div>

            <div>
              <label className="caption-mono block text-neutral-600 dark:text-neutral-300 mb-1">Cargo / Título del Encargado</label>
              <input
                type="text"
                value={formData.managerTitle}
                onChange={(e) => setFormData({ ...formData, managerTitle: e.target.value })}
                className="form-input w-full text-xs h-9 px-3 rounded-[6px]"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-[#ebebeb] dark:border-[#262626]">
          <button
            type="button"
            onClick={onResetDefaults}
            className="text-xs text-neutral-400 hover:text-red-500 font-medium flex items-center gap-1.5 transition font-sans"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restablecer Valores Predeterminados</span>
          </button>

          <button
            type="submit"
            className="button-primary px-5 py-2 rounded-full text-xs font-medium flex items-center gap-2"
          >
            {savedStatus ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>¡Guardado Correctamente!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Configuración</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
