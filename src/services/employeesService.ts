import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Employee } from '../types';
import { loadEmployees, saveEmployees } from '../utils/storage';

export const getEmployees = async (companyId?: string): Promise<Employee[]> => {
  if (!isSupabaseConfigured() || !supabase) {
    return loadEmployees();
  }

  try {
    let query = supabase
      .from('employees')
      .select('*')
      .order('name', { ascending: true });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Error fetching employees from Supabase, falling back to local:', error);
      return loadEmployees();
    }

    if (!data || data.length === 0) {
      // Si la base de datos está vacía, retornar los locales
      const local = loadEmployees();
      return local;
    }

    // Mapear campos de base de datos a interfaz frontend
    const mapped: Employee[] = data.map((d: any) => ({
      id: d.id,
      documentId: d.document_id,
      name: d.name,
      position: d.position,
      department: d.department || 'Operaciones',
      baseHourlyRate: Number(d.base_hourly_rate) || 15000,
      active: d.active !== false,
    }));

    // Cachear en local
    saveEmployees(mapped);
    return mapped;
  } catch (err) {
    console.error('Unexpected error in getEmployees:', err);
    return loadEmployees();
  }
};

export const createEmployee = async (
  newEmp: Omit<Employee, 'id'>,
  companyId?: string
): Promise<Employee> => {
  if (!isSupabaseConfigured() || !supabase) {
    const localEmp: Employee = {
      ...newEmp,
      id: `emp-${Date.now()}`,
    };
    const current = loadEmployees();
    const updated = [...current, localEmp];
    saveEmployees(updated);
    return localEmp;
  }

  try {
    const payload: any = {
      document_id: newEmp.documentId,
      name: newEmp.name,
      position: newEmp.position,
      department: newEmp.department,
      base_hourly_rate: newEmp.baseHourlyRate,
      active: newEmp.active,
    };

    if (companyId) {
      payload.company_id = companyId;
    }

    const { data, error } = await supabase
      .from('employees')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    const created: Employee = {
      id: data.id,
      documentId: data.document_id,
      name: data.name,
      position: data.position,
      department: data.department,
      baseHourlyRate: Number(data.base_hourly_rate),
      active: data.active,
    };

    const current = loadEmployees();
    saveEmployees([...current, created]);
    return created;
  } catch (err) {
    console.error('Error creating employee in Supabase, saving locally:', err);
    const fallback: Employee = {
      ...newEmp,
      id: `emp-${Date.now()}`,
    };
    const current = loadEmployees();
    saveEmployees([...current, fallback]);
    return fallback;
  }
};

export const createMultipleEmployees = async (
  newEmps: Omit<Employee, 'id'>[],
  companyId?: string
): Promise<Employee[]> => {
  if (!isSupabaseConfigured() || !supabase) {
    const createdList: Employee[] = newEmps.map((emp, idx) => ({
      ...emp,
      id: `emp-${Date.now()}-${idx}`,
    }));
    const current = loadEmployees();
    const updated = [...createdList, ...current];
    saveEmployees(updated);
    return createdList;
  }

  try {
    const payloads = newEmps.map((e) => ({
      company_id: companyId || null,
      document_id: e.documentId,
      name: e.name,
      position: e.position,
      department: e.department || 'Operaciones',
      base_hourly_rate: e.baseHourlyRate || 15000,
      active: e.active !== false,
    }));

    const { data, error } = await supabase
      .from('employees')
      .insert(payloads)
      .select();

    if (error) throw error;

    const mapped: Employee[] = data.map((d: any) => ({
      id: d.id,
      documentId: d.document_id,
      name: d.name,
      position: d.position,
      department: d.department,
      baseHourlyRate: Number(d.base_hourly_rate),
      active: d.active,
    }));

    const current = loadEmployees();
    saveEmployees([...mapped, ...current]);
    return mapped;
  } catch (err) {
    console.error('Error creating multiple employees in Supabase, saving locally:', err);
    const fallbackList: Employee[] = newEmps.map((emp, idx) => ({
      ...emp,
      id: `emp-${Date.now()}-${idx}`,
    }));
    const current = loadEmployees();
    saveEmployees([...fallbackList, ...current]);
    return fallbackList;
  }
};

export const updateEmployee = async (
  id: string,
  partial: Partial<Employee>
): Promise<void> => {
  // Actualizar local
  const current = loadEmployees();
  const updated = current.map((e) => (e.id === id ? { ...e, ...partial } : e));
  saveEmployees(updated);

  if (isSupabaseConfigured() && supabase && !id.startsWith('emp-')) {
    try {
      const payload: any = {};
      if (partial.name !== undefined) payload.name = partial.name;
      if (partial.documentId !== undefined) payload.document_id = partial.documentId;
      if (partial.position !== undefined) payload.position = partial.position;
      if (partial.department !== undefined) payload.department = partial.department;
      if (partial.baseHourlyRate !== undefined) payload.base_hourly_rate = partial.baseHourlyRate;
      if (partial.active !== undefined) payload.active = partial.active;
      payload.updated_at = new Date().toISOString();

      const { error } = await supabase.from('employees').update(payload).eq('id', id);
      if (error) console.error('Error updating employee in Supabase:', error);
    } catch (err) {
      console.error('Unexpected error in updateEmployee:', err);
    }
  }
};

export const deleteEmployee = async (id: string): Promise<void> => {
  const current = loadEmployees();
  saveEmployees(current.filter((e) => e.id !== id));

  if (isSupabaseConfigured() && supabase && !id.startsWith('emp-')) {
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) console.error('Error deleting employee in Supabase:', error);
    } catch (err) {
      console.error('Unexpected error in deleteEmployee:', err);
    }
  }
};
