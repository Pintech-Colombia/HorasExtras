import { toast } from 'sonner';
import { Employee } from '@/types';
import { usePermissions } from '@/features/auth/permissions';
import { EmployeeManager } from './EmployeeManager';
import { useCreateEmployee, useDeleteEmployee, useEmployees, useImportEmployees, useUpdateEmployee } from './queries';

export function EmployeesPage() {
  const { role } = usePermissions();
  const { employees } = useEmployees();
  const createEmployee = useCreateEmployee();
  const importEmployees = useImportEmployees();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const handleImport = async (emps: Omit<Employee, 'id'>[]) => {
    try {
      const created = await importEmployees.mutateAsync(emps);
      toast.success(`${created.length} empleado(s) importados`);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <EmployeeManager
      employees={employees}
      userRole={role}
      onAddEmployee={(emp) => createEmployee.mutate(emp)}
      onAddMultipleEmployees={handleImport}
      onUpdateEmployee={(id, partial) => updateEmployee.mutate({ id, partial })}
      onDeleteEmployee={(id) => deleteEmployee.mutate(id)}
    />
  );
}
