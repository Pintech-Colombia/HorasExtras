import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock, Hash, Info, Search } from 'lucide-react';
import { Employee, OVERTIME_TYPES, OvertimeRecord, OvertimeRules, OvertimeType } from '@/types';
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
import { Textarea } from '@/components/ui/textarea';
import { TYPE_STYLES, typeShortLabel } from '@/features/calendar/typeStyles';
import {
  OvertimeSegment,
  calculateOvertimeFromDeparture,
  formatHoursDisplay,
  formatTime12h,
  getWorkScheduleForDate,
  suggestOvertimeType,
} from '@/lib/schedule';
import { cn } from '@/lib/utils';
import { NewRecord, buildOvertimeRecords, getRegistrationWarnings } from './buildRecords';

interface AddOvertimeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  initialDate?: string;
  onSaveRecords: (records: NewRecord[]) => Promise<boolean>;
  rules: OvertimeRules;
  canVerify: boolean; // solo Jefa/Admin pueden registrar ya aprobado
  existingRecords: OvertimeRecord[]; // registros del mes, para los avisos
}

type InputMode = 'departure_time' | 'direct_hours';

const HOUR_PRESETS = [0.5, 1, 1.5, 2, 2.5, 3, 4];
const TYPES = Object.keys(OVERTIME_TYPES) as OvertimeType[];

const todayStr = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

const addMinutes = (time: string, minutes: number) => {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const typeLabel = (t: OvertimeType) => typeShortLabel(t, OVERTIME_TYPES[t].multiplier);

// Selector segmentado (mismo estilo que los filtros de Auditoría y Personal)
function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon: React.ReactNode }[];
}) {
  return (
    <div role="radiogroup" className="grid grid-cols-2 gap-1 rounded-lg border bg-muted/40 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium transition-colors [&_svg]:size-4',
            value === o.value
              ? 'bg-card text-foreground shadow-vercel-subtle'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {o.icon} {o.label}
        </button>
      ))}
    </div>
  );
}

