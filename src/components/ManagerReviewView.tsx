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
      {/* Header Banner - Minimalist Slate */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-slate-800 text-slate-300 text-xs font-semibold px-2.5 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
                Conciliación de Nómina
              </span>
              <span className="text-xs text-slate-400">Encargado: {settings.managerName}</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-2 tracking-tight">Revisión y Auditoría con el Encargado</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Audita y aprueba las horas extras registradas antes de generar la carta consolidada para el contador.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {pendingRecords.length > 0 && (
              <button
                onClick={onVerifyAllMonth}
                className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition shadow-sm"
              >
                <CheckCheck className="w-4 h-4 text-slate-900" />
                <span>Verificar Todo el Mes ({pendingRecords.length})</span>
              </button>
            )}

            <button
              onClick={onGoToGmailReport}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-700 transition"
            >
              <span>Ir a Reporte para Gmail</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-300" />
              Total Horas Registradas
            </span>
            <p className="text-lg font-bold text-white mt-1">{formatHoursDisplay(totalHours)}</p>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />
              Horas Verificadas
            </span>
            <p className="text-lg font-bold text-slate-200 mt-1">
              {formatHoursDisplay(verifiedHours)}
            </p>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              Pendientes de Revisión
            </span>
            <p className="text-lg font-bold text-amber-300 mt-1">{pendingRecords.length} reg</p>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-slate-300" />
              Valor Est. Recargos
            </span>
            <p className="text-lg font-bold text-white mt-1">{formatCurrency(totalSurchargeVal, settings.currencySymbol)}</p>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por empleado, fecha o nota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                filterStatus === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Todos ({monthRecords.length})
            </button>

            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                filterStatus === 'pending' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-500'
              }`}
            >
              Por Revisar ({pendingRecords.length})
            </button>

            <button
              onClick={() => setFilterStatus('verified')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                filterStatus === 'verified' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Verificados ({verifiedRecords.length})
            </button>
          </div>

          {/* Employee Filter */}
          <select
            value={filterEmployee}
            onChange={(e) => setFilterEmployee(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Empleado</th>
                <th className="px-4 py-3">Tipo de Extra</th>
                <th className="px-4 py-3 text-center">Horas</th>
                <th className="px-4 py-3 text-right">Recargo Est.</th>
                <th className="px-4 py-3">Observaciones / Motivo</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
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
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                        !rec.verifiedByManager ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold border ${
                            rec.verifiedByManager
                              ? 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                              : 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}
                        >
                          {rec.verifiedByManager ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                              <span>Verificado</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                              <span>Por Revisar</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900 dark:text-slate-200">
                        {rec.date}
                      </td>

                      {/* Employee */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white">{rec.employeeName}</div>
                        <div className="text-[10px] text-slate-500">Doc: {employeesMap.get(rec.employeeId)?.documentId || 'S/D'}</div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${typeInfo.badgeBg} ${typeInfo.badgeText}`}>
                          {typeInfo.label}
                        </span>
                      </td>

                      {/* Hours */}
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={editHours}
                            onChange={(e) => setEditHours(parseFloat(e.target.value) || 0)}
                            className="w-16 bg-white dark:bg-slate-800 border border-slate-400 rounded px-1.5 py-0.5 font-bold text-center text-xs"
                          />
                        ) : (
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{formatHoursDisplay(rec.hours)}</span>
                        )}
                      </td>

                      {/* Surcharge Value */}
                      <td className="px-4 py-3 whitespace-nowrap text-right font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(cost, settings.currencySymbol)}
                      </td>

                      {/* Notes */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-400 rounded px-2 py-0.5 text-xs"
                          />
                        ) : (
                          <p className="text-slate-600 dark:text-slate-300 italic text-[11px] max-w-xs truncate" title={rec.notes}>
                            {rec.notes || 'Sin observaciones'}
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
                                className="bg-slate-900 text-white hover:bg-slate-800 p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                                title="Guardar Cambios"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 p-1.5 rounded-lg text-xs"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startInlineEdit(rec)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                                title="Editar horas o notas"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => onToggleVerify(rec.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                                  rec.verifiedByManager
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                                }`}
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>{rec.verifiedByManager ? 'Desmarcar' : 'Verificar'}</span>
                              </button>

                              <button
                                onClick={() => onDeleteRecord(rec.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
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
