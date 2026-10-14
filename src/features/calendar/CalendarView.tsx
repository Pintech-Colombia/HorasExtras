import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Employee, OvertimeRecord, OvertimeRules, OvertimeType, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { formatHoursDisplay, formatTime12h } from '@/lib/schedule';
import { cn } from '@/lib/utils';
import { buildMonthWeeks, dayLabel, monthLabel, shiftMonth, todayKey } from './calendarUtils';
import { DayRecords } from './DayRecords';
import { MobileMonth } from './MobileMonth';
import { MonthGrid } from './MonthGrid';
import { TYPE_STYLES } from './typeStyles';

interface CalendarViewProps {
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (m: string) => void;
  records: OvertimeRecord[];
  employees: Employee[];
  userRole?: UserRole | null;
  onAddForDate: (dateStr: string) => void;
  onDeleteRecord: (id: string) => void;
  onToggleVerifyRecord: (id: string) => void;
  currentUserId?: string;
  rules: OvertimeRules;
  canRegister: boolean;
}

const DAY_SHORT: Record<string, string> = { '1': 'Lun', '2': 'Mar', '3': 'Mié', '4': 'Jue', '5': 'Vie', '6': 'Sáb' };

// Resumen de la jornada según Configuración, p. ej. "Lun–Vie 7:30 AM – 5:00 PM · Mié 4:30 PM"
function scheduleSummary(rules: OvertimeRules): string {
  const groups: { days: string[]; end: string | null }[] = [];
  ['1', '2', '3', '4', '5', '6'].forEach((d) => {
    const end = rules.shiftEnds[d] || null;
    const g = groups.find((x) => x.end === end);
    if (g) g.days.push(DAY_SHORT[d]);
    else groups.push({ days: [DAY_SHORT[d]], end });
  });
  const working = groups
    .filter((g) => g.end)
    .map((g) => `${g.days.join(', ')}: ${formatTime12h(rules.shiftStart)} – ${formatTime12h(g.end)}`);
  return `${working.join(' · ')} · Domingos y festivos: todo es extra`;
}

export function CalendarView({
  selectedMonth,
  setSelectedMonth,
  records,
  employees,
  userRole,
  onAddForDate,
  onDeleteRecord,
  onToggleVerifyRecord,
  currentUserId,
  rules,
  canRegister,
}: CalendarViewProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const canApprove = userRole === 'manager' || userRole === 'admin';
  // Jefa/Admin borran cualquier registro; el supervisor solo sus propios registros pendientes
  const canDelete = (rec: OvertimeRecord) =>
    userRole === 'manager' ||
    userRole === 'admin' ||
    (userRole === 'supervisor' && !rec.verifiedByManager && (!rec.createdBy || rec.createdBy === currentUserId));

  const weeks = useMemo(() => buildMonthWeeks(selectedMonth), [selectedMonth]);

  const filtered = records.filter(
    (r) => r.date.startsWith(selectedMonth) && (employeeFilter === 'all' || r.employeeId === employeeFilter)
  );
  const recordsByDate = useMemo(() => {
    const map = new Map<string, OvertimeRecord[]>();
    filtered.forEach((r) => map.set(r.date, [...(map.get(r.date) || []), r]));
    return map;
  }, [filtered]);

  const monthTotal = filtered.reduce((s, r) => s + r.hours, 0);
  const pendingCount = filtered.filter((r) => !r.verifiedByManager).length;

  // En celular siempre hay un día elegido (hoy si es este mes; si no, el día 1)
  const today = todayKey();
  const activeDate =
    selectedDate && selectedDate.startsWith(selectedMonth)
      ? selectedDate
      : today.startsWith(selectedMonth)
        ? today
        : `${selectedMonth}-01`;

  const selectDay = (date: string) => {
    setSelectedDate(date);
    if (isDesktop) setSheetOpen(true);
  };

  const goToMonth = (month: string) => {
    setSelectedMonth(month);
    setSelectedDate(null);
  };

  const dayRecords = recordsByDate.get(activeDate) || [];
  const dayRecordsProps = {
    date: activeDate,
    records: dayRecords,
    rules,
    canRegister,
    canApprove,
    canDelete,
    onAdd: onAddForDate,
    onToggleVerify: onToggleVerifyRecord,
    onDelete: onDeleteRecord,
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Encabezado: mes, navegación, filtro y leyenda */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-vercel-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm" onClick={() => goToMonth(shiftMonth(selectedMonth, -1))} aria-label="Mes anterior">
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => goToMonth(shiftMonth(selectedMonth, 1))} aria-label="Mes siguiente">
              <ChevronRight />
            </Button>
            <h2 className="ml-1 text-lg font-semibold sm:text-xl">{monthLabel(selectedMonth)}</h2>
            {!today.startsWith(selectedMonth) && (
              <Button variant="ghost" size="sm" onClick={() => goToMonth(today.slice(0, 7))}>
                Hoy
              </Button>
            )}
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <NativeSelect
              aria-label="Filtrar por empleado"
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              wrapperClassName="flex-1 sm:w-56 sm:flex-none"
              className="text-sm"
            >
              <option value="all">Todos los empleados</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {(Object.keys(TYPE_STYLES) as OvertimeType[]).map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className={cn('size-2 rounded-full', TYPE_STYLES[t].dot)} />
                {TYPE_STYLES[t].short}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded-full bg-warning" /> Pendiente de aprobar
            </span>
          </div>
          <span>
            <strong className="text-foreground">{formatHoursDisplay(monthTotal)}</strong> en el mes
            {pendingCount > 0 && <> · {pendingCount} pendiente(s)</>}
          </span>
        </div>
        <p className="hidden text-xs text-muted-foreground md:block">{scheduleSummary(rules)}</p>
      </div>

      {isDesktop ? (
        <>
          <MonthGrid weeks={weeks} recordsByDate={recordsByDate} selectedDate={sheetOpen ? selectedDate : null} onSelectDay={selectDay} />
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>{dayLabel(activeDate)}</SheetTitle>
                <SheetDescription>Horas extras registradas</SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-5">
                <DayRecords {...dayRecordsProps} />
              </div>
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <>
          <MobileMonth weeks={weeks} recordsByDate={recordsByDate} selectedDate={activeDate} onSelectDay={selectDay} />
          <section className={cn('flex flex-col gap-2', canRegister && 'pb-20')}>
            <h3 className="text-base font-semibold">{dayLabel(activeDate)}</h3>
            <DayRecords {...dayRecordsProps} />
          </section>
          {canRegister && (
            <Button
              size="lg"
              className="fixed bottom-5 right-5 z-30 h-14 rounded-full px-5 shadow-vercel-float"
              onClick={() => onAddForDate(activeDate)}
            >
              <Plus className="size-5" /> Registrar
            </Button>
          )}
        </>
      )}
    </div>
  );
}
