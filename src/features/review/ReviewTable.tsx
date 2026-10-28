import { AlertTriangle, Check, Pencil, Trash2, Undo2 } from 'lucide-react';
import { OVERTIME_TYPES } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from '@/features/records/StatusBadge';
import { TYPE_STYLES, typeShortLabel } from '@/features/calendar/typeStyles';
import { formatShortDate } from '@/lib/dates';
import { formatCurrency } from '@/lib/exporters';
import { formatHoursDisplay } from '@/lib/schedule';
import { cn } from '@/lib/utils';
import { ReviewActions, ReviewItem } from './reviewItem';

// Tabla de Auditoría para PC: columnas con ancho fijo para que todo quepa sin desplazamiento horizontal
export function ReviewTable({ items, actions }: { items: ReviewItem[]; actions: ReviewActions }) {
  const showMoney = items.some((i) => i.cost !== null);
  const sel = actions.selection;

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-vercel-card">
      <table className="w-full table-fixed text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
          <tr>
            {sel && (
              <th className="w-[44px] py-2.5 pl-4 pr-0">
                <Checkbox
                  aria-label="Seleccionar todos los registros visibles"
                  checked={sel.allSelected ? true : sel.someSelected ? 'indeterminate' : false}
                  onCheckedChange={sel.toggleAll}
                />
              </th>
            )}
            <th className="w-[110px] px-3 py-2.5 font-medium">Estado</th>
            <th className="w-[100px] px-3 py-2.5 font-medium">Fecha</th>
            <th className="px-3 py-2.5 font-medium">Empleado</th>
            <th className="w-[170px] px-3 py-2.5 font-medium">Tipo</th>
            <th className="w-[100px] px-3 py-2.5 text-right font-medium">Horas</th>
            {showMoney && <th className="w-[110px] px-3 py-2.5 text-right font-medium">Valor est.</th>}
            <th className="hidden px-3 py-2.5 font-medium xl:table-cell">Observación</th>
            {actions.canEdit && <th className="w-[150px] px-3 py-2.5 text-right font-medium">Acciones</th>}
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map(({ record: rec, employee, cost, dayAlert, locked }) => (
            <tr
              key={rec.id}
              className={cn(
                'align-middle',
                !rec.verifiedByManager && 'bg-warning/5',
                sel?.selected.has(rec.id) && 'bg-primary/5'
              )}
            >
              {sel && (
                <td className="py-2.5 pl-4 pr-0">
                  {!locked && (
                    <Checkbox
                      aria-label={`Seleccionar registro de ${rec.employeeName} del ${formatShortDate(rec.date)}`}
                      checked={sel.selected.has(rec.id)}
                      onCheckedChange={() => sel.toggle(rec.id)}
                    />
                  )}
                </td>
              )}
              <td className="px-3 py-2.5">
                <StatusBadge record={rec} />
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">{formatShortDate(rec.date)}</td>
              <td className="px-3 py-2.5">
                <p className="truncate font-medium">{rec.employeeName}</p>
                <p className="truncate text-xs text-muted-foreground">CC {employee?.documentId || 'S/D'}</p>
              </td>
              <td className="px-3 py-2.5">
                <span className="flex items-center gap-1.5 truncate text-xs">
                  <span className={cn('size-2 shrink-0 rounded-full', TYPE_STYLES[rec.type].dot)} />
                  <span className="truncate">
                    {typeShortLabel(rec.type, rec.customMultiplier || OVERTIME_TYPES[rec.type].multiplier)}
                  </span>
                </span>
              </td>
              <td className="px-3 py-2.5 text-right">
                <span className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap font-mono font-semibold">
                  {dayAlert && (
                    <AlertTriangle
                      className="size-3.5 text-warning"
                      aria-label={`Suma ${formatHoursDisplay(dayAlert)} extra ese día`}
                    >
                      <title>{`Suma ${formatHoursDisplay(dayAlert)} extra ese día (límite habitual: 2 h)`}</title>
                    </AlertTriangle>
                  )}
                  {formatHoursDisplay(rec.hours)}
                </span>
              </td>
              {showMoney && (
                <td className="px-3 py-2.5 text-right font-mono text-xs">
                  {cost !== null ? formatCurrency(cost, actions.currencySymbol) : '—'}
                </td>
              )}
              <td className="hidden px-3 py-2.5 xl:table-cell">
                <p className="truncate text-xs text-muted-foreground" title={rec.notes}>
                  {rec.notes || '—'}
                </p>
              </td>
              {actions.canEdit && (
                <td className="px-3 py-2.5">
                  {locked ? (
                    <p className="text-right text-xs text-muted-foreground">Bloqueado</p>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant={rec.verifiedByManager ? 'ghost' : 'default'}
                        className="h-7 px-2.5"
                        onClick={() => actions.onToggleVerify(rec.id)}
                        title={rec.verifiedByManager ? 'Quitar aprobación' : 'Aprobar'}
                      >
                        {rec.verifiedByManager ? <Undo2 /> : <Check />}
                        <span className="hidden 2xl:inline">{rec.verifiedByManager ? 'Quitar' : 'Aprobar'}</span>
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="size-7"
                        onClick={() => actions.onEdit(rec)}
                        aria-label="Corregir"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => actions.onDelete(rec)}
                        aria-label="Eliminar"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
