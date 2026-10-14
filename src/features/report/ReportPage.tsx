import { toast } from 'sonner';
import { useEmployees } from '@/features/employees/queries';
import { useMarkMonthSent, useMonthRecords } from '@/features/records/queries';
import { useCompanySettings } from '@/features/settings/queries';
import { useSelectedMonth } from '@/hooks/useSelectedMonth';
import { GmailReportBuilder } from './GmailReportBuilder';

export function ReportPage() {
  const [month] = useSelectedMonth();
  const { records } = useMonthRecords(month);
  const { employees } = useEmployees();
  const { settings } = useCompanySettings();
  const markSent = useMarkMonthSent();

  const handleMarkSent = async () => {
    try {
      const count = await markSent.mutateAsync(month);
      toast.success(`${count} registro(s) marcados como enviados y bloqueados`);
      return count;
    } catch {
      return null;
    }
  };

  return (
    <GmailReportBuilder
      records={records}
      employees={employees}
      settings={settings}
      selectedMonth={month}
      onMarkMonthSent={handleMarkSent}
    />
  );
}
