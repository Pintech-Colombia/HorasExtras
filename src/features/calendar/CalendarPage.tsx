import { useAuth } from '@/features/auth/AuthProvider';
import { usePermissions } from '@/features/auth/permissions';
import { useEmployees } from '@/features/employees/queries';
import { useRecordDialog } from '@/features/records/RecordDialogProvider';
import { useDeleteRecord, useMonthRecords, useUpdateRecord } from '@/features/records/queries';
import { useCompanySettings } from '@/features/settings/queries';
import { useSelectedMonth } from '@/hooks/useSelectedMonth';
import { CalendarView } from './CalendarView';

export function CalendarPage() {
  const [month, setMonth] = useSelectedMonth();
  const { profile } = useAuth();
  const { role, canRegister } = usePermissions();
  const { records } = useMonthRecords(month);
  const { employees } = useEmployees();
  const { settings } = useCompanySettings();
  const openRecordDialog = useRecordDialog();
  const updateRecord = useUpdateRecord();
  const deleteRecord = useDeleteRecord();

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
    <CalendarView
      selectedMonth={month}
      setSelectedMonth={setMonth}
      records={records}
      employees={employees}
      userRole={role}
      onAddForDate={openRecordDialog}
      onDeleteRecord={(id) => deleteRecord.mutate(id)}
      onToggleVerifyRecord={toggleVerify}
      currentUserId={profile?.id}
      rules={settings.overtimeRules}
      canRegister={canRegister}
    />
  );
}
