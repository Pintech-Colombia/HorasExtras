import { describe, expect, it } from 'vitest';
import { getPermissions } from './permissions';

// Debe coincidir con el cuadro de permisos acordado (y con las reglas RLS de supabase/schema.sql)
describe('permisos por rol', () => {
  it('supervisor: solo registra; no ve dinero ni pantallas de oficina', () => {
    expect(getPermissions('supervisor')).toEqual({
      canRegister: true,
      canApprove: false,
      canEditRecords: false,
      canSeeMoney: false,
      canEditEmployees: false,
      canEditRates: false,
      canEditSettings: false,
      canAccessOffice: false,
    });
  });

  it('jefa: puede todo', () => {
    expect(Object.values(getPermissions('manager')).every(Boolean)).toBe(true);
  });

  it('contador: no registra, no aprueba, no edita empleados; sí valor hora y configuración', () => {
    const p = getPermissions('accountant');
    expect(p.canRegister).toBe(false);
    expect(p.canApprove).toBe(false);
    expect(p.canEditRecords).toBe(false);
    expect(p.canEditEmployees).toBe(false);
    expect(p.canEditRates).toBe(true);
    expect(p.canEditSettings).toBe(true);
    expect(p.canSeeMoney).toBe(true);
  });

  it('admin: puede todo', () => {
    expect(Object.values(getPermissions('admin')).every(Boolean)).toBe(true);
  });
});
