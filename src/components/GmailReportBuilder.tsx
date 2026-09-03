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
      {/* Banner Minimalist Slate */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-slate-800 text-slate-300 text-xs font-semibold px-2.5 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-300" />
                Automatización para Gmail
              </span>
              <span className="text-xs text-slate-400">Destinatario: {settings.accountantEmail}</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-2 tracking-tight">Formato Oficial para Correo de Nómina</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Genera el reporte en el formato exacto requerido por contabilidad. Copia directamente a tu portapapeles para pegar en Gmail Web o exporta a Excel.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyForGmail}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-sm ${
                copiedStatus
                  ? 'bg-slate-100 text-slate-900'
                  : 'bg-white hover:bg-slate-100 text-slate-900'
              }`}
            >
              {copiedStatus ? (
                <>
                  <Check className="w-4 h-4 text-slate-900" />
                  <span>¡Copiado para Gmail!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-900" />
                  <span>Copiar Formato para Gmail</span>
                </>
              )}
            </button>

            <a
              href={gmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOpenGmailWeb}
              className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition inline-flex cursor-pointer"
              title="Abrir ventana de redacción en Gmail Web"
            >
              <ExternalLink className="w-4 h-4 text-slate-300" />
              <span>Abrir en Gmail</span>
            </a>

            <button
              onClick={handleExportCSV}
              className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition"
              title="Descargar archivo Excel / CSV para el contador"
            >
              <Download className="w-4 h-4 text-slate-300" />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>

        {unverifiedCount > 0 && (
          <div className="mt-4 p-3 bg-slate-800/80 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Aviso:</strong> Hay {unverifiedCount} registro(s) sin verificar por el encargado ({settings.managerName}). Te recomendamos revisarlos antes de enviar el correo final.
            </span>
          </div>
        )}
      </div>

      {/* Main Grid: AI Assistant + Formatted Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: AI Assistant & Controls */}
        <div className="space-y-4">
          {/* Gemini AI Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <div className="p-1.5 rounded-lg bg-slate-900 text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3>Asistente de Auditoría e IA (Gemini)</h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Genera automáticamente una nota ejecutiva de auditoría para el contador, identificando empleados con mayor recargo y observaciones de cierre.
            </p>

            <button
              onClick={handleGenerateAiSummary}
              disabled={isGeneratingAi || monthRecords.length === 0}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGeneratingAi ? 'Analizando con Gemini...' : 'Generar Síntesis con IA'}</span>
            </button>

            {aiError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 rounded-xl text-xs">
                {aiError}
              </div>
            )}

            {aiNotes && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 space-y-2">
                <div className="font-bold flex items-center justify-between">
                  <span>Nota de Auditoría IA:</span>
                  <button
                    onClick={() => setAiNotes('')}
                    className="text-[10px] text-slate-500 underline"
                  >
                    Borrar
                  </button>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed text-[11px]">{aiNotes}</p>
              </div>
            )}
          </div>

          {/* Quick Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">
              Datos del Envío
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Contador / Destinatario:</span>
                <span className="font-medium text-slate-900 dark:text-slate-200">{settings.accountantName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Correo Contador:</span>
                <span className="font-medium text-slate-900 dark:text-slate-200">{settings.accountantEmail}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Empresa:</span>
                <span className="font-medium text-slate-900 dark:text-slate-200">{settings.companyName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Total Horas Extras:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatHoursDisplay(totalHoursMonth)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Valor Est. Recargos:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(totalCostMonth, settings.currencySymbol)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Live Formatted HTML Email Canvas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Vista Previa del Mensaje para Gmail</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyForGmail}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedStatus ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Subject preview line */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px] mb-1">Asunto del Correo:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{subject}</span>
            </div>

            {/* Render Rich HTML Output in Container */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/50 overflow-x-auto text-slate-900 dark:text-slate-100">
              <div dangerouslySetInnerHTML={{ __html: htmlText }} />
            </div>

            {/* Footer tips */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <strong>Instrucción:</strong> Haz clic en <strong>"Copiar Formato para Gmail"</strong> y luego pégalo directamente (<kbd className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">Ctrl+V</kbd>) en el cuerpo del correo de Gmail.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
