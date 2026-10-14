// Almacenamiento local SOLO para el modo demostración de desarrollo (sin Supabase).
// En producción la app trabaja exclusivamente contra Supabase y nunca usa estos datos.
import { Employee, OvertimeRecord, CompanySettings, normalizeOvertimeRules } from '@/types';
import { INITIAL_SETTINGS } from '@/data/defaults';
import { DEMO_EMPLOYEES, getDemoRecords } from '@/data/demoData';

const KEYS = {
  EMPLOYEES: 'he_app_employees_v1',
  RECORDS: 'he_app_records_v1',
  SETTINGS: 'he_app_settings_v1',
};

const load = <T>(key: string, fallback: () => T): T => {
  if (!import.meta.env.DEV) return fallback();
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      const initial = fallback();
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  } catch {
    return fallback();
  }
};

const save = (key: string, value: unknown) => {
  if (!import.meta.env.DEV) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // almacenamiento lleno o bloqueado: se ignora en modo demo
  }
};

export const loadEmployees = (): Employee[] =>
  load(KEYS.EMPLOYEES, () => (import.meta.env.DEV ? DEMO_EMPLOYEES : []));
export const saveEmployees = (employees: Employee[]) => save(KEYS.EMPLOYEES, employees);

export const loadRecords = (): OvertimeRecord[] =>
  load(KEYS.RECORDS, () => (import.meta.env.DEV ? getDemoRecords() : []));
export const saveRecords = (records: OvertimeRecord[]) => save(KEYS.RECORDS, records);

export const loadSettings = (): CompanySettings => {
  const s = load<CompanySettings>(KEYS.SETTINGS, () => INITIAL_SETTINGS);
  return { ...INITIAL_SETTINGS, ...s, overtimeRules: normalizeOvertimeRules(s.overtimeRules) };
};
export const saveSettings = (settings: CompanySettings) => save(KEYS.SETTINGS, settings);
