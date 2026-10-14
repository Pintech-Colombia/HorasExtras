import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Lock, RotateCcw, Save } from 'lucide-react';
import { CompanySettings, DEFAULT_OVERTIME_RULES, OvertimeRules, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const WEEKDAYS: { key: string; label: string }[] = [
  { key: '1', label: 'Lunes' },
  { key: '2', label: 'Martes' },
  { key: '3', label: 'Miércoles' },
  { key: '4', label: 'Jueves' },
  { key: '5', label: 'Viernes' },
  { key: '6', label: 'Sábado' },
];

type PctKey = 'extraDiurnaPct' | 'extraNocturnaPct' | 'festivaDiurnaPct' | 'festivaNocturnaPct';

const PCT_FIELDS: { key: PctKey; label: string }[] = [
  { key: 'extraDiurnaPct', label: 'Extra diurna' },
  { key: 'extraNocturnaPct', label: 'Extra nocturna' },
  { key: 'festivaDiurnaPct', label: 'Dominical / festiva diurna' },
  { key: 'festivaNocturnaPct', label: 'Dominical / festiva nocturna' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CompanySettingsViewProps {
  settings: CompanySettings;
  userRole?: UserRole | null;
  onSaveSettings: (s: CompanySettings) => void;
}

// Sección de configuración: título y explicación a la izquierda (en PC), campos a la derecha
function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="grid gap-4 rounded-xl border bg-card p-4 shadow-vercel-card sm:p-5 lg:grid-cols-[260px_1fr] lg:gap-8"
    >
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="mt-1 text-xs text-muted-foreground">{description}</div>
      </div>
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
    </section>
  );
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function CompanySettingsView({ settings, userRole, onSaveSettings }: CompanySettingsViewProps) {
  const canEditSettings = userRole === 'manager' || userRole === 'accountant' || userRole === 'admin';
  const [form, setForm] = useState<CompanySettings>(settings);
  const [submitted, setSubmitted] = useState(false);
  const lastSettings = useRef(settings);

  // Cuando llegan datos del servidor se actualiza el formulario, salvo que haya cambios sin guardar
  useEffect(() => {
    setForm((prev) => (same(prev, lastSettings.current) ? settings : prev));
    lastSettings.current = settings;
  }, [settings]);

  const dirty = !same(form, settings);

  // Avisar antes de cerrar la pestaña con cambios sin guardar
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const rules = form.overtimeRules;
  const set = <K extends keyof CompanySettings>(key: K, value: CompanySettings[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const setRules = (partial: Partial<OvertimeRules>) =>
    setForm((f) => ({ ...f, overtimeRules: { ...f.overtimeRules, ...partial } }));

  const pctError = (v: number) =>
    !Number.isFinite(v) || v < 0 || v > 500 ? 'Escribe un porcentaje entre 0 y 500.' : undefined;
  const errors: Record<string, string | undefined> = {
    companyName: !form.companyName.trim() ? 'Escribe el nombre de la empresa.' : undefined,
    accountantName: !form.accountantName.trim() ? 'Escribe el nombre de quien recibe el reporte.' : undefined,
    accountantEmail: !EMAIL_RE.test(form.accountantEmail.trim()) ? 'Escribe un correo válido.' : undefined,
    managerName: !form.managerName.trim() ? 'Escribe el nombre de quien aprueba.' : undefined,
    ...Object.fromEntries(PCT_FIELDS.map((f) => [f.key, pctError(rules[f.key])])),
    shiftStart: !rules.shiftStart ? 'Indica la hora de ingreso.' : undefined,
    nightStart: !rules.nightStart
      ? 'Indica la hora.'
      : rules.nightStart === rules.nightEnd
        ? 'Inicio y fin no pueden ser iguales.'
        : undefined,
    nightEnd: !rules.nightEnd ? 'Indica la hora.' : undefined,
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const err = (key: string) => (submitted ? errors[key] : undefined);

  const isLegalDefault = PCT_FIELDS.every((f) => rules[f.key] === DEFAULT_OVERTIME_RULES[f.key]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditSettings) return;
    setSubmitted(true);
    if (hasErrors) {
      toast.error('Revisa los campos marcados en rojo.');
      return;
    }
    onSaveSettings({
      ...form,
      companyName: form.companyName.trim(),
      companyNIT: form.companyNIT.trim(),
      accountantName: form.accountantName.trim(),
      accountantEmail: form.accountantEmail.trim(),
      managerName: form.managerName.trim(),
      managerTitle: form.managerTitle.trim(),
    });
    setSubmitted(false);
  };

  const discard = () => {
    setForm(settings);
    setSubmitted(false);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* Encabezado */}
      <section className="flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-vercel-card sm:p-5">
        <h2 className="text-lg font-semibold sm:text-xl">Configuración</h2>
        <p className="text-sm text-muted-foreground">
          Datos que aparecen en el reporte a contabilidad, recargos y horario de la empresa.
        </p>
        {!canEditSettings && (
          <p className="mt-2 flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            <Lock className="size-4 shrink-0" /> Solo lectura: la Jefa, el Contador o el Administrador pueden hacer
            cambios.
          </p>
        )}
      </section>

      <fieldset disabled={!canEditSettings} className="flex min-w-0 flex-col gap-4">
        <Section id="empresa" title="Empresa" description="Aparece en el encabezado del correo y del Excel.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Razón social *" htmlFor="cfg-company" error={err('companyName')}>
              <Input
                id="cfg-company"
                value={form.companyName}
                onChange={(e) => set('companyName', e.target.value)}
                aria-invalid={Boolean(err('companyName'))}
              />
            </Field>
            <Field label="NIT" htmlFor="cfg-nit">
              <Input
                id="cfg-nit"
                className="font-mono"
                value={form.companyNIT}
                onChange={(e) => set('companyNIT', e.target.value)}
              />
            </Field>
          </div>
        </Section>

        <Section
          id="contabilidad"
          title="Contabilidad"
          description="Quién recibe el reporte mensual. El botón “Abrir Gmail” usa este correo."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre *" htmlFor="cfg-acc-name" error={err('accountantName')}>
              <Input
                id="cfg-acc-name"
                value={form.accountantName}
                onChange={(e) => set('accountantName', e.target.value)}
                aria-invalid={Boolean(err('accountantName'))}
              />
            </Field>
            <Field label="Correo *" htmlFor="cfg-acc-email" error={err('accountantEmail')}>
              <Input
                id="cfg-acc-email"
                type="email"
                inputMode="email"
                autoCapitalize="none"
                className="font-mono"
                value={form.accountantEmail}
                onChange={(e) => set('accountantEmail', e.target.value)}
                aria-invalid={Boolean(err('accountantEmail'))}
              />
            </Field>
          </div>
        </Section>

        <Section
          id="aprobacion"
          title="Aprobación"
          description="Quién revisa y aprueba las horas. Firma el correo y aparece como aprobador en el Excel."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre *" htmlFor="cfg-mgr-name" error={err('managerName')}>
              <Input
                id="cfg-mgr-name"
                value={form.managerName}
                onChange={(e) => set('managerName', e.target.value)}
                aria-invalid={Boolean(err('managerName'))}
              />
            </Field>
            <Field label="Cargo" htmlFor="cfg-mgr-title">
              <Input
                id="cfg-mgr-title"
                value={form.managerTitle}
                onChange={(e) => set('managerTitle', e.target.value)}
              />
            </Field>
          </div>
        </Section>

        <Section
          id="recargos"
          title="Recargos"
          description={
            <>
              <p>
                Porcentaje adicional sobre la hora ordinaria. Por defecto, Ley 2466 de 2025 (dominical 90% desde julio
                de 2026).
              </p>
              <p className="mt-2 font-medium text-foreground">
                Los cambios aplican solo a las horas que se registren desde ahora. Las ya registradas conservan su
                recargo.
              </p>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {PCT_FIELDS.map((f) => {
              const v = rules[f.key];
              const legal = DEFAULT_OVERTIME_RULES[f.key];
              return (
                <Field
                  key={f.key}
                  label={`${f.label} (%)`}
                  htmlFor={`cfg-${f.key}`}
                  error={err(f.key)}
                  hint={`Se paga ×${Number.isFinite(v) ? (1 + v / 100).toLocaleString('es-CO') : '—'} la hora${v !== legal ? ` · ley: ${legal}%` : ''}`}
                >
                  <Input
                    id={`cfg-${f.key}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={500}
                    step="0.01"
                    className="font-mono"
                    value={Number.isFinite(v) ? v : ''}
                    onChange={(e) => setRules({ [f.key]: e.target.valueAsNumber } as Partial<OvertimeRules>)}
                    aria-invalid={Boolean(err(f.key))}
                  />
                </Field>
              );
            })}
          </div>
          {canEditSettings && !isLegalDefault && (
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setRules(
                    Object.fromEntries(
                      PCT_FIELDS.map((f) => [f.key, DEFAULT_OVERTIME_RULES[f.key]])
                    ) as Partial<OvertimeRules>
                  )
                }
              >
                <RotateCcw /> Restaurar recargos de ley
              </Button>
            </div>
          )}
        </Section>

        <Section
          id="jornada"
          title="Jornada"
          description="Horario ordinario de la empresa. Al registrar horas se usa para calcular cuántas son diurnas, nocturnas o festivas. Domingos y festivos de Colombia se detectan solos."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Ingreso habitual" htmlFor="cfg-shift-start" error={err('shiftStart')}>
              <Input
                id="cfg-shift-start"
                type="time"
                className="font-mono"
                value={rules.shiftStart}
                onChange={(e) => setRules({ shiftStart: e.target.value })}
              />
            </Field>
            <Field label="Inicio nocturno" htmlFor="cfg-night-start" error={err('nightStart')}>
              <Input
                id="cfg-night-start"
                type="time"
                className="font-mono"
                value={rules.nightStart}
                onChange={(e) => setRules({ nightStart: e.target.value })}
              />
            </Field>
            <Field label="Fin nocturno" htmlFor="cfg-night-end" error={err('nightEnd')}>
              <Input
                id="cfg-night-end"
                type="time"
                className="font-mono"
                value={rules.nightEnd}
                onChange={(e) => setRules({ nightEnd: e.target.value })}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Hora de salida por día</Label>
            <p className="-mt-1 text-xs text-muted-foreground">
              Déjala vacía si ese día no hay jornada: todo lo trabajado cuenta como extra.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {WEEKDAYS.map((d) => (
                <Field
                  key={d.key}
                  label={<span className="font-normal text-muted-foreground">{d.label}</span>}
                  htmlFor={`cfg-end-${d.key}`}
                >
                  <Input
                    id={`cfg-end-${d.key}`}
                    type="time"
                    className="font-mono"
                    value={rules.shiftEnds[d.key] || ''}
                    onChange={(e) => setRules({ shiftEnds: { ...rules.shiftEnds, [d.key]: e.target.value || null } })}
                  />
                </Field>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border p-3">
            <Checkbox
              id="cfg-saturday"
              className="mt-0.5"
              checked={rules.saturdayAsHoliday}
              onCheckedChange={(v) => setRules({ saturdayAsHoliday: v === true })}
            />
            <div>
              <Label htmlFor="cfg-saturday">Pagar el sábado como dominical / festivo</Label>
              <p className="text-xs text-muted-foreground">
                No es obligatorio por ley; actívalo solo si la empresa lo acordó así.
              </p>
            </div>
          </div>
        </Section>
      </fieldset>

      {/* Barra de guardado: aparece solo con cambios pendientes */}
      {canEditSettings && dirty && (
        <div className="sticky bottom-3 z-20 flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-vercel-modal sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium">Tienes cambios sin guardar</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={discard}>
              Descartar
            </Button>
            <Button type="submit" className="flex-1 sm:flex-none">
              <Save /> Guardar cambios
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
