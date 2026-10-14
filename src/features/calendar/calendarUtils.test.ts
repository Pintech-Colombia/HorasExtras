import { describe, expect, it } from 'vitest';
import { buildMonthWeeks, monthLabel, shiftMonth, shortName } from './calendarUtils';

describe('calendario', () => {
  it('octubre 2026 empieza en jueves y se completa con días vecinos (lunes a domingo)', () => {
    const weeks = buildMonthWeeks('2026-10');
    expect(weeks).toHaveLength(5);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks[0][0]).toMatchObject({ date: '2026-09-28', inMonth: false });
    expect(weeks[0][3]).toMatchObject({ date: '2026-10-01', inMonth: true, weekday: 4 });
    expect(weeks[4][6]).toMatchObject({ date: '2026-11-01', inMonth: false, weekday: 0 });
  });

  it('febrero 2027 (28 días, empieza lunes) = exactamente 4 semanas', () => {
    const weeks = buildMonthWeeks('2027-02');
    expect(weeks).toHaveLength(4);
    expect(weeks.flat().every((d) => d.inMonth)).toBe(true);
  });

  it('cambia de mes cruzando el año', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });

  it('etiquetas en español', () => {
    expect(monthLabel('2026-10').toLowerCase()).toContain('octubre');
    expect(shortName('Carlos Alberto Mendoza')).toBe('Carlos A.');
    expect(shortName('Ana Torres')).toBe('Ana T.');
  });
});
