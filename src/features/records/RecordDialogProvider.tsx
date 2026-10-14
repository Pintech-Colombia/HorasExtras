import * as React from 'react';
import { toast } from 'sonner';
import { OvertimeRecord } from '@/types';
import { usePermissions } from '@/features/auth/permissions';
import { useEmployees } from '@/features/employees/queries';
import { useCompanySettings } from '@/features/settings/queries';
import { useSelectedMonth } from '@/hooks/useSelectedMonth';
import { AddOvertimeDialog } from './AddOvertimeDialog';
import { useCreateRecords, useMonthRecords } from './queries';

type OpenRecordDialog = (date?: string) => void;

const RecordDialogContext = React.createContext<OpenRecordDialog | null>(null);

// Ventana de "Registrar horas" disponible en toda la app (barra superior y calendario)
export function RecordDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [initialDate, setInitialDate] = React.useState<string | undefined>();
  const [month] = useSelectedMonth();
  const { employees } = useEmployees();
  const { records } = useMonthRecords(month);
  const { settings } = useCompanySettings();
  const { canApprove } = usePermissions();
  const createRecords = useCreateRecords();

  const openDialog = React.useCallback<OpenRecordDialog>((date) => {
    setInitialDate(date);
    setOpen(true);
  }, []);

  const handleSave = async (newRecords: Omit<OvertimeRecord, 'id' | 'createdAt'>[]) => {
    try {
      const created = await createRecords.mutateAsync(newRecords);
      toast.success(created.length === 1 ? 'Registro guardado' : `${created.length} registros guardados`);
      return true;
    } catch {
      return false; // el error ya se mostró como aviso; la ventana queda abierta para reintentar
    }
  };

  return (
    <RecordDialogContext.Provider value={openDialog}>
      {children}
      <AddOvertimeDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        employees={employees.filter((e) => e.active)}
        initialDate={initialDate}
        onSaveRecords={handleSave}
        rules={settings.overtimeRules}
        canVerify={canApprove}
        existingRecords={records}
      />
    </RecordDialogContext.Provider>
  );
}

export function useRecordDialog(): OpenRecordDialog {
  const ctx = React.useContext(RecordDialogContext);
  if (!ctx) throw new Error('useRecordDialog debe usarse dentro de <RecordDialogProvider>');
  return ctx;
}
