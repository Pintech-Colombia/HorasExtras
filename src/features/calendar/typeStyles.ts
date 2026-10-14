import { OvertimeType } from '@/types';

// Color de cada tipo de hora extra en el calendario (mismo color en PC, celular y leyenda).
// El ámbar queda reservado para "pendiente de aprobación".
export const TYPE_STYLES: Record<OvertimeType, { dot: string; chip: string; short: string }> = {
  diurna: {
    dot: 'bg-sky-500',
    chip: 'bg-sky-500/10 text-sky-800 dark:text-sky-200 border-sky-500/30',
    short: 'Diurna',
  },
  nocturna: {
    dot: 'bg-indigo-500',
    chip: 'bg-indigo-500/10 text-indigo-800 dark:text-indigo-200 border-indigo-500/30',
    short: 'Nocturna',
  },
  festiva_diurna: {
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-500/30',
    short: 'Festiva diurna',
  },
  festiva_nocturna: {
    dot: 'bg-rose-500',
    chip: 'bg-rose-500/10 text-rose-800 dark:text-rose-200 border-rose-500/30',
    short: 'Festiva nocturna',
  },
};
