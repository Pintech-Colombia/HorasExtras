import { Employee, OvertimeRecord } from '@/types';

// Datos ya calculados de una fila de Auditoría (los comparten la tabla de PC y las tarjetas de celular)
export interface ReviewItem {
  record: OvertimeRecord;
  employee?: Employee;
  cost: number | null; // null = el rol no ve valores
  dayAlert?: number; // horas del día si superan el límite habitual
  locked: boolean; // enviado a contabilidad
}

export interface ReviewActions {
  canEdit: boolean;
  currencySymbol: string;
  onToggleVerify: (id: string) => void;
  onEdit: (record: OvertimeRecord) => void;
  onDelete: (record: OvertimeRecord) => void;
}
