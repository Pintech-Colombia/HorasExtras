// Festivos de Colombia (Ley 51 de 1983 - "Ley Emiliani").
// Los festivos trasladables se mueven al lunes siguiente.

const pad = (n: number) => String(n).padStart(2, '0');
const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Domingo de Pascua (algoritmo anónimo gregoriano)
const easterSunday = (year: number): Date => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};

const addDays = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

const nextMonday = (d: Date) => {
  const offset = (8 - d.getDay()) % 7; // 0 si ya es lunes
  return addDays(d, offset);
};

const cache = new Map<number, Map<string, string>>();

export const getColombianHolidays = (year: number): Map<string, string> => {
  const cached = cache.get(year);
  if (cached) return cached;

  const holidays = new Map<string, string>();
  const add = (d: Date, name: string) => holidays.set(toKey(d), name);

  // Fijos
  add(new Date(year, 0, 1), 'Año Nuevo');
  add(new Date(year, 4, 1), 'Día del Trabajo');
  add(new Date(year, 6, 20), 'Día de la Independencia');
  add(new Date(year, 7, 7), 'Batalla de Boyacá');
  add(new Date(year, 11, 8), 'Inmaculada Concepción');
  add(new Date(year, 11, 25), 'Navidad');

  // Trasladables al lunes
  add(nextMonday(new Date(year, 0, 6)), 'Reyes Magos');
  add(nextMonday(new Date(year, 2, 19)), 'San José');
  add(nextMonday(new Date(year, 5, 29)), 'San Pedro y San Pablo');
  add(nextMonday(new Date(year, 7, 15)), 'Asunción de la Virgen');
  add(nextMonday(new Date(year, 9, 12)), 'Día de la Raza');
  add(nextMonday(new Date(year, 10, 1)), 'Todos los Santos');
  add(nextMonday(new Date(year, 10, 11)), 'Independencia de Cartagena');

  // Basados en Pascua
  const easter = easterSunday(year);
  add(addDays(easter, -3), 'Jueves Santo');
  add(addDays(easter, -2), 'Viernes Santo');
  add(addDays(easter, 43), 'Ascensión del Señor');
  add(addDays(easter, 64), 'Corpus Christi');
  add(addDays(easter, 71), 'Sagrado Corazón');

  cache.set(year, holidays);
  return holidays;
};

// Devuelve el nombre del festivo o null. dateStr en formato YYYY-MM-DD.
export const getHolidayName = (dateStr: string): string | null => {
  if (!dateStr) return null;
  const year = Number(dateStr.slice(0, 4));
  if (!year) return null;
  return getColombianHolidays(year).get(dateStr) || null;
};
