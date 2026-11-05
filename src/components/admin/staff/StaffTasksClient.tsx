'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  MessageSquare,
  Building2,
  X,
  Send,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate } from '@/lib/utils';

export default function StaffTasksClient() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create Form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    departmentId: '',
    assigneeId: '',
    priority: 'MEDIUM',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        status: selectedStatus,
        priority: selectedPriority,
        departmentId: selectedDept,
        myTasks: myTasksOnly ? 'true' : 'false',
      });

      const res = await fetch(`/api/admin/staff/tasks?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.data);
        setTotalPages(data.pagination.totalPages || 1);
        setTotalCount(data.pagination.total || 0);
      }
    } catch (err) {
      console.error('Fetch tasks error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [deptRes, staffRes] = await Promise.all([
        fetch('/api/admin/staff/departments'),
        fetch('/api/admin/staff?limit=100'),
      ]);
      const deptData = await deptRes.json();
      const staffData = await staffRes.json();
      if (deptData.success) setDepartments(deptData.data);
      if (staffData.success) setStaffList(staffData.data);
    } catch (err) {
      console.error('Fetch dependencies error:', err);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [page, selectedStatus, selectedPriority, selectedDept, myTasksOnly]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/staff/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'নতুন দায়িত্ব সফলভাবে তৈরি ও অর্পণ করা হয়েছে!' });
        setShowCreateModal(false);
        fetchTasks();
        setFormData({
          title: '',
          description: '',
          departmentId: '',
          assigneeId: '',
          priority: 'MEDIUM',
          startDate: new Date().toISOString().split('T')[0],
          dueDate: '',
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'টাস্ক তৈরিতে ব্যর্থ হয়েছে।' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'ত্রুটি ঘটেছে।' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/staff/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTasks();
        if (activeTask && activeTask.id === taskId) {
          setActiveTask(data.data);
        }
      }
    } catch (err) {
      console.error('Status change error:', err);
    }
  };

  const handleProgressChange = async (taskId: string, newProgress: number) => {
    try {
      const res = await fetch(`/api/admin/staff/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: newProgress }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTasks();
        if (activeTask && activeTask.id === taskId) {
          setActiveTask(data.data);
        }
      }
    } catch (err) {
      console.error('Progress change error:', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !activeTask) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/staff/tasks/${activeTask.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText }),
      });
      const data = await res.json();
      if (data.success) {
        setCommentText('');
        // Refresh active task details
        const taskRes = await fetch(`/api/admin/staff/tasks/${activeTask.id}`);
        const taskData = await taskRes.json();
        if (taskData.success) {
          setActiveTask(taskData.data);
        }
      }
    } catch (err) {
      console.error('Add comment error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const openTaskDetail = async (taskId: string) => {
    try {
      const res = await fetch(`/api/admin/staff/tasks/${taskId}`);
      const data = await res.json();
      if (data.success) {
        setActiveTask(data.data);
        setShowDetailModal(true);
      }
    } catch (err) {
      console.error('Open task error:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই টাস্কটি মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch(`/api/admin/staff/tasks/${taskId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchTasks();
        if (showDetailModal) setShowDetailModal(false);
      }
    } catch (err) {
      console.error('Delete task error:', err);
    }
  };

  return (
    <div className="space-y-6 font-bengali">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-shubban-green/10 text-shubban-green dark:text-shubban-gold border border-shubban-green/20">
              দায়িত্ব ও কার্যতালিকা
            </span>
            <span className="text-xs text-stone-500">মোট {toBengaliNumber(totalCount)} টি টাস্ক</span>
          </div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 mt-1 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-shubban-gold" />
            <span>প্রশাসনিক দায়িত্ব ও টাস্ক ম্যানেজমেন্ট (Staff Tasks)</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTasks}
            disabled={loading}
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
            title="রিফ্রেশ"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-shubban-gold' : ''}`} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-greenDark text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4 text-shubban-gold" />
            <span>নতুন টাস্ক অর্পণ</span>
          </button>
        </div>
      </div>

      {/* Alert Message */}
      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="p-1 hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter Tabs & Selectors */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { label: 'সকল', value: 'ALL' },
            { label: 'অপেক্ষমান (To-Do)', value: 'TODO' },
            { label: 'চলমান (In Progress)', value: 'IN_PROGRESS' },
            { label: 'পর্যালোচনা (Review)', value: 'REVIEW' },
            { label: 'সম্পন্ন (Completed)', value: 'COMPLETED' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setSelectedStatus(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                selectedStatus === tab.value
                  ? 'bg-shubban-green text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Priority */}
          <select
            value={selectedPriority}
            onChange={(e) => {
              setSelectedPriority(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
          >
            <option value="ALL">সকল অগ্রাধিকার</option>
            <option value="URGENT">জরুরি (Urgent)</option>
            <option value="HIGH">উচ্চ (High)</option>
            <option value="MEDIUM">মাঝারি (Medium)</option>
            <option value="LOW">সাধারণ (Low)</option>
          </select>

          {/* Department */}
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
          >
            <option value="ALL">সকল বিভাগ</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Task List / Grid */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-500 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <RefreshCw className="w-6 h-6 animate-spin text-shubban-gold mx-auto mb-2" />
            <span>টাস্ক তালিকা লোড হচ্ছে...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            বর্তমানে এই ফিল্টারে কোনো দায়িত্ব তালিকাভুক্ত নেই।
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm hover:border-shubban-gold/40 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        task.priority === 'URGENT'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : task.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {task.priority === 'URGENT' ? 'জরুরি' : task.priority === 'HIGH' ? 'উচ্চ' : 'সাধারণ'}
                    </span>

                    {task.department && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {task.department.name}
                      </span>
                    )}

                    <h3
                      onClick={() => openTaskDetail(task.id)}
                      className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 cursor-pointer hover:text-shubban-green transition"
                    >
                      {task.title}
                    </h3>
                  </div>

                  {task.description && (
                    <p className="text-xs text-stone-500 line-clamp-2 max-w-2xl">{task.description}</p>
                  )}
                </div>

                {/* Status Badge & Fast Toggle */}
                <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${
                      task.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                        : task.status === 'IN_PROGRESS'
                        ? 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300'
                        : 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                    }`}
                  >
                    <option value="TODO">অপেক্ষমান (To-Do)</option>
                    <option value="IN_PROGRESS">চলমান (In Progress)</option>
                    <option value="REVIEW">পর্যালোচনা (Review)</option>
                    <option value="COMPLETED">সম্পন্ন (Completed)</option>
                  </select>

                  <button
                    onClick={() => openTaskDetail(task.id)}
                    className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600"
                    title="বিস্তারিত ও মন্তব্য"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress & Meta Info */}
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                {/* Progress bar */}
                <div className="flex items-center gap-2 flex-1 max-w-xs">
                  <span className="text-[11px] text-stone-400 shrink-0">অগ্রগতি:</span>
                  <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        task.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-shubban-gold'
                      }`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-stone-600 dark:text-stone-300 shrink-0">
                    {toBengaliNumber(task.progress)}%
                  </span>
                </div>

                {/* Assignee & Dates */}
                <div className="flex items-center gap-4 text-[11px] text-stone-500 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span>অর্পিত: {task.assignee?.name || 'অনির্ধারিত'}</span>
                  </div>

                  {task.dueDate && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>শেষ সময়: {formatBengaliDate(task.dueDate)}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
                    <span>{toBengaliNumber(task._count?.comments || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-shubban-green" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  নতুন প্রশাসনিক দায়িত্ব ও টাস্ক অর্পণ
                </h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">টাস্ক শিরোনাম *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="উদাঃ রমাদান বিশেষ সংখ্যার সম্পাদকীয় প্রুফরিডিং সম্পন্নকরণ"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">বিস্তারিত বিবরণ ও নির্দেশিকা</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="কাজের বিস্তারিত নির্দেশাবলী ও প্রত্যাশিত ডেলিভারেবল..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">বিভাগ (Department)</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    <option value="">বিভাগ সিলেক্ট করুন</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">দায়িত্বপ্রাপ্ত কর্মকর্তা (Assignee)</label>
                  <select
                    value={formData.assigneeId}
                    onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    <option value="">কর্মকর্তা নির্বাচন করুন</option>
                    {staffList.map((s) => (
                      <option key={s.userId} value={s.userId}>
                        {s.user?.name} ({s.employeeId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">অগ্রাধিকার (Priority)</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    <option value="LOW">সাধারণ (Low)</option>
                    <option value="MEDIUM">মাঝারি (Medium)</option>
                    <option value="HIGH">উচ্চ (High)</option>
                    <option value="URGENT">জরুরি (Urgent)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">শেষ সময় (Due Date)</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-greenDark text-white font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'অর্পণ হচ্ছে...' : 'দায়িত্ব অর্পণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK DETAIL & COMMENT MODAL */}
      {showDetailModal && activeTask && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-shubban-green" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  টাস্ক বিবরণ ও অগ্রগতি রিপোর্ট
                </h3>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  {activeTask.title}
                </h4>
                {activeTask.description && (
                  <p className="text-stone-600 dark:text-stone-300 mt-2 leading-relaxed whitespace-pre-wrap">
                    {activeTask.description}
                  </p>
                )}
              </div>

              {/* Progress Slider */}
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-700 dark:text-stone-300">অগ্রগতি আপডেট করুন</span>
                  <span className="font-mono font-bold text-shubban-green dark:text-shubban-gold">
                    {toBengaliNumber(activeTask.progress)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={activeTask.progress}
                  onChange={(e) => handleProgressChange(activeTask.id, parseInt(e.target.value))}
                  className="w-full accent-shubban-green cursor-pointer"
                />
              </div>

              {/* Comments Timeline */}
              <div className="space-y-3">
                <span className="font-bold text-stone-800 dark:text-stone-200 block">
                  মন্তব্য ও অগ্রগতি নোট ({toBengaliNumber(activeTask.comments?.length || 0)} টি)
                </span>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activeTask.comments?.map((c: any) => (
                    <div key={c.id} className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-700">
                      <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1">
                        <span className="font-semibold text-stone-700 dark:text-stone-300">{c.author?.name}</span>
                        <span>{formatBengaliDate(c.createdAt)}</span>
                      </div>
                      <p className="text-stone-700 dark:text-stone-300 text-xs">{c.content}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="অগ্রগতি বা মন্তব্য লিখুন..."
                    className="flex-1 px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading || !commentText.trim()}
                    className="px-4 py-2 rounded-xl bg-shubban-green text-white font-semibold disabled:opacity-50 flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>পাঠান</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

