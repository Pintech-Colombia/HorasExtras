import type { Workbook, Worksheet } from 'exceljs';
import { CompanySettings, Employee, OVERTIME_TYPES, OvertimeRecord, OvertimeType } from '@/types';
import { formatShortDate } from './dates';

// Reporte de horas extras en Excel (.xlsx) con formato, para Contabilidad.
// Hoja "Resumen": una fila por empleado con horas por tipo, total y valor estimado.
// Hoja "Detalle": cada registro aprobado.

const TYPES: OvertimeType[] = ['diurna', 'nocturna', 'festiva_diurna', 'festiva_nocturna'];
const TYPE_NAMES: Record<OvertimeType, string> = {
  diurna: 'Extra diurna',
  nocturna: 'Extra nocturna',
  festiva_diurna: 'Festiva diurna',
  festiva_nocturna: 'Festiva nocturna',
};
const STATUS_NAMES: Record<OvertimeRecord['status'], string> = {
  pending_review: 'Pendiente',
  verified_manager: 'Aprobado',
  sent_accountant: 'Enviado',
};

const HEADER_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF171717' } };
const TOTAL_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF1F5F9' } };
const MONEY = '"$" #,##0';
const HOURS = '0.##';

const multiplierOf = (r: OvertimeRecord) => r.customMultiplier || OVERTIME_TYPES[r.type].multiplier;
const pctLabel = (m: number) => `${Number(((m - 1) * 100).toFixed(2))}%`;

export interface ExcelReportInput {
  monthLabel: string; // "Octubre de 2026"
  records: OvertimeRecord[]; // solo aprobados / enviados
  employees: Map<string, Employee>;
  settings: CompanySettings;
  generatedBy?: string;
}

function styleHeader(row: ReturnType<Worksheet['getRow']>) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = HEADER_FILL;
  row.alignment = { vertical: 'middle', wrapText: true };
  row.height = 32;
}

function addTitle(ws: Worksheet, title: string, input: ExcelReportInput, width: number) {
  ws.mergeCells(1, 1, 1, width);
  ws.getCell(1, 1).value = title;
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  ws.mergeCells(2, 1, 2, width);
  ws.getCell(2, 1).value = `${input.settings.companyName} · NIT ${input.settings.companyNIT} · Periodo: ${input.monthLabel}`;
  ws.mergeCells(3, 1, 3, width);
  ws.getCell(3, 1).value =
    `Aprobado por: ${input.settings.managerName} (${input.settings.managerTitle})` +
    (input.generatedBy ? ` · Generado por: ${input.generatedBy}` : '') +
    ` · ${new Date().toLocaleString('es-CO')}`;
  ws.getRow(2).font = { color: { argb: 'FF555555' } };
  ws.getRow(3).font = { color: { argb: 'FF555555' }, size: 9 };
}

export async function createOvertimeWorkbook(input: ExcelReportInput): Promise<Workbook> {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = input.settings.companyName;
  wb.created = new Date();

  const sorted = [...input.records].sort(
    (a, b) => a.employeeName.localeCompare(b.employeeName, 'es') || a.date.localeCompare(b.date)
  );

  // ---------- Hoja Resumen ----------
  const ws = wb.addWorksheet('Resumen', { views: [{ state: 'frozen', ySplit: 5 }] });
  const typeHeaders = TYPES.map((t) => `${TYPE_NAMES[t]} (${pctLabel(OVERTIME_TYPES[t].multiplier)}) h`);
  const headers = ['Empleado', 'Cédula', 'Cargo', ...typeHeaders, 'Total horas', 'Valor hora', 'Valor estimado'];
  addTitle(ws, 'Reporte de horas extras', input, headers.length);
  const headerRow = ws.getRow(5);
  headerRow.values = headers;
  styleHeader(headerRow);

  const byEmployee = new Map<string, OvertimeRecord[]>();
  sorted.forEach((r) => byEmployee.set(r.employeeId, [...(byEmployee.get(r.employeeId) || []), r]));

  let rowIndex = 6;
  byEmployee.forEach((recs, employeeId) => {
    const emp = input.employees.get(employeeId);
    const rate = emp?.baseHourlyRate || 0;
    const hoursByType = TYPES.map((t) => recs.filter((r) => r.type === t).reduce((s, r) => s + r.hours, 0));
    const value = recs.reduce((s, r) => s + r.hours * rate * multiplierOf(r), 0);
    const row = ws.getRow(rowIndex++);
    row.values = [
      recs[0].employeeName,
      emp?.documentId || 'S/D',
      emp?.position || '',
      ...hoursByType.map((h) => h || null),
      hoursByType.reduce((a, b) => a + b, 0),
      rate,
      Math.round(value),
    ];
  });

  const firstData = 6;
  const lastData = rowIndex - 1;
  const totalRow = ws.getRow(rowIndex);
  totalRow.getCell(1).value = 'TOTALES';
  if (lastData >= firstData) {
    for (let c = 4; c <= headers.length; c++) {
      if (c === headers.length - 1) continue; // valor hora: no se suma
      const col = ws.getColumn(c).letter;
      totalRow.getCell(c).value = { formula: `SUM(${col}${firstData}:${col}${lastData})` };
    }
  }
  totalRow.font = { bold: true };
  totalRow.fill = TOTAL_FILL;

  ws.columns.forEach((col, i) => {
    col.width = [30, 14, 26, 14, 14, 14, 14, 12, 13, 16][i] ?? 14;
  });
  for (let c = 4; c <= 8; c++) ws.getColumn(c).numFmt = HOURS;
  ws.getColumn(9).numFmt = MONEY;
  ws.getColumn(10).numFmt = MONEY;

  // ---------- Hoja Detalle ----------
  const wd = wb.addWorksheet('Detalle', { views: [{ state: 'frozen', ySplit: 5 }] });
  const dHeaders = ['Fecha', 'Día', 'Empleado', 'Cédula', 'Tipo', 'Recargo', 'Horas', 'Valor hora', 'Valor', 'Estado', 'Observación'];
  addTitle(wd, 'Detalle de horas extras', input, dHeaders.length);
  const dHeader = wd.getRow(5);
  dHeader.values = dHeaders;
  styleHeader(dHeader);
  sorted.forEach((r, i) => {
    const emp = input.employees.get(r.employeeId);
    const rate = emp?.baseHourlyRate || 0;
    const [y, m, d] = r.date.split('-').map(Number);
    wd.getRow(6 + i).values = [
      new Date(Date.UTC(y, m - 1, d)),
      formatShortDate(r.date).split(' ')[0],
      r.employeeName,
      emp?.documentId || 'S/D',
      TYPE_NAMES[r.type],
      pctLabel(multiplierOf(r)),
      r.hours,
      rate,
      Math.round(r.hours * rate * multiplierOf(r)),
      STATUS_NAMES[r.status],
      r.notes || '',
    ];
  });
  wd.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: dHeaders.length } };
  wd.columns.forEach((col, i) => {
    col.width = [12, 7, 30, 14, 18, 10, 9, 12, 13, 11, 45][i] ?? 14;
  });
  wd.getColumn(1).numFmt = 'dd/mm/yyyy';
  wd.getColumn(7).numFmt = HOURS;
  wd.getColumn(8).numFmt = MONEY;
  wd.getColumn(9).numFmt = MONEY;

  return wb;
}

// Genera y descarga el archivo en el navegador
export async function downloadOvertimeExcel(input: ExcelReportInput, fileName: string) {
  const wb = await createOvertimeWorkbook(input);
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
