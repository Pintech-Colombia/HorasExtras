import { describe, expect, it } from 'vitest';
import { Employee, OvertimeRecord } from '@/types';
import { summarizeByEmployee, summarizeRecords } from './summary';

const emp = (id: string, name: string, rate: number): Employee => ({
  id,
  name,
  documentId: `CC-${id}`,
  position: 'Operario',
  department: 'Operaciones',
  baseHourlyRate: rate,
  active: true,
});
const employees = new Map([emp('a', 'Beto', 10000), emp('b', 'Ana', 20000)].map((e) => [e.id, e]));

const rec = (p: Partial<OvertimeRecord>): OvertimeRecord => ({
  id: Math.random().toString(),
  date: '2026-10-01',
  employeeId: 'a',
  employeeName: 'Beto',
  hours: 1,
  type: 'diurna',
  customMultiplier: 1.25,
  status: 'verified_manager',
  notes: '',
  verifiedByManager: true,
  createdAt: '',
  ...p,
});

const records = [
  rec({ hours: 2 }),
  rec({ hours: 0.5, type: 'nocturna', customMultiplier: 1.75, verifiedByManager: false, status: 'pending_review' }),
  rec({ employeeId: 'b', employeeName: 'Ana', hours: 1.5, type: 'festiva_diurna', customMultiplier: 2.15 }),
];

describe('summarizeRecords', () => {
  it('suma horas, tipos, pendientes y valor congelado', () => {
    const s = summarizeRecords(records, employees);
    expect(s.totalHours).toBe(4);
    expect(s.pendingHours).toBe(0.5);
    expect(s.pendingCount).toBe(1);
    expect(s.hoursByType).toEqual({ diurna: 2, nocturna: 0.5, festiva_diurna: 1.5, festiva_nocturna: 0 });
    // 2*10000*1,25 + 0,5*10000*1,75 + 1,5*20000*2,15
    expect(Math.round(s.value)).toBe(25000 + 8750 + 64500);
  });

  it('sin registros todo queda en cero', () => {
    expect(summarizeRecords([], employees)).toMatchObject({ totalHours: 0, pendingHours: 0, value: 0, count: 0 });
  });
});

describe('summarizeByEmployee', () => {
  it('agrupa por empleado y ordena por nombre', () => {
    const rows = summarizeByEmployee(records, employees);
    expect(rows.map((r) => r.employeeName)).toEqual(['Ana', 'Beto']);
    expect(rows[1]).toMatchObject({
      employeeId: 'a',
      documentId: 'CC-a',
      totalHours: 2.5,
      pendingHours: 0.5,
      count: 2,
    });
  });
});
