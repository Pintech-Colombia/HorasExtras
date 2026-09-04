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

  // Default departure time and overtime type suggestion depending on weekday/weekend
  useEffect(() => {
    if (!date) return;
    const schedule = getWorkScheduleForDate(date);
    if (schedule.isWeekend) {
      setDepartureTime('13:30');
      setOvertimeType('festiva_diurna');
    } else {
      if (schedule.dayName === 'Miércoles') {
        setDepartureTime('18:00'); // 6:00 PM on Wednesday -> 1.5h extra from 4:30 PM
      } else {
        setDepartureTime('18:30'); // 6:30 PM on Mon/Tue/Thu/Fri -> 1.5h extra from 5:00 PM
      }
      setOvertimeType('diurna');
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

  return (    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111111] rounded-[12px] max-w-lg w-full border border-[#ebebeb] dark:border-[#262626] shadow-vercel-modal overflow-hidden flex flex-col max-h-[92vh]">
        {/* Vercel Polarity Flipped #171717 Header */}
        <div className="bg-[#171717] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#262626]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[6px] bg-white/10 border border-white/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-white tracking-tight">Registrar Horas Extras</h3>
              <p className="text-[11px] text-neutral-400 font-sans">
                Calcula por hora de salida real o ingresa las horas directamente.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1 rounded-[6px] transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Date Picker & Schedule Banner */}
          <div className="space-y-2">
            <label className="caption-mono block text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              Fecha de Trabajo *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="form-input w-full text-xs font-mono font-medium h-9 px-3 rounded-[6px]"
            />

            {/* Schedule Banner */}
            {date && (
              <div className="p-2.5 bg-[#fafafa] dark:bg-[#161616] border border-[#ebebeb] dark:border-[#262626] rounded-[8px] flex items-start gap-2 text-neutral-600 dark:text-neutral-300">
                <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed font-sans">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">{schedule.dayName}: </span>
                  <span>{schedule.notes}</span>
                </div>
              </div>
            )}
          </div>

          {/* Mode Switcher Tabs */}
          <div className="space-y-2">
            <label className="caption-mono block text-neutral-700 dark:text-neutral-200">
              Método de Registro de Horas *
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-[#f5f5f5] dark:bg-[#1c1c1c] p-1 rounded-[8px] border border-[#ebebeb] dark:border-[#2c2c2c]">
              <button
                type="button"
                onClick={() => setInputMode('departure_time')}
                className={`py-2 px-2 rounded-[6px] font-medium text-center text-xs transition flex items-center justify-center gap-1.5 ${
                  inputMode === 'departure_time'
                    ? 'bg-white dark:bg-[#111111] text-[#171717] dark:text-white shadow-vercel-subtle'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Por Hora de Salida</span>
              </button>

              <button
                type="button"
                onClick={() => setInputMode('direct_hours')}
                className={`py-2 px-2 rounded-[6px] font-medium text-center text-xs transition flex items-center justify-center gap-1.5 ${
                  inputMode === 'direct_hours'
                    ? 'bg-white dark:bg-[#111111] text-[#171717] dark:text-white shadow-vercel-subtle'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cantidad Directa</span>
              </button>
            </div>
          </div>

          {/* MODE A: DEPARTURE TIME CALCULATION */}
          {inputMode === 'departure_time' && (
            <div className="p-3.5 bg-[#fafafa] dark:bg-[#161616] border border-[#ebebeb] dark:border-[#262626] rounded-[10px] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="caption-mono text-neutral-700 dark:text-neutral-200 block text-xs">
                    Hora Real de Salida del Empleado
                  </span>
                  <span className="text-[11px] text-neutral-400 font-sans">
                    {schedule.isWeekend
                      ? 'Fin de semana (según horario de ingreso y salida)'
                      : `Hora oficial de salida: ${schedule.shiftEnd}`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    required
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="form-input text-xs font-mono font-medium h-9 px-3 rounded-[6px]"
                  />
                </div>
              </div>

              {schedule.isWeekend && (
                <div className="flex items-center justify-between pt-2 border-t border-[#ebebeb] dark:border-[#262626]">
                  <span className="caption-mono text-xs text-neutral-600 dark:text-neutral-300">
                    Hora de Ingreso Fin de Semana:
                  </span>
                  <input
                    type="time"
                    value={weekendStartTime}
                    onChange={(e) => setWeekendStartTime(e.target.value)}
                    className="form-input text-xs font-mono font-medium h-8 px-2.5 rounded-[6px]"
                  />
                </div>
              )}

              {/* Automatic Calculation Box */}
              <div className="p-2.5 bg-white dark:bg-[#0d0d0d] border border-[#ebebeb] dark:border-[#262626] rounded-[8px] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="caption-mono text-[10px] text-neutral-400">Resultado:</span>
                  <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium font-sans">{calculationBreakdown}</span>
                </div>

                <div className="bg-[#171717] text-white dark:bg-white dark:text-[#171717] font-mono font-semibold px-2.5 py-1 rounded-[6px] text-xs shrink-0 shadow-vercel-subtle">
                  = {formatHoursDisplay(effectiveHours)}
                </div>
              </div>
            </div>
          )}

          {/* MODE B: DIRECT HOURS INPUT */}
          {inputMode === 'direct_hours' && (
            <div className="p-3.5 bg-[#fafafa] dark:bg-[#161616] border border-[#ebebeb] dark:border-[#262626] rounded-[10px] space-y-3">
              <div className="flex items-center justify-between">
                <label className="caption-mono text-neutral-700 dark:text-neutral-200">
                  Horas Extras Laboradas
                </label>
                <span className="font-mono font-semibold text-xs text-neutral-900 dark:text-neutral-100 bg-white dark:bg-[#0d0d0d] px-2.5 py-1 rounded-[6px] border border-[#ebebeb] dark:border-[#262626] shadow-vercel-subtle">
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
                  className="form-input w-24 text-center font-mono font-medium text-xs h-9 rounded-[6px]"
                />

                <div className="flex flex-wrap items-center gap-1">
                  {directPresets.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setHours(num)}
                      className={`px-2 py-1 rounded-[6px] font-mono text-[11px] border transition ${
                        hours === num
                          ? 'bg-[#171717] text-white border-[#171717] dark:bg-white dark:text-[#171717] dark:border-white'
                          : 'bg-white dark:bg-[#111111] border-[#ebebeb] dark:border-[#262626] text-neutral-700 dark:text-neutral-300 hover:bg-[#fafafa]'
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
              <label className="caption-mono text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-neutral-400" />
                Empleados ({selectedEmployeeIds.length} seleccionados) *
              </label>

              <button
                type="button"
                onClick={handleSelectAllEmployees}
                className="caption-mono text-[11px] text-neutral-400 hover:text-neutral-900 dark:hover:text-white underline transition"
              >
                {selectedEmployeeIds.length === employees.length ? 'Desmarcar todos' : 'Seleccionar todos'}
              </button>
            </div>

            <div className="max-h-36 overflow-y-auto border border-[#ebebeb] dark:border-[#262626] rounded-[8px] p-1.5 bg-[#fafafa] dark:bg-[#161616] space-y-1">
              {employees.map((emp) => {
                const isSelected = selectedEmployeeIds.includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => toggleEmployeeSelect(emp.id)}
                    className={`p-2 rounded-[6px] cursor-pointer flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-[#171717] text-white'
                        : 'hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                    }`}
                  >
                    <div>
                      <span className="font-medium text-xs">{emp.name}</span>
                      <span className={`caption-mono block text-[10px] ${isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>
                        {emp.position} (CC {emp.documentId})
                      </span>
                    </div>

                    <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center ${isSelected ? 'border-white bg-white/20' : 'border-neutral-300 dark:border-neutral-600'}`}>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Type of Overtime */}
          <div>
            <label className="caption-mono block text-neutral-700 dark:text-neutral-200 mb-1.5">
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
                    className={`p-2.5 rounded-[8px] border cursor-pointer transition ${
                      isSelected
                        ? 'border-[#171717] dark:border-white bg-[#171717] text-white dark:bg-white dark:text-[#171717]'
                        : 'border-[#ebebeb] dark:border-[#262626] bg-[#fafafa] dark:bg-[#161616] text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                    }`}
                  >
                    <div className="font-semibold text-xs">{typeObj.label}</div>
                    <div className={`text-[10px] mt-0.5 font-sans ${isSelected ? 'opacity-80' : 'text-neutral-400'}`}>
                      {typeObj.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="caption-mono block text-neutral-700 dark:text-neutral-200 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-neutral-400" />
              Observaciones / Motivo
            </label>
            <input
              type="text"
              placeholder="Ej. Despacho urgente, reparación de máquina, cierre de mes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-input w-full text-xs h-9 px-3 rounded-[6px]"
            />
          </div>

          {/* Manager Verification Checkbox */}
          <div className="p-3 bg-[#fafafa] dark:bg-[#161616] border border-[#ebebeb] dark:border-[#262626] rounded-[8px] flex items-center gap-2.5">
            <input
              type="checkbox"
              id="verifyNow"
              checked={verifiedByManager}
              onChange={(e) => setVerifiedByManager(e.target.checked)}
              className="w-4 h-4 accent-[#171717] rounded cursor-pointer"
            />
            <label htmlFor="verifyNow" className="text-xs text-neutral-800 dark:text-neutral-200 font-medium cursor-pointer font-sans">
              Marcar como revisado y verificado por el encargado inmediatamente
            </label>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ebebeb] dark:border-[#262626]">
            <button
              type="button"
              onClick={onClose}
              className="button-secondary px-4 py-2 rounded-full text-xs font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={selectedEmployeeIds.length === 0 || effectiveHours <= 0}
              className="button-primary px-5 py-2 rounded-full text-xs font-medium"
            >
              Guardar ({selectedEmployeeIds.length}) Registros ({formatHoursDisplay(effectiveHours)})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
