import { supabase } from '@/lib/supabase';
import { OvertimeRecord } from '@/types';
import { loadRecords, saveRecords } from '@/lib/storage';
import { fail } from '@/lib/errors';

const fromRow = (d: any): OvertimeRecord => ({
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
  verifiedAt: d.verified_at || undefined,
  createdAt: d.created_at,
  createdBy: d.created_by || undefined,
});

const monthRange = (monthStr: string) => {
  const [year, month] = monthStr.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const mm = String(month).padStart(2, '0');
  return { start: `${year}-${mm}-01`, end: `${year}-${mm}-${String(lastDay).padStart(2, '0')}` };
};

// Carga solo el mes pedido (evita el límite de 1.000 filas por consulta de Supabase)
export const getRecords = async (monthStr: string): Promise<OvertimeRecord[]> => {
  if (!supabase) return loadRecords().filter((r) => r.date.startsWith(monthStr));

  const { start, end } = monthRange(monthStr);
  const { data, error } = await supabase
    .from('overtime_records')
    .select('*')
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: false });
  if (error) fail(error, 'No se pudieron cargar los registros de horas extras.');
  return (data || []).map(fromRow);
};

export const createRecords = async (
  newRecords: Omit<OvertimeRecord, 'id' | 'createdAt'>[]
): Promise<OvertimeRecord[]> => {
  if (!supabase) {
    const created = newRecords.map((rec, idx) => ({
      ...rec,
      id: `rec-${Date.now()}-${idx}`,
      createdAt: new Date().toISOString(),
    }));
    saveRecords([...created, ...loadRecords()]);
    return created;
  }

  // company_id, created_by, verified_by y el estado los fija el servidor según el rol
  const payloads = newRecords.map((r) => ({
    employee_id: r.employeeId,
    employee_name: r.employeeName,
    date: r.date,
    hours: r.hours,
    type: r.type,
    custom_multiplier: r.customMultiplier || null,
    status: r.verifiedByManager ? 'verified_manager' : 'pending_review',
    notes: r.notes || null,
    verified_by_manager: Boolean(r.verifiedByManager),
  }));

  const { data, error } = await supabase.from('overtime_records').insert(payloads).select();
  if (error) fail(error, 'No se pudieron guardar las horas extras.');
  return (data || []).map(fromRow);
};

export const updateRecord = async (id: string, partial: Partial<OvertimeRecord>): Promise<OvertimeRecord | null> => {
  if (!supabase) {
    saveRecords(loadRecords().map((r) => (r.id === id ? { ...r, ...partial } : r)));
    return null;
  }

  const payload: Record<string, unknown> = {};
  if (partial.hours !== undefined) payload.hours = partial.hours;
  if (partial.notes !== undefined) payload.notes = partial.notes;
  if (partial.type !== undefined) payload.type = partial.type;
  if (partial.status !== undefined) payload.status = partial.status;
  if (partial.verifiedByManager !== undefined) payload.verified_by_manager = partial.verifiedByManager;

  const { data, error } = await supabase.from('overtime_records').update(payload).eq('id', id).select();
  if (error) fail(error, 'No se pudo actualizar el registro.');
  if (!data || data.length === 0) fail(null, 'No tiene permisos para modificar este registro.');
  return fromRow(data[0]);
};

export const deleteRecord = async (id: string): Promise<void> => {
  if (!supabase) {
    saveRecords(loadRecords().filter((r) => r.id !== id));
    return;
  }

  const { data, error } = await supabase.from('overtime_records').delete().eq('id', id).select('id');
  if (error) fail(error, 'No se pudo eliminar el registro.');
  if (!data || data.length === 0) fail(null, 'No tiene permisos para eliminar este registro.');
};

export const verifyAllMonthRecords = async (monthStr: string): Promise<void> => {
  if (!supabase) {
    const now = new Date().toISOString();
    saveRecords(
      loadRecords().map((r) =>
        r.date.startsWith(monthStr) && !r.verifiedByManager
          ? { ...r, verifiedByManager: true, status: 'verified_manager' as const, verifiedAt: now }
          : r
      )
    );
    return;
  }

  const { start, end } = monthRange(monthStr);
  const { error } = await supabase
    .from('overtime_records')
    .update({ verified_by_manager: true, status: 'verified_manager' })
    .gte('date', start)
    .lte('date', end)
    .eq('verified_by_manager', false);
  if (error) fail(error, 'No se pudo aprobar el mes.');
};

// Marca como enviados a contabilidad los registros aprobados del mes (quedan bloqueados)
export const markMonthSent = async (monthStr: string): Promise<number> => {
  if (!supabase) {
    let count = 0;
    saveRecords(
      loadRecords().map((r) => {
        if (r.date.startsWith(monthStr) && r.status === 'verified_manager') {
          count++;
          return { ...r, status: 'sent_accountant' as const };
        }
        return r;
      })
    );
    return count;
  }

  const { data, error } = await supabase.rpc('mark_month_sent', { p_month: monthStr });
  if (error) fail(error, 'No se pudo marcar el mes como enviado.');
  return Number(data) || 0;
};
