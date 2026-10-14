import { OvertimeRules, OvertimeType, DEFAULT_OVERTIME_RULES } from '@/types';
import { getHolidayName } from '@/lib/holidays';

export interface ScheduleInfo {
  dayName: string;
  hasOrdinaryShift: boolean; // false = no hay jornada ordinaria (todo lo laborado es extra)
  isHoliday: boolean; // true = aplica recargo dominical/festivo
  holidayName: string | null;
  shiftStart: string;
  shiftEnd: string;
  overtimeStartsAt: string;
  notes: string;
}

export interface OvertimeSegment {
  type: OvertimeType;
  hours: number;
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const roundHours = (h: number) => Math.round(h * 100) / 100;

export const parseTimeToMinutes = (timeStr: string | null | undefined): number | null => {
  if (!timeStr) return null;
  const parts = timeStr.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return parts[0] * 60 + parts[1];
};

export const formatTime12h = (timeStr: string | null | undefined): string => {
  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return 'N/A';
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
};

const getDayOfWeek = (dateStr: string): number => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).getDay(); // 0 = domingo
};

export const getWorkScheduleForDate = (
  dateStr: string,
  rules: OvertimeRules = DEFAULT_OVERTIME_RULES
): ScheduleInfo => {
  if (!dateStr) {
    return {
      dayName: '',
      hasOrdinaryShift: true,
      isHoliday: false,
      holidayName: null,
      shiftStart: formatTime12h(rules.shiftStart),
      shiftEnd: formatTime12h(rules.shiftEnds['1']),
      overtimeStartsAt: formatTime12h(rules.shiftEnds['1']),
      notes: 'Jornada ordinaria habitual',
    };
  }

  const dayOfWeek = getDayOfWeek(dateStr);
  const dayName = DAY_NAMES[dayOfWeek];
  const holidayName = getHolidayName(dateStr);
  const isSunday = dayOfWeek === 0;
  const isSaturdayHoliday = dayOfWeek === 6 && rules.saturdayAsHoliday;
  const isHoliday = Boolean(holidayName) || isSunday || isSaturdayHoliday;
  const shiftEnd = isHoliday ? null : rules.shiftEnds[String(dayOfWeek)] ?? null;

  if (isHoliday) {
    const reason = holidayName ? `Festivo: ${holidayName}` : isSunday ? 'Dominical' : 'Sábado pagado como festivo';
    return {
      dayName,
      hasOrdinaryShift: false,
      isHoliday: true,
      holidayName,
      shiftStart: 'N/A',
      shiftEnd: 'N/A',
      overtimeStartsAt: 'Todo el día',
      notes: `${reason}. Todas las horas laboradas llevan recargo dominical/festivo.`,
    };
  }

  if (!shiftEnd) {
    return {
      dayName,
      hasOrdinaryShift: false,
      isHoliday: false,
      holidayName: null,
      shiftStart: 'N/A',
      shiftEnd: 'N/A',
      overtimeStartsAt: 'Todo el día',
      notes: 'Sin jornada ordinaria este día. Todas las horas laboradas son extras (diurnas o nocturnas, sin recargo festivo).',
    };
  }

  return {
    dayName,
    hasOrdinaryShift: true,
    isHoliday: false,
    holidayName: null,
    shiftStart: formatTime12h(rules.shiftStart),
    shiftEnd: formatTime12h(shiftEnd),
    overtimeStartsAt: formatTime12h(shiftEnd),
    notes: `Jornada ordinaria (${formatTime12h(rules.shiftStart)} - ${formatTime12h(shiftEnd)}). Horas extras inician a las ${formatTime12h(shiftEnd)}.`,
  };
};

// Tipo sugerido cuando se ingresan horas directamente (sin hora de salida)
export const suggestOvertimeType = (dateStr: string, rules: OvertimeRules = DEFAULT_OVERTIME_RULES): OvertimeType => {
  return getWorkScheduleForDate(dateStr, rules).isHoliday ? 'festiva_diurna' : 'diurna';
};

const overlap = (a1: number, a2: number, b1: number, b2: number) => Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));

// Minutos nocturnos dentro del intervalo [from, to] (to puede pasar de medianoche: > 1440)
const nightMinutesInRange = (from: number, to: number, nightStart: number, nightEnd: number): number => {
  let total = 0;
  // Ventanas nocturnas que tocan el día anterior, el día actual y el siguiente
  for (let dayOffset = -1440; dayOffset <= 1440; dayOffset += 1440) {
    total += overlap(from, to, nightStart + dayOffset, 1440 + nightEnd + dayOffset);
  }
  return total;
};

