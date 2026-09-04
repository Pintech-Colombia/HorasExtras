import React, { useState } from 'react';
import { Mail, Copy, Check, ExternalLink, Download, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';
import { OvertimeRecord, Employee, CompanySettings, OVERTIME_TYPES } from '../types';
import { buildGmailFormattedText, copyRichHtmlToClipboard, exportToCSV, getGmailWebUrl, getMailtoUrl, formatCurrency, calculateRecordCost } from '../utils/exporters';
import { formatHoursDisplay } from '../utils/schedule';

interface GmailReportBuilderProps {
  records: OvertimeRecord[];
  employees: Employee[];
  settings: CompanySettings;
  selectedMonth: string; // YYYY-MM
}

export const GmailReportBuilder: React.FC<GmailReportBuilderProps> = ({
  records,
  employees,
  settings,
  selectedMonth,
}) => {
  const [copiedStatus, setCopiedStatus] = useState<boolean>(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiNotes, setAiNotes] = useState<string>('');
  const [aiError, setAiError] = useState<string | null>(null);

  const employeesMap = new Map<string, Employee>(employees.map((e) => [e.id, e]));

  // Month label
  const [yearStr, monthStr] = selectedMonth.split('-');
  const dateObj = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
  const monthName = dateObj.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  const monthYearLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Month records
  const monthRecords = records.filter((r) => r.date.startsWith(selectedMonth));
  const verifiedRecords = monthRecords.filter((r) => r.verifiedByManager);
  const unverifiedCount = monthRecords.length - verifiedRecords.length;

  // Build default formatted email content
  const { subject, plainText, htmlText } = buildGmailFormattedText(
    monthYearLabel,
    monthRecords,
    employeesMap,
    settings,
    aiNotes
  );

  // Grouping for table preview
  const totalHoursMonth = monthRecords.reduce((s, r) => s + r.hours, 0);
  const totalCostMonth = monthRecords.reduce((s, r) => s + calculateRecordCost(r, employeesMap), 0);

  // Copy handler
  const handleCopyForGmail = async () => {
    const success = await copyRichHtmlToClipboard(htmlText, plainText);
    if (success) {
      setCopiedStatus(true);
      setTimeout(() => setCopiedStatus(false), 3000);
    }
  };

  const gmailUrl = getGmailWebUrl(settings.accountantEmail, subject, plainText);

  // Open in Gmail Web and pre-copy rich content to clipboard
  const handleOpenGmailWeb = async (e: React.MouseEvent) => {
    // Copy rich HTML table to clipboard first so user can paste it in Gmail
    await copyRichHtmlToClipboard(htmlText, plainText);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 3000);

    // If window.open is used as fallback
    if (!gmailUrl) {
      e.preventDefault();
    }
  };

  // Export CSV for accountant
  const handleExportCSV = () => {
    exportToCSV(monthRecords, employeesMap, selectedMonth, settings.companyName);
  };

  // Generate AI Summary with Gemini
  const handleGenerateAiSummary = async () => {
    setIsGeneratingAi(true);
    setAiError(null);

    // Group employee totals
    const empMap = new Map<string, any>();

    monthRecords.forEach((r) => {
      const emp = employeesMap.get(r.employeeId);
      if (!empMap.has(r.employeeId)) {
        empMap.set(r.employeeId, {
          nombre: r.employeeName,
          cedula: emp?.documentId || 'S/D',
          cargo: emp?.position || 'Operativo',
          horasExtrasTotales: 0,
          detalle: [],
        });
      }
      const item = empMap.get(r.employeeId);
      item.horasExtrasTotales += r.hours;
      item.detalle.push({
        fecha: r.date,
        horas: r.hours,
        tipo: OVERTIME_TYPES[r.type]?.label || r.type,
        nota: r.notes || '',
      });
    });

    try {
      const res = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthYear: monthYearLabel,
          totalHours: totalHoursMonth,
          employeeSummaries: Array.from(empMap.values()),
          companyName: settings.companyName,
          accountantName: settings.accountantName,
          accountantEmail: settings.accountantEmail,
          managerName: settings.managerName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al conectar con la API de IA');
      }

      if (data.auditSummary) {
        setAiNotes(data.auditSummary);
      } else if (data.emailBodyText) {
        setAiNotes(data.emailBodyText);
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Ocurrió un error al generar la síntesis con IA.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Vercel Polarity Flipped #171717 with Atmospheric Mesh Glow */}
      <div className="bg-[#171717] rounded-[14px] p-6 text-white border border-[#2a2a2a] shadow-vercel-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-32 bg-vercel-mesh opacity-20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="caption-mono bg-white/5 text-neutral-300 text-[11px] px-2.5 py-1 rounded-[6px] border border-white/10 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-neutral-300" />
                Automatización Gmail
              </span>
              <span className="caption-mono text-[11px] text-neutral-400">Destinatario: {settings.accountantEmail}</span>
            </div>
            <h2 className="text-2xl font-semibold text-white mt-2.5 tracking-display-md">Formato Oficial para Nómina</h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl font-sans">
              Genera el reporte en el formato exacto para contabilidad. Copia con un clic y pega directamente en Gmail Web o exporta a Excel.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyForGmail}
              className={`text-xs font-medium px-4 py-2.5 rounded-full flex items-center gap-2 transition-all shadow-vercel-subtle ${
                copiedStatus
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white hover:bg-neutral-100 text-[#171717]'
              }`}
            >
              {copiedStatus ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>¡Copiado para Gmail!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#171717]" />
                  <span>Copiar Formato para Gmail</span>
                </>
              )}
            </button>

            <a
              href={gmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOpenGmailWeb}
              className="bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-medium px-4 py-2.5 rounded-full flex items-center gap-1.5 transition-all inline-flex cursor-pointer"
              title="Abrir ventana de redacción en Gmail Web"
            >
              <ExternalLink className="w-3.5 h-3.5 text-neutral-300" />
              <span>Abrir en Gmail</span>
            </a>

            <button
              onClick={handleExportCSV}
              className="bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-medium px-4 py-2.5 rounded-full flex items-center gap-1.5 transition-all"
              title="Descargar archivo Excel / CSV para el contador"
            >
              <Download className="w-3.5 h-3.5 text-neutral-300" />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>

        {unverifiedCount > 0 && (
          <div className="relative z-10 mt-4 p-3 bg-[#202020] border border-amber-500/40 rounded-[10px] text-amber-300 text-xs flex items-center gap-2 font-sans">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Aviso:</strong> Hay {unverifiedCount} registro(s) sin verificar por el encargado ({settings.managerName}). Te recomendamos revisarlos antes de enviar el correo.
            </span>
          </div>
        )}
      </div>

      {/* Main Grid: AI Assistant + Formatted Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: AI Assistant & Controls */}
        <div className="space-y-4">
          {/* Gemini AI Card */}
          <div className="bg-white dark:bg-[#111111] rounded-[12px] p-5 border border-[#ebebeb] dark:border-[#262626] shadow-vercel-card space-y-4">
            <div className="flex items-center gap-2 text-[#171717] dark:text-white font-semibold text-sm">
              <div className="p-1.5 rounded-[6px] bg-[#171717] dark:bg-white text-white dark:text-[#171717]">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h3>Asistente de Auditoría (Gemini)</h3>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
              Genera automáticamente una nota ejecutiva de auditoría para el contador, identificando empleados con mayor recargo y observaciones.
            </p>

            <button
              onClick={handleGenerateAiSummary}
              disabled={isGeneratingAi || monthRecords.length === 0}
              className="button-primary w-full h-9 rounded-full text-xs font-medium flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGeneratingAi ? 'Analizando con Gemini...' : 'Generar Síntesis con IA'}</span>
            </button>

            {aiError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 rounded-[8px] text-xs font-sans">
                {aiError}
              </div>
            )}

            {aiNotes && (
              <div className="p-3 bg-[#fafafa] dark:bg-[#161616] border border-[#ebebeb] dark:border-[#262626] rounded-[8px] text-xs text-neutral-800 dark:text-neutral-200 space-y-2">
                <div className="font-semibold flex items-center justify-between text-xs">
                  <span>Nota de Auditoría IA:</span>
                  <button
                    onClick={() => setAiNotes('')}
                    className="caption-mono text-[10px] text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition underline"
                  >
                    Borrar
                  </button>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed text-[11px] font-sans text-neutral-600 dark:text-neutral-300">{aiNotes}</p>
              </div>
            )}
          </div>

          {/* Quick Summary Card */}
          <div className="bg-white dark:bg-[#111111] rounded-[12px] p-5 border border-[#ebebeb] dark:border-[#262626] shadow-vercel-card space-y-3">
            <h4 className="caption-mono text-[10px] text-neutral-400 uppercase tracking-[0.06em]">
              Datos del Envío
            </h4>

            <div className="space-y-2 text-xs font-sans">
              <div className="flex justify-between py-1 border-b border-[#ebebeb] dark:border-[#262626]">
                <span className="text-neutral-500 dark:text-neutral-400">Contador / Destinatario:</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-200">{settings.accountantName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#ebebeb] dark:border-[#262626]">
                <span className="text-neutral-500 dark:text-neutral-400">Correo Contador:</span>
                <span className="font-mono text-neutral-900 dark:text-neutral-200 text-[11px]">{settings.accountantEmail}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#ebebeb] dark:border-[#262626]">
                <span className="text-neutral-500 dark:text-neutral-400">Empresa:</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-200">{settings.companyName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#ebebeb] dark:border-[#262626]">
                <span className="text-neutral-500 dark:text-neutral-400">Total Horas:</span>
                <span className="font-mono font-semibold text-neutral-900 dark:text-white">{formatHoursDisplay(totalHoursMonth)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-500 dark:text-neutral-400">Est. Recargos:</span>
                <span className="font-mono font-semibold text-neutral-900 dark:text-white">{formatCurrency(totalCostMonth, settings.currencySymbol)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Live Formatted HTML Email Canvas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-[#111111] rounded-[12px] border border-[#ebebeb] dark:border-[#262626] shadow-vercel-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#ebebeb] dark:border-[#262626] pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                <h3 className="font-semibold text-neutral-900 dark:text-white text-sm tracking-tight">Vista Previa del Mensaje para Gmail</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyForGmail}
                  className="button-secondary text-xs font-medium px-3 py-1.5 rounded-[6px] flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedStatus ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Subject preview line */}
            <div className="bg-[#fafafa] dark:bg-[#161616] p-3 rounded-[8px] border border-[#ebebeb] dark:border-[#262626] text-xs">
              <span className="caption-mono text-[10px] text-neutral-400 block mb-1">Asunto del Correo:</span>
              <span className="font-mono text-xs text-neutral-900 dark:text-neutral-100">{subject}</span>
            </div>

            {/* Render Rich HTML Output in Container */}
            <div className="border border-[#ebebeb] dark:border-[#262626] rounded-[10px] p-4 bg-white dark:bg-[#0a0a0a] overflow-x-auto text-neutral-900 dark:text-neutral-100 font-sans shadow-vercel-subtle">
              <div dangerouslySetInnerHTML={{ __html: htmlText }} />
            </div>

            {/* Footer tips */}
            <div className="p-3 bg-[#fafafa] dark:bg-[#161616] border border-[#ebebeb] dark:border-[#262626] rounded-[8px] text-xs text-neutral-600 dark:text-neutral-300 flex items-start gap-2.5 font-sans">
              <ShieldCheck className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
              <div>
                <strong>Instrucción:</strong> Haz clic en <strong>"Copiar Formato para Gmail"</strong> y luego pégalo directamente (<kbd className="bg-neutral-200 dark:bg-neutral-800 px-1 py-0.5 rounded font-mono text-[11px]">Ctrl+V</kbd>) en el cuerpo del correo de Gmail Web.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
