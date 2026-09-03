import { Employee, OvertimeRecord, CompanySettings } from '../types';
import { INITIAL_EMPLOYEES, INITIAL_SETTINGS, getInitialRecords } from '../data/initialData';

const KEYS = {
  EMPLOYEES: 'he_app_employees_v1',
  RECORDS: 'he_app_records_v1',
  SETTINGS: 'he_app_settings_v1',
};

export const loadEmployees = (): Employee[] => {
  try {
    const data = localStorage.getItem(KEYS.EMPLOYEES);
    if (!data) {
      saveEmployees(INITIAL_EMPLOYEES);
      return INITIAL_EMPLOYEES;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Error loading employees:', e);
    return INITIAL_EMPLOYEES;
  }
};

export const saveEmployees = (employees: Employee[]) => {
  try {
    localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(employees));
  } catch (e) {
    console.error('Error saving employees:', e);
  }
};

export const loadRecords = (): OvertimeRecord[] => {
  try {
    const data = localStorage.getItem(KEYS.RECORDS);
    if (!data) {
      const initial = getInitialRecords();
      saveRecords(initial);
      return initial;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Error loading records:', e);
    return getInitialRecords();
  }
};

export const saveRecords = (records: OvertimeRecord[]) => {
  try {
    localStorage.setItem(KEYS.RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving records:', e);
  }
};

export const loadSettings = (): CompanySettings => {
  try {
    const data = localStorage.getItem(KEYS.SETTINGS);
    if (!data) {
      saveSettings(INITIAL_SETTINGS);
      return INITIAL_SETTINGS;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Error loading settings:', e);
    return INITIAL_SETTINGS;
  }
};

export const saveSettings = (settings: CompanySettings) => {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
};

export const resetDataToDefaults = () => {
  localStorage.removeItem(KEYS.EMPLOYEES);
  localStorage.removeItem(KEYS.RECORDS);
  localStorage.removeItem(KEYS.SETTINGS);
  return {
    employees: loadEmployees(),
    records: loadRecords(),
    settings: loadSettings(),
  };
};
