import { supabase } from '../lib/supabase';
import { CompanySettings, normalizeOvertimeRules } from '../types';
import { INITIAL_SETTINGS } from '../data/defaults';
import { loadSettings, saveSettings } from '../utils/storage';
import { fail } from './errors';

export const getCompanySettings = async (): Promise<CompanySettings> => {
  if (!supabase) return loadSettings();

  // RLS limita la consulta a la empresa del usuario
  const { data, error } = await supabase.from('companies').select('*').limit(1).maybeSingle();
  if (error) fail(error, 'No se pudo cargar la configuración de la empresa.');
  if (!data) fail(null, 'Su usuario no está asociado a una empresa. Contacte al administrador.');

  return {
    companyName: data.name || INITIAL_SETTINGS.companyName,
    companyNIT: data.nit || '',
    accountantName: data.accountant_name || '',
    accountantEmail: data.accountant_email || '',
    managerName: data.manager_name || '',
    managerTitle: data.manager_title || '',
    currencySymbol: data.currency_symbol || '$',
    overtimeRules: normalizeOvertimeRules(data.overtime_rules),
  };
};

export const updateCompanySettings = async (settings: CompanySettings): Promise<void> => {
  if (!supabase) {
    saveSettings(settings);
    return;
  }

  const payload = {
    name: settings.companyName,
    nit: settings.companyNIT,
    accountant_name: settings.accountantName,
    accountant_email: settings.accountantEmail,
    manager_name: settings.managerName,
    manager_title: settings.managerTitle,
    currency_symbol: settings.currencySymbol,
    overtime_rules: settings.overtimeRules,
    updated_at: new Date().toISOString(),
  };

  const { data: company, error: findError } = await supabase.from('companies').select('id').limit(1).maybeSingle();
  if (findError || !company) fail(findError, 'No se encontró la empresa para actualizar.');

  const { data, error } = await supabase.from('companies').update(payload).eq('id', company.id).select('id');
  if (error) fail(error, 'No se pudo guardar la configuración.');
  if (!data || data.length === 0) fail(null, 'No tiene permisos para modificar la configuración.');
};
