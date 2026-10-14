import { supabase } from '../lib/supabase';
import { Employee } from '../types';
import { loadEmployees, saveEmployees } from '../utils/storage';
import { fail } from './errors';

const fromRow = (d: any): Employee => ({
  id: d.id,
  documentId: d.document_id,
  name: d.name,
  position: d.position,
  department: d.department || 'Operaciones',
  baseHourlyRate: Number(d.base_hourly_rate) || 0,
  active: d.active !== false,
});

const toRow = (e: Partial<Employee>) => {
  const row: Record<string, unknown> = {};
  if (e.documentId !== undefined) row.document_id = e.documentId.trim();
  if (e.name !== undefined) row.name = e.name.trim();
  if (e.position !== undefined) row.position = e.position;
  if (e.department !== undefined) row.department = e.department || 'Operaciones';
  if (e.baseHourlyRate !== undefined) row.base_hourly_rate = e.baseHourlyRate;
  if (e.active !== undefined) row.active = e.active;
  return row;
};

export const getEmployees = async (): Promise<Employee[]> => {
  if (!supabase) return loadEmployees();

  const { data, error } = await supabase.from('employees').select('*').order('name', { ascending: true });
  if (error) fail(error, 'No se pudo cargar la lista de empleados.');
  return (data || []).map(fromRow);
};

export const createEmployee = async (newEmp: Omit<Employee, 'id'>): Promise<Employee> => {
  const [created] = await createMultipleEmployees([newEmp]);
  return created;
};

export const createMultipleEmployees = async (newEmps: Omit<Employee, 'id'>[]): Promise<Employee[]> => {
  if (!supabase) {
    const createdList = newEmps.map((emp, idx) => ({ ...emp, id: `emp-${Date.now()}-${idx}` }));
    saveEmployees([...createdList, ...loadEmployees()]);
    return createdList;
  }

  const { data, error } = await supabase.from('employees').insert(newEmps.map(toRow)).select();
  if (error) fail(error, 'No se pudieron guardar los empleados.');
  return (data || []).map(fromRow);
};

export const updateEmployee = async (id: string, partial: Partial<Employee>): Promise<void> => {
  if (!supabase) {
    saveEmployees(loadEmployees().map((e) => (e.id === id ? { ...e, ...partial } : e)));
    return;
  }

  const { data, error } = await supabase.from('employees').update(toRow(partial)).eq('id', id).select('id');
  if (error) fail(error, 'No se pudo actualizar el empleado.');
  if (!data || data.length === 0) fail(null, 'No tiene permisos para modificar este empleado.');
};

export const deleteEmployee = async (id: string): Promise<void> => {
  if (!supabase) {
    saveEmployees(loadEmployees().filter((e) => e.id !== id));
    return;
  }

  const { data, error } = await supabase.from('employees').delete().eq('id', id).select('id');
  if (error) fail(error, 'No se pudo eliminar el empleado.');
  if (!data || data.length === 0) fail(null, 'No tiene permisos para eliminar empleados.');
};
