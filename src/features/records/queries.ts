import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OvertimeRecord } from '@/types';
import { useAuth } from '@/features/auth/AuthProvider';
import { createRecords, deleteRecord, getRecords, markMonthSent, updateRecord, verifyAllMonthRecords } from './api';

export const recordKeys = {
  all: ['records'] as const,
  month: (userId: string, month: string) => ['records', userId, month] as const,
};

// Registros de un mes (YYYY-MM). Se cargan por mes para no superar el límite de filas de Supabase.
export function useMonthRecords(month: string) {
  const { profile, isDemo } = useAuth();
  const userId = isDemo ? 'demo' : profile?.id ?? 'anon';
  const query = useQuery({
    queryKey: recordKeys.month(userId, month),
    queryFn: () => getRecords(month),
  });
  return { ...query, records: query.data ?? [] };
}

function useInvalidateRecords() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: recordKeys.all });
}

export function useCreateRecords() {
  const invalidate = useInvalidateRecords();
  return useMutation({
    mutationFn: (records: Omit<OvertimeRecord, 'id' | 'createdAt'>[]) => createRecords(records),
    onSettled: invalidate,
  });
}

// Actualiza un registro mostrando el cambio de inmediato (si falla, se recarga el dato real)
export function useUpdateRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, partial }: { id: string; partial: Partial<OvertimeRecord> }) => updateRecord(id, partial),
    onMutate: async ({ id, partial }) => {
      await queryClient.cancelQueries({ queryKey: recordKeys.all });
      queryClient.setQueriesData<OvertimeRecord[]>({ queryKey: recordKeys.all }, (old) =>
        old?.map((r) => (r.id === id ? { ...r, ...partial } : r))
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: recordKeys.all }),
  });
}

export function useDeleteRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRecord(id),
    meta: { successMessage: 'Registro eliminado' },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: recordKeys.all });
      queryClient.setQueriesData<OvertimeRecord[]>({ queryKey: recordKeys.all }, (old) =>
        old?.filter((r) => r.id !== id)
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: recordKeys.all }),
  });
}

export function useVerifyMonth() {
  const invalidate = useInvalidateRecords();
  return useMutation({
    mutationFn: (month: string) => verifyAllMonthRecords(month),
    meta: { successMessage: 'Registros del mes aprobados' },
    onSettled: invalidate,
  });
}

export function useMarkMonthSent() {
  const invalidate = useInvalidateRecords();
  return useMutation({
    mutationFn: (month: string) => markMonthSent(month),
    onSettled: invalidate,
  });
}
