import { OvertimeRecord, OvertimeType } from '@/types';
import { getHolidayName } from '@/lib/holidays';
import { cn } from '@/lib/utils';
import { CalendarDay, todayKey } from './calendarUtils';
import { TYPE_STYLES } from './typeStyles';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

interface MobileMonthProps {
  weeks: CalendarDay[][];
  recordsByDate: Map<string, OvertimeRecord[]>;
  selectedDate: string | null;
  onSelectDay: (date: string) => void;
}

// Mes compacto para celular: números grandes y puntos de color; el detalle va debajo
export function MobileMonth({ weeks, recordsByDate, selectedDate, onSelectDay }: MobileMonthProps) {
  const today = todayKey();

  return (
    <div className="rounded-xl border bg-card p-3 shadow-vercel-card">
      <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium text-muted-foreground">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="py-1">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {weeks.flat().map((day) => {
          const dayRecords = day.inMonth ? recordsByDate.get(day.date) || [] : [];
          const types = Array.from(new Set(dayRecords.map((r) => r.type))) as OvertimeType[];
          const hasPending = dayRecords.some((r) => !r.verifiedByManager);
          const isRestDay = day.weekday === 0 || Boolean(getHolidayName(day.date));
          const isToday = day.date === today;
          const isSelected = day.date === selectedDate;

          return (
            <button
              key={day.date}
              type="button"
              disabled={!day.inMonth}
              onClick={() => onSelectDay(day.date)}
              className="flex h-12 flex-col items-center justify-start gap-1 rounded-lg pt-1 outline-none disabled:opacity-30"
              aria-label={`${day.date}${dayRecords.length ? `, ${dayRecords.length} registro(s)` : ''}`}
            >
              <span
                className={cn(
                  'flex size-8 items-center justify-center rounded-full text-sm',
                  isRestDay && !isSelected && 'text-muted-foreground',
                  isToday && !isSelected && 'font-semibold text-foreground ring-1 ring-primary',
                  isSelected && 'bg-primary font-semibold text-primary-foreground',
                  hasPending && !isSelected && 'underline decoration-warning decoration-2 underline-offset-4'
                )}
              >
                {day.day}
              </span>
              <span className="flex h-1.5 items-center gap-0.5">
                {types.slice(0, 3).map((t) => (
                  <span key={t} className={cn('size-1.5 rounded-full', TYPE_STYLES[t].dot)} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
