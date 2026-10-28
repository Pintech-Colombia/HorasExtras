import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { OVERTIME_TYPES, OvertimeRecord, OvertimeRules } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TYPE_STYLES, typeShortLabel } from '@/features/calendar/typeStyles';
import { NewRecord, buildCopies } from '@/features/records/buildRecords';
import { formatShortDate } from '@/lib/dates';
import { formatHoursDisplay, getWorkScheduleForDate } from '@/lib/schedule';
import { cn } from '@/lib/utils';

interface CopyRecordsDialogProps {
  records: OvertimeRecord[]; // los seleccionados
  open: boolean;
  month: string; // mes que se está viendo (YYYY-MM)
  rules: OvertimeRules;
  monthRecords: OvertimeRecord[]; // registros del mes que se está viendo, para avisar repetidos
  onClose: () => void;
  onCopy: (copies: NewRecord[], targetDate: string) => Promise<boolean>;
}

// Copia los registros seleccionados a UNA fecha: misma persona, horas y observación; tipo según el día
export function CopyRecordsDialog({
  records,
  open,
  month,
  rules,
  monthRecords,
  onClose,
  onCopy,
}: CopyRecordsDialogProps) {
  const [targetDate, setTargetDate] = useState('');
  const [approveNow, setApproveNow] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTargetDate('');
    setApproveNow(false);
  }, [open]);

  const copies = targetDate ? buildCopies({ records, targetDate, rules, verifyNow: approveNow }) : [];
  const schedule = targetDate ? getWorkScheduleForDate(targetDate, rules) : null;
  const totalHours = records.reduce((s, r) => s + r.hours, 0);

  // Avisos (no bloquean): misma fecha de origen, personas que ya tienen horas ese día y fecha de otro mes
  const warnings: string[] = [];
  if (targetDate) {
    if (records.some((r) => r.date === targetDate))
      warnings.push('Algunos registros ya son de esa fecha: quedarían duplicados.');
    if (!targetDate.startsWith(month)) {
      warnings.push('La fecha es de otro mes: no se revisan registros repetidos de ese mes. Revísalo después.');
    } else {
      const withHours = new Set(
        monthRecords
          .filter((r) => r.date === targetDate && !records.some((x) => x.id === r.id))
          .map((r) => r.employeeId)
      );
      const names = [...new Set(records.filter((r) => withHours.has(r.employeeId)).map((r) => r.employeeName))];
      if (names.length > 0) warnings.push(`Ya tienen horas ese día: ${names.join(', ')}. ¿Son registros repetidos?`);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDate || copies.length === 0 || isSaving) return;
    setIsSaving(true);
    const ok = await onCopy(copies, targetDate);
    setIsSaving(false);
    if (ok) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>Copiar a otra fecha</DialogTitle>
            <DialogDescription>
              {records.length} registro(s) · {formatHoursDisplay(totalHours)}. Se copian la persona, las horas y la
              observación.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            <Field label="Fecha destino" htmlFor="copy-date">
              <Input
                id="copy-date"
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="font-mono"
              />
              {schedule && (
                <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                  <strong className="font-medium text-foreground">{schedule.dayName}:</strong>{' '}
                  {schedule.isHoliday ? 'domingo o festivo, las horas pasan a festivas.' : 'día hábil.'}
                </p>
              )}
            </Field>

            {copies.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label>Se crearán el {formatShortDate(targetDate)}</Label>
                <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border text-sm">
                  {copies.map((c, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 px-3 py-2">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{c.employeeName}</span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className={cn('size-2 rounded-full', TYPE_STYLES[c.type].dot)} />
                          {typeShortLabel(c.type, OVERTIME_TYPES[c.type].multiplier)}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono font-semibold">{formatHoursDisplay(c.hours)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-start gap-2.5 rounded-lg border p-3">
              <Checkbox
                id="copy-approve"
                className="mt-0.5"
                checked={approveNow}
                onCheckedChange={(v) => setApproveNow(v === true)}
              />
              <div>
                <Label htmlFor="copy-approve">Aprobar de una vez</Label>
                <p className="text-xs text-muted-foreground">Si no, las copias quedan pendientes para revisarlas.</p>
              </div>
            </div>

            {warnings.length > 0 && (
              <div className="flex flex-col gap-1.5 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs">
                {warnings.map((w) => (
                  <p key={w} className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
                    {w}
                  </p>
                ))}
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!targetDate || isSaving}>
              {isSaving ? 'Copiando...' : targetDate ? `Copiar ${copies.length} registro(s)` : 'Elige la fecha'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
