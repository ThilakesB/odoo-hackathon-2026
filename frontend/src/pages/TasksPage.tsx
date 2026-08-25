import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  firestoreTaskService,
  firestoreUserService
} from '../services/firestoreService';
import type { TaskItem, TaskPriority, TaskStatus, EmployeeProfile } from '../types';
import {
  CheckSquare,
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Trash2,
  Edit3,
  Sparkles,
  ChevronRight,
  TrendingUp,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const TasksPage: React.FC = () => {
  const { user, role } = useAuth();
  const isAdmin = role === 'admin';

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [completionNotes, setCompletionNotes] = useState<string>('');

  // New task form state
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    assigned_to: string;
    assigned_to_name: string;
    priority: TaskPriority;
    due_date: string;
    category: string;
  }>({
    title: '',
    description: '',
    assigned_to: 'all',
    assigned_to_name: 'All Employees',
    priority: 'medium',
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    category: 'Operations'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [allTasks, allEmployees] = await Promise.all([
        firestoreTaskService.getTasks(),
        firestoreUserService.getAllEmployees()
      ]);
      setTasks(allTasks);
      setEmployees(allEmployees);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter tasks based on role, search, status, and priority
  const filteredTasks = tasks.filter((task) => {
    // If not admin, show tasks assigned to this employee, or 'all', or matching their name
    if (!isAdmin) {
      const isForMe =
        task.assigned_to === 'all' ||
        task.assigned_to === String(user?.id) ||
        task.assigned_to === user?.employee_id ||
        task.assigned_to_name.toLowerCase().includes(user?.name.toLowerCase() || '');
      if (!isForMe) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;

    // Priority filter
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q) ||
        task.assigned_to_name.toLowerCase().includes(q) ||
        task.category?.toLowerCase().includes(q)
      );
    }

    return true;
  });

  // Calculate metrics
  const totalCount = filteredTasks.length;
  const todoCount = filteredTasks.filter((t) => t.status === 'todo').length;
  const inProgressCount = filteredTasks.filter((t) => t.status === 'in_progress').length;
  const completedCount = filteredTasks.filter((t) => t.status === 'completed').length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Handle task creation
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      const created = await firestoreTaskService.createTask({
        title: newTask.title,
        description: newTask.description,
        assigned_to: newTask.assigned_to,
        assigned_to_name: newTask.assigned_to_name,
        assigned_by: `${user?.name || 'HR Admin'} (${isAdmin ? 'Admin' : 'Lead'})`,
        priority: newTask.priority,
        status: 'todo',
        due_date: newTask.due_date,
        category: newTask.category
      });

      setTasks([created, ...tasks]);
      setShowCreateModal(false);
      setNewTask({
        title: '',
        description: '',
        assigned_to: 'all',
        assigned_to_name: 'All Employees',
        priority: 'medium',
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        category: 'Operations'
      });
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  // Handle quick status toggle
  const handleStatusChange = async (task: TaskItem, newStatus: TaskStatus) => {
    if (newStatus === 'completed') {
      setSelectedTask(task);
      setShowCompleteModal(true);
      return;
    }

    try {
      await firestoreTaskService.updateTaskStatus(task.id, newStatus);
      setTasks(tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  // Submit completion notes and mark completed
  const handleConfirmCompletion = async () => {
    if (!selectedTask) return;
    try {
      await firestoreTaskService.updateTaskStatus(selectedTask.id, 'completed', completionNotes);
      setTasks(
        tasks.map((t) =>
          t.id === selectedTask.id
            ? {
                ...t,
                status: 'completed',
                completed_at: new Date().toISOString(),
                completion_notes: completionNotes
              }
            : t
        )
      );

      // Celebration effect
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      setShowCompleteModal(false);
      setSelectedTask(null);
      setCompletionNotes('');
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await firestoreTaskService.deleteTask(taskId);
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'urgent':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20';
      case 'medium':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
      case 'low':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    }
  };

  const getStatusBadge = (s: TaskStatus) => {
    switch (s) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'in_progress':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'todo':
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20';
      default:
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary-900/40 via-purple-900/20 to-surface-800/60 p-6 rounded-2xl border border-primary-500/20 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary-400" />
              {isAdmin ? 'HR & Management Hub' : 'Employee Workspace'}
            </span>
            <span className="text-xs text-gray-400">• Cloud Firestore Realtime</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
            {isAdmin ? 'Task Assignment & Oversight' : 'My Assigned Tasks & Milestones'}
          </h1>
          <p className="text-sm text-gray-300 mt-1 max-w-2xl">
            {isAdmin
              ? 'Create, assign, track, and review employee deliverables and company-wide HR compliance goals in real-time.'
              : 'View your upcoming deliverables, track sprint progress, and submit completion notes directly to HR.'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium shadow-lg shadow-primary-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Task</span>
          </button>
        )}
      </div>

      {/* Overview Stat Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-800/80 border border-gray-700/50 p-4 rounded-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Tasks</span>
            <CheckSquare className="w-4 h-4 text-primary-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalCount}</div>
          <p className="text-xs text-gray-400 mt-1">Assigned deliverables</p>
        </div>

        <div className="bg-surface-800/80 border border-gray-700/50 p-4 rounded-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">To Do</span>
            <AlertCircle className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-200">{todoCount}</div>
          <p className="text-xs text-gray-400 mt-1">Pending initiation</p>
        </div>

        <div className="bg-surface-800/80 border border-gray-700/50 p-4 rounded-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">In Progress</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{inProgressCount}</div>
          <p className="text-xs text-gray-400 mt-1">Under active work</p>
        </div>

        <div className="bg-surface-800/80 border border-gray-700/50 p-4 rounded-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Completion Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{completionPercentage}%</div>
          <div className="w-full bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-surface-800/90 border border-gray-700/50 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks, assignee, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex bg-surface-900 p-1 rounded-lg border border-gray-700 text-xs">
            {['all', 'todo', 'in_progress', 'completed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-md font-medium capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-primary-600 text-white shadow'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {st === 'in_progress' ? 'In Progress' : st}
              </button>
            ))}
          </div>

          {/* Priority Select */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-surface-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Task List Grid / Cards */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-surface-800/50 border border-gray-700/50 rounded-2xl p-12 text-center">
          <CheckSquare className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">No tasks found</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
            {isAdmin
              ? 'You have not created any tasks matching your criteria. Click "Create New Task" above to assign one.'
              : 'You are all caught up! No pending deliverables in this view.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isInProgress = task.status === 'in_progress';
            const isDueSoon = new Date(task.due_date).getTime() - Date.now() < 3 * 86400000 && !isCompleted;

            return (
              <div
                key={task.id}
                className={`bg-surface-800/90 border transition-all duration-200 rounded-2xl p-5 flex flex-col justify-between hover:shadow-xl hover:border-primary-500/40 relative group ${
                  isCompleted
                    ? 'border-emerald-500/20 bg-surface-850/60'
                    : 'border-gray-700/60'
                }`}
              >
                <div>
                  {/* Card Header: Category & Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-surface-900 text-gray-300 border border-gray-700">
                      {task.category || 'Deliverable'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${getPriorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded capitalize ${getStatusBadge(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className={`text-base font-bold text-white mb-2 leading-snug ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                    {task.title}
                  </h3>
                  <p className="text-xs text-gray-300 line-clamp-3 mb-4 leading-relaxed">
                    {task.description}
                  </p>

                  {/* Assignee & Creator Info */}
                  <div className="space-y-1.5 py-3 border-t border-b border-gray-700/50 text-xs text-gray-400">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary-400" />
                        Assigned To:
                      </span>
                      <span className="font-semibold text-gray-200">{task.assigned_to_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        Due Date:
                      </span>
                      <span className={`font-semibold ${isDueSoon ? 'text-red-400 animate-pulse' : 'text-gray-200'}`}>
                        {task.due_date} {isDueSoon ? '(Soon)' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Completion Note If Present */}
                  {task.completion_notes && (
                    <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                      <span className="font-bold">Completion Note:</span> {task.completion_notes}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="mt-5 pt-3 border-t border-gray-700/40 flex items-center justify-between gap-2">
                  {/* Status Action Buttons */}
                  {!isCompleted ? (
                    <div className="flex items-center gap-2 w-full">
                      {!isInProgress ? (
                        <button
                          onClick={() => handleStatusChange(task, 'in_progress')}
                          className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-all text-center"
                        >
                          Start Working
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(task, 'todo')}
                          className="py-1.5 px-2.5 rounded-lg text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600"
                        >
                          Pause
                        </button>
                      )}

                      <button
                        onClick={() => handleStatusChange(task, 'completed')}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all hover:scale-102"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Complete
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4" /> Finished
                      </span>
                      <button
                        onClick={() => handleStatusChange(task, 'in_progress')}
                        className="text-xs text-gray-400 hover:text-gray-200 underline"
                      >
                        Re-open
                      </button>
                    </div>
                  )}

                  {/* Admin Delete Action */}
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TASK MODAL (HR / ADMIN) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-800 border border-gray-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-surface-850">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary-400" />
                <h3 className="text-lg font-bold text-white">Create & Assign New Task</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete SOC2 Security Verification"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Description / Deliverables
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail the requirements, success criteria, and links..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Assign To
                  </label>
                  <select
                    value={newTask.assigned_to}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'all') {
                        setNewTask({ ...newTask, assigned_to: 'all', assigned_to_name: 'All Employees' });
                      } else {
                        const emp = employees.find((x) => String(x.id) === val || x.uid === val);
                        setNewTask({
                          ...newTask,
                          assigned_to: val,
                          assigned_to_name: emp?.user?.name || emp?.designation || 'Employee'
                        });
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-surface-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="all">All Employees (Company-wide)</option>
                    {employees.map((emp) => (
                      <option key={String(emp.id)} value={String(emp.id)}>
                        {emp.user?.name || 'User'} ({emp.department} - {emp.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="Operations">Operations</option>
                    <option value="Compliance">Compliance & HR</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design & UI</option>
                    <option value="Performance">Performance Goals</option>
                    <option value="Onboarding">Onboarding</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                    className="w-full px-3.5 py-2.5 bg-surface-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white bg-surface-900 hover:bg-surface-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 shadow-lg shadow-primary-600/30"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETE TASK CONFIRMATION MODAL */}
      {showCompleteModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-800 border border-emerald-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-700 bg-surface-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Complete Task</h3>
              </div>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-400">Marking completed:</p>
                <h4 className="text-sm font-bold text-white mt-1">{selectedTask.title}</h4>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Completion Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Share a brief note or link about the finished deliverable..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 rounded-xl text-sm text-gray-300 hover:text-white bg-surface-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCompletion}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Completion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TasksPage;
