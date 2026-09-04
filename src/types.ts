export type OvertimeType = 'diurna' | 'nocturna' | 'festiva_diurna' | 'festiva_nocturna';

export interface OvertimeTypeInfo {
  type: OvertimeType;
  label: string;
  multiplier: number; // e.g. 1.25, 1.75, 2.0, 2.5
  description: string;
  badgeBg: string;
  badgeText: string;
}

export const OVERTIME_TYPES: Record<OvertimeType, OvertimeTypeInfo> = {
  diurna: {
    type: 'diurna',
    label: 'Extra Diurna (25%)',
    multiplier: 1.25,
    description: 'Trabajo adicional en jornada diurna habitual (6:00 AM - 9:00 PM)',
    badgeBg: 'bg-slate-100 dark:bg-slate-800/80',
    badgeText: 'text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
  },
  nocturna: {
    type: 'nocturna',
    label: 'Extra Nocturna (75%)',
    multiplier: 1.75,
    description: 'Trabajo adicional en jornada nocturna (9:00 PM - 6:00 AM)',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    badgeText: 'text-indigo-900 dark:text-indigo-200 border-indigo-200/80 dark:border-indigo-800/80',
  },
  festiva_diurna: {
    type: 'festiva_diurna',
    label: 'Dominical/Festiva Diurna (100%)',
    multiplier: 2.0,
    description: 'Horas extras realizadas en domingo o festivo durante el día',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-900 dark:text-amber-200 border-amber-200/80 dark:border-amber-800/80',
  },
  festiva_nocturna: {
    type: 'festiva_nocturna',
    label: 'Dominical/Festiva Nocturna (150%)',
    multiplier: 2.5,
    description: 'Horas extras en domingo o festivo durante la noche',
    badgeBg: 'bg-slate-200 dark:bg-slate-800',
    badgeText: 'text-slate-900 dark:text-slate-100 border-slate-400 dark:border-slate-600',
  },
};

export interface Employee {
  id: string;
  documentId: string; // Cédula / DNI / ID fiscal
  name: string;
  position: string;
  department: string;
  baseHourlyRate: number; // Tarifa base por hora ordinaria
  active: boolean;
}

export interface OvertimeRecord {
  id: string;
  date: string; // Formato YYYY-MM-DD
  employeeId: string;
  employeeName: string;
  hours: number;
  type: OvertimeType;
  customMultiplier?: number;
  status: 'pending_review' | 'verified_manager' | 'sent_accountant';
  notes?: string;
  verifiedByManager?: boolean;
  verifiedAt?: string;
  createdAt: string;
}

export interface CompanySettings {
  companyName: string;
  companyNIT: string;
  accountantName: string;
  accountantEmail: string;
  managerName: string;
  managerTitle: string;
  currencySymbol: string;
}

export interface GeneratedEmailReport {
  subject: string;
  emailBodyText: string;
  auditSummary: string;
  generatedAt: string;
}

export type UserRole = 'supervisor' | 'manager' | 'accountant' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  companyId?: string;
}

export type PeriodType = 'full_month' | 'first_half' | 'second_half';
