import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCheck, Copy, List, Search, Trash2, Users, X } from 'lucide-react';
import { CompanySettings, Employee, OvertimeRecord, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/ui/confirm';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { monthLabel } from '@/features/calendar/calendarUtils';
import { TYPE_STYLES } from '@/features/calendar/typeStyles';
import { NewRecord } from '@/features/records/buildRecords';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { formatShortDate } from '@/lib/dates';
import { calculateRecordCost, formatCurrency } from '@/lib/exporters';
import { formatHoursDisplay, getDailyOvertimeAlerts } from '@/lib/schedule';
import { cn } from '@/lib/utils';
import { CopyRecordsDialog } from './CopyRecordsDialog';
import { EditRecordDialog } from './EditRecordDialog';
import { EmployeeSummaryView } from './EmployeeSummaryView';
import { ReviewCard } from './ReviewCard';
import { ReviewActions, ReviewItem, ReviewSelection } from './reviewItem';
import { ReviewTable } from './ReviewTable';
import { OVERTIME_TYPE_ORDER, summarizeByEmployee, summarizeRecords } from './summary';

interface ManagerReviewViewProps {
  records: OvertimeRecord[];
  employees: Employee[];
  settings: CompanySettings;
  selectedMonth: string; // YYYY-MM
  userRole?: UserRole | null;
  onToggleVerify: (id: string) => void;
  onVerifyAllMonth: () => void;
  onDeleteRecord: (id: string) => void;
  onDeleteRecords: (ids: string[]) => Promise<boolean>;
  onCopyRecords: (copies: NewRecord[], targetDate: string) => Promise<boolean>;
  onUpdateRecord: (id: string, updated: Partial<OvertimeRecord>) => void;
  onGoToGmailReport: () => void;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'sent';
type ViewMode = 'list' | 'employees';

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

const monthBounds = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return {
    first: `${month}-01`,
    mid: `${month}-15`,
    midNext: `${month}-16`,
    last: `${month}-${String(last).padStart(2, '0')}`,
  };
};

// Botones segmentados (mismo estilo en filtros y vistas)
function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { key: T; label: React.ReactNode }[];
  className?: string;
}) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1', className)}>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors lg:flex-none [&_svg]:size-3.5',
            value === o.key
              ? 'bg-card text-foreground shadow-vercel-subtle'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ManagerReviewView({
  records,
  employees,
  settings,
  selectedMonth,
  userRole,
  onToggleVerify,
  onVerifyAllMonth,
  onDeleteRecord,
  onDeleteRecords,
  onCopyRecords,
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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [view, setView] = useState<ViewMode>('list');
  const [editing, setEditing] = useState<OvertimeRecord | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copyOpen, setCopyOpen] = useState(false);

  const bounds = monthBounds(selectedMonth);

  // Al cambiar de mes se limpian el rango y la selección
  useEffect(() => {
    setDateFrom('');
    setDateTo('');
    setSelected(new Set());
  }, [selectedMonth]);

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

  // Todos los filtros menos el de estado (los contadores de estado se calculan sobre esto)
  const term = search.trim().toLowerCase();
  const baseFiltered = monthRecords
    .filter((r) => employeeFilter === 'all' || r.employeeId === employeeFilter)
    .filter((r) => (!dateFrom || r.date >= dateFrom) && (!dateTo || r.date <= dateTo))
    .filter(
      (r) =>
        !term ||
        r.employeeName.toLowerCase().includes(term) ||
        (r.notes || '').toLowerCase().includes(term) ||
        formatShortDate(r.date).toLowerCase().includes(term)
    );
  const filtered = baseFiltered.filter((r) => matchesStatus(r, statusFilter));
  const summary = summarizeRecords(filtered, employeesMap);

  const counts: Record<StatusFilter, number> = {
    all: baseFiltered.length,
    pending: baseFiltered.filter((r) => matchesStatus(r, 'pending')).length,
    approved: baseFiltered.filter((r) => matchesStatus(r, 'approved')).length,
    sent: baseFiltered.filter((r) => matchesStatus(r, 'sent')).length,
  };

  const isLocked = (r: OvertimeRecord) => r.status === 'sent_accountant' && userRole !== 'admin';
  const items: ReviewItem[] = filtered.map((r) => ({
    record: r,
    employee: employeesMap.get(r.employeeId),
    cost: canSeeMoney ? calculateRecordCost(r, employeesMap) : null,
    dayAlert: dailyAlerts.get(`${r.employeeId}|${r.date}`),
    locked: isLocked(r),
  }));

  // Selección: solo lo visible y no bloqueado (si un filtro oculta algo, deja de contar)
  const selectable = items.filter((i) => !i.locked).map((i) => i.record);
  const selectedRecords = selectable.filter((r) => selected.has(r.id));
  const selection: ReviewSelection | undefined =
    canEdit && view === 'list'
      ? {
          selected,
          allSelected: selectable.length > 0 && selectedRecords.length === selectable.length,
          someSelected: selectedRecords.length > 0,
          toggle: (id) =>
            setSelected((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            }),
          toggleAll: () =>
            setSelected(
              selectedRecords.length === selectable.length ? new Set() : new Set(selectable.map((r) => r.id))
            ),
        }
      : undefined;

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
    selection,
  };

  const approveAll = async () => {
    const ok = await confirm({
      title: `¿Aprobar ${pending.length} registro(s) pendientes?`,
      description: `Se aprueban todas las horas pendientes de ${monthLabel(selectedMonth)}.`,
      confirmText: 'Aprobar todos',
    });
    if (ok) onVerifyAllMonth();
  };

  const deleteSelected = async () => {
    const hours = selectedRecords.reduce((s, r) => s + r.hours, 0);
    const ok = await confirm({
      title: `¿Eliminar ${selectedRecords.length} registro(s)?`,
      description: `${formatHoursDisplay(hours)} en total. Esta acción no se puede deshacer.`,
      confirmText: `Eliminar ${selectedRecords.length}`,
      destructive: true,
    });
    if (!ok) return;
    if (await onDeleteRecords(selectedRecords.map((r) => r.id))) setSelected(new Set());
  };

  const copySelected = async (copies: NewRecord[], targetDate: string) => {
    const ok = await onCopyRecords(copies, targetDate);
    if (ok) setSelected(new Set());
    return ok;
  };

  // Descripción de los filtros activos (para que se entienda de qué son los totales)
  const rangeLabel =
    dateFrom || dateTo
      ? `${formatShortDate(dateFrom || bounds.first)} – ${formatShortDate(dateTo || bounds.last)}`
      : null;
  const activeFilters = [
    employeeFilter !== 'all' ? employeesMap.get(employeeFilter)?.name : null,
    rangeLabel,
    statusFilter !== 'all' ? STATUS_FILTERS.find((f) => f.key === statusFilter)?.label : null,
    term ? `"${search.trim()}"` : null,
  ].filter(Boolean);
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setEmployeeFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const setRange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
  };
  const rangePreset =
    !dateFrom && !dateTo
      ? 'month'
      : dateFrom === bounds.first && dateTo === bounds.mid
        ? 'q1'
        : dateFrom === bounds.midNext && dateTo === bounds.last
          ? 'q2'
          : 'custom';

  const stats = [
    {
      label: 'Horas',
      value: formatHoursDisplay(summary.totalHours),
      sub:
        summary.pendingHours > 0 ? `de eso, ${formatHoursDisplay(summary.pendingHours)} pendientes` : 'todas aprobadas',
      warn: summary.pendingHours > 0,
    },
    {
      label: 'Registros',
      value: String(summary.count),
      sub:
        summary.pendingCount === 0
          ? 'sin pendientes'
          : `${summary.pendingCount} pendiente${summary.pendingCount === 1 ? '' : 's'}`,
      warn: summary.pendingCount > 0,
    },
    ...(canSeeMoney
      ? [
          {
            label: 'Valor estimado',
            value: formatCurrency(summary.value, settings.currencySymbol),
            sub: 'incluye pendientes',
            warn: false,
          },
        ]
      : []),
  ];

  return (
    <div className={cn('flex flex-col gap-4', selectedRecords.length > 0 && 'pb-24')}>
      {/* Encabezado: totales de lo que se está viendo y acciones principales */}
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

        {activeFilters.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="text-muted-foreground">Mostrando:</span>
            <span className="font-medium">{activeFilters.join(' · ')}</span>
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              Quitar filtros
            </button>
          </p>
        )}

        <div className={cn('grid grid-cols-2 gap-2', canSeeMoney ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border bg-muted/40 px-3 py-2.5 last:max-sm:col-span-2">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-0.5 font-mono text-base font-semibold sm:text-lg">{s.value}</p>
              <p className={cn('text-xs', s.warn ? 'text-warning' : 'text-muted-foreground')}>{s.sub}</p>
            </div>
          ))}
        </div>

        {summary.totalHours > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {OVERTIME_TYPE_ORDER.map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className={cn('size-2 rounded-full', TYPE_STYLES[t].dot)} />
                {TYPE_STYLES[t].short}{' '}
                <strong className="font-mono font-semibold text-foreground">
                  {formatHoursDisplay(summary.hoursByType[t])}
                </strong>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Filtros */}
      <section className="flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-vercel-subtle">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar empleado, fecha o nota"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Segmented
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_FILTERS.map((f) => ({ key: f.key, label: `${f.label} (${counts[f.key]})` }))}
          />
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
        </div>

        {/* Rango de fechas dentro del mes (p. ej. quincena) */}
        <div className="flex flex-col gap-2 border-t pt-2 lg:flex-row lg:items-center">
          <span className="text-xs font-medium text-muted-foreground">Fechas</span>
          <Segmented
            value={rangePreset}
            onChange={(k) => {
              if (k === 'month') setRange('', '');
              if (k === 'q1') setRange(bounds.first, bounds.mid);
              if (k === 'q2') setRange(bounds.midNext, bounds.last);
            }}
            options={[
              { key: 'month', label: 'Todo el mes' },
              { key: 'q1', label: '1 – 15' },
              { key: 'q2', label: `16 – ${Number(bounds.last.slice(8))}` },
              ...(rangePreset === 'custom' ? [{ key: 'custom' as const, label: 'Personalizado' }] : []),
            ]}
          />
          <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center">
            <Input
              type="date"
              aria-label="Desde"
              min={bounds.first}
              max={dateTo || bounds.last}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="font-mono lg:w-40"
            />
            <Input
              type="date"
              aria-label="Hasta"
              min={dateFrom || bounds.first}
              max={bounds.last}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="font-mono lg:w-40"
            />
          </div>
          <Segmented
            className="lg:ml-auto"
            value={view}
            onChange={(v) => {
              setView(v);
              setSelected(new Set());
            }}
            options={[
              {
                key: 'list',
                label: (
                  <>
                    <List /> Lista
                  </>
                ),
              },
              {
                key: 'employees',
                label: (
                  <>
                    <Users /> Por empleado
                  </>
                ),
              },
            ]}
          />
        </div>
      </section>

      {/* Registros */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card px-4 py-12 text-center text-sm text-muted-foreground">
          {monthRecords.length === 0
            ? `No hay horas extras registradas en ${monthLabel(selectedMonth)}.`
            : 'Ningún registro coincide con los filtros.'}
        </div>
      ) : view === 'employees' ? (
        <EmployeeSummaryView
          rows={summarizeByEmployee(filtered, employeesMap)}
          total={summary}
          showMoney={canSeeMoney}
          currencySymbol={settings.currencySymbol}
          isDesktop={isDesktop}
          onSelectEmployee={(id) => {
            setEmployeeFilter(id);
            setView('list');
          }}
        />
      ) : isDesktop ? (
        <ReviewTable items={items} actions={actions} />
      ) : (
        <div className="flex flex-col gap-3">
          {selection && selectable.length > 0 && (
            <button
              type="button"
              onClick={selection.toggleAll}
              className="self-start text-xs font-medium text-muted-foreground underline hover:text-foreground"
            >
              {selection.allSelected ? 'Quitar selección' : `Seleccionar los ${selectable.length} visibles`}
            </button>
          )}
          {items.map((item) => (
            <ReviewCard key={item.record.id} item={item} actions={actions} />
          ))}
        </div>
      )}

      {/* Barra de acciones para los seleccionados */}
      {selectedRecords.length > 0 && (
        <div className="fixed inset-x-3 bottom-3 z-30 mx-auto flex max-w-2xl flex-col gap-2 rounded-xl border bg-card p-3 shadow-vercel-modal sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            <strong>{selectedRecords.length}</strong> seleccionado(s) ·{' '}
            <span className="font-mono">{formatHoursDisplay(selectedRecords.reduce((s, r) => s + r.hours, 0))}</span>
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setCopyOpen(true)}>
              <Copy /> Copiar a…
            </Button>
            <Button
              variant="outline"
              className="flex-1 text-destructive hover:text-destructive sm:flex-none"
              onClick={deleteSelected}
            >
              <Trash2 /> Eliminar
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSelected(new Set())} aria-label="Cancelar selección">
              <X />
            </Button>
          </div>
        </div>
      )}

      <EditRecordDialog record={editing} onClose={() => setEditing(null)} onSave={onUpdateRecord} />
      <CopyRecordsDialog
        open={copyOpen}
        records={selectedRecords}
        month={selectedMonth}
        rules={settings.overtimeRules}
        monthRecords={monthRecords}
        onClose={() => setCopyOpen(false)}
        onCopy={copySelected}
      />
    </div>
  );
}
