import { describe, expect, it } from 'vitest';
import { parseEmployeesCsv, parseMoney } from './csvImport';

describe('parseMoney', () => {
  it('entiende formatos colombianos e ingleses', () => {
    expect(parseMoney('15000')).toBe(15000);
    expect(parseMoney('15.000')).toBe(15000);
    expect(parseMoney('$ 1.250.000')).toBe(1250000);
    expect(parseMoney('15.000,50')).toBe(15000.5);
    expect(parseMoney('15,000.50')).toBe(15000.5);
    expect(parseMoney('15,5')).toBe(15.5);
    expect(parseMoney('')).toBe(0);
    expect(parseMoney('abc')).toBe(0);
  });
});

describe('parseEmployeesCsv', () => {
  it('lee archivos con punto y coma (Excel en español) y comillas', () => {
    const csv = '﻿cedula;nombre;cargo;departamento;valor_hora\r\n123;"Pérez; Ana";Operaria;Calidad;15.000\r\n\r\n';
    const { employees, skippedLines } = parseEmployeesCsv(csv);
    expect(skippedLines).toEqual([]);
    expect(employees).toEqual([
      {
        documentId: '123',
        name: 'Pérez; Ana',
        position: 'Operaria',
        department: 'Calidad',
        baseHourlyRate: 15000,
        active: true,
      },
    ]);
  });

  it('lee archivos con coma y omite filas sin cédula o nombre', () => {
    const csv = 'cedula,nombre,cargo,departamento,tarifa_hora\n456,Luis,,,\n,Sin cédula,,,\n789,,,,';
    const { employees, skippedLines } = parseEmployeesCsv(csv);
    expect(employees).toHaveLength(1);
    expect(employees[0]).toMatchObject({
      documentId: '456',
      name: 'Luis',
      position: 'Operario de Planta',
      baseHourlyRate: 0,
    });
    expect(skippedLines).toEqual([3, 4]);
  });
});
