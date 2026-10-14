import { describe, expect, it } from 'vitest';
import { formatShortDate } from './dates';

describe('fechas cortas', () => {
  it('formatea en español con día de la semana', () => {
    expect(formatShortDate('2026-10-02')).toBe('Vie 2 oct');
    expect(formatShortDate('2026-12-25')).toBe('Vie 25 dic');
    expect(formatShortDate('2027-01-03')).toBe('Dom 3 ene');
  });
  it('devuelve el texto original si no es una fecha', () => {
    expect(formatShortDate('')).toBe('');
  });
});
