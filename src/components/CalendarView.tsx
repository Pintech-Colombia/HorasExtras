import React, { useState } from 'react';
import { Plus, CheckCircle2, Clock, AlertCircle, Filter, Trash2, UserCheck, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { OvertimeRecord, Employee, OVERTIME_TYPES } from '../types';
import { getWorkScheduleForDate, formatHoursDisplay } from '../utils/schedule';

interface CalendarViewProps {
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (m: string) => void;
  records: OvertimeRecord[];
  employees: Employee[];
  onAddForDate: (dateStr: string) => void;
  onDeleteRecord: (id: string) => void;
  onToggleVerifyRecord: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  selectedMonth,
  setSelectedMonth,
  records,
  employees,
  onAddForDate,
  onDeleteRecord,
  onToggleVerifyRecord,
}) => {
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Parse Year and Month
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12

  // Month Navigation helpers
  const handlePrevMonth = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  // Calendar Days calculation
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 = Sunday, 1 = Monday...
  // Shift Sunday (0) to 7 for Monday start grid (1..7)
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  // Filter records by employee if selected
  const filteredRecords = records.filter((r) => {
    if (!r.date.startsWith(selectedMonth)) return false;
    if (selectedEmployeeFilter !== 'all' && r.employeeId !== selectedEmployeeFilter) return false;
    return true;
  });

  // Group records by YYYY-MM-DD
  const recordsByDate = new Map<string, OvertimeRecord[]>();
  filteredRecords.forEach((r) => {
    if (!recordsByDate.has(r.date)) {
      recordsByDate.set(r.date, []);
    }
    recordsByDate.get(r.date)!.push(r);
  });

  // Today string for highlighting
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const monthName = new Date(year, month - 1, 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  const formattedMonthTitle = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Day records for detail modal/sidebar
  const activeDateRecords = selectedDate ? recordsByDate.get(selectedDate) || [] : [];
  const selectedDateSchedule = selectedDate ? getWorkScheduleForDate(selectedDate) : null;

  return (
    <div className="space-y-5">
      {/* Schedule Info Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
            <Info className="w-4 h-4 text-slate-300" />
          </div>
          <div>
            <span className="font-bold tracking-wider text-[10px] text-slate-400 uppercase block">Horarios de Trabajo Oficiales</span>
            <p className="text-slate-200 mt-0.5">
              <strong className="text-white">Lun, Mar, Jue, Vie:</strong> 7:30 AM - 5:00 PM &nbsp;|&nbsp;
              <strong className="text-white">Mié:</strong> 7:30 AM - 4:30 PM &nbsp;|&nbsp;
              <strong className="text-slate-400">Sáb y Dom:</strong> No laboral
            </p>
          </div>
        </div>
        <span className="text-[11px] bg-slate-800 text-slate-300 px-3 py-1 rounded-lg border border-slate-700 whitespace-nowrap self-start sm:self-center">
          Soporta fracción (1.5h, 2.5h)
        </span>
      </div>

      {/* Top Controls Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              Calendario Mensual de Horas Extras
            </h2>
            <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
              Formato Físico Digitalizado
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Haz clic en cualquier día para tachar horas extras o revisar el detalle de la jornada.
          </p>
        </div>

        {/* Month Switcher & Employee Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition"
              title="Mes Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-xs text-slate-800 dark:text-slate-200 min-w-[130px] text-center">
              {formattedMonthTitle}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition"
              title="Mes Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedEmployeeFilter}
              onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-medium focus:outline-none cursor-pointer"
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
      </div>

      {/* Main Grid + Sidebar Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Calendar Grid (3 Cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3 mb-2">
            <span>Lun</span>
            <span>Mar</span>
            <span className="text-slate-900 dark:text-slate-100 underline decoration-slate-400 decoration-1" title="Miércoles sale a las 4:30 PM">Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span className="text-slate-400">Sáb</span>
            <span className="text-slate-400">Dom</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Empty slots for start offset */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`offset-${i}`} className="min-h-[90px] sm:min-h-[110px] rounded-xl bg-slate-50/40 dark:bg-slate-900/20 border border-transparent" />
            ))}

            {/* Days of Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayRecords = recordsByDate.get(dateStr) || [];
              const totalDayHours = dayRecords.reduce((sum, r) => sum + r.hours, 0);
              const isToday = dateStr === todayStr;
              const isSelected = selectedDate === dateStr;
              const dayOfWeek = new Date(year, month - 1, dayNum).getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const isWednesday = dayOfWeek === 3;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[95px] sm:min-h-[115px] p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'border-slate-900 bg-slate-100/70 dark:bg-slate-800 dark:border-slate-100 ring-1 ring-slate-900'
                      : isToday
                      ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/30 dark:bg-indigo-950/20'
                      : dayRecords.length > 0
                      ? 'border-slate-300 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/60 hover:border-slate-400'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold rounded-md w-6 h-6 flex items-center justify-center ${
                        isToday
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : isWeekend
                          ? 'text-slate-400'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Wed badge */}
                    {isWednesday && dayRecords.length === 0 && (
                      <span className="text-[9px] font-medium text-slate-400" title="Sale 4:30 PM">
                        4:30pm
                      </span>
                    )}

                    {totalDayHours > 0 && (
                      <span className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                        <Clock className="w-2.5 h-2.5" />
                        {formatHoursDisplay(totalDayHours)}
                      </span>
                    )}
                  </div>

                  {/* Badges preview for records on this day */}
                  <div className="mt-1 space-y-1 overflow-hidden flex-1">
                    {dayRecords.slice(0, 2).map((rec) => {
                      const typeInfo = OVERTIME_TYPES[rec.type];
                      return (
                        <div
                          key={rec.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded border truncate flex items-center justify-between gap-1 font-medium ${typeInfo.badgeBg} ${typeInfo.badgeText}`}
                        >
                          <span className="truncate">{rec.employeeName.split(' ')[0]}</span>
                          <span className="font-bold">{rec.hours}h</span>
                        </div>
                      );
                    })}

                    {dayRecords.length > 2 && (
                      <div className="text-[10px] text-slate-500 font-semibold text-center py-0.5">
                        +{dayRecords.length - 2} más
                      </div>
                    )}
                  </div>

                  {/* Add Overtime Button on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddForDate(dateStr);
                    }}
                    className="mt-1 w-full opacity-0 group-hover:opacity-100 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 py-0.5 rounded text-[10px] font-semibold flex items-center justify-center gap-1 transition shadow-sm"
                    title="Añadir horas extras a esta fecha"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tachar Extra</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details Sidebar (1 Col) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  {selectedDate ? `Detalle: ${selectedDate}` : 'Selecciona una fecha'}
                </h3>
                {selectedDateSchedule && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedDateSchedule.dayName}: {selectedDateSchedule.notes}
                  </p>
                )}
              </div>

              {selectedDate && (
                <button
                  onClick={() => onAddForDate(selectedDate)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir</span>
                </button>
              )}
            </div>

            {!selectedDate ? (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <CalendarIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-xs">Haz clic en cualquier casilla del calendario para ver o tachar horas extras de empleados.</p>
              </div>
            ) : activeDateRecords.length === 0 ? (
              <div className="text-center py-8 text-slate-500 space-y-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-xs">Sin registros de horas extras para el día {selectedDate}.</p>
                <button
                  onClick={() => onAddForDate(selectedDate)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Horas Extras</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {activeDateRecords.map((rec) => {
                  const typeInfo = OVERTIME_TYPES[rec.type];
                  return (
                    <div
                      key={rec.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{rec.employeeName}</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {formatHoursDisplay(rec.hours)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${typeInfo.badgeBg} ${typeInfo.badgeText}`}>
                          {typeInfo.label}
                        </span>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium flex items-center gap-1 border ${
                            rec.verifiedByManager
                              ? 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                              : 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}
                        >
                          {rec.verifiedByManager ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-slate-700 dark:text-slate-300" />
                              <span>Verificado</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                              <span>Por Revisar</span>
                            </>
                          )}
                        </span>
                      </div>

                      {rec.notes && <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">"{rec.notes}"</p>}

                      <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-slate-200/80 dark:border-slate-700/80">
                        <button
                          onClick={() => onToggleVerifyRecord(rec.id)}
                          className={`text-[11px] px-2.5 py-1 rounded font-semibold flex items-center gap-1 transition ${
                            rec.verifiedByManager
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                          title="Alternar verificación con el encargado"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>{rec.verifiedByManager ? 'Desmarcar' : 'Verificar'}</span>
                        </button>

                        <button
                          onClick={() => onDeleteRecord(rec.id)}
                          className="text-[11px] px-2.5 py-1 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 rounded font-semibold flex items-center gap-1 transition"
                          title="Eliminar este registro"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Summary at bottom of sidebar */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
            <span>Total Mes Seleccionado:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {formatHoursDisplay(filteredRecords.reduce((sum, r) => sum + r.hours, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