export const calculateOvertimeFromDeparture = (
  dateStr: string,
  departureTimeStr: string,
  startTimeStr: string,
  rules: OvertimeRules = DEFAULT_OVERTIME_RULES
): { hours: number; breakdown: string; segments: OvertimeSegment[] } => {
  const depMinsRaw = parseTimeToMinutes(departureTimeStr);
  if (depMinsRaw === null) {
    return { hours: 0, breakdown: 'Selecciona una hora de salida válida.', segments: [] };
  }

  const schedule = getWorkScheduleForDate(dateStr, rules);
  const dayOfWeek = dateStr ? getDayOfWeek(dateStr) : 1;
  const shiftEndMins = schedule.hasOrdinaryShift ? parseTimeToMinutes(rules.shiftEnds[String(dayOfWeek)]) : null;

  let from: number;
  if (shiftEndMins !== null) {
    from = shiftEndMins;
  } else {
    from = parseTimeToMinutes(startTimeStr) ?? parseTimeToMinutes(rules.shiftStart) ?? 450;
  }

  // Una salida de madrugada (antes del fin de la jornada nocturna) se toma como del día siguiente
  let to = depMinsRaw;
  if (to < from && depMinsRaw <= (parseTimeToMinutes(rules.nightEnd) ?? 360)) {
    to += 1440;
  }

  const totalMins = Math.max(0, to - from);
  if (totalMins <= 0) {
    return {
      hours: 0,
      breakdown: `La hora de salida (${formatTime12h(departureTimeStr)}) no supera la hora oficial de salida (${schedule.shiftEnd}).`,
      segments: [],
    };
  }

  const nightStart = parseTimeToMinutes(rules.nightStart) ?? 19 * 60;
  const nightEnd = parseTimeToMinutes(rules.nightEnd) ?? 6 * 60;
  const nightMins = nightMinutesInRange(from, to, nightStart, nightEnd);
  const dayMins = totalMins - nightMins;

  const dayType: OvertimeType = schedule.isHoliday ? 'festiva_diurna' : 'diurna';
  const nightType: OvertimeType = schedule.isHoliday ? 'festiva_nocturna' : 'nocturna';

  const segments: OvertimeSegment[] = [];
  if (dayMins > 0) segments.push({ type: dayType, hours: roundHours(dayMins / 60) });
  if (nightMins > 0) segments.push({ type: nightType, hours: roundHours(nightMins / 60) });

  const hours = segments.reduce((acc, s) => acc + s.hours, 0);
  const label = (t: OvertimeType) =>
    t === 'diurna' ? 'diurnas' : t === 'nocturna' ? 'nocturnas' : t === 'festiva_diurna' ? 'festivas diurnas' : 'festivas nocturnas';
  const detail = segments.map((s) => `${formatHoursDisplay(s.hours)} ${label(s.type)}`).join(' + ');

  const range = shiftEndMins !== null
    ? `Salida ordinaria ${schedule.shiftEnd} → salida real ${formatTime12h(departureTimeStr)}`
    : `Ingreso ${formatTime12h(startTimeStr)} → salida ${formatTime12h(departureTimeStr)}`;

  return { hours: roundHours(hours), breakdown: `${range}: ${detail}`, segments };
};

export const formatHoursDisplay = (hours: number): string => {
  if (hours % 1 === 0) {
    return `${hours}h`;
  }
  const whole = Math.floor(hours);
  const minutes = Math.round((hours % 1) * 60);
  if (whole === 0) {
    return `${minutes}m`;
  }
  return `${whole}h ${minutes}m`;
};

// Límite habitual de horas extra por día ordinario (se usa solo como alerta, no bloquea)
export const DAILY_OVERTIME_ALERT_HOURS = 2;

// Devuelve "empleado|fecha" -> total de horas, solo para los días ordinarios que superan el límite
export const getDailyOvertimeAlerts = (
  records: { employeeId: string; date: string; hours: number }[],
  rules: OvertimeRules = DEFAULT_OVERTIME_RULES
): Map<string, number> => {
  const totals = new Map<string, number>();
  records.forEach((r) => {
    const key = `${r.employeeId}|${r.date}`;
    totals.set(key, (totals.get(key) || 0) + r.hours);
  });
  const alerts = new Map<string, number>();
  totals.forEach((total, key) => {
    const date = key.split('|')[1];
    if (total > DAILY_OVERTIME_ALERT_HOURS && getWorkScheduleForDate(date, rules).hasOrdinaryShift) {
      alerts.set(key, roundHours(total));
    }
  });
  return alerts;
};
