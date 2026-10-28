import { ChevronRight } from 'lucide-react';
import { TYPE_STYLES } from '@/features/calendar/typeStyles';
import { formatCurrency } from '@/lib/exporters';
import { formatHoursDisplay } from '@/lib/schedule';
import { cn } from '@/lib/utils';
import { EmployeeSummary, OVERTIME_TYPE_ORDER, RecordsSummary } from './summary';

interface EmployeeSummaryViewProps {
  rows: EmployeeSummary[];
  total: RecordsSummary;
  showMoney: boolean;
  currencySymbol: string;
  isDesktop: boolean;
  onSelectEmployee: (employeeId: string) => void;
}

const hours = (h: number) => (h > 0 ? formatHoursDisplay(h) : '—');

function Pending({ s }: { s: RecordsSummary }) {
  if (s.pendingHours <= 0) return null;
  return <span className="text-xs text-warning">{formatHoursDisplay(s.pendingHours)} pend.</span>;
}

// Totales por empleado (como la hoja "Resumen" del Excel). Al tocar una fila se ve su detalle.
export function EmployeeSummaryView({
  rows,
  total,
  showMoney,
  currencySymbol,
  isDesktop,
  onSelectEmployee,
}: EmployeeSummaryViewProps) {
  if (!isDesktop) {
    return (
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.employeeId}>
            <button
              type="button"
              onClick={() => onSelectEmployee(row.employeeId)}
              className="w-full rounded-xl border bg-card p-4 text-left shadow-vercel-subtle transition-colors hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{row.employeeName}</p>
                  <p className="text-xs text-muted-foreground">{row.count} registro(s)</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-lg font-semibold leading-none">{formatHoursDisplay(row.totalHours)}</p>
                  {showMoney && (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {formatCurrency(row.value, currencySymbol)}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {OVERTIME_TYPE_ORDER.filter((t) => row.hoursByType[t] > 0).map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <span className={cn('size-2 rounded-full', TYPE_STYLES[t].dot)} />
                    {TYPE_STYLES[t].short} {formatHoursDisplay(row.hoursByType[t])}
                  </span>
                ))}
                <Pending s={row} />
              </div>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-vercel-card">
      <table className="w-full table-fixed text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 font-medium">Empleado</th>
            {OVERTIME_TYPE_ORDER.map((t) => (
              <th key={t} className="w-[140px] whitespace-nowrap px-3 py-2.5 text-right font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <span className={cn('size-2 rounded-full', TYPE_STYLES[t].dot)} />
                  {TYPE_STYLES[t].short}
                </span>
              </th>
            ))}
            <th className="w-[120px] px-3 py-2.5 text-right font-medium">Total</th>
            {showMoney && <th className="w-[130px] px-3 py-2.5 text-right font-medium">Valor est.</th>}
            <th className="w-[44px]" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr
              key={row.employeeId}
              onClick={() => onSelectEmployee(row.employeeId)}
              className="cursor-pointer align-middle transition-colors hover:bg-muted/40"
            >
              <td className="px-4 py-2.5">
                <p className="truncate font-medium">{row.employeeName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  CC {row.documentId || 'S/D'} · {row.count} reg.
                </p>
              </td>
              {OVERTIME_TYPE_ORDER.map((t) => (
                <td key={t} className="px-3 py-2.5 text-right font-mono">
                  {hours(row.hoursByType[t])}
                </td>
              ))}
              <td className="px-3 py-2.5 text-right">
                <p className="font-mono font-semibold">{formatHoursDisplay(row.totalHours)}</p>
                <Pending s={row} />
              </td>
              {showMoney && (
                <td className="px-3 py-2.5 text-right font-mono">{formatCurrency(row.value, currencySymbol)}</td>
              )}
              <td className="pr-3 text-muted-foreground">
                <ChevronRight className="size-4" aria-label="Ver detalle" />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t bg-muted/40 font-semibold">
          <tr className="align-middle">
            <td className="px-4 py-2.5">TOTAL · {rows.length} empleado(s)</td>
            {OVERTIME_TYPE_ORDER.map((t) => (
              <td key={t} className="px-3 py-2.5 text-right font-mono">
                {hours(total.hoursByType[t])}
              </td>
            ))}
            <td className="px-3 py-2.5 text-right">
              <p className="font-mono">{formatHoursDisplay(total.totalHours)}</p>
              <Pending s={total} />
            </td>
            {showMoney && (
              <td className="px-3 py-2.5 text-right font-mono">{formatCurrency(total.value, currencySymbol)}</td>
            )}
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
