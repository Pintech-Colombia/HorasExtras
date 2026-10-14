import { Plus, Trash2 } from 'lucide-react';
import { OVERTIME_TYPES, OvertimeRecord, OvertimeRules } from '@/types';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/ui/confirm';
import { formatHoursDisplay, getWorkScheduleForDate } from '@/lib/schedule';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/features/records/StatusBadge';
import { TYPE_STYLES } from './typeStyles';

interface DayRecordsProps {
  date: string;
  records: OvertimeRecord[];
  rules: OvertimeRules;
  canRegister: boolean;
  canApprove: boolean;
  canDelete: (rec: OvertimeRecord) => boolean;
  onAdd: (date: string) => void;
  onToggleVerify: (id: string) => void;
  onDelete: (id: string) => void;
}

// Registros de un día con sus acciones (aprobar / eliminar según el rol)
export function DayRecords({
  date,
  records,
  rules,
  canRegister,
  canApprove,
  canDelete,
  onAdd,
  onToggleVerify,
  onDelete,
}: DayRecordsProps) {
  const confirm = useConfirm();
  const schedule = getWorkScheduleForDate(date, rules);
  const total = records.reduce((sum, r) => sum + r.hours, 0);

  const handleDelete = async (rec: OvertimeRecord) => {
    const ok = await confirm({
      title: `¿Eliminar el registro de ${rec.employeeName}?`,
      description: `${formatHoursDisplay(rec.hours)} el ${date}.`,
      confirmText: 'Eliminar',
      destructive: true,
    });
    if (ok) onDelete(rec.id);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">{schedule.notes}</div>

      {records.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">Sin horas extras registradas este día.</p>
          {canRegister && (
            <Button size="sm" onClick={() => onAdd(date)}>
              <Plus /> Registrar horas
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {records.length} registro(s) · <strong className="text-foreground">{formatHoursDisplay(total)}</strong>
            </span>
            {canRegister && (
              <Button size="sm" variant="outline" onClick={() => onAdd(date)}>
                <Plus /> Agregar
              </Button>
            )}
          </div>

          <ul className="flex flex-col gap-2">
            {records.map((rec) => {
              const style = TYPE_STYLES[rec.type];
              const isSent = rec.status === 'sent_accountant';
              return (
                <li key={rec.id} className="rounded-lg border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{rec.employeeName}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className={cn('size-2 shrink-0 rounded-full', style.dot)} />
                        {OVERTIME_TYPES[rec.type].label}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-semibold">{formatHoursDisplay(rec.hours)}</span>
                  </div>

                  {rec.notes && <p className="mt-2 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{rec.notes}</p>}

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <StatusBadge record={rec} />

                    {!isSent && (
                      <div className="flex items-center gap-1">
                        {canApprove && (
                          <Button size="sm" variant="ghost" className="h-7" onClick={() => onToggleVerify(rec.id)}>
                            {rec.verifiedByManager ? 'Desmarcar' : 'Aprobar'}
                          </Button>
                        )}
                        {canDelete(rec) && (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="size-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(rec)}
                            aria-label="Eliminar registro"
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
