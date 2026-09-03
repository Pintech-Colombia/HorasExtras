import React, { useState } from 'react';
import { Users, UserPlus, Edit, Trash2, Search, DollarSign, Building, FileText } from 'lucide-react';
import { Employee } from '../types';
import { formatCurrency } from '../utils/exporters';

interface EmployeeManagerProps {
  employees: Employee[];
  onAddEmployee: (emp: Omit<Employee, 'id'>) => void;
  onUpdateEmployee: (id: string, updated: Partial<Employee>) => void;
  onDeleteEmployee: (id: string) => void;
}

export const EmployeeManager: React.FC<EmployeeManagerProps> = ({
  employees,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('Operaciones');
  const [baseHourlyRate, setBaseHourlyRate] = useState<number>(15000);

  const openAddModal = () => {
    setEditingEmployee(null);
    setName('');
    setDocumentId('');
    setPosition('');
    setDepartment('Operaciones');
    setBaseHourlyRate(15000);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setDocumentId(emp.documentId);
    setPosition(emp.position);
    setDepartment(emp.department);
    setBaseHourlyRate(emp.baseHourlyRate);
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
      });
    } else {
      onAddEmployee({
        name,
        documentId,
        position,
        department,
        baseHourlyRate,
        active: true,
      });
    }

    setIsModalOpen(false);
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            Gestión de Personal y Tarifas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Administra los empleados, números de documento (Cédula) para nómina y valores por hora ordinaria.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-sm"
        >
          <UserPlus className="w-4 h-4 text-white" />
          <span>Nuevo Empleado</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, documento o cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
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
                    Doc: {emp.documentId || 'Sin registrar'}
                  </span>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                    emp.active
                      ? 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  {emp.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="text-xs space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Building className="w-3 h-3" />
                    Cargo/Depto:
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-200">{emp.position} ({emp.department})</span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1 text-slate-400">
                    <DollarSign className="w-3 h-3 text-slate-500" />
                    Valor Hora Base:
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
                className="text-xs text-slate-700 dark:text-slate-200 font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center gap-1 transition hover:bg-slate-200"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>

              <button
                onClick={() => onDeleteEmployee(emp.id)}
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Alberto Mendoza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
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
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Cargo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Técnico de Planta"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Área / Depto</label>
                  <input
                    type="text"
                    placeholder="Ej. Operaciones"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
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
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm transition"
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
