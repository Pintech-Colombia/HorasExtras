import { Employee, OvertimeRecord, OvertimeRules, OvertimeType } from '@/types';
import {
  DAILY_OVERTIME_ALERT_HOURS,
  OvertimeSegment,
  formatHoursDisplay,
  getWorkScheduleForDate,
} from '@/lib/schedule';

export type NewRecord = Omit<OvertimeRecord, 'id' | 'createdAt'>;

// Un registro por empleado y por tramo (p. ej. 1 h diurna + 30 min nocturna = 2 registros)
export function buildOvertimeRecords(input: {
  date: string;
  employees: Employee[];
  selectedIds: string[];
  segments: OvertimeSegment[];
  notes: string;
  verifyNow: boolean;
  now?: Date;
}): NewRecord[] {
  const byId = new Map(input.employees.map((e) => [e.id, e]));
  const verifiedAt = input.verifyNow ? (input.now ?? new Date()).toISOString() : undefined;
  return input.selectedIds.flatMap((id) =>
    input.segments
      .filter((seg) => seg.hours > 0)
      .map((seg) => ({
        date: input.date,
        employeeId: id,
        employeeName: byId.get(id)?.name || 'Empleado',
        hours: seg.hours,
        type: seg.type,
        status: input.verifyNow ? ('verified_manager' as const) : ('pending_review' as const),
        notes: input.notes,
        verifiedByManager: input.verifyNow,
        verifiedAt,
      }))
  );
}

// Avisos que no bloquean: fecha futura, registro repetido y más de 2 h extra en día ordinario
export function getRegistrationWarnings(input: {
  date: string;
  today: string;
  hours: number;
  employees: Employee[];
  selectedIds: string[];
  existingRecords: Pick<OvertimeRecord, 'employeeId' | 'date' | 'hours'>[];
  rules: OvertimeRules;
}): string[] {
  const warnings: string[] = [];
  if (!input.date || input.hours <= 0) return warnings;
  if (input.date > input.today) warnings.push('La fecha es futura. Revisa que sea correcta.');
  const hasShift = getWorkScheduleForDate(input.date, input.rules).hasOrdinaryShift;
  const byId = new Map(input.employees.map((e) => [e.id, e]));
  input.selectedIds.forEach((id) => {
    const name = byId.get(id)?.name || 'Empleado';
    const prev = input.existingRecords
      .filter((r) => r.employeeId === id && r.date === input.date)
      .reduce((s, r) => s + r.hours, 0);
    if (prev > 0)
      warnings.push(`${name} ya tiene ${formatHoursDisplay(prev)} registradas este día. ¿Es un registro repetido?`);
    const total = prev + input.hours;
    if (hasShift && total > DAILY_OVERTIME_ALERT_HOURS) {
      warnings.push(
        `${name} sumaría ${formatHoursDisplay(total)} extra este día (límite habitual: ${DAILY_OVERTIME_ALERT_HOURS} h).`
      );
    }
  });
  return warnings;
}

// Tipo equivalente en otra fecha: se conserva diurna/nocturna y se ajusta si el día destino es domingo o festivo
export function typeForDate(type: OvertimeType, date: string, rules: OvertimeRules): OvertimeType {
  const night = type === 'nocturna' || type === 'festiva_nocturna';
  const holiday = getWorkScheduleForDate(date, rules).isHoliday;
  if (holiday) return night ? 'festiva_nocturna' : 'festiva_diurna';
  return night ? 'nocturna' : 'diurna';
}

// Copia registros a otra fecha: misma persona, horas y observación; tipo recalculado.
// Las copias quedan pendientes salvo que la Jefa marque "Aprobar de una vez".
export function buildCopies(input: {
  records: OvertimeRecord[];
  targetDate: string;
  rules: OvertimeRules;
  verifyNow: boolean;
  now?: Date;
}): NewRecord[] {
  const verifiedAt = input.verifyNow ? (input.now ?? new Date()).toISOString() : undefined;
  return input.records.map((r) => ({
    date: input.targetDate,
    employeeId: r.employeeId,
    employeeName: r.employeeName,
    hours: r.hours,
    type: typeForDate(r.type, input.targetDate, input.rules),
    status: input.verifyNow ? ('verified_manager' as const) : ('pending_review' as const),
    notes: r.notes,
    verifiedByManager: input.verifyNow,
    verifiedAt,
  }));
}
