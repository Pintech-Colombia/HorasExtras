import { useNavigate } from 'react-router';
import { usePermissions } from '@/features/auth/permissions';
import { useEmployees } from '@/features/employees/queries';
import { useDeleteRecord, useMonthRecords, useUpdateRecord, useVerifyMonth } from '@/features/records/queries';
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
      onUpdateRecord={(id, partial) => updateRecord.mutate({ id, partial })}
      onGoToGmailReport={() => navigate({ pathname: '/reporte', search: window.location.search })}
    />
  );
}
