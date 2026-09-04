import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { OvertimeRecord } from '../types';
import { loadRecords, saveRecords } from '../utils/storage';

export const getRecords = async (monthStr?: string, companyId?: string): Promise<OvertimeRecord[]> => {
  if (!isSupabaseConfigured() || !supabase) {
    return loadRecords();
  }

  try {
    let query = supabase
      .from('overtime_records')
      .select('*')
      .order('date', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (monthStr) {
      // Filtrar por mes YYYY-MM
      const [year, month] = monthStr.split('-').map(Number);
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Error fetching records from Supabase, falling back to local:', error);
      return loadRecords();
    }

    if (!data || data.length === 0) {
      saveRecords([]);
      return [];
    }

    const mapped: OvertimeRecord[] = data.map((d: any) => ({
      id: d.id,
      date: d.date,
      employeeId: d.employee_id,
      employeeName: d.employee_name,
      hours: Number(d.hours),
      type: d.type,
      customMultiplier: d.custom_multiplier ? Number(d.custom_multiplier) : undefined,
      status: d.status,
      notes: d.notes || '',
      verifiedByManager: Boolean(d.verified_by_manager),
      verifiedAt: d.verified_at,
      createdAt: d.created_at,
    }));

    saveRecords(mapped);
    return mapped;
  } catch (err) {
    console.error('Unexpected error in getRecords:', err);
    return loadRecords();
  }
};

export const createRecords = async (
  newRecords: Omit<OvertimeRecord, 'id' | 'createdAt'>[],
  companyId?: string,
  createdBy?: string
): Promise<OvertimeRecord[]> => {
  if (!isSupabaseConfigured() || !supabase) {
    const created: OvertimeRecord[] = newRecords.map((rec, idx) => ({
      ...rec,
      id: `rec-${Date.now()}-${idx}`,
      createdAt: new Date().toISOString(),
    }));
    const current = loadRecords();
    const updated = [...created, ...current];
    saveRecords(updated);
    return created;
  }

  try {
    const payloads = newRecords.map((r) => ({
      company_id: companyId || null,
      employee_id: r.employeeId.startsWith('emp-') ? null : r.employeeId,
      employee_name: r.employeeName,
      date: r.date,
      hours: r.hours,
      type: r.type,
      custom_multiplier: r.customMultiplier || null,
      status: r.status || (r.verifiedByManager ? 'verified_manager' : 'pending_review'),
      notes: r.notes || null,
      verified_by_manager: Boolean(r.verifiedByManager),
      verified_at: r.verifiedAt || null,
      created_by: createdBy || null,
    }));

    const { data, error } = await supabase
      .from('overtime_records')
      .insert(payloads)
      .select();

    if (error) throw error;

    const mapped: OvertimeRecord[] = data.map((d: any) => ({
      id: d.id,
      date: d.date,
      employeeId: d.employee_id || '',
      employeeName: d.employee_name,
      hours: Number(d.hours),
      type: d.type,
      customMultiplier: d.custom_multiplier ? Number(d.custom_multiplier) : undefined,
      status: d.status,
      notes: d.notes || '',
      verifiedByManager: Boolean(d.verified_by_manager),
      verifiedAt: d.verified_at,
      createdAt: d.created_at,
    }));

    const current = loadRecords();
    saveRecords([...mapped, ...current]);
    return mapped;
  } catch (err) {
    console.error('Error creating records in Supabase, using fallback:', err);
    const created: OvertimeRecord[] = newRecords.map((rec, idx) => ({
      ...rec,
      id: `rec-${Date.now()}-${idx}`,
      createdAt: new Date().toISOString(),
    }));
    const current = loadRecords();
    saveRecords([...created, ...current]);
    return created;
  }
};

export const updateRecord = async (
  id: string,
  partial: Partial<OvertimeRecord>
): Promise<void> => {
  const current = loadRecords();
  const updated = current.map((r) => (r.id === id ? { ...r, ...partial } : r));
  saveRecords(updated);

  if (isSupabaseConfigured() && supabase && !id.startsWith('rec-')) {
    try {
      const payload: any = {};
      if (partial.hours !== undefined) payload.hours = partial.hours;
      if (partial.notes !== undefined) payload.notes = partial.notes;
      if (partial.type !== undefined) payload.type = partial.type;
      if (partial.status !== undefined) payload.status = partial.status;
      if (partial.verifiedByManager !== undefined) payload.verified_by_manager = partial.verifiedByManager;
      if (partial.verifiedAt !== undefined) payload.verified_at = partial.verifiedAt;

      const { error } = await supabase
        .from('overtime_records')
        .update(payload)
        .eq('id', id);

      if (error) console.error('Error updating overtime record in Supabase:', error);
    } catch (err) {
      console.error('Unexpected error in updateRecord:', err);
    }
  }
};

export const deleteRecord = async (id: string): Promise<void> => {
  const current = loadRecords();
  saveRecords(current.filter((r) => r.id !== id));

  if (isSupabaseConfigured() && supabase && !id.startsWith('rec-')) {
    try {
      const { error } = await supabase.from('overtime_records').delete().eq('id', id);
      if (error) console.error('Error deleting record from Supabase:', error);
    } catch (err) {
      console.error('Unexpected error in deleteRecord:', err);
    }
  }
};

export const verifyAllMonthRecords = async (monthStr: string): Promise<void> => {
  const now = new Date().toISOString();
  const current = loadRecords();
  const updated = current.map((r) => {
    if (r.date.startsWith(monthStr) && !r.verifiedByManager) {
      return {
        ...r,
        verifiedByManager: true,
        status: 'verified_manager' as OvertimeRecord['status'],
        verifiedAt: now,
      };
    }
    return r;
  });
  saveRecords(updated);

  if (isSupabaseConfigured() && supabase) {
    try {
      const [year, month] = monthStr.split('-').map(Number);
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      await supabase
        .from('overtime_records')
        .update({
          verified_by_manager: true,
          status: 'verified_manager',
          verified_at: now,
        })
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('verified_by_manager', false);
    } catch (err) {
      console.error('Error verifying all month in Supabase:', err);
    }
  }
};
