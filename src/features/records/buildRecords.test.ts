import { describe, expect, it } from 'vitest';
import { DEFAULT_OVERTIME_RULES, Employee } from '@/types';
import { buildCopies, buildOvertimeRecords, getRegistrationWarnings, typeForDate } from './buildRecords';

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

describe('buildCopies', () => {
  const original = {
    id: 'x',
    date: '2026-10-20', // martes
    employeeId: 'a',
    employeeName: 'Ana',
    hours: 2,
    type: 'diurna' as const,
    customMultiplier: 1.25,
    status: 'verified_manager' as const,
    notes: 'Despacho',
    verifiedByManager: true,
    createdAt: '2026-10-20T12:00:00Z',
  };

  it('copia a un día hábil como pendiente, con la misma persona, horas y observación', () => {
    const [copy] = buildCopies({
      records: [original],
      targetDate: '2026-10-22',
      rules: DEFAULT_OVERTIME_RULES,
      verifyNow: false,
    });
    expect(copy).toEqual({
      date: '2026-10-22',
      employeeId: 'a',
      employeeName: 'Ana',
      hours: 2,
      type: 'diurna',
      status: 'pending_review',
      notes: 'Despacho',
      verifiedByManager: false,
      verifiedAt: undefined,
    });
    expect(copy).not.toHaveProperty('customMultiplier'); // el porcentaje lo fija el servidor al crear
  });

  it('a domingo o festivo pasa a festiva, conservando diurna/nocturna', () => {
    const night = { ...original, type: 'nocturna' as const };
    const copies = buildCopies({
      records: [original, night],
      targetDate: '2026-10-25',
      rules: DEFAULT_OVERTIME_RULES,
      verifyNow: true,
    });
    expect(copies.map((c) => c.type)).toEqual(['festiva_diurna', 'festiva_nocturna']);
    expect(copies[0]).toMatchObject({ status: 'verified_manager', verifiedByManager: true });
  });

  it('de festivo a día hábil vuelve a diurna/nocturna', () => {
    expect(typeForDate('festiva_nocturna', '2026-10-21', DEFAULT_OVERTIME_RULES)).toBe('nocturna');
  });
});
