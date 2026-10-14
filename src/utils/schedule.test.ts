import { describe, expect, it } from 'vitest';
import { calculateOvertimeFromDeparture as calc, getDailyOvertimeAlerts, getWorkScheduleForDate } from './schedule';
import { DEFAULT_OVERTIME_RULES as R, normalizeOvertimeRules } from '../types';

describe('cálculo por hora de salida', () => {
  it('martes 6:30 PM = 1.5 h diurnas', () => {
    expect(calc('2026-10-13', '18:30', '07:30', R).segments).toEqual([{ type: 'diurna', hours: 1.5 }]);
  });

  it('martes 9:00 PM = 2 h diurnas + 2 h nocturnas (noche desde 7 PM)', () => {
    expect(calc('2026-10-13', '21:00', '07:30', R).segments).toEqual([
      { type: 'diurna', hours: 2 },
      { type: 'nocturna', hours: 2 },
    ]);
  });

  it('miércoles sale a las 4:30 PM: 6:00 PM = 1.5 h', () => {
    expect(calc('2026-10-14', '18:00', '07:30', R).hours).toBe(1.5);
  });

  it('salida de madrugada cuenta como día siguiente', () => {
    expect(calc('2026-10-13', '01:00', '07:30', R).segments).toEqual([
      { type: 'diurna', hours: 2 },
      { type: 'nocturna', hours: 6 },
    ]);
  });

  it('salir antes de la hora oficial no genera extras', () => {
    expect(calc('2026-10-13', '16:00', '07:30', R).hours).toBe(0);
  });

  it('sábado: extra normal (no festiva) por defecto', () => {
    expect(calc('2026-10-17', '13:30', '07:30', R).segments).toEqual([{ type: 'diurna', hours: 6 }]);
  });

  it('sábado como festivo si la empresa lo configura', () => {
    const rules = { ...R, saturdayAsHoliday: true };
    expect(calc('2026-10-17', '13:30', '07:30', rules).segments).toEqual([{ type: 'festiva_diurna', hours: 6 }]);
  });

  it('domingo: recargo festivo diurno y nocturno', () => {
    expect(calc('2026-10-18', '20:00', '07:30', R).segments).toEqual([
      { type: 'festiva_diurna', hours: 11.5 },
      { type: 'festiva_nocturna', hours: 1 },
    ]);
  });

  it('festivo entre semana (Día de la Raza 2026)', () => {
    const s = getWorkScheduleForDate('2026-10-12', R);
    expect(s.isHoliday).toBe(true);
    expect(calc('2026-10-12', '12:00', '08:00', R).segments).toEqual([{ type: 'festiva_diurna', hours: 4 }]);
  });

  it('respeta un horario nocturno configurado distinto', () => {
    const rules = { ...R, nightStart: '21:00' };
    expect(calc('2026-10-13', '21:00', '07:30', rules).segments).toEqual([{ type: 'diurna', hours: 4 }]);
  });
});

describe('alertas de más de 2 h extra al día', () => {
  it('suma los registros del mismo empleado y día', () => {
    const alerts = getDailyOvertimeAlerts(
      [
        { employeeId: 'a', date: '2026-10-13', hours: 1.5 },
        { employeeId: 'a', date: '2026-10-13', hours: 1 },
        { employeeId: 'b', date: '2026-10-13', hours: 2 },
      ],
      R
    );
    expect(alerts.get('a|2026-10-13')).toBe(2.5);
    expect(alerts.has('b|2026-10-13')).toBe(false);
  });

  it('no alerta en domingos (no hay jornada ordinaria)', () => {
    expect(getDailyOvertimeAlerts([{ employeeId: 'a', date: '2026-10-18', hours: 8 }], R).size).toBe(0);
  });
});

describe('reglas de recargo', () => {
  it('completa valores faltantes con los de ley', () => {
    const r = normalizeOvertimeRules({ extraDiurnaPct: 30, shiftEnds: { '3': '16:00' } });
    expect(r.extraDiurnaPct).toBe(30);
    expect(r.festivaDiurnaPct).toBe(115);
    expect(r.shiftEnds['1']).toBe('17:00');
    expect(r.shiftEnds['3']).toBe('16:00');
  });
});
