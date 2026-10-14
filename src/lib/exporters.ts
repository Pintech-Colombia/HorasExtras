import { Employee, OvertimeRecord, CompanySettings, OVERTIME_TYPES, OvertimeType } from '@/types';

export const calculateRecordCost = (record: OvertimeRecord, employeesMap: Map<string, Employee>) => {
  const emp = employeesMap.get(record.employeeId);
  const baseRate = emp ? emp.baseHourlyRate : 0;
  const mult = record.customMultiplier || OVERTIME_TYPES[record.type]?.multiplier || 1.25;
  return record.hours * baseRate * mult;
};

// Escapa texto para insertarlo en el HTML del correo
const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Etiqueta corta de cada tipo con el porcentaje vigente, p. ej. "Ex. Diurna (25%)"
const shortLabel = (t: OvertimeType) => {
  const pct = Number(((OVERTIME_TYPES[t].multiplier - 1) * 100).toFixed(2));
  const names: Record<OvertimeType, string> = {
    diurna: 'Ex. Diurna',
    nocturna: 'Ex. Nocturna',
    festiva_diurna: 'Fest. Diurna',
    festiva_nocturna: 'Fest. Nocturna',
  };
  return `${names[t]} (${pct}%)`;
};

// Formatter for currency
export const formatCurrency = (amount: number, symbol = '$') => {
  return `${symbol} ${amount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

// Build Formatted Email Text for Gmail
export const buildGmailFormattedText = (
  monthYearLabel: string,
  records: OvertimeRecord[],
  employeesMap: Map<string, Employee>,
  settings: CompanySettings
): { subject: string; plainText: string; htmlText: string } => {
  const subject = `[NÓMINA] Reporte Consolidado de Horas Extras - ${monthYearLabel} - ${settings.companyName}`;

  // Group records by employee
  const empGroup = new Map<
    string,
    {
      employee: Employee | undefined;
      name: string;
      doc: string;
      diurna: number;
      nocturna: number;
      festivaDiurna: number;
      festivaNocturna: number;
      totalHours: number;
      estimatedSurcharge: number;
      records: OvertimeRecord[];
    }
  >();

  let grandTotalHours = 0;
  let grandTotalCost = 0;

  records.forEach((rec) => {
    const emp = employeesMap.get(rec.employeeId);
    const empId = rec.employeeId;
    if (!empGroup.has(empId)) {
      empGroup.set(empId, {
        employee: emp,
        name: rec.employeeName,
        doc: emp?.documentId || 'S/D',
        diurna: 0,
        nocturna: 0,
        festivaDiurna: 0,
        festivaNocturna: 0,
        totalHours: 0,
        estimatedSurcharge: 0,
        records: [],
      });
    }

    const item = empGroup.get(empId)!;
    item.totalHours += rec.hours;
    grandTotalHours += rec.hours;

    const cost = calculateRecordCost(rec, employeesMap);
    item.estimatedSurcharge += cost;
    grandTotalCost += cost;

    if (rec.type === 'diurna') item.diurna += rec.hours;
    else if (rec.type === 'nocturna') item.nocturna += rec.hours;
    else if (rec.type === 'festiva_diurna') item.festivaDiurna += rec.hours;
    else if (rec.type === 'festiva_nocturna') item.festivaNocturna += rec.hours;

    item.records.push(rec);
  });

  const empList = Array.from(empGroup.values());

  // Plain Text Version
  let plainText = `Apreciado(a) ${settings.accountantName},\n\n`;
  plainText += `Adjunto remito el reporte consolidado y verificado de HORAS EXTRAS correspondientes al periodo de ${monthYearLabel} para la empresa ${settings.companyName} (NIT: ${settings.companyNIT}).\n\n`;
  plainText += `Este informe fue revisado y validado en conjunto con el encargado de planta/operaciones (${settings.managerName}).\n\n`;
  plainText += `===========================================================\n`;
  plainText += `RESUMEN GENERAL DE NÓMINA\n`;
  plainText += `===========================================================\n`;
  plainText += `- Total Empleados con Horas Extras: ${empList.length}\n`;
  plainText += `- Total Horas Extras Registradas: ${grandTotalHours} hrs\n`;
  plainText += `- Valor Estimado de Horas Extras: ${formatCurrency(grandTotalCost, settings.currencySymbol)}\n\n`;

  plainText += `-----------------------------------------------------------\n`;
  plainText += `DETALLE POR EMPLEADO:\n`;
  plainText += `-----------------------------------------------------------\n`;

  empList.forEach((e, idx) => {
    plainText += `${idx + 1}. ${e.name} (Doc: ${e.doc})\n`;
    plainText += `   Cargo: ${e.employee?.position || 'Operativo'}\n`;
    plainText += `   - ${OVERTIME_TYPES.diurna.label}: ${e.diurna} h\n`;
    plainText += `   - ${OVERTIME_TYPES.nocturna.label}: ${e.nocturna} h\n`;
    plainText += `   - ${OVERTIME_TYPES.festiva_diurna.label}: ${e.festivaDiurna} h\n`;
    plainText += `   - ${OVERTIME_TYPES.festiva_nocturna.label}: ${e.festivaNocturna} h\n`;
    plainText += `   => TOTAL HORAS: ${e.totalHours} hrs | Valor est. extras: ${formatCurrency(e.estimatedSurcharge, settings.currencySymbol)}\n\n`;
  });

  plainText += `Quedamos atentos a cualquier inquietud para el procesamiento de la nómina del mes.\n\n`;
  plainText += `Atentamente,\n`;
  plainText += `${settings.managerName}\n`;
  plainText += `${settings.managerTitle}\n`;
  plainText += `${settings.companyName}\n`;

  // Rich HTML Version for Gmail Clipboard Copy
  let htmlText = `
<div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 680px; margin: 0 auto; line-height: 1.5;">
  <div style="background-color: #1e3a8a; color: #ffffff; padding: 20px; border-radius: 8px 8px 0 0;">
    <h2 style="margin: 0; font-size: 20px;">REPORTE DE HORAS EXTRAS - ${monthYearLabel.toUpperCase()}</h2>
    <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">${esc(settings.companyName)} | NIT: ${esc(settings.companyNIT)}</p>
  </div>
  
  <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; background-color: #ffffff;">
    <p>Apreciado(a) <strong>${esc(settings.accountantName)}</strong>,</p>
    <p>Le enviamos el reporte detallado y verificado de las <strong>horas extras</strong> realizadas por el personal durante el mes de <strong>${monthYearLabel}</strong>.</p>
    
    <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 20px 0; border-radius: 0 6px 6px 0;">
      <p style="margin: 0; font-weight: bold; color: #1e40af;">Resumen Consolidado:</p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #334155;">
        <li><strong>Empleados reportados:</strong> ${empList.length}</li>
        <li><strong>Total horas extras del mes:</strong> ${grandTotalHours} hrs</li>
        <li><strong>Valor estimado de horas extras:</strong> <span style="color: #16a34a; font-weight: bold;">${formatCurrency(grandTotalCost, settings.currencySymbol)}</span></li>
        <li><strong>Validado por:</strong> ${esc(settings.managerName)} (${esc(settings.managerTitle)})</li>
      </ul>
    </div>

    <h3 style="color: #0f172a; margin-top: 25px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Desglose de Horas por Empleado:</h3>
    
    <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px;">
      <thead>
        <tr style="background-color: #f1f5f9; color: #334155; text-align: left;">
          <th style="padding: 10px; border: 1px solid #cbd5e1;">Empleado / Documento</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">${shortLabel('diurna')}</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">${shortLabel('nocturna')}</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">${shortLabel('festiva_diurna')}</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">${shortLabel('festiva_nocturna')}</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">Total Horas</th>
        </tr>
      </thead>
      <tbody>
  `;

  empList.forEach((e) => {
    htmlText += `
        <tr>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">
            <strong>${esc(e.name)}</strong><br/>
            <span style="font-size: 11px; color: #64748b;">Doc: ${esc(e.doc)} | ${esc(e.employee?.position || 'Operativo')}</span>
          </td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${e.diurna > 0 ? `<strong>${e.diurna}h</strong>` : '-'}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${e.nocturna > 0 ? `<strong>${e.nocturna}h</strong>` : '-'}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${e.festivaDiurna > 0 ? `<strong>${e.festivaDiurna}h</strong>` : '-'}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${e.festivaNocturna > 0 ? `<strong>${e.festivaNocturna}h</strong>` : '-'}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; background-color: #f8fafc; font-weight: bold;">${e.totalHours} hrs</td>
        </tr>
    `;
  });

  htmlText += `
        <tr style="background-color: #f1f5f9; font-weight: bold;">
          <td style="padding: 12px; border: 1px solid #cbd5e1;">TOTALES GENERALES</td>
          <td style="padding: 12px; border: 1px solid #cbd5e1; text-align: center;" colspan="4">---</td>
          <td style="padding: 12px; border: 1px solid #cbd5e1; text-align: right; color: #1e40af; font-size: 15px;">${grandTotalHours} hrs</td>
        </tr>
      </tbody>
    </table>
  `;

  htmlText += `
    <p style="margin-top: 30px;">Quedamos atentos a cualquier confirmación necesaria para el cierre de la nómina.</p>
    
    <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 13px; color: #475569;">
      <strong>${esc(settings.managerName)}</strong><br/>
      ${esc(settings.managerTitle)}<br/>
      ${esc(settings.companyName)}
    </div>
  </div>
</div>
  `;

  return { subject, plainText, htmlText };
};

// Copy HTML Rich Text to Clipboard for direct Gmail paste
export const copyRichHtmlToClipboard = async (htmlContent: string, plainTextContent: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const blobHtml = new Blob([htmlContent], { type: 'text/html' });
      const blobText = new Blob([plainTextContent], { type: 'text/plain' });
      const item = new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobText,
      });
      await navigator.clipboard.write([item]);
      return true;
    } else {
      await navigator.clipboard.writeText(plainTextContent);
      return true;
    }
  } catch (err) {
    console.error('Error copying rich text to clipboard:', err);
    try {
      await navigator.clipboard.writeText(plainTextContent);
      return true;
    } catch {
      return false;
    }
  }
};

// Generate direct Gmail Web Link safely without exceeding URL length limits
export const getGmailWebUrl = (recipientEmail: string, subject: string, bodyText: string): string => {
  // Truncate bodyText if it's long to prevent browser 414 / URI too long error
  const maxBodyLength = 1200;
  let safeBody = bodyText || '';
  if (safeBody.length > maxBodyLength) {
    safeBody = safeBody.substring(0, maxBodyLength) + '\n\n[...Reporte completo copiado al portapapeles. Presiona Ctrl+V en Gmail para pegar el formato con tablas...]';
  }

  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    tf: '1',
    to: recipientEmail || '',
    su: subject || '',
    body: safeBody,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
};

export const getMailtoUrl = (recipientEmail: string, subject: string, bodyText: string): string => {
  const maxBodyLength = 800;
  const safeBody = (bodyText || '').length > maxBodyLength
    ? bodyText.substring(0, maxBodyLength) + '\n\n[...Reporte copiado al portapapeles...]'
    : bodyText;

  return `mailto:${encodeURIComponent(recipientEmail || '')}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(safeBody)}`;
};
