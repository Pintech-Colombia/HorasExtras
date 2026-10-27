// Franja fija cuando la app está conectada a la base de PRUEBAS (VITE_ENTORNO=pruebas).
// Evita confundir datos de prueba con los reales de la empresa.
export function EnvironmentBanner() {
  if (import.meta.env.VITE_ENTORNO !== 'pruebas') return null;
  return (
    <div role="status" className="bg-warning px-3 py-1 text-center text-xs font-semibold text-white">
      Entorno de pruebas · los datos no son reales
    </div>
  );
}
