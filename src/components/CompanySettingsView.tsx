import React, { useState, useEffect } from 'react';
import { Building2, Mail, ShieldCheck, Save, RefreshCw, CheckCircle, Lock, Percent } from 'lucide-react';
import { CompanySettings, UserRole, OvertimeRules, DEFAULT_OVERTIME_RULES } from '../types';

const WEEKDAYS: { key: string; label: string }[] = [
  { key: '1', label: 'Lunes' },
  { key: '2', label: 'Martes' },
  { key: '3', label: 'Miércoles' },
  { key: '4', label: 'Jueves' },
  { key: '5', label: 'Viernes' },
  { key: '6', label: 'Sábado' },
];

const PCT_FIELDS: { key: keyof OvertimeRules; label: string }[] = [
  { key: 'extraDiurnaPct', label: 'Extra diurna' },
  { key: 'extraNocturnaPct', label: 'Extra nocturna' },
  { key: 'festivaDiurnaPct', label: 'Extra dominical/festiva diurna' },
  { key: 'festivaNocturnaPct', label: 'Extra dominical/festiva nocturna' },
];

interface CompanySettingsViewProps {
  settings: CompanySettings;
  userRole?: UserRole | null;
  onSaveSettings: (s: CompanySettings) => void;
  onResetDefaults: () => void;
}

export const CompanySettingsView: React.FC<CompanySettingsViewProps> = ({
  settings,
  userRole,
  onSaveSettings,
  onResetDefaults,
}) => {
  const canEditSettings = userRole === 'accountant' || userRole === 'admin';
  const [formData, setFormData] = useState<CompanySettings>({ ...settings });
  const [savedStatus, setSavedStatus] = useState(false);

  // Sincronizar el formulario cuando llegan los datos del servidor
  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);
  const rules = formData.overtimeRules;
  const setRules = (partial: Partial<OvertimeRules>) =>
    setFormData({ ...formData, overtimeRules: { ...formData.overtimeRules, ...partial } });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditSettings) return;
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

      {/* Read-only Alert for Non-Admin */}
      {!canEditSettings && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-[10px] text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2.5">
          <Lock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Modo Solo Lectura:</strong> La modificación de datos fiscales, NIT y correos de contabilidad está reservada para el Contador o Administrador.
          </span>
        </div>
      )}

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

        {/* Section 4: Overtime rules */}
        <div className="space-y-4">
          <h3 className="caption-mono text-xs text-neutral-500 dark:text-neutral-400 pb-2 border-b border-[#ebebeb] dark:border-[#262626] flex items-center gap-2 uppercase tracking-[0.06em]">
            <Percent className="w-3.5 h-3.5 text-neutral-400" />
            4. Recargos y Jornada Laboral
          </h3>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans">
            Porcentaje de recargo sobre la hora ordinaria (25% = se paga 1,25 veces). Valores por defecto según Ley 2466 de 2025
            (dominical 90% desde julio de 2026); ajústelos si la empresa liquida de otra forma. Los cambios aplican a todos los
            cálculos y reportes, incluidos meses anteriores.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {PCT_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="caption-mono block text-neutral-600 dark:text-neutral-300 mb-1">
                  {f.label} (%) <span className="text-neutral-400">· ley: {DEFAULT_OVERTIME_RULES[f.key] as number}%</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={500}
                  step="0.01"
                  required
                  disabled={!canEditSettings}
                  value={rules[f.key] as number}
                  onChange={(e) => setRules({ [f.key]: parseFloat(e.target.value) || 0 } as Partial<OvertimeRules>)}
                  className="form-input w-full text-xs h-9 px-3 rounded-[6px] font-mono"
                />
              </div>
            ))}

            <div>
              <label className="caption-mono block text-neutral-600 dark:text-neutral-300 mb-1">Inicio jornada nocturna</label>
              <input
                type="time"
                required
                disabled={!canEditSettings}
                value={rules.nightStart}
                onChange={(e) => setRules({ nightStart: e.target.value })}
                className="form-input w-full text-xs h-9 px-3 rounded-[6px] font-mono"
              />
            </div>
            <div>
              <label className="caption-mono block text-neutral-600 dark:text-neutral-300 mb-1">Fin jornada nocturna</label>
              <input
                type="time"
                required
                disabled={!canEditSettings}
                value={rules.nightEnd}
                onChange={(e) => setRules({ nightEnd: e.target.value })}
                className="form-input w-full text-xs h-9 px-3 rounded-[6px] font-mono"
              />
            </div>
            <div>
              <label className="caption-mono block text-neutral-600 dark:text-neutral-300 mb-1">Hora de ingreso habitual</label>
              <input
                type="time"
                required
                disabled={!canEditSettings}
                value={rules.shiftStart}
                onChange={(e) => setRules({ shiftStart: e.target.value })}
                className="form-input w-full text-xs h-9 px-3 rounded-[6px] font-mono"
              />
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <span className="caption-mono block text-neutral-600 dark:text-neutral-300">
              Hora de salida ordinaria por día (vacío = sin jornada ese día: todo cuenta como extra)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {WEEKDAYS.map((d) => (
                <div key={d.key}>
                  <label className="text-[11px] text-neutral-500 block mb-1">{d.label}</label>
                  <input
                    type="time"
                    disabled={!canEditSettings}
                    value={rules.shiftEnds[d.key] || ''}
                    onChange={(e) => setRules({ shiftEnds: { ...rules.shiftEnds, [d.key]: e.target.value || null } })}
                    className="form-input w-full text-xs h-9 px-3 rounded-[6px] font-mono"
                  />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-neutral-400 font-sans">Domingos y festivos de Colombia se detectan automáticamente.</p>
          </div>

          <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-200 font-sans">
            <input
              type="checkbox"
              disabled={!canEditSettings}
              checked={rules.saturdayAsHoliday}
              onChange={(e) => setRules({ saturdayAsHoliday: e.target.checked })}
              className="w-4 h-4 accent-[#171717]"
            />
            Pagar las horas del sábado con recargo dominical/festivo (no es obligatorio por ley)
          </label>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-[#ebebeb] dark:border-[#262626]">
          {canEditSettings ? (
            <>
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
            </>
          ) : (
            <div className="text-xs text-neutral-400 italic font-mono-tech">
              [Edición bloqueada para tu rol actual]
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
