import { OvertimeRecord } from '@/types';
import { getHolidayName } from '@/lib/holidays';
import { formatHoursDisplay } from '@/lib/schedule';
import { cn } from '@/lib/utils';
import { CalendarDay, shortName, todayKey } from './calendarUtils';
import { TYPE_STYLES } from './typeStyles';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MAX_CHIPS = 3;

interface MonthGridProps {
  weeks: CalendarDay[][];
  recordsByDate: Map<string, OvertimeRecord[]>;
  selectedDate: string | null;
  onSelectDay: (date: string) => void;
}

// Calendario mensual grande (PC/tablet): cada día muestra quién trabajó horas extra y cuántas
export function MonthGrid({ weeks, recordsByDate, selectedDate, onSelectDay }: MonthGridProps) {
  const today = todayKey();

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-vercel-card">
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-3 py-2 text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {weeks.flat().map((day, i) => {
          const dayRecords = day.inMonth ? recordsByDate.get(day.date) || [] : [];
          const holiday = getHolidayName(day.date);
          const isRestDay = day.weekday === 0 || Boolean(holiday);
          const total = dayRecords.reduce((s, r) => s + r.hours, 0);
          const pending = dayRecords.filter((r) => !r.verifiedByManager).length;
          const isToday = day.date === today;
          const isSelected = day.date === selectedDate;

          return (
            <button
              key={day.date}
              type="button"
              disabled={!day.inMonth}
              onClick={() => onSelectDay(day.date)}
              className={cn(
                'group flex min-h-32 flex-col gap-1 border-b border-r p-2 text-left transition-colors outline-none',
                i % 7 === 6 && 'border-r-0',
                !day.inMonth && 'bg-muted/30 text-muted-foreground/40',
                day.inMonth && 'hover:bg-accent/60 focus-visible:bg-accent/60',
                day.inMonth && isRestDay && 'bg-muted/40',
                isSelected && 'bg-accent ring-2 ring-inset ring-primary/40'
              )}
            >
              <div className="flex items-start justify-between gap-1">
                <span
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full text-sm',
                    isToday && 'bg-primary font-semibold text-primary-foreground',
                    !isToday && isRestDay && day.inMonth && 'text-muted-foreground'
                  )}
                >
                  {day.day}
                </span>
                {total > 0 && (
                  <span className="flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[11px] font-semibold">
                    {pending > 0 && <span className="size-1.5 rounded-full bg-warning" title={`${pending} pendiente(s)`} />}
                    {formatHoursDisplay(total)}
                  </span>
                )}
              </div>

              {holiday && day.inMonth && <span className="truncate text-[10px] font-medium text-warning">{holiday}</span>}

              <div className="flex flex-col gap-1">
                {dayRecords.slice(0, MAX_CHIPS).map((rec) => (
                  <span
                    key={rec.id}
                    className={cn(
                      'flex items-center gap-1 truncate rounded border px-1.5 py-0.5 text-[11px] leading-tight',
                      TYPE_STYLES[rec.type].chip,
                      !rec.verifiedByManager && 'border-dashed border-warning'
                    )}
                    title={`${rec.employeeName} · ${formatHoursDisplay(rec.hours)}${rec.verifiedByManager ? '' : ' · pendiente'}`}
                  >
                    <span className="truncate">{shortName(rec.employeeName)}</span>
                    <span className="ml-auto shrink-0 font-mono">{formatHoursDisplay(rec.hours)}</span>
                  </span>
                ))}
                {dayRecords.length > MAX_CHIPS && (
                  <span className="px-1 text-[11px] font-medium text-muted-foreground">
                    +{dayRecords.length - MAX_CHIPS} más
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
