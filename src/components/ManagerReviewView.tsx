import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, UserCheck, Search, ShieldCheck, DollarSign, Clock, CheckCheck, Trash2, Edit2, Save, X } from 'lucide-react';
import { OvertimeRecord, Employee, CompanySettings, OVERTIME_TYPES } from '../types';
import { calculateRecordCost, formatCurrency } from '../utils/exporters';
import { formatHoursDisplay } from '../utils/schedule';

interface ManagerReviewViewProps {
  records: OvertimeRecord[];
  employees: Employee[];
  settings: CompanySettings;
  selectedMonth: string; // YYYY-MM
  onToggleVerify: (id: string) => void;
  onVerifyAllMonth: () => void;
  onDeleteRecord: (id: string) => void;
  onUpdateRecord: (id: string, updated: Partial<OvertimeRecord>) => void;
  onGoToGmailReport: () => void;
}

export const ManagerReviewView: React.FC<ManagerReviewViewProps> = ({
  records,
  employees,
  settings,
  selectedMonth,
  onToggleVerify,
  onVerifyAllMonth,
  onDeleteRecord,
  onUpdateRecord,
  onGoToGmailReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified'>('all');
  const [filterEmployee, setFilterEmployee] = useState('all');

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHours, setEditHours] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');

  const employeesMap = new Map<string, Employee>(employees.map((e) => [e.id, e]));

  // Month records
  const monthRecords = records.filter((r) => r.date.startsWith(selectedMonth));

  // Filtered records
  const filtered = monthRecords.filter((r) => {
    if (filterStatus === 'pending' && r.verifiedByManager) return false;
    if (filterStatus === 'verified' && !r.verifiedByManager) return false;
    if (filterEmployee !== 'all' && r.employeeId !== filterEmployee) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = r.employeeName.toLowerCase().includes(term);
      const matchNote = (r.notes || '').toLowerCase().includes(term);
      const matchDate = r.date.includes(term);
      if (!matchName && !matchNote && !matchDate) return false;
    }
    return true;
  });

  // Calculate totals
  const totalHours = monthRecords.reduce((sum, r) => sum + r.hours, 0);
  const verifiedRecords = monthRecords.filter((r) => r.verifiedByManager);
  const verifiedHours = verifiedRecords.reduce((sum, r) => sum + r.hours, 0);
  const pendingRecords = monthRecords.filter((r) => !r.verifiedByManager);
  const totalSurchargeVal = monthRecords.reduce((sum, r) => sum + calculateRecordCost(r, employeesMap), 0);

  const startInlineEdit = (rec: OvertimeRecord) => {
    setEditingId(rec.id);
    setEditHours(rec.hours);
    setEditNotes(rec.notes || '');
  };

  const saveInlineEdit = (id: string) => {
    onUpdateRecord(id, {
      hours: editHours,
      notes: editNotes,
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Vercel Polarity Flipped #171717 */}
      <div className="bg-[#171717] rounded-[14px] p-6 text-white border border-[#2a2a2a] shadow-vercel-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="caption-mono bg-white/5 text-neutral-300 text-[11px] px-2.5 py-1 rounded-[6px] border border-white/10 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-300" />
                Conciliación de Nómina
              </span>
              <span className="caption-mono text-[11px] text-neutral-400">Encargado: {settings.managerName}</span>
            </div>
            <h2 className="text-2xl font-semibold text-white mt-2.5 tracking-display-md">Revisión y Auditoría</h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl font-sans">
              Audita y concilia las horas extras registradas antes de generar la carta consolidada para el contador.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {pendingRecords.length > 0 && (
              <button
                onClick={onVerifyAllMonth}
                className="bg-white hover:bg-neutral-100 text-[#171717] text-xs font-medium px-4 py-2 rounded-full flex items-center gap-2 transition-all shadow-vercel-subtle"
              >
                <CheckCheck className="w-3.5 h-3.5 text-[#171717]" />
                <span>Verificar Todo ({pendingRecords.length})</span>
              </button>
            )}

            <button
              onClick={onGoToGmailReport}
              className="bg-white/10 hover:bg-white/15 text-white text-xs font-medium px-4 py-2 rounded-full flex items-center gap-2 border border-white/15 transition-all"
            >
              <span>Ir a Reporte Gmail</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-neutral-800">
          <div className="bg-[#202020] rounded-[10px] p-3.5 border border-[#2d2d2d]">
            <span className="caption-mono text-[10px] text-neutral-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-neutral-400" />
              Total Horas
            </span>
            <p className="font-mono text-xl font-semibold text-white mt-1.5 tracking-tight">{formatHoursDisplay(totalHours)}</p>
          </div>

          <div className="bg-[#202020] rounded-[10px] p-3.5 border border-[#2d2d2d]">
            <span className="caption-mono text-[10px] text-neutral-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Verificadas
            </span>
            <p className="font-mono text-xl font-semibold text-neutral-100 mt-1.5 tracking-tight">
              {formatHoursDisplay(verifiedHours)}
            </p>
          </div>

          <div className="bg-[#202020] rounded-[10px] p-3.5 border border-[#2d2d2d]">
            <span className="caption-mono text-[10px] text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              Por Revisar
            </span>
            <p className="font-mono text-xl font-semibold text-amber-300 mt-1.5 tracking-tight">{pendingRecords.length} <span className="text-xs font-sans text-amber-400/80 font-normal">reg</span></p>
          </div>

          <div className="bg-[#202020] rounded-[10px] p-3.5 border border-[#2d2d2d]">
            <span className="caption-mono text-[10px] text-neutral-400 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-neutral-400" />
              Est. Recargos
            </span>
            <p className="font-mono text-xl font-semibold text-white mt-1.5 tracking-tight">{formatCurrency(totalSurchargeVal, settings.currencySymbol)}</p>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-[#111111] rounded-[12px] p-3 border border-[#ebebeb] dark:border-[#262626] shadow-vercel-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por empleado, fecha o nota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input w-full text-xs pl-9 pr-3 h-9 rounded-[6px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center bg-[#f5f5f5] dark:bg-[#1c1c1c] p-1 rounded-[8px] border border-[#ebebeb] dark:border-[#2c2c2c] text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-[6px] font-medium transition text-xs ${
                filterStatus === 'all' ? 'bg-white dark:bg-[#111111] text-[#171717] dark:text-white shadow-vercel-subtle' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Todos ({monthRecords.length})
            </button>

            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1 rounded-[6px] font-medium transition text-xs ${
                filterStatus === 'pending' ? 'bg-amber-400 text-neutral-950 font-semibold shadow-vercel-subtle' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Por Revisar ({pendingRecords.length})
            </button>

            <button
              onClick={() => setFilterStatus('verified')}
              className={`px-3 py-1 rounded-[6px] font-medium transition text-xs ${
                filterStatus === 'verified' ? 'bg-[#171717] text-white dark:bg-white dark:text-[#171717] shadow-vercel-subtle' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Verificados ({verifiedRecords.length})
            </button>
          </div>

          {/* Employee Filter */}
          <select
            value={filterEmployee}
            onChange={(e) => setFilterEmployee(e.target.value)}
            className="form-input text-xs h-9 px-3 rounded-[6px]"
          >
            <option value="all">Todos los empleados</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white dark:bg-[#111111] rounded-[12px] border border-[#ebebeb] dark:border-[#262626] shadow-vercel-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fafafa] dark:bg-[#161616] text-neutral-500 dark:text-neutral-400 border-b border-[#ebebeb] dark:border-[#262626]">
              <tr>
                <th className="caption-mono px-4 py-3 text-[11px]">Estado</th>
                <th className="caption-mono px-4 py-3 text-[11px]">Fecha</th>
                <th className="caption-mono px-4 py-3 text-[11px]">Empleado</th>
                <th className="caption-mono px-4 py-3 text-[11px]">Tipo de Extra</th>
                <th className="caption-mono px-4 py-3 text-[11px] text-center">Horas</th>
                <th className="caption-mono px-4 py-3 text-[11px] text-right">Recargo Est.</th>
                <th className="caption-mono px-4 py-3 text-[11px]">Observaciones / Motivo</th>
                <th className="caption-mono px-4 py-3 text-[11px] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb] dark:divide-[#262626]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-neutral-400 font-sans">
                    No se encontraron registros de horas extras con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filtered.map((rec) => {
                  const typeInfo = OVERTIME_TYPES[rec.type];
                  const isEditing = editingId === rec.id;
                  const cost = calculateRecordCost(rec, employeesMap);

                  return (
                    <tr
                      key={rec.id}
                      className={`hover:bg-[#fafafa] dark:hover:bg-[#171717]/70 transition-colors ${
                        !rec.verifiedByManager ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`caption-mono inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[10px] border ${
                            rec.verifiedByManager
                              ? 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700'
                              : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40'
                          }`}
                        >
                          {rec.verifiedByManager ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-neutral-700 dark:text-neutral-300" />
                              <span>Verificado</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>Por Revisar</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-neutral-900 dark:text-neutral-200">
                        {rec.date}
                      </td>

                      {/* Employee */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-xs text-neutral-900 dark:text-white">{rec.employeeName}</div>
                        <div className="caption-mono text-[10px] text-neutral-400">CC {employeesMap.get(rec.employeeId)?.documentId || 'S/D'}</div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-[4px] border text-[10px] font-medium ${typeInfo.badgeBg} ${typeInfo.badgeText} border-transparent`}>
                          {typeInfo.label}
                        </span>
                      </td>

                      {/* Hours */}
                      <td className="px-4 py-3 whitespace-nowrap text-center font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={editHours}
                            onChange={(e) => setEditHours(parseFloat(e.target.value) || 0)}
                            className="w-16 bg-white dark:bg-[#1a1a1a] border border-neutral-300 dark:border-neutral-700 rounded-[4px] px-1.5 py-0.5 font-mono text-center text-xs"
                          />
                        ) : (
                          <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">{formatHoursDisplay(rec.hours)}</span>
                        )}
                      </td>

                      {/* Surcharge Value */}
                      <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-medium text-xs text-neutral-800 dark:text-neutral-200">
                        {formatCurrency(cost, settings.currencySymbol)}
                      </td>

                      {/* Notes */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="w-full form-input text-xs h-7 px-2 rounded-[4px]"
                          />
                        ) : (
                          <p className="text-neutral-500 dark:text-neutral-400 text-xs max-w-xs truncate" title={rec.notes}>
                            {rec.notes || '—'}
                          </p>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveInlineEdit(rec.id)}
                                className="bg-[#171717] dark:bg-white text-white dark:text-[#171717] p-1.5 rounded-[6px] text-xs transition"
                                title="Guardar Cambios"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 p-1.5 rounded-[6px] text-xs hover:bg-neutral-200 transition"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startInlineEdit(rec)}
                                className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-[6px] transition"
                                title="Editar horas o notas"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => onToggleVerify(rec.id)}
                                className={`px-2.5 py-1 rounded-[6px] text-xs font-medium flex items-center gap-1 transition ${
                                  rec.verifiedByManager
                                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                                    : 'bg-[#171717] text-white hover:bg-neutral-800 dark:bg-white dark:text-[#171717] dark:hover:bg-neutral-100 shadow-vercel-subtle'
                                }`}
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>{rec.verifiedByManager ? 'Desmarcar' : 'Verificar'}</span>
                              </button>

                              <button
                                onClick={() => onDeleteRecord(rec.id)}
                                className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-[6px] transition"
                                title="Eliminar registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
