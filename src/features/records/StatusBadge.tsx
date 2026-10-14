import { CheckCircle2, Circle, Lock } from 'lucide-react';
import { OvertimeRecord } from '@/types';
import { Badge } from '@/components/ui/badge';

// Estado de un registro con las mismas palabras en toda la app: Pendiente / Aprobado / Enviado
export function StatusBadge({ record, className }: { record: OvertimeRecord; className?: string }) {
  if (record.status === 'sent_accountant') {
    return (
      <Badge variant="secondary" className={className}>
        <Lock /> Enviado
      </Badge>
    );
  }
  if (record.verifiedByManager) {
    return (
      <Badge variant="success" className={className}>
        <CheckCircle2 /> Aprobado
      </Badge>
    );
  }
  return (
    <Badge variant="warning" className={className}>
      <Circle /> Pendiente
    </Badge>
  );
}
