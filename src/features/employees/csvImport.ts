import { Employee } from '@/types';

// Importación de personal desde CSV. Acepta coma o punto y coma como separador
// (Excel en español guarda con ";") y valores como "15000", "15.000" o "$ 15.000,50".

export const CSV_TEMPLATE_HEADER = 'cedula;nombre;cargo;departamento;valor_hora';

export interface CsvImportResult {
  employees: Omit<Employee, 'id'>[];
  skippedLines: number[]; // líneas del archivo (desde 1) sin cédula o nombre
}

// Convierte un valor en pesos escrito a la colombiana o a la inglesa
export function parseMoney(raw: string): number {
  const s = raw.replace(/[^\d.,-]/g, '');
  if (!s) return 0;
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  let normalized: string;
  if (lastDot >= 0 && lastComma >= 0) {
    // El último separador es el decimal
    const dec = lastDot > lastComma ? '.' : ',';
    const thou = dec === '.' ? ',' : '.';
    normalized = s.split(thou).join('').replace(dec, '.');
  } else {
    const sep = lastDot >= 0 ? '.' : lastComma >= 0 ? ',' : '';
    const parts = sep ? s.split(sep) : [s];
    // "15.000" o "1.250.000" son miles; "15,5" es decimal
    const isThousands = parts.length > 2 || (parts.length === 2 && parts[1].length === 3);
    normalized = isThousands ? parts.join('') : parts.join('.');
  }
  const n = Number(normalized);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function splitLine(line: string, sep: string): string[] {
  const cols: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === sep && !quoted) {
      cols.push(cur);
      cur = '';
    } else cur += ch;
  }
  cols.push(cur);
  return cols.map((c) => c.trim());
}

export function parseEmployeesCsv(text: string): CsvImportResult {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const header = lines[0] || '';
  const sep = (header.match(/;/g) || []).length >= (header.match(/,/g) || []).length ? ';' : ',';
  const employees: Omit<Employee, 'id'>[] = [];
  const skippedLines: number[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const [documentId = '', name = '', position = '', department = '', rate = ''] = splitLine(lines[i], sep);
    // Cédula y nombre son obligatorios: no se inventan documentos
    if (!documentId || !name) {
      skippedLines.push(i + 1);
      continue;
    }
    employees.push({
      documentId,
      name,
      position: position || 'Operario de Planta',
      department: department || 'Operaciones',
      baseHourlyRate: parseMoney(rate),
      active: true,
    });
  }
  return { employees, skippedLines };
}
