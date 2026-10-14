// Lógica pura del calendario (sin React), con pruebas en calendarUtils.test.ts

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  day: number;
  inMonth: boolean; // false = día del mes anterior/siguiente que completa la semana
  weekday: number; // 0 = domingo ... 6 = sábado
}

const pad = (n: number) => String(n).padStart(2, '0');
export const toDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayKey = () => toDateKey(new Date());

// Semanas completas (lunes a domingo) que cubren el mes "YYYY-MM"
export function buildMonthWeeks(month: string): CalendarDay[][] {
  const [year, m] = month.split('-').map(Number);
  const first = new Date(year, m - 1, 1);
  const offset = (first.getDay() + 6) % 7; // lunes = 0
  const start = new Date(year, m - 1, 1 - offset);
  const daysInMonth = new Date(year, m, 0).getDate();
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;

  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    if (i % 7 === 0) weeks.push([]);
    weeks[weeks.length - 1].push({
      date: toDateKey(d),
      day: d.getDate(),
      inMonth: d.getMonth() === m - 1,
      weekday: d.getDay(),
    });
  }
  return weeks;
}

export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split('-').map(Number);
  const d = new Date(year, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function monthLabel(month: string): string {
  const [year, m] = month.split('-').map(Number);
  const label = new Date(year, m - 1, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function dayLabel(date: string): string {
  const [year, m, d] = date.split('-').map(Number);
  const label = new Date(year, m - 1, d).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// "Carlos Alberto Mendoza" -> "Carlos M."
export function shortName(full: string): string {
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] || '';
  const last = parts.length >= 3 ? parts[parts.length - 2] : parts[1];
  return `${parts[0]} ${last.charAt(0)}.`;
}
