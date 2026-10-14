// Traduce errores de Supabase/Postgres a mensajes claros para el usuario.
export const toUserMessage = (err: any, fallback: string): string => {
  const code = err?.code as string | undefined;
  const msg = String(err?.message || '');
  if (code === '23505') return 'Ya existe un registro con esa cédula.';
  if (code === '23503') return 'No se puede eliminar: tiene horas extras registradas. Márquelo como inactivo.';
  if (code === '42501' || msg.includes('row-level security')) return 'No tiene permisos para esta acción.';
  if (code === 'P0001' && msg) return msg; // mensajes de las reglas del servidor
  if (msg.toLowerCase().includes('failed to fetch')) return 'Sin conexión con el servidor. Revise su internet e intente de nuevo.';
  return fallback;
};

export class ServiceError extends Error {}

// Declarada como function para que TypeScript entienda que nunca retorna (narrowing)
export function fail(err: any, fallback: string): never {
  if (import.meta.env.DEV) console.error(err);
  throw new ServiceError(toUserMessage(err, fallback));
}
