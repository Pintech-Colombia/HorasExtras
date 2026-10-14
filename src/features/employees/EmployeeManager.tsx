import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ChevronDown, Download, Search, Upload, UserPlus } from 'lucide-react';
import { Employee, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/ui/confirm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { CSV_TEMPLATE_HEADER, parseEmployeesCsv } from './csvImport';
import { EmployeeFormDialog, EmployeeDraft } from './EmployeeFormDialog';
import { EmployeeActions, EmployeeCards, EmployeeTable } from './EmployeeList';

interface EmployeeManagerProps {
  employees: Employee[];
  userRole?: UserRole | null;
  onAddEmployee: (emp: EmployeeDraft) => void;
  onAddMultipleEmployees: (emps: EmployeeDraft[]) => Promise<boolean>;
  onUpdateEmployee: (id: string, updated: Partial<Employee>) => void;
  onDeleteEmployee: (id: string) => void;
}

type StatusFilter = 'all' | 'active' | 'inactive';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Activos' },
  { key: 'inactive', label: 'Inactivos' },
];

export function EmployeeManager({
  employees,
  userRole,
  onAddEmployee,
  onAddMultipleEmployees,
  onUpdateEmployee,
  onDeleteEmployee,
}: EmployeeManagerProps) {
  const confirm = useConfirm();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  // Jefa y Admin gestionan empleados; Jefa, Contador y Admin gestionan el valor hora
  const canEditEmployees = userRole === 'manager' || userRole === 'admin';
  const canManageSalaries = userRole === 'manager' || userRole === 'accountant' || userRole === 'admin';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sorted = useMemo(() => [...employees].sort((a, b) => a.name.localeCompare(b.name, 'es')), [employees]);
  const departments = useMemo(
    () => [...new Set(employees.map((e) => e.department))].sort((a, b) => a.localeCompare(b, 'es')),
    [employees]
  );

  const term = search.trim().toLowerCase();
  const filtered = sorted
    .filter((e) => statusFilter === 'all' || (statusFilter === 'active') === e.active)
    .filter((e) => deptFilter === 'all' || e.department === deptFilter)
    .filter(
      (e) =>
        !term ||
        e.name.toLowerCase().includes(term) ||
        e.documentId.includes(term) ||
        e.position.toLowerCase().includes(term) ||
        e.department.toLowerCase().includes(term)
    );

  const activeCount = employees.filter((e) => e.active).length;
  const withoutRate = employees.filter((e) => e.active && !e.baseHourlyRate).length;
  const counts: Record<StatusFilter, number> = {
    all: employees.length,
    active: activeCount,
    inactive: employees.length - activeCount,
  };

  const openForm = (emp: Employee | null) => {
    setEditing(emp);
    setFormOpen(true);
  };

  const handleSave = (draft: EmployeeDraft) => {
    if (!editing) onAddEmployee(draft);
    else if (canEditEmployees) onUpdateEmployee(editing.id, draft);
    else onUpdateEmployee(editing.id, { baseHourlyRate: draft.baseHourlyRate }); // Contador: solo valor hora
  };

  const actions: EmployeeActions = {
    canEditEmployees,
    canManageSalaries,
    onEdit: openForm,
    onToggleActive: (emp) => onUpdateEmployee(emp.id, { active: !emp.active }),
    onDelete: async (emp) => {
      const ok = await confirm({
        title: `¿Eliminar a ${emp.name}?`,
        description: 'Solo se puede eliminar si no tiene horas registradas. Si tiene historial, márcalo como inactivo.',
        confirmText: 'Eliminar',
        destructive: true,
      });
      if (ok) onDeleteEmployee(emp.id);
    },
  };

  // Plantilla con ";" y BOM para que Excel en español la abra en columnas y con tildes
  const downloadTemplate = () => {
    const blob = new Blob(['﻿' + CSV_TEMPLATE_HEADER + '\n'], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla_empleados_pintech.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importCsv = async (file: File) => {
    const { employees: parsed, skippedLines } = parseEmployeesCsv(await file.text());
    // Cédulas que ya existen (o repetidas en el mismo archivo) se omiten en vez de frenar toda la carga
    const known = new Set(employees.map((e) => e.documentId.trim()));
    const fresh = parsed.filter((e) => !known.has(e.documentId) && known.add(e.documentId));
    const duplicated = parsed.length - fresh.length;

    if (fresh.length === 0) {
      toast.error(
        parsed.length > 0
          ? 'Todas las cédulas del archivo ya existen. No se importó nada.'
          : 'El archivo no tiene filas válidas. Usa la plantilla: cédula y nombre son obligatorios.'
      );
      return;
    }
    const ok = await onAddMultipleEmployees(fresh);
    if (ok && (duplicated > 0 || skippedLines.length > 0)) {
      toast.warning(
        [
          duplicated > 0 && `${duplicated} cédula(s) ya existían y se omitieron.`,
          skippedLines.length > 0 && `Filas sin cédula o nombre: ${skippedLines.join(', ')}.`,
        ]
          .filter(Boolean)
          .join(' ')
      );
    }
  };

  const stats = [
    { label: 'Empleados', value: String(employees.length) },
    { label: 'Activos', value: String(activeCount) },
    { label: 'Inactivos', value: String(employees.length - activeCount) },
    ...(canManageSalaries
      ? [{ label: 'Activos sin valor hora', value: String(withoutRate), highlight: withoutRate > 0 }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Encabezado */}
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-vercel-card sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold sm:text-xl">Personal</h2>
            <p className="text-sm text-muted-foreground">
              {canEditEmployees
                ? 'Empleados que pueden tener horas extras, con su cargo, área y valor hora.'
                : 'Consulta del personal. Puedes actualizar el valor hora de cada empleado.'}
            </p>
          </div>
          {canEditEmployees && (
            <div className="flex w-full gap-2 sm:w-auto">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) void importCsv(file);
                }}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-1 sm:flex-none">
                    <Upload /> Importar <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={downloadTemplate}>
                    <Download /> Descargar plantilla
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
                    <Upload /> Subir archivo CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button className="flex-1 sm:flex-none" onClick={() => openForm(null)}>
                <UserPlus /> Nuevo empleado
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border bg-muted/40 px-3 py-2.5">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={cn('mt-0.5 font-mono text-base font-semibold sm:text-lg', s.highlight && 'text-warning')}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Filtros */}
      <section className="flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-vercel-subtle lg:flex-row lg:items-center">
        <div className="relative lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar nombre, cédula o cargo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                'flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors lg:flex-none',
                statusFilter === f.key
                  ? 'bg-card text-foreground shadow-vercel-subtle'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>
        <NativeSelect
          aria-label="Filtrar por área"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          wrapperClassName="lg:ml-auto lg:w-52"
        >
          <option value="all">Todas las áreas</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </NativeSelect>
      </section>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card px-4 py-12 text-center text-sm text-muted-foreground">
          {employees.length === 0 ? (
            <>
              <p>Aún no hay empleados registrados.</p>
              {canEditEmployees && (
                <Button size="sm" onClick={() => openForm(null)}>
                  <UserPlus /> Crear el primero
                </Button>
              )}
            </>
          ) : (
            <p>Ningún empleado coincide con los filtros.</p>
          )}
        </div>
      ) : isDesktop ? (
        <EmployeeTable employees={filtered} actions={actions} />
      ) : (
        <EmployeeCards employees={filtered} actions={actions} />
      )}

      <EmployeeFormDialog
        open={formOpen}
        employee={editing}
        employees={employees}
        canEditEmployees={canEditEmployees}
        canManageSalaries={canManageSalaries}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
