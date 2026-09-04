import React, { useState } from 'react';
import { Plus, CheckCircle2, Clock, AlertCircle, Filter, Trash2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { OvertimeRecord, Employee, OVERTIME_TYPES, UserRole } from '../types';
import { getWorkScheduleForDate, formatHoursDisplay } from '../utils/schedule';

interface CalendarViewProps {
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (m: string) => void;
  records: OvertimeRecord[];
  employees: Employee[];
  userRole?: UserRole | null;
  onAddForDate: (dateStr: string) => void;
  onDeleteRecord: (id: string) => void;
  onToggleVerifyRecord: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  selectedMonth,
  setSelectedMonth,
  records,
  employees,
  userRole,
  onAddForDate,
  onDeleteRecord,
  onToggleVerifyRecord,
}) => {
  const canAudit = userRole !== 'supervisor';
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Parse Year and Month
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

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
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
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
    <div className="space-y-6">
      {/* Vercel Polarity-Flipped Dark Band (Schedule Info) */}
      <div className="bg-[#171717] dark:bg-[#0a0a0a] text-white rounded-[12px] p-5 border border-[#ebebeb]/10 dark:border-[#262626] shadow-vercel-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-[6px] bg-white/10 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-mono-tech uppercase tracking-wider text-[11px] text-[#888888] block">
              Jornada Ordinaria Oficial Pintech
            </span>
            <p className="text-sm text-[#ededed] mt-0.5 tracking-tight font-medium">
              <span className="text-white">Lun, Mar, Jue, Vie:</span> 7:30 AM – 5:00 PM &nbsp;•&nbsp;
              <span className="text-white">Mié:</span> 7:30 AM – 4:30 PM &nbsp;•&nbsp;
              <span className="text-[#888888]">Sáb y Dom:</span> No laboral
            </p>
          </div>
        </div>
        <div className="font-mono-tech text-[11px] text-[#888888] bg-white/5 border border-white/10 px-3 py-1 rounded-[6px] whitespace-nowrap self-start sm:self-center">
          Cálculo automático de salida
        </div>
      </div>

      {/* Top Controls Header (Vercel stark layout) */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-[12px] p-5 border border-[#ebebeb] dark:border-[#262626] shadow-vercel-card flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-[-0.96px] text-[#171717] dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#171717] dark:text-white" />
              Calendario de Operaciones
            </h2>
            <span className="font-mono-tech text-[10px] uppercase px-2 py-0.5 rounded-[4px] bg-[#f5f5f5] dark:bg-[#1a1a1a] text-[#666666] dark:text-[#888888] border border-[#ebebeb] dark:border-[#262626]">
              Digitalizado
            </span>
          </div>
          <p className="text-xs text-[#666666] dark:text-[#888888] mt-1">
            Selecciona cualquier fecha para revisar registros o registrar horas extras del turno.
          </p>
        </div>

        {/* Month Switcher & Employee Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-[#fafafa] dark:bg-[#111111] rounded-[6px] border border-[#ebebeb] dark:border-[#262626] h-9 p-0.5">
            <button
              onClick={handlePrevMonth}
              className="w-7 h-7 flex items-center justify-center text-[#666666] dark:text-[#888888] hover:text-[#171717] dark:hover:text-white rounded-[4px] transition-colors cursor-pointer"
              title="Mes Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-mono-tech text-xs text-[#171717] dark:text-white min-w-[130px] text-center font-medium">
              {formattedMonthTitle}
            </span>
            <button
              onClick={handleNextMonth}
              className="w-7 h-7 flex items-center justify-center text-[#666666] dark:text-[#888888] hover:text-[#171717] dark:hover:text-white rounded-[4px] transition-colors cursor-pointer"
              title="Mes Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-[#fafafa] dark:bg-[#111111] px-3 h-9 rounded-[6px] border border-[#ebebeb] dark:border-[#262626] text-xs">
            <Filter className="w-3.5 h-3.5 text-[#888888]" />
            <select
              value={selectedEmployeeFilter}
              onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
              className="bg-transparent text-[#171717] dark:text-white font-medium focus:outline-none cursor-pointer text-xs font-mono-tech"
            >
              <option value="all" className="bg-white dark:bg-[#111111]">Todos los operarios</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id} className="bg-white dark:bg-[#111111]">
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid + Sidebar Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid (3 Cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-[#0a0a0a] rounded-[12px] border border-[#ebebeb] dark:border-[#262626] shadow-vercel-card p-5">
          {/* Weekday Headers in Geist Mono */}
          <div className="grid grid-cols-7 text-center font-mono-tech text-[11px] text-[#888888] uppercase tracking-wider border-b border-[#ebebeb] dark:border-[#262626] pb-3 mb-3">
            <span>Lun</span>
            <span>Mar</span>
            <span className="text-[#171717] dark:text-white font-bold" title="Salida 4:30 PM">Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span className="text-[#a1a1a1] dark:text-[#555555]">Sáb</span>
            <span className="text-[#a1a1a1] dark:text-[#555555]">Dom</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty slots for start offset */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`offset-${i}`} className="min-h-[90px] sm:min-h-[110px] rounded-[6px] bg-[#fafafa]/50 dark:bg-[#111111]/30 border border-transparent" />
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
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 0;
              const isWednesday = dayOfWeek === 3;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[95px] sm:min-h-[115px] p-2 sm:p-2.5 rounded-[6px] border text-left flex flex-col justify-between transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'border-[#171717] bg-[#f5f5f5] dark:border-white dark:bg-[#1a1a1a] ring-1 ring-[#171717] dark:ring-white'
                      : isToday
                      ? 'border-[#0070f3] bg-[#d3e5ff]/20 dark:bg-[#0070f3]/10'
                      : dayRecords.length > 0
                      ? 'border-[#ebebeb] dark:border-[#262626] bg-[#fafafa] dark:bg-[#111111] hover:border-[#a1a1a1]'
                      : 'border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] hover:bg-[#fafafa] dark:hover:bg-[#111111]'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono-tech text-xs rounded-[4px] w-6 h-6 flex items-center justify-center font-medium ${
                        isToday
                          ? 'bg-[#0070f3] text-white font-bold'
                          : isWeekend
                          ? 'text-[#888888]'
                          : 'text-[#171717] dark:text-[#ededed]'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Wed Indicator */}
                    {isWednesday && dayRecords.length === 0 && (
                      <span className="font-mono-tech text-[9px] text-[#888888]">
                        4:30p
                      </span>
                    )}

                    {totalDayHours > 0 && (
                      <span className="font-mono-tech bg-[#171717] dark:bg-white text-white dark:text-[#171717] text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatHoursDisplay(totalDayHours)}
                      </span>
                    )}
                  </div>

                  {/* Overtime chips for this day */}
                  <div className="mt-1.5 space-y-1 overflow-hidden flex-1">
                    {dayRecords.slice(0, 2).map((rec) => {
                      const typeInfo = OVERTIME_TYPES[rec.type];
                      return (
                        <div
                          key={rec.id}
                          className="text-[10px] font-mono-tech px-1.5 py-0.5 rounded-[4px] border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#171717] truncate flex items-center justify-between gap-1 text-[#171717] dark:text-white"
                        >
                          <span className="truncate">{rec.employeeName.split(' ')[0]}</span>
                          <span className="font-bold text-[#0070f3]">{rec.hours}h</span>
                        </div>
                      );
                    })}

                    {dayRecords.length > 2 && (
                      <div className="text-[10px] font-mono-tech text-[#888888] text-center">
                        +{dayRecords.length - 2} más
                      </div>
                    )}
                  </div>

                  {/* Add button on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddForDate(dateStr);
                    }}
                    className="mt-1 w-full opacity-0 group-hover:opacity-100 bg-[#171717] dark:bg-white text-white dark:text-[#171717] py-0.5 rounded-[4px] text-[10px] font-medium flex items-center justify-center gap-1 transition-opacity cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tachar</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details Sidebar (1 Col) */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-[12px] border border-[#ebebeb] dark:border-[#262626] shadow-vercel-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#ebebeb] dark:border-[#262626] pb-3 mb-4">
              <div>
                <span className="font-mono-tech text-[10px] uppercase text-[#888888] block">Detalle de Fecha</span>
                <h3 className="font-semibold text-sm tracking-[-0.6px] text-[#171717] dark:text-white font-mono-tech mt-0.5">
                  {selectedDate ? selectedDate : 'Selecciona un día'}
                </h3>
              </div>

              {selectedDate && (
                <button
                  onClick={() => onAddForDate(selectedDate)}
                  className="h-7 px-2.5 rounded-[6px] bg-[#171717] dark:bg-white text-white dark:text-[#171717] text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir</span>
                </button>
              )}
            </div>

            {!selectedDate ? (
              <div className="text-center py-12 text-[#888888] space-y-2">
                <CalendarIcon className="w-8 h-8 mx-auto text-[#888888] opacity-50" />
                <p className="text-xs">Selecciona un día en la cuadrícula para ver el desglose o registrar horas.</p>
              </div>
            ) : activeDateRecords.length === 0 ? (
              <div className="text-center py-10 text-[#888888] space-y-3 bg-[#fafafa] dark:bg-[#111111] rounded-[8px] p-4 border border-dashed border-[#ebebeb] dark:border-[#262626]">
                <p className="text-xs font-mono-tech">0 horas registradas</p>
                <button
                  onClick={() => onAddForDate(selectedDate)}
                  className="h-8 px-3 rounded-full bg-[#171717] dark:bg-white text-white dark:text-[#171717] text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
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
                      className="p-3 bg-[#fafafa] dark:bg-[#111111] rounded-[8px] border border-[#ebebeb] dark:border-[#262626] space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-semibold text-[#171717] dark:text-white block">
                            {rec.employeeName}
                          </span>
                          <span className="font-mono-tech text-[11px] text-[#0070f3] font-bold">
                            {rec.hours} hrs ({typeInfo?.label})
                          </span>
                        </div>

                        <button
                          onClick={() => onDeleteRecord(rec.id)}
                          className="text-[#888888] hover:text-[#ee0000] p-1 transition-colors cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {rec.notes && (
                        <p className="text-[11px] font-mono-tech text-[#666666] dark:text-[#888888] bg-white dark:bg-[#0a0a0a] p-1.5 rounded-[4px] border border-[#ebebeb] dark:border-[#262626]">
                          {rec.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-[#ebebeb] dark:border-[#262626] text-[10px] font-mono-tech">
                        <span className={rec.verifiedByManager ? 'text-[#0070f3]' : 'text-[#f5a623]'}>
                          {rec.verifiedByManager ? '✓ Auditado' : '○ Pendiente'}
                        </span>
                        {canAudit && (
                          <button
                            onClick={() => onToggleVerifyRecord(rec.id)}
                            className="text-[#888888] hover:text-[#171717] dark:hover:text-white underline cursor-pointer"
                          >
                            {rec.verifiedByManager ? 'Desmarcar' : 'Verificar'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedDate && (
            <div className="pt-4 border-t border-[#ebebeb] dark:border-[#262626] mt-4 flex items-center justify-between text-xs font-mono-tech text-[#888888]">
              <span>Registros: {activeDateRecords.length}</span>
              <span className="font-bold text-[#171717] dark:text-white">
                Total: {formatHoursDisplay(activeDateRecords.reduce((s, r) => s + r.hours, 0))}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