export function AddOvertimeDialog({
  isOpen,
  onClose,
  employees,
  initialDate,
  onSaveRecords,
  rules,
  canVerify,
  existingRecords,
}: AddOvertimeDialogProps) {
  const [date, setDate] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('departure_time');
  const [departureTime, setDepartureTime] = useState('18:30');
  const [startTime, setStartTime] = useState(rules.shiftStart); // solo días sin jornada ordinaria
  const [hoursText, setHoursText] = useState('1.5');
  const [overtimeType, setOvertimeType] = useState<OvertimeType>('diurna');
  const [notes, setNotes] = useState('');
  const [approveNow, setApproveNow] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Al abrir: formulario limpio con la fecha elegida (o hoy). El modo se conserva entre registros.
  useEffect(() => {
    if (!isOpen) return;
    setDate(initialDate || todayStr());
    setSelectedIds([]);
    setSearch('');
    setNotes('');
    setApproveNow(false);
  }, [isOpen, initialDate]);

  // Sugerencias según el día: salida 1,5 h después de la jornada, o jornada de medio día si no hay jornada
  useEffect(() => {
    if (!date) return;
    const sched = getWorkScheduleForDate(date, rules);
    if (!sched.hasOrdinaryShift) {
      setStartTime(rules.shiftStart);
      setDepartureTime('13:30');
    } else {
      const [y, m, d] = date.split('-').map(Number);
      setDepartureTime(addMinutes(rules.shiftEnds[String(new Date(y, m - 1, d).getDay())] || '17:00', 90));
    }
    setOvertimeType(suggestOvertimeType(date, rules));
  }, [date, rules]);

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    const sorted = [...employees].sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return term
      ? sorted.filter(
          (e) =>
            e.name.toLowerCase().includes(term) ||
            e.documentId.includes(term) ||
            e.position.toLowerCase().includes(term)
        )
      : sorted;
  }, [employees, search]);

  const schedule = getWorkScheduleForDate(date, rules);

  // Horas y tramos según el modo; con hora de salida el tipo (diurna/nocturna/festiva) se calcula solo
  const parsedHours = Number(hoursText.replace(',', '.'));
  const hoursValid = Number.isFinite(parsedHours) && parsedHours > 0 && parsedHours <= 24;
  let segments: OvertimeSegment[];
  let breakdown = '';
  if (inputMode === 'departure_time') {
    const calc = calculateOvertimeFromDeparture(date, departureTime, startTime, rules);
    segments = calc.segments;
    breakdown = calc.breakdown;
  } else {
    segments = hoursValid ? [{ type: overtimeType, hours: parsedHours }] : [];
  }
  const totalHours = segments.reduce((s, seg) => s + seg.hours, 0);

  const warnings = getRegistrationWarnings({
    date,
    today: todayStr(),
    hours: totalHours,
    employees,
    selectedIds,
    existingRecords,
    rules,
  });

  const visibleIds = filteredEmployees.map((e) => e.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const toggle = (id: string) =>
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  const toggleAllVisible = () =>
    setSelectedIds((ids) =>
      allVisibleSelected ? ids.filter((id) => !visibleIds.includes(id)) : [...new Set([...ids, ...visibleIds])]
    );

  const canSave = Boolean(date) && selectedIds.length > 0 && totalHours > 0 && !isSaving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    const records = buildOvertimeRecords({
      date,
      employees,
      selectedIds,
      segments,
      notes: notes.trim() || (inputMode === 'departure_time' ? `Salida: ${formatTime12h(departureTime)}` : ''),
      verifyNow: canVerify && approveNow,
    });
    setIsSaving(true);
    const ok = await onSaveRecords(records);
    setIsSaving(false);
    // Si falló, el formulario queda abierto para reintentar (el error ya se mostró)
    if (ok) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        // En celular se muestra como panel inferior (más cómodo con el pulgar)
        className="max-w-lg max-sm:bottom-0 max-sm:top-auto max-sm:max-h-[94dvh] max-sm:w-full max-sm:max-w-none max-sm:translate-y-0 max-sm:rounded-b-none"
      >
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>Registrar horas extras</DialogTitle>
            <DialogDescription>
              Por hora de salida (se calcula solo) o escribiendo la cantidad de horas.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="flex flex-col gap-5">
            {/* 1. Fecha */}
            <Field label="Fecha" htmlFor="ot-date">
              <Input
                id="ot-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="font-mono"
              />
              {date && (
                <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                  <Info className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    <strong className="font-medium text-foreground">{schedule.dayName}:</strong> {schedule.notes}
                  </span>
                </p>
              )}
            </Field>

            {/* 2. Empleados */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label>
                  Empleados{' '}
                  {selectedIds.length > 0 && (
                    <span className="text-muted-foreground">· {selectedIds.length} seleccionado(s)</span>
                  )}
                </Label>
                {filteredEmployees.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleAllVisible}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    {allVisibleSelected ? 'Quitar todos' : search ? 'Marcar resultados' : 'Marcar todos'}
                  </button>
                )}
              </div>
              {employees.length > 6 && (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar empleado"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                    aria-label="Buscar empleado"
                  />
                </div>
              )}
              <ul className="max-h-52 divide-y overflow-y-auto rounded-lg border">
                {filteredEmployees.length === 0 ? (
                  <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {employees.length === 0
                      ? 'No hay empleados activos. Créalos en Personal.'
                      : 'Ningún empleado coincide.'}
                  </li>
                ) : (
                  filteredEmployees.map((emp) => {
                    const checked = selectedIds.includes(emp.id);
                    return (
                      <li key={emp.id}>
                        <label
                          className={cn(
                            'flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50',
                            checked && 'bg-muted/60'
                          )}
                        >
                          <Checkbox checked={checked} onCheckedChange={() => toggle(emp.id)} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{emp.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {emp.position} · CC {emp.documentId}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>

            {/* 3. Horas */}
            <div className="flex flex-col gap-3">
              <Label>Horas</Label>
              <Segmented<InputMode>
                value={inputMode}
                onChange={setInputMode}
                options={[
                  { value: 'departure_time', label: 'Hora de salida', icon: <Clock /> },
                  { value: 'direct_hours', label: 'Cantidad', icon: <Hash /> },
                ]}
              />

              {inputMode === 'departure_time' ? (
                <div className="flex flex-col gap-3 rounded-lg border p-3">
                  <div className={cn('grid gap-3', !schedule.hasOrdinaryShift && 'grid-cols-2')}>
                    {!schedule.hasOrdinaryShift && (
                      <Field label="Hora de ingreso" htmlFor="ot-start">
                        <Input
                          id="ot-start"
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="font-mono"
                        />
                      </Field>
                    )}
                    <Field
                      label="Hora real de salida"
                      htmlFor="ot-departure"
                      hint={schedule.hasOrdinaryShift ? `Salida ordinaria: ${schedule.shiftEnd}` : undefined}
                    >
                      <Input
                        id="ot-departure"
                        type="time"
                        required
                        value={departureTime}
                        onChange={(e) => setDepartureTime(e.target.value)}
                        className="font-mono"
                      />
                    </Field>
                  </div>
                  {/* Resultado del cálculo */}
                  <div className="rounded-md bg-muted/60 px-3 py-2.5">
                    {segments.length === 0 ? (
                      <p className="text-xs text-muted-foreground">{breakdown}</p>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">Horas extra</span>
                          <span className="font-mono text-base font-semibold">{formatHoursDisplay(totalHours)}</span>
                        </div>
                        <ul className="mt-1.5 flex flex-col gap-1">
                          {segments.map((seg) => (
                            <li key={seg.type} className="flex items-center justify-between gap-2 text-xs">
                              <span className="flex items-center gap-1.5">
                                <span className={cn('size-2 rounded-full', TYPE_STYLES[seg.type].dot)} />
                                {typeLabel(seg.type)}
                              </span>
                              <span className="font-mono">{formatHoursDisplay(seg.hours)}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 rounded-lg border p-3">
                  <Field
                    label="Cantidad de horas"
                    htmlFor="ot-hours"
                    error={hoursText && !hoursValid ? 'Escribe un número entre 0,5 y 24.' : undefined}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        id="ot-hours"
                        inputMode="decimal"
                        value={hoursText}
                        onChange={(e) => setHoursText(e.target.value)}
                        aria-invalid={Boolean(hoursText) && !hoursValid}
                        className="font-mono sm:w-24"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {HOUR_PRESETS.map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setHoursText(String(h))}
                            className={cn(
                              'rounded-md border px-2.5 py-1 font-mono text-xs transition-colors',
                              parsedHours === h ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
                            )}
                          >
                            {formatHoursDisplay(h)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </Field>
                  <div role="radiogroup" aria-label="Tipo de hora extra" className="grid gap-2 sm:grid-cols-2">
                    {TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={overtimeType === t}
                        onClick={() => setOvertimeType(t)}
                        className={cn(
                          'flex items-start gap-2 rounded-md border p-2.5 text-left transition-colors',
                          overtimeType === t ? 'border-primary ring-1 ring-primary' : 'hover:bg-muted/50'
                        )}
                      >
                        <span className={cn('mt-1 size-2 shrink-0 rounded-full', TYPE_STYLES[t].dot)} />
                        <span>
                          <span className="block text-sm font-medium">{typeLabel(t)}</span>
                          <span className="block text-xs text-muted-foreground">{OVERTIME_TYPES[t].description}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Observación */}
            <Field
              label="Motivo u observación"
              htmlFor="ot-notes"
              hint="Opcional. Ayuda a la Jefa a aprobar más rápido."
            >
              <Textarea
                id="ot-notes"
                rows={2}
                placeholder="Ej. Despacho urgente, reparación de máquina"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>

            {canVerify && (
              <div className="flex items-start gap-2.5 rounded-lg border p-3">
                <Checkbox
                  id="ot-approve"
                  className="mt-0.5"
                  checked={approveNow}
                  onCheckedChange={(v) => setApproveNow(v === true)}
                />
                <div>
                  <Label htmlFor="ot-approve">Aprobar de una vez</Label>
                  <p className="text-xs text-muted-foreground">Quedan aprobadas sin pasar por Auditoría.</p>
                </div>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="flex flex-col gap-1.5 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs">
                {warnings.map((w) => (
                  <p key={w} className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
                    {w}
                  </p>
                ))}
                <p className="text-muted-foreground">Puedes guardar igual si es correcto.</p>
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSave}>
              {isSaving
                ? 'Guardando...'
                : selectedIds.length === 0
                  ? 'Elige al menos un empleado'
                  : `Guardar · ${selectedIds.length} empleado${selectedIds.length === 1 ? '' : 's'} · ${formatHoursDisplay(totalHours)}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
