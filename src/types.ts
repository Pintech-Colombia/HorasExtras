export type OvertimeType = 'diurna' | 'nocturna' | 'festiva_diurna' | 'festiva_nocturna';

export interface OvertimeTypeInfo {
  type: OvertimeType;
  label: string;
  multiplier: number; // e.g. 1.25, 1.75, 2.0, 2.5
  description: string;
  badgeBg: string;
  badgeText: string;
}

// Reglas de recargos y jornada, configurables por Contabilidad/Admin.
// Porcentajes = recargo sobre la hora ordinaria (25 => se paga 1.25x).
export interface OvertimeRules {
  extraDiurnaPct: number;
  extraNocturnaPct: number;
  festivaDiurnaPct: number;
  festivaNocturnaPct: number;
  nightStart: string; // HH:MM inicio de la jornada nocturna
  nightEnd: string; // HH:MM fin de la jornada nocturna
  shiftStart: string; // HH:MM ingreso habitual
  // Hora de salida ordinaria por día (1 = lunes ... 6 = sábado). null = sin jornada ordinaria (todo es extra)
  shiftEnds: Record<string, string | null>;
  saturdayAsHoliday: boolean; // true = las horas del sábado se pagan con recargo festivo
}

// Valores por defecto: Ley 2466 de 2025 (recargo dominical 90% desde jul-2026, nocturno desde 7 PM).
export const DEFAULT_OVERTIME_RULES: OvertimeRules = {
  extraDiurnaPct: 25,
  extraNocturnaPct: 75,
  festivaDiurnaPct: 115,
  festivaNocturnaPct: 165,
  nightStart: '19:00',
  nightEnd: '06:00',
  shiftStart: '07:30',
  shiftEnds: { '1': '17:00', '2': '17:00', '3': '16:30', '4': '17:00', '5': '17:00', '6': null },
  saturdayAsHoliday: false,
};

export const normalizeOvertimeRules = (raw?: Partial<OvertimeRules> | null): OvertimeRules => ({
  ...DEFAULT_OVERTIME_RULES,
  ...(raw || {}),
  shiftEnds: { ...DEFAULT_OVERTIME_RULES.shiftEnds, ...(raw?.shiftEnds || {}) },
});

const formatPct = (pct: number) => `${Number(pct.toFixed(2))}%`;

export const OVERTIME_TYPES: Record<OvertimeType, OvertimeTypeInfo> = {
  diurna: {
    type: 'diurna',
    label: '',
    multiplier: 1,
    description: '',
    badgeBg: 'bg-slate-100 dark:bg-slate-800/80',
    badgeText: 'text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
  },
  nocturna: {
    type: 'nocturna',
    label: '',
    multiplier: 1,
    description: '',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    badgeText: 'text-indigo-900 dark:text-indigo-200 border-indigo-200/80 dark:border-indigo-800/80',
  },
  festiva_diurna: {
    type: 'festiva_diurna',
    label: '',
    multiplier: 1,
    description: '',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-900 dark:text-amber-200 border-amber-200/80 dark:border-amber-800/80',
  },
  festiva_nocturna: {
    type: 'festiva_nocturna',
    label: '',
    multiplier: 1,
    description: '',
    badgeBg: 'bg-slate-200 dark:bg-slate-800',
    badgeText: 'text-slate-900 dark:text-slate-100 border-slate-400 dark:border-slate-600',
  },
};

// Actualiza etiquetas y multiplicadores de OVERTIME_TYPES con las reglas vigentes de la empresa.
export const applyOvertimeRules = (rules: OvertimeRules) => {
  const day = `${rules.nightEnd} - ${rules.nightStart}`;
  const night = `${rules.nightStart} - ${rules.nightEnd}`;
  const set = (t: OvertimeType, name: string, pct: number, description: string) => {
    OVERTIME_TYPES[t].label = `${name} (${formatPct(pct)})`;
    OVERTIME_TYPES[t].multiplier = 1 + pct / 100;
    OVERTIME_TYPES[t].description = description;
  };
  set('diurna', 'Extra Diurna', rules.extraDiurnaPct, `Hora extra en jornada diurna (${day})`);
  set('nocturna', 'Extra Nocturna', rules.extraNocturnaPct, `Hora extra en jornada nocturna (${night})`);
  set('festiva_diurna', 'Dominical/Festiva Diurna', rules.festivaDiurnaPct, `Hora extra en domingo o festivo (${day})`);
  set('festiva_nocturna', 'Dominical/Festiva Nocturna', rules.festivaNocturnaPct, `Hora extra en domingo o festivo (${night})`);
};

applyOvertimeRules(DEFAULT_OVERTIME_RULES);

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
  createdBy?: string;
}

export interface CompanySettings {
  companyName: string;
  companyNIT: string;
  accountantName: string;
  accountantEmail: string;
  managerName: string;
  managerTitle: string;
  currencySymbol: string;
  overtimeRules: OvertimeRules;
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
  mustChangePassword?: boolean;
}

