import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Edit2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  CheckCircle2,
  X,
  Save
} from 'lucide-react';
import { employeeService, authService } from '../services/api';
import type { EmployeeProfile } from '../types';
import confetti from 'canvas-confetti';

export const EmployeeManagementPage: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [selectedEmp, setSelectedEmp] = useState<EmployeeProfile | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  // Add Employee Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    employee_id: `DF-EMP-${Math.floor(100 + Math.random() * 900)}`,
    name: '',
    email: '',
    password: 'employee123',
    role: 'employee',
    department: 'Engineering',
    designation: 'Associate Engineer',
    phone: '',
    address: '',
  });

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await employeeService.listEmployees(departmentFilter, search);
      setEmployees(data);
    } catch (err) {
      console.error('Failed to load employees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [departmentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadEmployees();
  };

  const handleOpenEdit = (emp: EmployeeProfile) => {
    setSelectedEmp(emp);
    setEditFormData({
      department: emp.department,
      designation: emp.designation,
      work_location: emp.work_location || 'Remote (Hybrid)',
      leave_balance_paid: emp.leave_balance_paid,
      leave_balance_sick: emp.leave_balance_sick,
      leave_balance_unpaid: emp.leave_balance_unpaid,
      phone: emp.phone || '',
      address: emp.address || '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    try {
      await employeeService.adminUpdateEmployee(selectedEmp.id, editFormData);
      setSelectedEmp(null);
      await loadEmployees();
    } catch (err) {
      console.error('Failed to update employee', err);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.register(addFormData);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
      setShowAddModal(false);
      await loadEmployees();
    } catch (err) {
      console.error('Failed to register employee', err);
    }
  };

  const departments = ['All', 'Engineering', 'Product Design', 'People & Culture', 'Marketing', 'Finance'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Employee Directory & Headcount
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            View profiles, assign departments, manage roles, and calibrate leave balances.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-brand-500 text-slate-900 dark:text-white focus:outline-none"
            />
          </form>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setDepartmentFilter(dept)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  departmentFilter === dept
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-xs text-slate-400">
            Loading employees directory...
          </div>
        ) : employees.length === 0 ? (
          <div className="col-span-full text-center py-12 text-xs text-slate-400">
            No employees found matching criteria.
          </div>
        ) : (
          employees.map((emp) => (
            <GlassCard key={emp.id} interactive className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      emp.profile_picture ||
                      emp.user.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.user.name}`
                    }
                    alt={emp.user.name}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-brand-500/25 shadow-md"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{emp.user.name}</h3>
                    <p className="text-xs text-slate-500">{emp.designation}</p>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-brand-500/10 text-brand-600 dark:text-brand-400 mt-1">
                      {emp.department}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEdit(emp)}
                  className="p-2 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition"
                  title="Edit details"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{emp.user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{emp.phone || 'No phone added'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{emp.work_location || 'Remote'}</span>
                </div>
              </div>

              {/* Leave Balances indicator */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-400 block font-semibold">Paid</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">{emp.leave_balance_paid}d</span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-400 block font-semibold">Sick</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{emp.leave_balance_sick}d</span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-400 block font-semibold">Unpaid</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{emp.leave_balance_unpaid}d</span>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Employee: {selectedEmp.user.name}
              </h3>
              <button
                onClick={() => setSelectedEmp(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={editFormData.designation}
                    onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Work Location
                </label>
                <input
                  type="text"
                  value={editFormData.work_location}
                  onChange={(e) => setEditFormData({ ...editFormData, work_location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Paid Leaves
                  </label>
                  <input
                    type="number"
                    value={editFormData.leave_balance_paid}
                    onChange={(e) => setEditFormData({ ...editFormData, leave_balance_paid: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sick Leaves
                  </label>
                  <input
                    type="number"
                    value={editFormData.leave_balance_sick}
                    onChange={(e) => setEditFormData({ ...editFormData, leave_balance_sick: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unpaid Leaves
                  </label>
                  <input
                    type="number"
                    value={editFormData.leave_balance_unpaid}
                    onChange={(e) => setEditFormData({ ...editFormData, leave_balance_unpaid: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedEmp(null)}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 text-xs font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-500" />
                <span>Onboard New Employee</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={addFormData.employee_id}
                    onChange={(e) => setAddFormData({ ...addFormData, employee_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role
                  </label>
                  <select
                    value={addFormData.role}
                    onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">HR / Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={addFormData.name}
                  onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                  placeholder="e.g. Jordan Miller"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  value={addFormData.email}
                  onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                  placeholder="jordan.miller@dayflow.io"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={addFormData.department}
                    onChange={(e) => setAddFormData({ ...addFormData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={addFormData.designation}
                    onChange={(e) => setAddFormData({ ...addFormData, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 text-xs font-semibold"
                >
                  Create & Onboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
