import { supabase } from '../lib/supabase';
import { Employee } from '../types';
import { loadEmployees, saveEmployees } from '../utils/storage';
import { fail } from './errors';

const fromRow = (d: any, rate = 0): Employee => ({
  id: d.id,
  documentId: d.document_id,
  name: d.name,
  position: d.position,
  department: d.department || 'Operaciones',
  baseHourlyRate: rate,
  active: d.active !== false,
});

const toRow = (e: Partial<Employee>) => {
  const row: Record<string, unknown> = {};
  if (e.documentId !== undefined) row.document_id = e.documentId.trim();
  if (e.name !== undefined) row.name = e.name.trim();
  if (e.position !== undefined) row.position = e.position;
  if (e.department !== undefined) row.department = e.department || 'Operaciones';
  if (e.active !== undefined) row.active = e.active;
  return row;
};

// Las tarifas viven en employee_rates; solo se consultan si el rol puede verlas (el supervisor no)
export const getEmployees = async (includeRates: boolean): Promise<Employee[]> => {
  if (!supabase) return loadEmployees().map((e) => (includeRates ? e : { ...e, baseHourlyRate: 0 }));

  const { data, error } = await supabase.from('employees').select('*').order('name', { ascending: true });
  if (error) fail(error, 'No se pudo cargar la lista de empleados.');

  const rates = new Map<string, number>();
  if (includeRates) {
    const { data: rateRows, error: rateError } = await supabase.from('employee_rates').select('employee_id, base_hourly_rate');
    if (rateError) fail(rateError, 'No se pudieron cargar las tarifas.');
    (rateRows || []).forEach((r: any) => rates.set(r.employee_id, Number(r.base_hourly_rate) || 0));
  }
  return (data || []).map((d: any) => fromRow(d, rates.get(d.id) || 0));
};

const saveRates = async (items: { employeeId: string; rate: number }[]) => {
  if (!supabase || items.length === 0) return;
  const { error } = await supabase
    .from('employee_rates')
    .upsert(items.map((i) => ({ employee_id: i.employeeId, base_hourly_rate: i.rate })), { onConflict: 'employee_id' });
  if (error) fail(error, 'No se pudo guardar la tarifa.');
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
  // Se insertan en el mismo orden, así que la tarifa i corresponde al empleado i
  const created = (data || []).map((d: any, i: number) => fromRow(d, newEmps[i]?.baseHourlyRate || 0));
  await saveRates(created.filter((e) => e.baseHourlyRate > 0).map((e) => ({ employeeId: e.id, rate: e.baseHourlyRate })));
  return created;
};

export const updateEmployee = async (id: string, partial: Partial<Employee>): Promise<void> => {
  if (!supabase) {
    saveEmployees(loadEmployees().map((e) => (e.id === id ? { ...e, ...partial } : e)));
    return;
  }

  // Datos del empleado (Jefa/Admin) y tarifa (Jefa/Contador/Admin) se guardan por separado
  const row = toRow(partial);
  if (Object.keys(row).length > 0) {
    const { data, error } = await supabase.from('employees').update(row).eq('id', id).select('id');
    if (error) fail(error, 'No se pudo actualizar el empleado.');
    if (!data || data.length === 0) fail(null, 'No tiene permisos para modificar este empleado.');
  }
  if (partial.baseHourlyRate !== undefined) {
    await saveRates([{ employeeId: id, rate: partial.baseHourlyRate }]);
  }
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
