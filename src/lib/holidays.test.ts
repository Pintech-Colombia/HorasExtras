import { describe, expect, it } from 'vitest';
import { getColombianHolidays, getHolidayName } from '@/lib/holidays';

describe('festivos de Colombia', () => {
  it('2026 coincide con el calendario oficial (18 festivos)', () => {
    const h = getColombianHolidays(2026);
    expect(h.size).toBe(18);
    expect([...h.keys()].sort()).toEqual(
      [
        '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01',
        '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29', '2026-07-20', '2026-08-07',
        '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16', '2026-12-08', '2026-12-25',
      ].sort()
    );
  });

  it('2027: Semana Santa y festivos trasladados al lunes', () => {
    expect(getHolidayName('2027-03-25')).toBe('Jueves Santo');
    expect(getHolidayName('2027-03-26')).toBe('Viernes Santo');
    expect(getHolidayName('2027-01-11')).toBe('Reyes Magos');
  });

  it('un día normal no es festivo', () => {
    expect(getHolidayName('2026-10-13')).toBeNull();
    expect(getHolidayName('')).toBeNull();
  });
});
