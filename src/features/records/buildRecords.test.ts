import { describe, expect, it } from 'vitest';
import { DEFAULT_OVERTIME_RULES, Employee } from '@/types';
import { buildOvertimeRecords, getRegistrationWarnings } from './buildRecords';

const emp = (id: string, name: string): Employee => ({
  id,
  name,
  documentId: id,
  position: 'Operario',
  department: 'Operaciones',
  baseHourlyRate: 10000,
  active: true,
});
const employees = [emp('a', 'Ana'), emp('b', 'Beto')];

describe('buildOvertimeRecords', () => {
  it('crea un registro por empleado y tramo, omitiendo tramos en cero', () => {
    const recs = buildOvertimeRecords({
      date: '2026-10-14',
      employees,
      selectedIds: ['a', 'b'],
      segments: [
        { type: 'diurna', hours: 1 },
        { type: 'nocturna', hours: 0.5 },
        { type: 'nocturna', hours: 0 },
      ],
      notes: 'Despacho',
      verifyNow: false,
    });
    expect(recs).toHaveLength(4);
    expect(recs[0]).toMatchObject({
      employeeId: 'a',
      employeeName: 'Ana',
      type: 'diurna',
      hours: 1,
      status: 'pending_review',
    });
    expect(recs.every((r) => !r.verifiedByManager && r.verifiedAt === undefined)).toBe(true);
  });

  it('marca como aprobado cuando la Jefa aprueba de una vez', () => {
    const now = new Date('2026-10-14T12:00:00Z');
    const [rec] = buildOvertimeRecords({
      date: '2026-10-14',
      employees,
      selectedIds: ['a'],
      segments: [{ type: 'diurna', hours: 2 }],
      notes: '',
      verifyNow: true,
      now,
    });
    expect(rec).toMatchObject({ status: 'verified_manager', verifiedByManager: true, verifiedAt: now.toISOString() });
  });
});

describe('getRegistrationWarnings', () => {
  const base = { today: '2026-10-14', employees, rules: DEFAULT_OVERTIME_RULES, existingRecords: [] };

  it('avisa fecha futura, repetidos y exceso diario en día ordinario', () => {
    const w = getRegistrationWarnings({
      ...base,
      date: '2026-10-15', // jueves
      hours: 1.5,
      selectedIds: ['a'],
      existingRecords: [{ employeeId: 'a', date: '2026-10-15', hours: 1 }],
    });
    expect(w).toHaveLength(3);
    expect(w[0]).toContain('futura');
    expect(w[1]).toContain('Ana ya tiene 1h');
    expect(w[2]).toContain('2h 30m');
  });

  it('no avisa exceso en domingo', () => {
    const w = getRegistrationWarnings({ ...base, date: '2026-10-11', hours: 8, selectedIds: ['a'] });
    expect(w).toEqual([]);
  });
});
