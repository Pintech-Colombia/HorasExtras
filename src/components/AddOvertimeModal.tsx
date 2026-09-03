import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, FileText, CheckCircle2, X, Info, ArrowRight, Sparkles } from 'lucide-react';
import { Employee, OvertimeType, OVERTIME_TYPES, OvertimeRecord } from '../types';
import { getWorkScheduleForDate, calculateOvertimeFromDeparture, formatHoursDisplay } from '../utils/schedule';

interface AddOvertimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  initialDate?: string;
  onSaveRecords: (records: Omit<OvertimeRecord, 'id' | 'createdAt'>[]) => void;
}

export const AddOvertimeModal: React.FC<AddOvertimeModalProps> = ({
  isOpen,
  onClose,
  employees,
  initialDate,
  onSaveRecords,
}) => {
  const [date, setDate] = useState<string>('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  
  // Input Mode: 'departure_time' (Hora de Salida) or 'direct_hours' (Cantidad de horas directa)
  const [inputMode, setInputMode] = useState<'departure_time' | 'direct_hours'>('departure_time');
  
  // Departure mode state
  const [departureTime, setDepartureTime] = useState<string>('18:30'); // Default 6:30 PM
  const [weekendStartTime, setWeekendStartTime] = useState<string>('07:30'); // For weekends

  // Direct hours mode state
  const [hours, setHours] = useState<number>(1.5);
  
  const [overtimeType, setOvertimeType] = useState<OvertimeType>('diurna');
  const [notes, setNotes] = useState<string>('');
  const [verifiedByManager, setVerifiedByManager] = useState<boolean>(false);

  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
    } else {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      setDate(dateStr);
    }
  }, [initialDate, isOpen]);

  // Default departure time suggestion depending on weekday
  useEffect(() => {
    if (!date) return;
    const schedule = getWorkScheduleForDate(date);
    if (schedule.isWeekend) {
      setDepartureTime('13:30');
    } else if (schedule.dayName === 'Miércoles') {
      setDepartureTime('18:00'); // 6:00 PM on Wednesday -> 1.5h extra from 4:30 PM
    } else {
      setDepartureTime('18:30'); // 6:30 PM on Mon/Tue/Thu/Fri -> 1.5h extra from 5:00 PM
    }
  }, [date]);

  if (!isOpen) return null;

  const schedule = getWorkScheduleForDate(date);

  // Calculate effective hours based on mode
  let effectiveHours = hours;
  let calculationBreakdown = '';

  if (inputMode === 'departure_time') {
    const calc = calculateOvertimeFromDeparture(date, departureTime, weekendStartTime);
    effectiveHours = calc.hours;
    calculationBreakdown = calc.breakdown;
  }

  const toggleEmployeeSelect = (empId: string) => {
    if (selectedEmployeeIds.includes(empId)) {
      setSelectedEmployeeIds(selectedEmployeeIds.filter((id) => id !== empId));
    } else {
      setSelectedEmployeeIds([...selectedEmployeeIds, empId]);
    }
  };

  const handleSelectAllEmployees = () => {
    if (selectedEmployeeIds.length === employees.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(employees.map((e) => e.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployeeIds.length === 0 || effectiveHours <= 0) return;

    const employeesMap = new Map<string, Employee>(employees.map((emp) => [emp.id, emp]));

    const defaultNote = inputMode === 'departure_time' 
      ? `Salida: ${departureTime}`
      : '';

    const finalNotes = notes.trim() 
      ? notes.trim() 
      : defaultNote;

    const newRecords: Omit<OvertimeRecord, 'id' | 'createdAt'>[] = selectedEmployeeIds.map((empId) => {
      const emp = employeesMap.get(empId);
      return {
        date,
        employeeId: empId,
        employeeName: emp ? emp.name : 'Empleado',
        hours: effectiveHours,
        type: overtimeType,
        status: verifiedByManager ? 'verified_manager' : 'pending_review',
        notes: finalNotes,
        verifiedByManager,
        verifiedAt: verifiedByManager ? new Date().toISOString() : undefined,
      };
    });

    onSaveRecords(newRecords);
    onClose();
    // Reset defaults
    setSelectedEmployeeIds([]);
    setNotes('');
  };

  const directPresets = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Soft Minimalist Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center">
              <Clock className="w-4 h-4 text-slate-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">Registrar Horas Extras</h3>
              <p className="text-[11px] text-slate-400">
                Calcula por hora de salida real o ingresa las horas directamente.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Date Picker & Schedule Banner */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Fecha de Trabajo *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-slate-400"
            />

            {/* Schedule Banner */}
            {date && (
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-xl flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{schedule.dayName}: </span>
                  <span>{schedule.notes}</span>
                </div>
              </div>
            )}
          </div>

          {/* Mode Switcher Tabs */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 dark:text-slate-200">
              Método de Registro de Horas *
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setInputMode('departure_time')}
                className={`py-2 px-2 rounded-lg font-bold text-center text-xs transition flex items-center justify-center gap-1.5 ${
                  inputMode === 'departure_time'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Por Hora de Salida</span>
              </button>

              <button
                type="button"
                onClick={() => setInputMode('direct_hours')}
                className={`py-2 px-2 rounded-lg font-bold text-center text-xs transition flex items-center justify-center gap-1.5 ${
                  inputMode === 'direct_hours'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cantidad Directa (ej. 1.5h)</span>
              </button>
            </div>
          </div>

          {/* MODE A: DEPARTURE TIME CALCULATION */}
          {inputMode === 'departure_time' && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                    Hora Real de Salida del Empleado
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {schedule.isWeekend
                      ? 'Día de fin de semana (se calcula según horario de ingreso y salida)'
                      : `Hora oficial de salida: ${schedule.shiftEnd}`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    required
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-1.5 font-bold text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              {schedule.isWeekend && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Hora de Ingreso el Fin de Semana:
                  </span>
                  <input
                    type="time"
                    value={weekendStartTime}
                    onChange={(e) => setWeekendStartTime(e.target.value)}
                    className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* Automatic Calculation Box */}
              <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">Resultado Extra:</span>
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{calculationBreakdown}</span>
                </div>

                <div className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold px-2.5 py-1 rounded-lg text-xs shrink-0 shadow-sm">
                  = {formatHoursDisplay(effectiveHours)}
                </div>
              </div>
            </div>
          )}

          {/* MODE B: DIRECT HOURS INPUT */}
          {inputMode === 'direct_hours' && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Horas Extras Laboradas
                </label>
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                  {formatHoursDisplay(hours)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  required={inputMode === 'direct_hours'}
                  value={hours}
                  onChange={(e) => setHours(parseFloat(e.target.value) || 0.5)}
                  className="w-24 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 font-bold text-center text-xs focus:outline-none"
                />

                <div className="flex flex-wrap items-center gap-1">
                  {directPresets.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setHours(num)}
                      className={`px-2 py-1 rounded-lg font-bold text-[11px] border transition ${
                        hours === num
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      +{num}h
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Employee Multi Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Empleados ({selectedEmployeeIds.length} seleccionados) *
              </label>

              <button
                type="button"
                onClick={handleSelectAllEmployees}
                className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 font-semibold underline"
              >
                {selectedEmployeeIds.length === employees.length ? 'Desmarcar todos' : 'Seleccionar todos'}
              </button>
            </div>

            <div className="max-h-36 overflow-y-auto border border-slate-200/80 dark:border-slate-800 rounded-xl p-1.5 bg-slate-50/50 dark:bg-slate-800/30 space-y-1">
              {employees.map((emp) => {
                const isSelected = selectedEmployeeIds.includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => toggleEmployeeSelect(emp.id)}
                    className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-slate-900 text-white font-medium'
                        : 'hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-xs">{emp.name}</span>
                      <span className={`block text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                        {emp.position} (Doc: {emp.documentId})
                      </span>
                    </div>

                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'border-white bg-white/20' : 'border-slate-300 dark:border-slate-600'}`}>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Type of Overtime */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Tipo de Hora Extra / Recargo *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(OVERTIME_TYPES) as OvertimeType[]).map((tKey) => {
                const typeObj = OVERTIME_TYPES[tKey];
                const isSelected = overtimeType === tKey;
                return (
                  <div
                    key={tKey}
                    onClick={() => setOvertimeType(tKey)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'border-slate-900 dark:border-slate-100 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs">{typeObj.label}</div>
                    <div className={`text-[10px] mt-0.5 ${isSelected ? 'opacity-80' : 'text-slate-400'}`}>
                      {typeObj.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Observaciones / Motivo
            </label>
            <input
              type="text"
              placeholder="Ej. Despacho urgente, reparación de máquina, cierre de mes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none"
            />
          </div>

          {/* Manager Verification Checkbox */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl flex items-center gap-2.5">
            <input
              type="checkbox"
              id="verifyNow"
              checked={verifiedByManager}
              onChange={(e) => setVerifiedByManager(e.target.checked)}
              className="w-4 h-4 text-slate-900 rounded focus:ring-slate-500 cursor-pointer"
            />
            <label htmlFor="verifyNow" className="text-xs text-slate-800 dark:text-slate-200 font-medium cursor-pointer">
              Marcar como revisado y verificado por el encargado inmediatamente
            </label>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={selectedEmployeeIds.length === 0 || effectiveHours <= 0}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold rounded-xl transition shadow-sm"
            >
              Guardar ({selectedEmployeeIds.length}) Registros ({formatHoursDisplay(effectiveHours)})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
