import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, ArrowRight, Check, Copy, ExternalLink, FileSpreadsheet, Lock, Mail } from 'lucide-react';
import { CompanySettings, Employee, OvertimeRecord } from '@/types';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/ui/confirm';
import { monthLabel } from '@/features/calendar/calendarUtils';
import { downloadOvertimeExcel } from '@/lib/excelReport';
import { buildGmailFormattedText, calculateRecordCost, copyRichHtmlToClipboard, formatCurrency, getGmailWebUrl } from '@/lib/exporters';
import { formatHoursDisplay } from '@/lib/schedule';
import { cn } from '@/lib/utils';

interface GmailReportBuilderProps {
  records: OvertimeRecord[];
  employees: Employee[];
  settings: CompanySettings;
  selectedMonth: string; // YYYY-MM
  onMarkMonthSent: () => Promise<number | null>;
  onGoToReview?: () => void;
}

// Paso numerado del flujo de cierre
function Step({
  number,
  title,
  description,
  done,
  children,
}: {
  number: number;
  title: string;
  description: string;
  done?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
            done ? 'border-success bg-success text-white' : 'bg-muted text-muted-foreground'
          )}
        >
          {done ? <Check className="size-4" /> : number}
        </span>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children && <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">{children}</div>}
    </li>
  );
}

