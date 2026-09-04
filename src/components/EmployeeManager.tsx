import React, { useState, useRef } from 'react';
import { Users, UserPlus, Edit, Trash2, Search, DollarSign, Building, FileText, Upload, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { Employee } from '../types';
import { formatCurrency } from '../utils/exporters';

interface EmployeeManagerProps {
  employees: Employee[];
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
  onAddEmployee,
  onAddMultipleEmployees,
  onUpdateEmployee,
  onDeleteEmployee,
}) => {
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-500" />
            Gestión de Personal y Operarios Pintech
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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

          <button
            onClick={handleDownloadTemplate}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700"
            title="Descargar archivo Excel / CSV de ejemplo"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Plantilla CSV</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700"
            title="Importar lista de personal masivamente"
          >
            <Upload className="w-4 h-4 text-sky-500" />
            <span>Importar CSV</span>
          </button>

          <button
            onClick={openAddModal}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-white" />
            <span>Nuevo Empleado</span>
          </button>
        </div>
      </div>

      {/* Import Status Alert */}
      {importStatus && (
        <div className="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl text-xs text-sky-800 dark:text-sky-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula, cargo o área..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total: <strong className="text-slate-900 dark:text-white">{employees.length}</strong> empleados ({employees.filter(e => e.active).length} activos)
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => (
          <div
            key={emp.id}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{emp.name}</h3>
                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                    <FileText className="w-3 h-3 text-slate-400" />
                    Cédula: {emp.documentId || 'Sin registrar'}
                  </span>
                </div>

                {/* Active / Inactive Badge with Toggle click */}
                <button
                  onClick={() => onUpdateEmployee(emp.id, { active: !emp.active })}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border transition cursor-pointer ${
                    emp.active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}
                  title="Clic para cambiar estado"
                >
                  {emp.active ? '● Activo' : '○ Inactivo'}
                </button>
              </div>

              <div className="text-xs space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Building className="w-3 h-3" />
                    Área / Cargo:
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-200">
                    {emp.position} <span className="text-sky-500 font-semibold">({emp.department})</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1 text-slate-400">
                    <DollarSign className="w-3 h-3 text-slate-500" />
                    Valor Hora Ordinaria:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(emp.baseHourlyRate)} / h
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => openEditModal(emp)}
                className="text-xs text-slate-700 dark:text-slate-200 font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center gap-1 transition hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm(`¿Seguro que deseas eliminar a ${emp.name}?`)) {
                    onDeleteEmployee(emp.id);
                  }
                }}
                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-semibold px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center gap-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in duration-150">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingEmployee ? 'Editar Empleado Pintech' : 'Nuevo Empleado Pintech'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Alberto Mendoza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Número de Cédula / Documento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 1020304050"
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cargo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Técnico Inyección"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Área / Depto *
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
                  >
                    {PINTECH_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Valor Hora Base Ordinaria ($)
                </label>
                <input
                  type="number"
                  step="500"
                  min="0"
                  value={baseHourlyRate}
                  onChange={(e) => setBaseHourlyRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm transition cursor-pointer"
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
