export interface ScheduleInfo {
  dayName: string;
  isWeekend: boolean;
  shiftStart: string;
  shiftEnd: string;
  overtimeStartsAt: string;
  notes: string;
}

export const getWorkScheduleForDate = (dateStr: string): ScheduleInfo => {
  if (!dateStr) {
    return {
      dayName: '',
      isWeekend: false,
      shiftStart: '7:30 AM',
      shiftEnd: '5:00 PM',
      overtimeStartsAt: '5:00 PM',
      notes: 'Jornada ordinaria habitual',
    };
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat

  switch (dayOfWeek) {
    case 1: // Monday
    case 2: // Tuesday
    case 4: // Thursday
    case 5: // Friday
      return {
        dayName: dayOfWeek === 1 ? 'Lunes' : dayOfWeek === 2 ? 'Martes' : dayOfWeek === 4 ? 'Jueves' : 'Viernes',
        isWeekend: false,
        shiftStart: '7:30 AM',
        shiftEnd: '5:00 PM',
        overtimeStartsAt: '5:00 PM',
        notes: 'Jornada ordinaria (7:30 AM - 5:00 PM). Horas extras inician a las 5:00 PM.',
      };
    case 3: // Wednesday
      return {
        dayName: 'Miércoles',
        isWeekend: false,
        shiftStart: '7:30 AM',
        shiftEnd: '4:30 PM',
        overtimeStartsAt: '4:30 PM',
        notes: 'Jornada corta (7:30 AM - 4:30 PM). Horas extras inician a las 4:30 PM.',
      };
    case 6: // Saturday
      return {
        dayName: 'Sábado',
        isWeekend: true,
        shiftStart: 'N/A',
        shiftEnd: 'N/A',
        overtimeStartsAt: 'Todo el día',
        notes: 'Día no laboral ordinario. Todas las horas laboradas se consideran extras.',
      };
    case 0: // Sunday
    default:
      return {
        dayName: 'Domingo',
        isWeekend: true,
        shiftStart: 'N/A',
        shiftEnd: 'N/A',
        overtimeStartsAt: 'Todo el día',
        notes: 'Día dominical/festivo. Aplica recargo festivo.',
      };
  }
};

export const getShiftEndMinutes = (dateStr: string): number | null => {
  if (!dateStr) return 17 * 60; // 5:00 PM
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay();

  if (dayOfWeek === 0 || dayOfWeek === 6) return null; // Weekend
  if (dayOfWeek === 3) return 16 * 60 + 30; // 4:30 PM = 990 mins
  return 17 * 60; // 5:00 PM = 1020 mins
};

export const parseTimeToMinutes = (timeStr: string): number | null => {
  if (!timeStr) return null;
  const parts = timeStr.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return parts[0] * 60 + parts[1];
};

export const calculateOvertimeFromDeparture = (
  dateStr: string,
  departureTimeStr: string,
  startTimeStr: string = '07:30'
): { hours: number; breakdown: string } => {
  const depMins = parseTimeToMinutes(departureTimeStr);
  if (depMins === null) {
    return { hours: 0, breakdown: 'Selecciona una hora de salida válida.' };
  }

  const shiftEndMins = getShiftEndMinutes(dateStr);

  if (shiftEndMins === null) {
    // Weekend - calculate total time from start to departure
    const startMins = parseTimeToMinutes(startTimeStr) ?? (7 * 60 + 30);
    const diffMins = Math.max(0, depMins - startMins);
    const hours = Math.round((diffMins / 60) * 10) / 10;
    return {
      hours,
      breakdown: `Fin de semana: Ingreso ${startTimeStr} a Salida ${departureTimeStr} = ${formatHoursDisplay(hours)}`,
    };
  }

  // Weekday calculation relative to shift end
  const diffMins = Math.max(0, depMins - shiftEndMins);
  const hours = Math.round((diffMins / 60) * 10) / 10;

  const schedule = getWorkScheduleForDate(dateStr);
  if (diffMins <= 0) {
    return {
      hours: 0,
      breakdown: `La hora de salida (${departureTimeStr}) no supera la hora oficial de salida (${schedule.shiftEnd}).`,
    };
  }

  return {
    hours,
    breakdown: `Salida ordinaria (${schedule.shiftEnd}) vs Salida real (${departureTimeStr}) = ${formatHoursDisplay(hours)} extras`,
  };
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
  return `${whole}h ${minutes}m (${hours}h)`;
};
