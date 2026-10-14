import { CompanySettings, DEFAULT_OVERTIME_RULES } from '@/types';

export const INITIAL_SETTINGS: CompanySettings = {
  companyName: 'Pintech Colombia S.A.S.',
  companyNIT: '901.123.507-9',
  accountantName: 'Omar (Contador)',
  accountantEmail: 'contabilidad@pintech.co',
  managerName: 'Lorena Vargas',
  managerTitle: 'Jefa de Producción',
  currencySymbol: '$',
  overtimeRules: DEFAULT_OVERTIME_RULES,
};
