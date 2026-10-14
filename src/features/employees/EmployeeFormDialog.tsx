import { useEffect, useState } from 'react';
import { Employee } from '@/types';
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
import { NativeSelect } from '@/components/ui/native-select';

export const DEPARTMENTS = [
  'Operaciones',
  'Inyección',
  'Ensamble',
  'Mantenimiento',
  'Calidad',
  'Logística',
  'Empaque',
  'Administración',
];

export type EmployeeDraft = Omit<Employee, 'id'>;

interface EmployeeFormDialogProps {
  open: boolean;
  employee: Employee | null; // null = nuevo
  employees: Employee[]; // para validar cédulas repetidas
  canEditEmployees: boolean; // false = solo valor hora (Contador)
  canManageSalaries: boolean;
  onClose: () => void;
  onSave: (draft: EmployeeDraft) => void;
}

const EMPTY: EmployeeDraft = {
  name: '',
  documentId: '',
  position: '',
  department: 'Inyección',
  baseHourlyRate: 0,
  active: true,
};

// Crear o editar un empleado. El Contador solo puede cambiar el valor hora.
export function EmployeeFormDialog({
  open,
  employee,
  employees,
  canEditEmployees,
  canManageSalaries,
  onClose,
  onSave,
}: EmployeeFormDialogProps) {
  const [draft, setDraft] = useState<EmployeeDraft>(EMPTY);
  const [rate, setRate] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    const initial = employee ? { ...employee } : EMPTY;
    setDraft(initial);
    setRate(initial.baseHourlyRate ? String(initial.baseHourlyRate) : '');
    setSubmitted(false);
  }, [open, employee]);

  const set = <K extends keyof EmployeeDraft>(key: K, value: EmployeeDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const parsedRate = rate.trim() === '' ? 0 : Number(rate.replace(',', '.'));
  const rateValid = Number.isFinite(parsedRate) && parsedRate >= 0;
  const docTaken = employees.some((e) => e.id !== employee?.id && e.documentId.trim() === draft.documentId.trim());
  const errors = {
    name: !draft.name.trim() ? 'Escribe el nombre completo.' : undefined,
    documentId: !draft.documentId.trim()
      ? 'Escribe la cédula.'
      : docTaken
        ? 'Ya hay un empleado con esta cédula.'
        : undefined,
    position: !draft.position.trim() ? 'Escribe el cargo.' : undefined,
    rate: !rateValid ? 'Escribe un valor válido, sin puntos ni signos (ej. 15000).' : undefined,
  };
  const hasErrors = canEditEmployees ? Object.values(errors).some(Boolean) : Boolean(errors.rate);
  const show = (msg?: string) => (submitted ? msg : undefined);

  // Si el empleado tiene un área que ya no está en la lista, se conserva como opción
  const departments =
    DEPARTMENTS.includes(draft.department) || !draft.department ? DEPARTMENTS : [...DEPARTMENTS, draft.department];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (hasErrors) return;
    onSave({
      ...draft,
      name: draft.name.trim(),
      documentId: draft.documentId.trim(),
      position: draft.position.trim(),
      baseHourlyRate: parsedRate,
    });
    onClose();
  };

  const title = !employee ? 'Nuevo empleado' : canEditEmployees ? 'Editar empleado' : 'Valor hora';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {employee
                ? `${employee.name} · CC ${employee.documentId}`
                : 'Los campos marcados con * son obligatorios.'}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            <Field label="Nombre completo *" htmlFor="emp-name" error={show(errors.name)}>
              <Input
                id="emp-name"
                disabled={!canEditEmployees}
                placeholder="Ej. Carlos Alberto Mendoza"
                value={draft.name}
                onChange={(e) => set('name', e.target.value)}
                aria-invalid={Boolean(show(errors.name))}
              />
            </Field>
            <Field label="Cédula *" htmlFor="emp-doc" error={show(errors.documentId)}>
              <Input
                id="emp-doc"
                inputMode="numeric"
                disabled={!canEditEmployees}
                placeholder="Ej. 1020304050"
                value={draft.documentId}
                onChange={(e) => set('documentId', e.target.value)}
                aria-invalid={Boolean(show(errors.documentId))}
                className="font-mono"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cargo *" htmlFor="emp-position" error={show(errors.position)}>
                <Input
                  id="emp-position"
                  disabled={!canEditEmployees}
                  placeholder="Ej. Técnico de inyección"
                  value={draft.position}
                  onChange={(e) => set('position', e.target.value)}
                  aria-invalid={Boolean(show(errors.position))}
                />
              </Field>
              <Field label="Área" htmlFor="emp-dept">
                <NativeSelect
                  id="emp-dept"
                  disabled={!canEditEmployees}
                  value={draft.department}
                  onChange={(e) => set('department', e.target.value)}
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            {canManageSalaries && (
              <Field
                label="Valor hora ordinaria ($)"
                htmlFor="emp-rate"
                error={show(errors.rate)}
                hint="Base para calcular el valor de las horas extras. Solo lo ven Jefa, Contador y Admin."
              >
                <Input
                  id="emp-rate"
                  inputMode="decimal"
                  placeholder="Ej. 15000"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  aria-invalid={Boolean(show(errors.rate))}
                  className="font-mono"
                />
              </Field>
            )}
            {canEditEmployees && employee && (
              <div className="flex items-start gap-2.5 rounded-lg border p-3">
                <Checkbox
                  id="emp-active"
                  checked={draft.active}
                  onCheckedChange={(c) => set('active', c === true)}
                  className="mt-0.5"
                />
                <div>
                  <Label htmlFor="emp-active">Activo</Label>
                  <p className="text-xs text-muted-foreground">
                    Los inactivos no aparecen al registrar horas, pero conservan su historial.
                  </p>
                </div>
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{employee ? 'Guardar cambios' : 'Crear empleado'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
