import { useSearchParams } from 'react-router';

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// El mes seleccionado vive en la URL (?mes=2026-10): sobrevive a recargas y se puede compartir
export function useSelectedMonth(): [string, (month: string) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get('mes');
  const month = raw && /^\d{4}-\d{2}$/.test(raw) ? raw : currentMonth();

  const setMonth = (next: string) => {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (next === currentMonth()) p.delete('mes');
        else p.set('mes', next);
        return p;
      },
      { replace: true }
    );
  };

  return [month, setMonth];
}
