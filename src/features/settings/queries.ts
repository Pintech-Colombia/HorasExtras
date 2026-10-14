import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applyOvertimeRules, CompanySettings } from '@/types';
import { INITIAL_SETTINGS } from '@/data/defaults';
import { useAuth } from '@/features/auth/AuthProvider';
import { getCompanySettings, updateCompanySettings } from './api';

export const settingsKeys = {
  all: (userId: string) => ['settings', userId] as const,
};

// Configuración de la empresa. Al llegar, actualiza etiquetas y multiplicadores de recargos.
export function useCompanySettings() {
  const { profile, isDemo } = useAuth();
  const userId = isDemo ? 'demo' : profile?.id ?? 'anon';
  const query = useQuery({
    queryKey: settingsKeys.all(userId),
    queryFn: async () => {
      const settings = await getCompanySettings();
      applyOvertimeRules(settings.overtimeRules);
      return settings;
    },
  });
  return { ...query, settings: query.data ?? INITIAL_SETTINGS };
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: CompanySettings) => updateCompanySettings(settings),
    meta: { successMessage: 'Configuración guardada' },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
}
