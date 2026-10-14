import { describe, expect, it } from 'vitest';
import { createOvertimeWorkbook } from './excelReport';
import { applyOvertimeRules, DEFAULT_OVERTIME_RULES, Employee, OvertimeRecord } from '../types';
import { INITIAL_SETTINGS } from '../data/defaults';

const emp = (id: string, name: string, rate: number): Employee => ({
  id, name, documentId: `CC-${id}`, position: 'Operario', department: 'Planta', baseHourlyRate: rate, active: true,
});
const rec = (id: string, employee: Employee, over: Partial<OvertimeRecord>): OvertimeRecord => ({
  id, date: '2026-10-13', employeeId: employee.id, employeeName: employee.name, hours: 2, type: 'diurna',
  status: 'verified_manager', verifiedByManager: true, createdAt: '', ...over,
});

describe('Excel de horas extras', () => {
  applyOvertimeRules(DEFAULT_OVERTIME_RULES);
  const ana = emp('a', 'Ana Torres', 10000);
  const juan = emp('j', 'Juan Pérez', 8000);
  const records = [
    rec('1', ana, { hours: 2, type: 'diurna' }),
    rec('2', ana, { hours: 1, type: 'festiva_diurna', date: '2026-10-18' }),
    rec('3', juan, { hours: 3, type: 'nocturna', customMultiplier: 1.75 }),
  ];

  it('genera Resumen por empleado con horas por tipo, valor y totales', async () => {
    const wb = await createOvertimeWorkbook({
      monthLabel: 'Octubre de 2026',
      records,
      employees: new Map([[ana.id, ana], [juan.id, juan]]),
      settings: INITIAL_SETTINGS,
    });
    const ws = wb.getWorksheet('Resumen')!;
    expect(ws.getCell('A1').value).toBe('Reporte de horas extras');
    expect(String(ws.getCell('F5').value)).toContain('115%');
    // Ana: 2 h diurna (1.25) + 1 h festiva diurna (2.15) a $10.000
    expect(ws.getRow(6).getCell(1).value).toBe('Ana Torres');
    expect(ws.getRow(6).getCell(8).value).toBe(3);
    expect(ws.getRow(6).getCell(10).value).toBe(Math.round(2 * 10000 * 1.25 + 1 * 10000 * 2.15));
    // Juan: 3 h nocturna (1.75) a $8.000
    expect(ws.getRow(7).getCell(10).value).toBe(42000);
    expect(ws.getRow(8).getCell(1).value).toBe('TOTALES');
    expect(ws.getRow(8).getCell(10).value).toEqual({ formula: 'SUM(J6:J7)' });
  });

  it('genera Detalle con un registro por fila y filtro', async () => {
    const wb = await createOvertimeWorkbook({
      monthLabel: 'Octubre de 2026', records, employees: new Map([[ana.id, ana], [juan.id, juan]]), settings: INITIAL_SETTINGS,
    });
    const wd = wb.getWorksheet('Detalle')!;
    expect(wd.rowCount).toBe(8); // 5 de encabezado + 3 registros
    expect(wd.getRow(6).getCell(5).value).toBe('Extra diurna');
    expect(wd.getRow(7).getCell(6).value).toBe('115%');
    expect(wd.autoFilter).toBeTruthy();
    const buffer = await wb.xlsx.writeBuffer();
    expect(buffer.byteLength).toBeGreaterThan(5000);
  });
});
