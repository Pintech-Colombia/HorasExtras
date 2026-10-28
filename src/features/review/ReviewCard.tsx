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

// Tarjeta de Auditoría para celular/tablet: botones grandes para aprobar con el pulgar
export function ReviewCard({ item, actions }: { item: ReviewItem; actions: ReviewActions }) {
  const { record: rec, cost, dayAlert, locked } = item;
  const sel = actions.selection;
  const isSelected = Boolean(sel?.selected.has(rec.id));

  return (
    <article
      className={cn(
        'rounded-xl border bg-card p-4 shadow-vercel-subtle',
        !rec.verifiedByManager && 'border-warning/40',
        isSelected && 'border-primary ring-1 ring-primary'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {sel && !locked && (
          <Checkbox
            className="mt-0.5 size-5"
            aria-label={`Seleccionar registro de ${rec.employeeName}`}
            checked={isSelected}
            onCheckedChange={() => sel.toggle(rec.id)}
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{rec.employeeName}</p>
          <p className="text-xs text-muted-foreground">{formatShortDate(rec.date)}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-lg font-semibold leading-none">{formatHoursDisplay(rec.hours)}</p>
          {cost !== null && (
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {formatCurrency(cost, actions.currencySymbol)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <StatusBadge record={rec} />
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className={cn('size-2 rounded-full', TYPE_STYLES[rec.type].dot)} />
          {typeShortLabel(rec.type, rec.customMultiplier || OVERTIME_TYPES[rec.type].multiplier)}
        </span>
      </div>

      {dayAlert && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-warning">
          <AlertTriangle className="size-3.5" /> Suma {formatHoursDisplay(dayAlert)} extra ese día (límite habitual: 2
          h)
        </p>
      )}
      {rec.notes && <p className="mt-2 rounded-md bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">{rec.notes}</p>}

      {actions.canEdit && !locked && (
        <div className="mt-3 flex items-center gap-2">
          <Button
            className="h-10 flex-1"
            variant={rec.verifiedByManager ? 'outline' : 'default'}
            onClick={() => actions.onToggleVerify(rec.id)}
          >
            {rec.verifiedByManager ? (
              <>
                <Undo2 /> Quitar aprobación
              </>
            ) : (
              <>
                <Check /> Aprobar
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-10"
            onClick={() => actions.onEdit(rec)}
            aria-label="Corregir"
          >
            <Pencil />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-10 text-muted-foreground hover:text-destructive"
            onClick={() => actions.onDelete(rec)}
            aria-label="Eliminar"
          >
            <Trash2 />
          </Button>
        </div>
      )}
    </article>
  );
}
