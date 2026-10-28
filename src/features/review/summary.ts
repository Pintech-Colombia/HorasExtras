import { Employee, OvertimeRecord, OvertimeType } from '@/types';
import { calculateRecordCost } from '@/lib/exporters';

export const OVERTIME_TYPE_ORDER: OvertimeType[] = ['diurna', 'nocturna', 'festiva_diurna', 'festiva_nocturna'];

export interface RecordsSummary {
  totalHours: number;
  pendingHours: number;
  pendingCount: number;
  hoursByType: Record<OvertimeType, number>;
  value: number; // valor estimado (el que lo muestra decide si el rol puede verlo)
  count: number;
}

export interface EmployeeSummary extends RecordsSummary {
  employeeId: string;
  employeeName: string;
  documentId?: string;
}

const round = (h: number) => Math.round(h * 100) / 100;

function emptySummary(): RecordsSummary {
  return {
    totalHours: 0,
    pendingHours: 0,
    pendingCount: 0,
    hoursByType: { diurna: 0, nocturna: 0, festiva_diurna: 0, festiva_nocturna: 0 },
    value: 0,
    count: 0,
  };
}

function add(s: RecordsSummary, r: OvertimeRecord, employees: Map<string, Employee>) {
  s.totalHours = round(s.totalHours + r.hours);
  s.hoursByType[r.type] = round(s.hoursByType[r.type] + r.hours);
  s.value += calculateRecordCost(r, employees);
  s.count++;
  if (!r.verifiedByManager) {
    s.pendingHours = round(s.pendingHours + r.hours);
    s.pendingCount++;
  }
}

// Totales de un grupo de registros: horas, horas por tipo, pendientes y valor estimado
export function summarizeRecords(records: OvertimeRecord[], employees: Map<string, Employee>): RecordsSummary {
  const s = emptySummary();
  records.forEach((r) => add(s, r, employees));
  return s;
}

// Una fila por empleado (como la hoja "Resumen" del Excel), ordenada por nombre
export function summarizeByEmployee(records: OvertimeRecord[], employees: Map<string, Employee>): EmployeeSummary[] {
  const byId = new Map<string, EmployeeSummary>();
  records.forEach((r) => {
    let row = byId.get(r.employeeId);
    if (!row) {
      row = {
        ...emptySummary(),
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        documentId: employees.get(r.employeeId)?.documentId,
      };
      byId.set(r.employeeId, row);
    }
    add(row, r, employees);
  });
  return [...byId.values()].sort((a, b) => a.employeeName.localeCompare(b.employeeName, 'es'));
}
