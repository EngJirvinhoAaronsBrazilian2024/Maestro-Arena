import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, updateUserRole, deleteUserRecord, UserData } from '../services/userService';
import { Users, Shield, Trash2, ShieldAlert, AlertCircle, Activity, Database, Star, RefreshCw, HelpCircle, FileText, Target, Search, Bell, Award, ChevronRight, Brain } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card, CardContent } from '../components/ui/Card';
import { toast } from 'sonner';
import { UserAvatar } from '../components/ui/UserAvatar';

export function AdminDashboard() {
  const { user, userData } = useAuth();
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    totalAdmins: 0,
    totalTips: 0,
    totalQuestions: 0,
    totalArticles: 0,
    openFeedbackCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load users
      const data = await getAllUsers();
      setUsers(data);
      
      // Load stats
      try {
        const res = await fetch('/api/admin/overview');
        if (res.ok) {
          const overview = await res.json();
          setStats(overview);
        }
      } catch (statErr) {
        console.warn('Overview stats error:', statErr);
      }
      
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load user directory.');
    }
    setLoading(false);
  };

  const handleSyncUsers = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/users/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(`User sync complete! ${data.synced} new accounts synced.`);
        loadData();
      } else {
        toast.error(data.error || 'Failed to sync users.');
      }
    } catch (e: any) {
      toast.error('Sync failed: ' + e.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!user) return;
    const currentAdminId = user.id || (user as any).uid;
    try {
      await updateUserRole(userId, newRole, currentAdminId);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
      toast.success(`User role updated to ${newRole}`);
      // Refresh stats
      loadData();
    } catch (err: any) {
      toast.error("Failed to update role: " + err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!user || !confirm('Are you sure you want to delete this user?')) return;
    const currentAdminId = user.id || (user as any).uid;
    try {
      await deleteUserRecord(userId, currentAdminId);
      setUsers(users.filter(u => u.id !== userId));
      toast.success("User removed from database");
      loadData();
    } catch (err: any) {
      toast.error("Failed to delete user: " + err.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-slate-500">You need administrator privileges to view this page.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    (u.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 mb-2">
            <Shield className="w-3.5 h-3.5 text-rose-600" />
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Maestro Arena Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Platform Overview</h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">Manage user accounts, database state, and monitor platform activity.</p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200/80 shadow-2xs transition-all cursor-pointer"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh Stats
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-none shadow-md shadow-rose-600/15 bg-gradient-to-br from-rose-600 via-rose-600 to-red-600 text-white overflow-hidden relative rounded-2xl">
          <div className="absolute right-0 top-0 opacity-15 transform translate-x-4 -translate-y-4 pointer-events-none">
            <Users size={120} />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center gap-2 mb-3 opacity-90 font-extrabold uppercase tracking-wider text-xs">
              <Users size={16} />
              Total Users
            </div>
            <div className="text-4xl font-black tracking-tight">{stats.totalUsers || users.length}</div>
            <p className="text-[11px] font-medium text-rose-100 mt-1">
              {stats.totalAdmins || users.filter(u => u.role === 'admin').length} Admins • {users.length} in DB
            </p>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl shadow-2xs bg-white border border-slate-200/80">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-500 font-extrabold uppercase tracking-wider text-xs">
                <Target size={16} className="text-emerald-600" />
                Predictions (Tips)
              </div>
              <Link to="/admin/tips" className="text-xs font-bold text-rose-600 hover:underline">Manage</Link>
            </div>
            <div className="text-4xl font-black text-slate-900 tracking-tight">{stats.totalTips || 0}</div>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              <span className="text-emerald-600 font-bold">{stats.wonTipsCount || 0} Won</span> • <span className="text-blue-600 font-bold">{stats.pendingTipsCount || 0} Pending</span>
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-2xs bg-white border border-slate-200/80">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-500 font-extrabold uppercase tracking-wider text-xs">
                <FileText size={16} className="text-blue-600" />
                Newsroom
              </div>
              <Link to="/admin/news" className="text-xs font-bold text-rose-600 hover:underline">Manage</Link>
            </div>
            <div className="text-4xl font-black text-slate-900 tracking-tight">{stats.totalArticles || 0}</div>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              <span className="text-emerald-600 font-bold">{stats.publishedArticlesCount || 0} Published</span> • <span className="text-amber-600 font-bold">{stats.draftArticlesCount || 0} Drafts</span>
            </p>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl shadow-2xs bg-white border border-slate-200/80">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-500 font-extrabold uppercase tracking-wider text-xs">
                <Brain size={16} className="text-purple-600" />
                Trivia & Quiz
              </div>
              <Link to="/admin/quiz" className="text-xs font-bold text-rose-600 hover:underline">Manage</Link>
            </div>
            <div className="text-4xl font-black text-slate-900 tracking-tight">{stats.totalQuestions || 0}</div>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              {stats.totalSeasons || 0} Seasons • {stats.activePollsCount || 0} Active Polls
            </p>
          </CardContent>
        </Card>
      </div>

      {/* QUICK ACTIONS NAVIGATION */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <Link to="/admin/news" className="p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-rose-300 hover:shadow-xs transition-all flex flex-col items-center text-center group cursor-pointer">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform mb-2">
            <FileText size={18} />
          </div>
          <span className="text-xs font-black text-slate-900">Newsroom</span>
          <span className="text-[10px] text-slate-400 font-semibold">{stats.totalArticles || 0} Articles</span>
        </Link>

        <Link to="/admin/tips" className="p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-rose-300 hover:shadow-xs transition-all flex flex-col items-center text-center group cursor-pointer">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform mb-2">
            <Target size={18} />
          </div>
          <span className="text-xs font-black text-slate-900">Predictions</span>
          <span className="text-[10px] text-slate-400 font-semibold">{stats.totalTips || 0} Tips</span>
        </Link>

        <Link to="/admin/quiz" className="p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-rose-300 hover:shadow-xs transition-all flex flex-col items-center text-center group cursor-pointer">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform mb-2">
            <Brain size={18} />
          </div>
          <span className="text-xs font-black text-slate-900">Trivia Vault</span>
          <span className="text-[10px] text-slate-400 font-semibold">{stats.totalQuestions || 0} Qs</span>
        </Link>

        <Link to="/admin/polls" className="p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-rose-300 hover:shadow-xs transition-all flex flex-col items-center text-center group cursor-pointer">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform mb-2">
            <Star size={18} />
          </div>
          <span className="text-xs font-black text-slate-900">Live Polls</span>
          <span className="text-[10px] text-slate-400 font-semibold">{stats.totalPolls || 0} Polls</span>
        </Link>

        <Link to="/admin/seasons" className="p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-rose-300 hover:shadow-xs transition-all flex flex-col items-center text-center group cursor-pointer">
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform mb-2">
            <Award size={18} />
          </div>
          <span className="text-xs font-black text-slate-900">Seasons</span>
          <span className="text-[10px] text-slate-400 font-semibold">{stats.totalSeasons || 0} Cycles</span>
        </Link>

        <Link to="/admin/notifications" className="p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-rose-300 hover:shadow-xs transition-all flex flex-col items-center text-center group cursor-pointer">
          <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 group-hover:scale-110 transition-transform mb-2">
            <Bell size={18} />
          </div>
          <span className="text-xs font-black text-slate-900">Broadcasts</span>
          <span className="text-[10px] text-slate-400 font-semibold">{stats.totalNotifications || 0} Alerts</span>
        </Link>

        <Link to="/admin/feedback" className="p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-rose-300 hover:shadow-xs transition-all flex flex-col items-center text-center group cursor-pointer">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-600 group-hover:scale-110 transition-transform mb-2">
            <HelpCircle size={18} />
          </div>
          <span className="text-xs font-black text-slate-900">Feedback</span>
          <span className="text-[10px] text-slate-400 font-semibold">
            {stats.openFeedbackCount > 0 ? (
              <span className="text-rose-600 font-bold">{stats.openFeedbackCount} New</span>
            ) : (
              'All clear'
            )}
          </span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="font-black text-base sm:text-lg text-slate-900 flex items-center gap-2.5">
            <Database className="text-rose-600" size={18} />
            User Directory <span className="text-xs font-bold text-slate-400">({users.length})</span>
          </h3>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search user or email..."
                className="pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 w-48 sm:w-64 transition-all"
              />
            </div>

            <button
              onClick={handleSyncUsers}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-black hover:bg-rose-100 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              title="Sync newly registered auth users into public users table"
            >
              <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
              {syncing ? 'Syncing...' : 'Sync Auth'}
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-3 border-slate-200 border-t-rose-600 animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-5 h-5" />{error}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] uppercase tracking-wider font-black text-slate-500">
                  <th className="p-4 sm:p-5">User</th>
                  <th className="p-4 sm:p-5">Role</th>
                  <th className="p-4 sm:p-5">Joined</th>
                  <th className="p-4 sm:p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-rose-50/20 transition-colors group">
                    <td className="p-4 sm:p-5">
                      <div className="flex items-center gap-3.5">
                        <UserAvatar 
                          name={u.displayName}
                          email={u.email}
                          avatarUrl={(u as any).avatarUrl || (u as any).avatar_url}
                          size="md"
                          className={cn(
                            "h-10 w-10 rounded-xl",
                            u.role === 'admin' ? "ring-2 ring-rose-500/40" : ""
                          )}
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-slate-900 truncate">{u.displayName || 'Unnamed User'}</div>
                          <div className="text-xs text-slate-500 font-mono truncate">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 sm:p-5">
                      <select
                        value={u.role || 'user'}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className={cn(
                          "bg-white border text-xs font-bold rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none p-2 transition-all shadow-2xs cursor-pointer",
                          u.role === 'admin' ? "text-purple-700 bg-purple-50/80 border-purple-200" : "text-slate-700 border-slate-200"
                        )}
                      >
                        <option value="user">User</option>
                        <option value="editor">Editor</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-4 sm:p-5 text-slate-500 text-xs font-semibold">
                      {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-4 sm:p-5 text-right">
                      <button 
                        onClick={() => handleDeleteUser(u.id)} 
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
