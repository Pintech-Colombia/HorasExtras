import { useMemo, useState } from 'react';
import { ArrowRight, CheckCheck, Search } from 'lucide-react';
import { CompanySettings, Employee, OvertimeRecord, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/ui/confirm';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { monthLabel } from '@/features/calendar/calendarUtils';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { formatShortDate } from '@/lib/dates';
import { calculateRecordCost, formatCurrency } from '@/lib/exporters';
import { formatHoursDisplay, getDailyOvertimeAlerts } from '@/lib/schedule';
import { cn } from '@/lib/utils';
import { EditRecordDialog } from './EditRecordDialog';
import { ReviewCard } from './ReviewCard';
import { ReviewActions, ReviewItem } from './reviewItem';
import { ReviewTable } from './ReviewTable';

interface ManagerReviewViewProps {
  records: OvertimeRecord[];
  employees: Employee[];
  settings: CompanySettings;
  selectedMonth: string; // YYYY-MM
  userRole?: UserRole | null;
  onToggleVerify: (id: string) => void;
  onVerifyAllMonth: () => void;
  onDeleteRecord: (id: string) => void;
  onUpdateRecord: (id: string, updated: Partial<OvertimeRecord>) => void;
  onGoToGmailReport: () => void;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'sent';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'approved', label: 'Aprobados' },
  { key: 'sent', label: 'Enviados' },
];

const matchesStatus = (r: OvertimeRecord, f: StatusFilter) =>
  f === 'all' ||
  (f === 'pending' && !r.verifiedByManager) ||
  (f === 'approved' && r.verifiedByManager && r.status !== 'sent_accountant') ||
  (f === 'sent' && r.status === 'sent_accountant');

export function ManagerReviewView({
  records,
  employees,
  settings,
  selectedMonth,
  userRole,
  onToggleVerify,
  onVerifyAllMonth,
  onDeleteRecord,
  onUpdateRecord,
  onGoToGmailReport,
}: ManagerReviewViewProps) {
  const confirm = useConfirm();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const canSeeMoney = userRole === 'manager' || userRole === 'accountant' || userRole === 'admin';
  const canEdit = userRole === 'manager' || userRole === 'admin'; // solo la Jefa (y el Admin) aprueban y corrigen

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [editing, setEditing] = useState<OvertimeRecord | null>(null);

  const employeesMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const monthRecords = useMemo(
    () => records.filter((r) => r.date.startsWith(selectedMonth)).sort((a, b) => a.date.localeCompare(b.date)),
    [records, selectedMonth]
  );
  const dailyAlerts = useMemo(
    () => getDailyOvertimeAlerts(monthRecords, settings.overtimeRules),
    [monthRecords, settings.overtimeRules]
  );

  const pending = monthRecords.filter((r) => !r.verifiedByManager);
  const totalHours = monthRecords.reduce((s, r) => s + r.hours, 0);
  const approvedHours = monthRecords.filter((r) => r.verifiedByManager).reduce((s, r) => s + r.hours, 0);
  const totalValue = monthRecords.reduce((s, r) => s + calculateRecordCost(r, employeesMap), 0);

  const term = search.trim().toLowerCase();
  const items: ReviewItem[] = monthRecords
    .filter((r) => matchesStatus(r, statusFilter))
    .filter((r) => employeeFilter === 'all' || r.employeeId === employeeFilter)
    .filter(
      (r) =>
        !term ||
        r.employeeName.toLowerCase().includes(term) ||
        (r.notes || '').toLowerCase().includes(term) ||
        formatShortDate(r.date).toLowerCase().includes(term)
    )
    .map((r) => ({
      record: r,
      employee: employeesMap.get(r.employeeId),
      cost: canSeeMoney ? calculateRecordCost(r, employeesMap) : null,
      dayAlert: dailyAlerts.get(`${r.employeeId}|${r.date}`),
      locked: r.status === 'sent_accountant' && userRole !== 'admin',
    }));

  const counts: Record<StatusFilter, number> = {
    all: monthRecords.length,
    pending: pending.length,
    approved: monthRecords.filter((r) => matchesStatus(r, 'approved')).length,
    sent: monthRecords.filter((r) => matchesStatus(r, 'sent')).length,
  };

  const actions: ReviewActions = {
    canEdit,
    currencySymbol: settings.currencySymbol,
    onToggleVerify,
    onEdit: setEditing,
    onDelete: async (rec) => {
      const ok = await confirm({
        title: `¿Eliminar el registro de ${rec.employeeName}?`,
        description: `${formatHoursDisplay(rec.hours)} el ${formatShortDate(rec.date)}.`,
        confirmText: 'Eliminar',
        destructive: true,
      });
      if (ok) onDeleteRecord(rec.id);
    },
  };

  const approveAll = async () => {
    const ok = await confirm({
      title: `¿Aprobar ${pending.length} registro(s) pendientes?`,
      description: `Se aprueban todas las horas pendientes de ${monthLabel(selectedMonth)}.`,
      confirmText: 'Aprobar todos',
    });
    if (ok) onVerifyAllMonth();
  };

  const stats = [
    { label: 'Horas del mes', value: formatHoursDisplay(totalHours) },
    { label: 'Aprobadas', value: formatHoursDisplay(approvedHours) },
    { label: 'Pendientes', value: `${pending.length} reg.`, highlight: pending.length > 0 },
    ...(canSeeMoney ? [{ label: 'Valor estimado', value: formatCurrency(totalValue, settings.currencySymbol) }] : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Encabezado: resumen del mes y acciones principales */}
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-vercel-card sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold sm:text-xl">Auditoría · {monthLabel(selectedMonth)}</h2>
            <p className="text-sm text-muted-foreground">
              {canEdit
                ? 'Revisa y aprueba las horas antes de enviarlas a contabilidad.'
                : `Horas registradas y su estado de aprobación por ${settings.managerName || 'la Jefa'}.`}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {canEdit && pending.length > 0 && (
              <Button className="flex-1 sm:flex-none" onClick={approveAll}>
                <CheckCheck /> Aprobar pendientes ({pending.length})
              </Button>
            )}
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={onGoToGmailReport}>
              Ir al reporte <ArrowRight />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border bg-muted/40 px-3 py-2.5">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={cn('mt-0.5 font-mono text-base font-semibold sm:text-lg', s.highlight && 'text-warning')}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Filtros */}
      <section className="flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-vercel-subtle lg:flex-row lg:items-center">
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar empleado, fecha o nota"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                'whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                statusFilter === f.key ? 'bg-card text-foreground shadow-vercel-subtle' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>
        <NativeSelect
          aria-label="Filtrar por empleado"
          value={employeeFilter}
          onChange={(e) => setEmployeeFilter(e.target.value)}
          wrapperClassName="lg:ml-auto lg:w-60"
        >
          <option value="all">Todos los empleados</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </NativeSelect>
      </section>

      {/* Registros */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card px-4 py-12 text-center text-sm text-muted-foreground">
          {monthRecords.length === 0
            ? `No hay horas extras registradas en ${monthLabel(selectedMonth)}.`
            : 'Ningún registro coincide con los filtros.'}
        </div>
      ) : isDesktop ? (
        <ReviewTable items={items} actions={actions} />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <ReviewCard key={item.record.id} item={item} actions={actions} />
          ))}
        </div>
      )}

      <EditRecordDialog record={editing} onClose={() => setEditing(null)} onSave={onUpdateRecord} />
    </div>
  );
}
