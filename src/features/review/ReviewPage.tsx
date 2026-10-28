import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { usePermissions } from '@/features/auth/permissions';
import { useEmployees } from '@/features/employees/queries';
import { NewRecord } from '@/features/records/buildRecords';
import {
  useCreateRecords,
  useDeleteRecord,
  useDeleteRecords,
  useMonthRecords,
  useUpdateRecord,
  useVerifyMonth,
} from '@/features/records/queries';
import { monthLabel } from '@/features/calendar/calendarUtils';
import { formatShortDate } from '@/lib/dates';
import { useCompanySettings } from '@/features/settings/queries';
import { useSelectedMonth } from '@/hooks/useSelectedMonth';
import { ManagerReviewView } from './ManagerReviewView';

export function ReviewPage() {
  const [month] = useSelectedMonth();
  const navigate = useNavigate();
  const { role } = usePermissions();
  const { records } = useMonthRecords(month);
  const { employees } = useEmployees();
  const { settings } = useCompanySettings();
  const updateRecord = useUpdateRecord();
  const deleteRecord = useDeleteRecord();
  const deleteRecords = useDeleteRecords();
  const createRecords = useCreateRecords();
  const verifyMonth = useVerifyMonth();

  const toggleVerify = (id: string) => {
    const rec = records.find((r) => r.id === id);
    if (!rec) return;
    const verified = !rec.verifiedByManager;
    updateRecord.mutate({
      id,
      partial: { verifiedByManager: verified, status: verified ? 'verified_manager' : 'pending_review' },
    });
  };

  // Los errores ya se muestran como aviso automático; aquí solo el mensaje de éxito
  const handleDeleteMany = async (ids: string[]) => {
    try {
      const n = await deleteRecords.mutateAsync(ids);
      toast.success(n === 1 ? 'Registro eliminado' : `${n} registros eliminados`);
      return true;
    } catch {
      return false;
    }
  };

  const handleCopy = async (copies: NewRecord[], targetDate: string) => {
    try {
      const created = await createRecords.mutateAsync(copies);
      const otherMonth = !targetDate.startsWith(month);
      toast.success(
        `${created.length} registro(s) copiados al ${formatShortDate(targetDate)}` +
          (otherMonth ? `. Están en ${monthLabel(targetDate.slice(0, 7))}: cambia el mes arriba para verlos.` : '')
      );
      return true;
    } catch {
      return false;
    }
  };

  return (
    <ManagerReviewView
      records={records}
      employees={employees}
      settings={settings}
      selectedMonth={month}
      userRole={role}
      onToggleVerify={toggleVerify}
      onVerifyAllMonth={() => verifyMonth.mutate(month)}
      onDeleteRecord={(id) => deleteRecord.mutate(id)}
      onDeleteRecords={handleDeleteMany}
      onCopyRecords={handleCopy}
      onUpdateRecord={(id, partial) => updateRecord.mutate({ id, partial })}
      onGoToGmailReport={() => navigate({ pathname: '/reporte', search: window.location.search })}
    />
  );
}
