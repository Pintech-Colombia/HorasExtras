// Formatos de fecha en español usados en toda la app

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// "2026-10-02" -> "Vie 2 oct"
export function formatShortDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return date;
  const weekday = new Date(y, m - 1, d).getDay();
  return `${WEEKDAYS[weekday]} ${d} ${MONTHS[m - 1]}`;
}
