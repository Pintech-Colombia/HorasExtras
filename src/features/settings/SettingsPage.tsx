import { INITIAL_SETTINGS } from '@/data/defaults';
import { usePermissions } from '@/features/auth/permissions';
import { CompanySettingsView } from './CompanySettingsView';
import { useCompanySettings, useUpdateSettings } from './queries';

export function SettingsPage() {
  const { role } = usePermissions();
  const { settings } = useCompanySettings();
  const updateSettings = useUpdateSettings();

  return (
    <CompanySettingsView
      settings={settings}
      userRole={role}
      onSaveSettings={(s) => updateSettings.mutate(s)}
      onResetDefaults={() => updateSettings.mutate(INITIAL_SETTINGS)}
    />
  );
}
