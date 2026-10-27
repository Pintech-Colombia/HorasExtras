import { useEffect, useState } from 'react';
import { OVERTIME_TYPES, OvertimeRecord, OvertimeType } from '@/types';
import { Button } from '@/components/ui/button';
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
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { formatShortDate } from '@/lib/dates';

interface EditRecordDialogProps {
  record: OvertimeRecord | null;
  onClose: () => void;
  onSave: (id: string, partial: Partial<OvertimeRecord>) => void;
}

// Corrige horas, tipo y observación de un registro (Jefa/Admin)
export function EditRecordDialog({ record, onClose, onSave }: EditRecordDialogProps) {
  const [hours, setHours] = useState('');
  const [type, setType] = useState<OvertimeType>('diurna');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (record) {
      setHours(String(record.hours));
      setType(record.type);
      setNotes(record.notes || '');
    }
  }, [record]);

  const parsedHours = Number(hours.replace(',', '.'));
  const hoursValid = Number.isFinite(parsedHours) && parsedHours > 0 && parsedHours <= 24;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!record || !hoursValid) return;
    onSave(record.id, { hours: parsedHours, type, notes: notes.trim() });
    onClose();
  };

  return (
    <Dialog open={record !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>Corregir registro</DialogTitle>
            {record && (
              <DialogDescription>
                {record.employeeName} · {formatShortDate(record.date)}
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            <Field
              label="Horas"
              htmlFor="edit-hours"
              error={hours && !hoursValid ? 'Escribe un número entre 0,5 y 24.' : undefined}
            >
              <Input
                id="edit-hours"
                inputMode="decimal"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                aria-invalid={Boolean(hours) && !hoursValid}
              />
            </Field>
            <Field label="Tipo de hora extra" htmlFor="edit-type">
              <NativeSelect id="edit-type" value={type} onChange={(e) => setType(e.target.value as OvertimeType)}>
                {(Object.keys(OVERTIME_TYPES) as OvertimeType[]).map((t) => (
                  <option key={t} value={t}>
                    {OVERTIME_TYPES[t].label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Observación" htmlFor="edit-notes">
              <Textarea id="edit-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!hoursValid}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
