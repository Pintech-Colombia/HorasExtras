import { CompanySettings, DEFAULT_OVERTIME_RULES } from '@/types';

// Valores genéricos: solo se usan mientras cargan los datos reales (que viven en la base de datos)
// y en el modo demostración local. El repositorio es público: aquí no van nombres ni datos reales.
export const INITIAL_SETTINGS: CompanySettings = {
  companyName: 'Empresa',
  companyNIT: '',
  accountantName: 'Contabilidad',
  accountantEmail: '',
  managerName: 'Jefa de Producción',
  managerTitle: 'Jefa de Producción',
  currencySymbol: '$',
  overtimeRules: DEFAULT_OVERTIME_RULES,
};
