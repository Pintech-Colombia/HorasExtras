import { describe, expect, it } from 'vitest';
import { buildGmailFormattedText, calculateRecordCost } from './exporters';
import { applyOvertimeRules, DEFAULT_OVERTIME_RULES, Employee, OvertimeRecord } from '../types';
import { INITIAL_SETTINGS } from '../data/defaults';

const emp: Employee = {
  id: 'e1',
  documentId: '123',
  name: 'Ana <b>Pérez</b>',
  position: 'Operaria',
  department: 'Planta',
  baseHourlyRate: 10000,
  active: true,
};

const rec = (over: Partial<OvertimeRecord>): OvertimeRecord => ({
  id: 'r1',
  date: '2026-10-13',
  employeeId: 'e1',
  employeeName: emp.name,
  hours: 2,
  type: 'diurna',
  status: 'verified_manager',
  verifiedByManager: true,
  createdAt: '2026-10-13T00:00:00Z',
  ...over,
});

describe('valor de las horas extra', () => {
  applyOvertimeRules(DEFAULT_OVERTIME_RULES);
  const map = new Map([[emp.id, emp]]);

  it('usa el porcentaje vigente si el registro no tiene uno guardado', () => {
    expect(calculateRecordCost(rec({ type: 'festiva_diurna' }), map)).toBeCloseTo(2 * 10000 * 2.15);
  });

  it('usa el porcentaje congelado del registro (meses pasados no cambian)', () => {
    expect(calculateRecordCost(rec({ type: 'festiva_diurna', customMultiplier: 2.0 }), map)).toBe(40000);
  });

  it('empleado sin tarifa visible = 0 (no inventa valores)', () => {
    expect(calculateRecordCost(rec({ employeeId: 'otro' }), map)).toBe(0);
  });
});

describe('correo al contador', () => {
  it('muestra los porcentajes configurados y escapa el HTML de los nombres', () => {
    applyOvertimeRules(DEFAULT_OVERTIME_RULES);
    const { htmlText, plainText } = buildGmailFormattedText(
      'Octubre de 2026',
      [rec({})],
      new Map([[emp.id, emp]]),
      INITIAL_SETTINGS
    );
    expect(htmlText).toContain('Fest. Diurna (115%)');
    expect(htmlText).not.toContain('(100%)');
    expect(htmlText).toContain('Ana &lt;b&gt;Pérez&lt;/b&gt;');
    expect(plainText).toContain('Dominical/Festiva Nocturna (165%)');
  });
});
