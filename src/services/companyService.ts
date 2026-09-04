import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CompanySettings } from '../types';
import { loadSettings, saveSettings } from '../utils/storage';

export const getCompanySettings = async (companyId?: string): Promise<CompanySettings> => {
  if (!isSupabaseConfigured() || !supabase) {
    return loadSettings();
  }

  try {
    let query = supabase.from('companies').select('*').limit(1);
    if (companyId) {
      query = query.eq('id', companyId);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return loadSettings();
    }

    const comp = data[0];
    const mapped: CompanySettings = {
      companyName: comp.name || 'Pintech Colombia S.A.S.',
      companyNIT: comp.nit || '901.456.789-0',
      accountantName: comp.accountant_name || 'Dpto. Contabilidad & Nómina',
      accountantEmail: comp.accountant_email || 'contabilidad@pintech.co',
      managerName: comp.manager_name || 'Jefe de Operaciones & Planta',
      managerTitle: comp.manager_title || 'Operaciones Pintech',
      currencySymbol: comp.currency_symbol || '$',
    };

    saveSettings(mapped);
    return mapped;
  } catch (err) {
    console.error('Error fetching company settings from Supabase:', err);
    return loadSettings();
  }
};

export const updateCompanySettings = async (
  settings: CompanySettings,
  companyId?: string
): Promise<void> => {
  saveSettings(settings);

  if (isSupabaseConfigured() && supabase) {
    try {
      const payload: any = {
        name: settings.companyName,
        nit: settings.companyNIT,
        accountant_name: settings.accountantName,
        accountant_email: settings.accountantEmail,
        manager_name: settings.managerName,
        manager_title: settings.managerTitle,
        currency_symbol: settings.currencySymbol,
        updated_at: new Date().toISOString(),
      };

      if (companyId) {
        await supabase.from('companies').update(payload).eq('id', companyId);
      } else {
        // Actualizar la primera empresa disponible
        const { data } = await supabase.from('companies').select('id').limit(1);
        if (data && data.length > 0) {
          await supabase.from('companies').update(payload).eq('id', data[0].id);
        } else {
          await supabase.from('companies').insert([payload]);
        }
      }
    } catch (err) {
      console.error('Error updating company settings in Supabase:', err);
    }
  }
};
