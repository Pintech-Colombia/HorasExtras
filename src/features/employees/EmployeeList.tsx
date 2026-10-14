import { MoreHorizontal, Pencil, Power, Trash2 } from 'lucide-react';
import { Employee } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/exporters';
import { cn } from '@/lib/utils';

export interface EmployeeActions {
  canEditEmployees: boolean;
  canManageSalaries: boolean;
  onEdit: (emp: Employee) => void;
  onToggleActive: (emp: Employee) => void;
  onDelete: (emp: Employee) => void;
}

function ActiveBadge({ active }: { active: boolean }) {
  return <Badge variant={active ? 'success' : 'secondary'}>{active ? 'Activo' : 'Inactivo'}</Badge>;
}

function Rate({ emp, actions }: { emp: Employee; actions: EmployeeActions }) {
  if (!actions.canManageSalaries) return <span className="text-xs text-muted-foreground">Confidencial</span>;
  if (!emp.baseHourlyRate) return <span className="text-xs text-warning">Sin valor hora</span>;
  return <span className="font-mono">{formatCurrency(emp.baseHourlyRate)}</span>;
}

// Menú "⋯": Eliminar queda escondido aquí para que no se toque por accidente
function RowMenu({ emp, actions, className }: { emp: Employee; actions: EmployeeActions; className?: string }) {
  if (!actions.canEditEmployees && !actions.canManageSalaries) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn('text-muted-foreground', className)}
          aria-label={`Acciones para ${emp.name}`}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => actions.onEdit(emp)}>
          <Pencil /> {actions.canEditEmployees ? 'Editar' : 'Cambiar valor hora'}
        </DropdownMenuItem>
        {actions.canEditEmployees && (
          <>
            <DropdownMenuItem onSelect={() => actions.onToggleActive(emp)}>
              <Power /> {emp.active ? 'Marcar como inactivo' : 'Marcar como activo'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => actions.onDelete(emp)}>
              <Trash2 /> Eliminar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Tabla para PC
export function EmployeeTable({ employees, actions }: { employees: Employee[]; actions: EmployeeActions }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-vercel-card">
      <table className="w-full table-fixed text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 font-medium">Empleado</th>
            <th className="w-[140px] px-3 py-2.5 font-medium">Cédula</th>
            <th className="px-3 py-2.5 font-medium">Cargo</th>
            <th className="w-[150px] px-3 py-2.5 font-medium">Área</th>
            <th className="w-[130px] px-3 py-2.5 text-right font-medium">Valor hora</th>
            <th className="w-[100px] px-3 py-2.5 font-medium">Estado</th>
            <th className="w-[56px] px-3 py-2.5">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {employees.map((emp) => (
            <tr key={emp.id} className={cn('align-middle', !emp.active && 'text-muted-foreground')}>
              <td className="px-4 py-2.5">
                <button
                  type="button"
                  className="block max-w-full truncate text-left font-medium hover:underline disabled:no-underline"
                  onClick={() => actions.onEdit(emp)}
                  disabled={!actions.canEditEmployees && !actions.canManageSalaries}
                >
                  {emp.name}
                </button>
              </td>
              <td className="truncate px-3 py-2.5 font-mono text-xs">{emp.documentId}</td>
              <td className="truncate px-3 py-2.5" title={emp.position}>
                {emp.position}
              </td>
              <td className="truncate px-3 py-2.5 text-muted-foreground">{emp.department}</td>
              <td className="px-3 py-2.5 text-right">
                <Rate emp={emp} actions={actions} />
              </td>
              <td className="px-3 py-2.5">
                <ActiveBadge active={emp.active} />
              </td>
              <td className="px-2 py-2.5 text-right">
                <RowMenu emp={emp} actions={actions} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Tarjetas para celular
export function EmployeeCards({ employees, actions }: { employees: Employee[]; actions: EmployeeActions }) {
  return (
    <ul className="flex flex-col gap-2">
      {employees.map((emp) => (
        <li
          key={emp.id}
          className={cn('rounded-xl border bg-card p-4 shadow-vercel-subtle', !emp.active && 'opacity-70')}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium">{emp.name}</p>
              <p className="font-mono text-xs text-muted-foreground">CC {emp.documentId}</p>
            </div>
            <RowMenu emp={emp} actions={actions} className="-mr-2 -mt-1 size-9" />
          </div>
          <p className="mt-2 truncate text-sm">
            {emp.position} <span className="text-muted-foreground">· {emp.department}</span>
          </p>
          <div className="mt-2 flex items-center justify-between gap-2 text-sm">
            <ActiveBadge active={emp.active} />
            <span>
              <Rate emp={emp} actions={actions} />
              {actions.canManageSalaries && emp.baseHourlyRate > 0 && (
                <span className="text-xs text-muted-foreground"> / h</span>
              )}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
