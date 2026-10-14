import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Employee } from '@/types';
import { useAuth } from '@/features/auth/AuthProvider';
import { usePermissions } from '@/features/auth/permissions';
import { createEmployee, createMultipleEmployees, deleteEmployee, getEmployees, updateEmployee } from './api';

export const employeeKeys = {
  all: ['employees'] as const,
  list: (userId: string, withRates: boolean) => ['employees', userId, withRates] as const,
};

// Empleados de la empresa (con tarifas solo para los roles que pueden verlas)
export function useEmployees() {
  const { profile, isDemo } = useAuth();
  const { canSeeMoney } = usePermissions();
  const userId = isDemo ? 'demo' : profile?.id ?? 'anon';
  const query = useQuery({
    queryKey: employeeKeys.list(userId, canSeeMoney),
    queryFn: () => getEmployees(canSeeMoney),
  });
  return { ...query, employees: query.data ?? [] };
}

function useInvalidateEmployees() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: employeeKeys.all });
}

export function useCreateEmployee() {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: (emp: Omit<Employee, 'id'>) => createEmployee(emp),
    meta: { successMessage: 'Empleado creado' },
    onSettled: invalidate,
  });
}

export function useImportEmployees() {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: (emps: Omit<Employee, 'id'>[]) => createMultipleEmployees(emps),
    onSettled: invalidate,
  });
}

export function useUpdateEmployee() {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: ({ id, partial }: { id: string; partial: Partial<Employee> }) => updateEmployee(id, partial),
    meta: { successMessage: 'Empleado actualizado' },
    onSettled: invalidate,
  });
}

export function useDeleteEmployee() {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    meta: { successMessage: 'Empleado eliminado' },
    onSettled: invalidate,
  });
}
