import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  RefreshCw, 
  Download, 
  Trash2, 
  Users, 
  Zap, 
  ShieldAlert, 
  Clock, 
  Filter, 
  Eye, 
  CheckCircle2, 
  Smartphone, 
  Globe, 
  X,
  TrendingUp,
  Brain,
  Target,
  LogIn,
  AlertTriangle,
  Archive,
  CheckSquare,
  Square,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '../../components/ui/Card';

interface ActivityLogItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  category: 'auth' | 'quiz' | 'tips' | 'matches' | 'news' | 'admin' | 'engagement';
  description: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  timestamp: number;
}

interface ActivityStats {
  totalEvents24h: number;
  totalEventsAllTime: number;
  activeUsersToday: number;
  categoryCounts: Record<string, number>;
  topAction: string;
  topActionCount: number;
}

const CATEGORIES = [
  { id: 'all', label: 'All Activity' },
  { id: 'auth', label: 'Logins & Signups' },
  { id: 'quiz', label: 'Quizzes & Trivia' },
  { id: 'tips', label: 'Tips & VIP' },
  { id: 'matches', label: 'Matches & Live' },
  { id: 'admin', label: 'Admin Ops' },
  { id: 'engagement', label: 'Polls & Votes' },
];

export function AdminActivityLogs() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);

  // Clear modal & batch delete state
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearScope, setClearScope] = useState<'all' | 'keep_50' | 'older_24h' | 'older_7d'>('keep_50');
  const [clearing, setClearing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [dataSource, setDataSource] = useState('InsForge Database (Live Connected)');

  const fetchLogs = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (isManual) params.set('sync', 'true');
      params.set('limit', '200');

      const res = await fetch(`/api/admin/activity-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        if (data.stats) setStats(data.stats);
        if (data.source) setDataSource(data.source);
      } else {
        toast.error('Failed to load activity logs');
      }
    } catch (err: any) {
      console.error('Activity logs fetch error:', err);
      toast.error('Network error loading activity logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedCategory, searchTerm]);

  // Auto-refresh interval (every 12 seconds when enabled)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 12000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedCategory, searchTerm]);

  // Execute clearing of logs with chosen scope
  const handleExecuteClear = async () => {
    setClearing(true);
    try {
      const res = await fetch('/api/admin/activity-logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: clearScope })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(
          clearScope === 'all'
            ? 'All activity logs successfully cleared'
            : clearScope === 'keep_50'
            ? 'Pruned older logs — latest 50 kept intact'
            : clearScope === 'older_24h'
            ? 'Purged logs older than 24 hours'
            : 'Purged logs older than 7 days'
        );
        setShowClearModal(false);
        setSelectedIds(new Set());
        fetchLogs(true);
      } else {
        toast.error('Failed to clear activity logs');
      }
    } catch {
      toast.error('Network error clearing logs');
    } finally {
      setClearing(false);
    }
  };

  // Delete a single log
  const handleDeleteSingle = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      // Optimistic local update
      setLogs(prev => prev.filter(l => l.id !== id));
      if (selectedLog?.id === id) setSelectedLog(null);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      const res = await fetch(`/api/admin/activity-logs/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Log entry deleted');
      } else {
        fetchLogs(true);
      }
    } catch {
      toast.error('Failed to delete log entry');
      fetchLogs(true);
    }
  };

  // Batch delete selected logs
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    try {
      // Optimistic update
      setLogs(prev => prev.filter(l => !selectedIds.has(l.id)));
      setSelectedIds(new Set());

      const res = await fetch('/api/admin/activity-logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      if (res.ok) {
        toast.success(`Deleted ${ids.length} selected log entries`);
      } else {
        fetchLogs(true);
      }
    } catch {
      toast.error('Failed to delete selected logs');
      fetchLogs(true);
    }
  };

  // Toggle select all visible
  const handleToggleSelectAll = () => {
    if (selectedIds.size === logs.length && logs.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(logs.map(l => l.id)));
    }
  };

  // Toggle single item selection
  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    window.location.href = `/api/admin/activity-logs/export?${params.toString()}`;
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = Math.max(0, now - timestamp);
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'auth':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Auth</span>;
      case 'quiz':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Quiz</span>;
      case 'tips':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">Tips</span>;
      case 'matches':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Matches</span>;
      case 'admin':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Admin</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">Activity</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans relative">
      
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-emerald-200/70 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/25">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
                Activity Logs & Monitoring
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Live monitoring of real active users, quiz sessions, prediction views, and platform usage.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Connected to InsForge Database
                </span>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  (Live active user stream)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              autoRefresh 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs' 
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
            {autoRefresh ? 'Live Stream: ON' : 'Live Stream: OFF'}
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
            Refresh
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Export CSV
          </button>

          {/* Clear Logs Button */}
          <button
            onClick={() => setShowClearModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 shadow-xs transition-all cursor-pointer active:scale-95"
            title="Purge or prune activity logs"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-600" />
            <span>Clear Logs</span>
            {logs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-200 text-rose-800 text-[10px] font-black">
                {logs.length}
              </span>
            )}
          </button>
        </div>
      </div>


      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-emerald-200/80 shadow-xs bg-white/90">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Events (24h)</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {stats?.totalEvents24h ?? '—'}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Live traffic tracked
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-emerald-200/80 shadow-xs bg-white/90">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Users (24h)</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {stats?.activeUsersToday ?? '—'}
              </h3>
              <p className="text-[11px] text-blue-600 font-semibold mt-0.5">
                Distinct user accounts
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-emerald-200/80 shadow-xs bg-white/90">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top Feature</p>
              <h3 className="text-lg font-black text-slate-900 tracking-tight mt-0.5 truncate max-w-[140px]">
                {stats?.topAction?.replace(/_/g, ' ') || 'Quiz & Trivia'}
              </h3>
              <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
                {stats?.topActionCount || 0} interactions today
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-emerald-200/80 shadow-xs bg-white/90">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Admin Actions</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {stats?.categoryCounts?.admin || 0}
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                Total all-time: {stats?.totalEventsAllTime || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar & Search */}
      <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-emerald-200/70 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user, email, or action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Batch Selection Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-950 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold">{selectedIds.size} log{selectedIds.size > 1 ? 's' : ''} selected</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-700"></div>
          <button
            onClick={handleDeleteSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Selected ({selectedIds.size})
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer font-medium"
          >
            Deselect All
          </button>
        </div>
      )}

      {/* Activity Logs Table */}
      <Card className="rounded-3xl border-emerald-200/80 shadow-xs overflow-hidden bg-white/95">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 w-10 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    className="p-1 hover:text-slate-800 text-slate-400 transition-colors cursor-pointer"
                    title={selectedIds.size === logs.length && logs.length > 0 ? "Deselect all" : "Select all visible"}
                  >
                    {selectedIds.size > 0 && selectedIds.size === logs.length ? (
                      <CheckSquare className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4 sm:px-6">Timestamp</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
                      <span>Loading live activity logs...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Clock className="h-8 w-8 text-slate-300" />
                      <span>No activity logs match the selected filter.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSelected = selectedIds.has(log.id);
                  return (
                    <tr 
                      key={log.id} 
                      className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${
                        isSelected ? 'bg-emerald-50/40' : ''
                      }`}
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Selection Checkbox */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => handleToggleSelect(log.id, e)}>
                        <button className="p-1 text-slate-400 hover:text-emerald-600 transition-colors">
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Square className="h-4 w-4 group-hover:text-slate-600" />
                          )}
                        </button>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-slate-500">
                        <span className="font-bold text-slate-800 block text-xs">
                          {formatRelativeTime(log.timestamp)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-700 uppercase border border-slate-200">
                            {(log.userName || log.userEmail || 'U').charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-xs leading-tight truncate max-w-[140px]">
                              {log.userName}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                              {log.userEmail}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getCategoryBadge(log.category)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] font-bold text-slate-900">
                        {log.action}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 text-slate-800 max-w-sm font-medium">
                        <p className="truncate text-xs leading-relaxed">
                          {log.description}
                        </p>
                      </td>

                      {/* Details View & Delete Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="View log details"
                          >
                            <Eye className="h-3 w-3" /> View
                          </button>
                          <button
                            onClick={(e) => handleDeleteSingle(log.id, e)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete this log entry"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>Showing {logs.length} logged events from real active users</span>
            {logs.length > 50 && (
              <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 text-[11px]">
                Tip: Use "Clear Logs" above to purge older history
              </span>
            )}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 sm:mt-0 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            {dataSource} (Zero mock data)
          </span>
        </div>
      </Card>

      {/* Clear Logs Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-950 text-base">Purge Activity Logs</h3>
                  <p className="text-xs text-slate-500 font-medium">Free up database space or prune older records</p>
                </div>
              </div>
              <button
                onClick={() => setShowClearModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body: Scopes */}
            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs">Manage High-Volume Logs</p>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    You currently have <strong className="font-bold text-amber-950">{logs.length}</strong> events logged. Choose how you would like to clean up:
                  </p>
                </div>
              </div>

              {/* Scope options */}
              <div className="space-y-2.5">
                <label 
                  onClick={() => setClearScope('keep_50')}
                  className={`p-3.5 rounded-2xl border cursor-pointer flex items-start gap-3 transition-all ${
                    clearScope === 'keep_50'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="clearScope"
                    checked={clearScope === 'keep_50'}
                    onChange={() => setClearScope('keep_50')}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">Prune Older — Keep Recent 50</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Deletes all historical logs while keeping the 50 newest events so your live dashboard stays populated.
                    </p>
                  </div>
                </label>

                <label 
                  onClick={() => setClearScope('older_24h')}
                  className={`p-3.5 rounded-2xl border cursor-pointer flex items-start gap-3 transition-all ${
                    clearScope === 'older_24h'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="clearScope"
                    checked={clearScope === 'older_24h'}
                    onChange={() => setClearScope('older_24h')}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <div>
                    <span className="font-bold text-slate-900 text-xs">Purge Older Than 24 Hours</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Clears everything logged prior to today, keeping today's active user sessions.
                    </p>
                  </div>
                </label>

                <label 
                  onClick={() => setClearScope('older_7d')}
                  className={`p-3.5 rounded-2xl border cursor-pointer flex items-start gap-3 transition-all ${
                    clearScope === 'older_7d'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="clearScope"
                    checked={clearScope === 'older_7d'}
                    onChange={() => setClearScope('older_7d')}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <div>
                    <span className="font-bold text-slate-900 text-xs">Purge Older Than 7 Days</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Removes archives older than one week while preserving recent weekly activity stats.
                    </p>
                  </div>
                </label>

                <label 
                  onClick={() => setClearScope('all')}
                  className={`p-3.5 rounded-2xl border cursor-pointer flex items-start gap-3 transition-all ${
                    clearScope === 'all'
                      ? 'border-rose-600 bg-rose-50/50 ring-2 ring-rose-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="clearScope"
                    checked={clearScope === 'all'}
                    onChange={() => setClearScope('all')}
                    className="mt-0.5 accent-rose-600"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-900 text-xs">Delete All Logs (Full Reset)</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        Irreversible
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-600/80 mt-0.5">
                      Completely empties the activity_logs table in InsForge Postgres and memory cache.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <button
                onClick={() => setShowClearModal(false)}
                disabled={clearing}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteClear}
                disabled={clearing}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-rose-600/20 active:scale-95 disabled:opacity-50"
              >
                {clearing ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Purging Logs...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Confirm & Purge</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Activity Event Details</h3>
                  <p className="text-[10px] text-slate-400 font-mono">{selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <p className="font-bold text-slate-900 text-sm">{selectedLog.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  {getCategoryBadge(selectedLog.category)}
                  <span className="font-mono text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {selectedLog.action}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">User Email</span>
                  <span className="font-bold text-slate-900 mt-0.5 block truncate">{selectedLog.userEmail}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Full Name</span>
                  <span className="font-bold text-slate-900 mt-0.5 block truncate">{selectedLog.userName}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Date & Time</span>
                  <span className="font-medium text-slate-700 mt-0.5 block">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">IP Address</span>
                  <span className="font-mono font-bold text-slate-700 mt-0.5 block">{selectedLog.ip || '127.0.0.1'}</span>
                </div>
              </div>

              {selectedLog.userAgent && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">User Agent & Device</span>
                  <span className="font-mono text-[11px] text-slate-600 break-all leading-tight block">
                    {selectedLog.userAgent}
                  </span>
                </div>
              )}

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1.5">Event Metadata Payload</span>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => handleDeleteSingle(selectedLog.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                Delete this Log
              </button>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminActivityLogs;

