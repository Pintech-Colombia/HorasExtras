import React, { useState, useRef } from 'react';
import { Users, UserPlus, Edit, Trash2, Search, DollarSign, Building, FileText, Upload, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { Employee, UserRole } from '../types';
import { formatCurrency } from '../utils/exporters';

interface EmployeeManagerProps {
  employees: Employee[];
  userRole?: UserRole | null;
  onAddEmployee: (emp: Omit<Employee, 'id'>) => void;
  onAddMultipleEmployees?: (emps: Omit<Employee, 'id'>[]) => void;
  onUpdateEmployee: (id: string, updated: Partial<Employee>) => void;
  onDeleteEmployee: (id: string) => void;
}

const PINTECH_DEPARTMENTS = [
  'Operaciones',
  'Inyección',
  'Ensamble',
  'Mantenimiento',
  'Calidad',
  'Logística',
  'Empaque',
  'Administración',
];

export const EmployeeManager: React.FC<EmployeeManagerProps> = ({
  employees,
  userRole,
  onAddEmployee,
  onAddMultipleEmployees,
  onUpdateEmployee,
  onDeleteEmployee,
}) => {
  const canManageSalaries = userRole === 'accountant' || userRole === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [name, setName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('Inyección');
  const [baseHourlyRate, setBaseHourlyRate] = useState<number>(15000);
  const [active, setActive] = useState(true);

  const openAddModal = () => {
    setEditingEmployee(null);
    setName('');
    setDocumentId('');
    setPosition('');
    setDepartment('Inyección');
    setBaseHourlyRate(15000);
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setDocumentId(emp.documentId);
    setPosition(emp.position);
    setDepartment(emp.department);
    setBaseHourlyRate(emp.baseHourlyRate);
    setActive(emp.active);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingEmployee) {
      onUpdateEmployee(editingEmployee.id, {
        name,
        documentId,
        position,
        department,
        baseHourlyRate,
        active,
      });
    } else {
      onAddEmployee({
        name,
        documentId,
        position,
        department,
        baseHourlyRate,
        active,
      });
    }

    setIsModalOpen(false);
  };

  // Carga Masiva desde CSV
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length <= 1) {
          setImportStatus('El archivo está vacío o solo contiene encabezados.');
          return;
        }

        const newEmployees: Omit<Employee, 'id'>[] = [];
        // Saltar encabezado i = 1
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length >= 2 && cols[1]) {
            newEmployees.push({
              documentId: cols[0] || `DOC-${Date.now()}-${i}`,
              name: cols[1],
              position: cols[2] || 'Operario de Planta',
              department: cols[3] || 'Operaciones',
              baseHourlyRate: parseFloat(cols[4]) || 15000,
              active: true,
            });
          }
        }

        if (newEmployees.length > 0) {
          if (onAddMultipleEmployees) {
            onAddMultipleEmployees(newEmployees);
          } else {
            newEmployees.forEach((emp) => onAddEmployee(emp));
          }
          setImportStatus(`¡Éxito! Se importaron ${newEmployees.length} empleados correctamente.`);
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          setImportStatus('No se encontraron registros válidos en el archivo CSV.');
        }
      } catch (err: any) {
        setImportStatus('Error al leer el archivo CSV: ' + err.message);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Descargar Plantilla CSV
  const handleDownloadTemplate = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      'cedula,nombre,cargo,departamento,tarifa_hora\n' +
      '1020304050,Carlos Alberto Mendoza,Técnico de Inyección,Inyección,16000\n' +
      '1098765432,Ana Lucía Torres,Inspectora de Calidad,Calidad,17500\n' +
      '1012345678,Javier Gómez,Técnico de Mantenimiento,Mantenimiento,18000\n';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'plantilla_empleados_pintech.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEmployees = employees.filter((emp) => {
    const term = searchTerm.toLowerCase();
    return (
      emp.name.toLowerCase().includes(term) ||
      emp.documentId.includes(term) ||
      emp.position.toLowerCase().includes(term) ||
      emp.department.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#111111] rounded-[12px] p-6 border border-[#ebebeb] dark:border-[#262626] shadow-vercel-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="caption-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[11px] px-2.5 py-0.5 rounded-[6px] border border-neutral-200 dark:border-neutral-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
              Gestión de Personal
            </span>
          </div>
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mt-2 tracking-display-md">
            Personal y Operarios Pintech
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-sans">
            Administra los empleados por área (Inyección, Ensamble, Calidad, etc.), documentos y tarifas horarias.
          </p>
        </div>

        {/* Actions Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Hidden File Input for CSV */}
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleCsvFileUpload}
            className="hidden"
          />

          {canManageSalaries && (
            <>
              <button
                onClick={handleDownloadTemplate}
                className="button-secondary text-xs font-medium px-3.5 py-2 rounded-[6px] flex items-center gap-1.5"
                title="Descargar archivo Excel / CSV de ejemplo"
              >
                <Download className="w-3.5 h-3.5 text-neutral-500" />
                <span>Plantilla CSV</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="button-secondary text-xs font-medium px-3.5 py-2 rounded-[6px] flex items-center gap-1.5"
                title="Importar lista de personal masivamente"
              >
                <Upload className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
                <span>Importar CSV</span>
              </button>

              <button
                onClick={openAddModal}
                className="button-primary text-xs font-medium px-4 py-2 rounded-full flex items-center gap-2"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Nuevo Empleado</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Import Status Alert */}
      {importStatus && (
        <div className="p-3.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-[10px] text-xs text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white dark:bg-[#111111] p-3 rounded-[12px] border border-[#ebebeb] dark:border-[#262626] shadow-vercel-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula, cargo o área..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input w-full text-xs pl-9 pr-3 h-9 rounded-[6px]"
          />
        </div>

        <div className="caption-mono text-xs text-neutral-500 dark:text-neutral-400">
          Total: <strong className="font-mono text-neutral-900 dark:text-white font-semibold">{employees.length}</strong> empleados ({employees.filter(e => e.active).length} activos)
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => (
          <div
            key={emp.id}
            className="bg-white dark:bg-[#111111] rounded-[12px] p-5 border border-[#ebebeb] dark:border-[#262626] shadow-vercel-card flex flex-col justify-between space-y-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm tracking-tight">{emp.name}</h3>
                  <span className="caption-mono text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                    <FileText className="w-3 h-3 text-neutral-400" />
                    CC {emp.documentId || 'Sin registrar'}
                  </span>
                </div>

                {/* Active / Inactive Badge with Toggle click */}
                <button
                  onClick={() => onUpdateEmployee(emp.id, { active: !emp.active })}
                  className={`caption-mono text-[10px] px-2.5 py-0.5 rounded-full border transition cursor-pointer ${
                    emp.active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700'
                  }`}
                  title="Clic para cambiar estado"
                >
                  {emp.active ? '● Activo' : '○ Inactivo'}
                </button>
              </div>

              <div className="text-xs space-y-1.5 pt-2 border-t border-[#ebebeb] dark:border-[#262626] font-sans">
                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                  <span className="flex items-center gap-1 text-neutral-400 text-xs">
                    <Building className="w-3 h-3" />
                    Área / Cargo:
                  </span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-200 text-xs">
                    {emp.position} <span className="caption-mono text-neutral-400 font-normal">({emp.department})</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                  <span className="flex items-center gap-1 text-neutral-400 text-xs">
                    <DollarSign className="w-3 h-3 text-neutral-400" />
                    Tarifa Hora Base:
                  </span>
                  {canManageSalaries ? (
                    <span className="font-mono font-semibold text-neutral-900 dark:text-white text-xs">
                      {formatCurrency(emp.baseHourlyRate)} / h
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-[4px]">
                      Confidencial (Nómina)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ebebeb] dark:border-[#262626]">
              <button
                onClick={() => openEditModal(emp)}
                className="text-xs text-neutral-700 dark:text-neutral-300 font-medium px-2.5 py-1 rounded-[6px] bg-neutral-100 dark:bg-neutral-800 flex items-center gap-1 transition hover:bg-neutral-200 dark:hover:bg-neutral-700"
              >
                <Edit className="w-3 h-3" />
                <span>Editar</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm(`¿Seguro que deseas eliminar a ${emp.name}?`)) {
                    onDeleteEmployee(emp.id);
                  }
                }}
                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-medium px-2.5 py-1 rounded-[6px] bg-red-50 dark:bg-red-950/30 flex items-center gap-1 transition"
              >
                <Trash2 className="w-3 h-3" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111111] rounded-[12px] max-w-md w-full border border-[#ebebeb] dark:border-[#262626] shadow-vercel-modal overflow-hidden animate-in fade-in duration-150">
            <div className="bg-[#171717] text-white p-4 flex items-center justify-between border-b border-[#262626]">
              <h3 className="font-semibold text-sm">
                {editingEmployee ? 'Editar Empleado Pintech' : 'Nuevo Empleado Pintech'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-white cursor-pointer text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="caption-mono block text-neutral-600 dark:text-neutral-300 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Alberto Mendoza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input w-full text-xs h-9 px-3 rounded-[6px]"
                />
              </div>

              <div>
                <label className="caption-mono block text-neutral-600 dark:text-neutral-300 mb-1">
                  Número de Cédula / Documento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 1020304050"
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  className="form-input w-full text-xs h-9 px-3 rounded-[6px] font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="caption-mono block text-neutral-600 dark:text-neutral-300 mb-1">
                    Cargo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Técnico Inyección"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="form-input w-full text-xs h-9 px-3 rounded-[6px]"
                  />
                </div>

                <div>
                  <label className="caption-mono block text-neutral-600 dark:text-neutral-300 mb-1">
                    Área / Depto *
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="form-input w-full text-xs h-9 px-3 rounded-[6px]"
                  >
                    {PINTECH_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {canManageSalaries ? (
                <div>
                  <label className="caption-mono block text-neutral-600 dark:text-neutral-300 mb-1">
                    Valor Hora Base Ordinaria ($)
                  </label>
                  <input
                    type="number"
                    step="500"
                    min="0"
                    value={baseHourlyRate}
                    onChange={(e) => setBaseHourlyRate(parseFloat(e.target.value) || 0)}
                    className="form-input w-full text-xs h-9 px-3 rounded-[6px] font-mono"
                  />
                </div>
              ) : (
                <div className="p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[6px] text-xs text-neutral-500">
                  <span className="caption-mono text-[10px] uppercase block text-neutral-400 mb-0.5">Tarifa Salarial</span>
                  <span>Gestionada exclusivamente por el Contador / Nómina.</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ebebeb] dark:border-[#262626]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="button-secondary px-4 py-2 rounded-full text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="button-primary px-4 py-2 rounded-full text-xs font-medium"
                >
                  Guardar Empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