// Reporte del mes para Contabilidad: correo, Excel y cierre, en el orden en que se hacen
export function GmailReportBuilder({
  records,
  employees,
  settings,
  selectedMonth,
  onMarkMonthSent,
  onGoToReview,
}: GmailReportBuilderProps) {
  const confirm = useConfirm();
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  const employeesMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const label = monthLabel(selectedMonth);

  const monthRecords = records.filter((r) => r.date.startsWith(selectedMonth));
  // El reporte solo incluye horas aprobadas por la Jefa (o ya enviadas)
  const approved = monthRecords.filter((r) => r.verifiedByManager);
  const pendingCount = monthRecords.length - approved.length;
  const readyToSend = approved.filter((r) => r.status === 'verified_manager').length;
  const sentCount = approved.length - readyToSend;
  const totalHours = approved.reduce((s, r) => s + r.hours, 0);
  const totalValue = approved.reduce((s, r) => s + calculateRecordCost(r, employeesMap), 0);
  const hasData = approved.length > 0;

  const { subject, plainText, htmlText } = buildGmailFormattedText(label, approved, employeesMap, settings);
  const gmailUrl = getGmailWebUrl(settings.accountantEmail, subject, plainText);

  const copyForGmail = async () => {
    if (await copyRichHtmlToClipboard(htmlText, plainText)) {
      setCopied(true);
      toast.success('Correo copiado. Pégalo en Gmail con Ctrl+V.');
    } else {
      toast.error('No se pudo copiar. Selecciona la vista previa y cópiala manualmente.');
    }
  };

  const downloadExcel = async () => {
    setIsDownloading(true);
    try {
      await downloadOvertimeExcel(
        { monthLabel: label, records: approved, employees: employeesMap, settings },
        `Horas_Extras_${settings.companyName.replace(/\s+/g, '_')}_${selectedMonth}.xlsx`
      );
      setDownloaded(true);
    } catch {
      toast.error('No se pudo generar el Excel. Intenta de nuevo.');
    } finally {
      setIsDownloading(false);
    }
  };

  const markSent = async () => {
    const ok = await confirm({
      title: `¿Marcar ${label} como enviado a contabilidad?`,
      description: `${readyToSend} registro(s) aprobados quedarán bloqueados. Después no se podrán editar ni borrar.`,
      confirmText: 'Marcar como enviado',
    });
    if (!ok) return;
    setIsMarking(true);
    await onMarkMonthSent();
    setIsMarking(false);
  };

  const stats = [
    { label: 'Registros aprobados', value: String(approved.length) },
    { label: 'Horas aprobadas', value: formatHoursDisplay(totalHours) },
    { label: 'Valor estimado', value: formatCurrency(totalValue, settings.currencySymbol) },
    { label: 'Ya enviados', value: String(sentCount) },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Encabezado */}
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-vercel-card sm:p-5">
        <div>
          <h2 className="text-lg font-semibold sm:text-xl">Reporte y nómina · {label}</h2>
          <p className="text-sm text-muted-foreground">
            Para {settings.accountantName || 'Contabilidad'}
            {settings.accountantEmail && <> ({settings.accountantEmail})</>}. Solo se incluyen horas aprobadas.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border bg-muted/40 px-3 py-2.5">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-0.5 font-mono text-base font-semibold sm:text-lg">{s.value}</p>
            </div>
          ))}
        </div>
        {pendingCount > 0 && (
          <div className="flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              {pendingCount} registro(s) pendientes de aprobar no se incluyen en este reporte.
            </span>
            {onGoToReview && (
              <Button size="sm" variant="outline" onClick={onGoToReview}>
                Ir a Auditoría <ArrowRight />
              </Button>
            )}
          </div>
        )}
      </section>

      {/* Pasos del cierre */}
      <section className="rounded-xl border bg-card shadow-vercel-card">
        <h3 className="border-b px-4 py-3 text-sm font-semibold">Cierre del mes, paso a paso</h3>
        <ol className="divide-y">
          <Step
            number={1}
            title="Revisa el correo"
            description="Abajo está la vista previa con el resumen por empleado."
            done={hasData}
          />
          <Step
            number={2}
            title="Envía el correo a contabilidad"
            description="Copia el formato y pégalo en Gmail, o abre Gmail con el correo listo (también queda copiado)."
            done={copied}
          >
            <Button variant="outline" size="sm" onClick={copyForGmail} disabled={!hasData}>
              <Copy /> Copiar correo
            </Button>
            {hasData ? (
              <Button variant="outline" size="sm" asChild>
                <a href={gmailUrl} target="_blank" rel="noopener noreferrer" onClick={copyForGmail}>
                  <ExternalLink /> Abrir Gmail
                </a>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <ExternalLink /> Abrir Gmail
              </Button>
            )}
          </Step>
          <Step
            number={3}
            title="Descarga el Excel"
            description="Archivo .xlsx con resumen por empleado y detalle de cada registro, para adjuntar al correo."
            done={downloaded}
          >
            <Button variant="outline" size="sm" onClick={downloadExcel} disabled={!hasData || isDownloading}>
              <FileSpreadsheet /> {isDownloading ? 'Generando...' : 'Descargar Excel'}
            </Button>
          </Step>
          <Step
            number={4}
            title="Cierra el mes"
            description={
              readyToSend > 0
                ? `Marca ${readyToSend} registro(s) como enviados: quedan bloqueados para que nadie los cambie.`
                : sentCount > 0
                  ? 'Todos los registros aprobados ya fueron enviados.'
                  : 'Cuando haya horas aprobadas podrás cerrar el mes.'
            }
            done={sentCount > 0 && readyToSend === 0}
          >
            <Button size="sm" onClick={markSent} disabled={readyToSend === 0 || isMarking}>
              <Lock /> {isMarking ? 'Marcando...' : 'Marcar como enviado'}
            </Button>
          </Step>
        </ol>
      </section>

      {/* Vista previa del correo */}
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-vercel-card sm:p-5">
        <div className="flex items-center gap-2">
          <Mail className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Vista previa del correo</h3>
        </div>
        <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs">
          <span className="text-muted-foreground">Asunto: </span>
          <span className="font-mono">{subject}</span>
        </div>
        {hasData ? (
          // El correo se arma con estilos propios (para Gmail); se muestra sobre fondo blanco en ambos temas
          <div className="overflow-x-auto rounded-lg border bg-white p-3 text-neutral-900 sm:p-4">
            <div dangerouslySetInnerHTML={{ __html: htmlText }} />
          </div>
        ) : (
          <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            No hay horas aprobadas en {label}.
          </p>
        )}
      </section>
    </div>
  );
}
