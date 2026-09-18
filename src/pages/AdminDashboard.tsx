import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, updateUserRole, deleteUserRecord, UserData } from '../services/userService';
import { Users, Shield, Trash2, ShieldAlert, AlertCircle, Activity, Database, Star, RefreshCw, HelpCircle, FileText, Target, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card, CardContent } from '../components/ui/Card';
import { toast } from 'sonner';

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
    <div className="max-w-7xl mx-auto pb-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Platform Overview</h1>
          <p className="text-slate-500">Manage user accounts, database state, and monitor platform activity.</p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh Stats
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden relative">
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
            <Users size={120} />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center gap-3 mb-4 opacity-80 font-bold uppercase tracking-wider text-sm">
              <Users size={18} />
              Total Users
            </div>
            <div className="text-4xl font-black">{stats.totalUsers || users.length}</div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-white border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4 text-slate-500 font-bold uppercase tracking-wider text-sm">
              <Shield size={18} className="text-purple-500" />
              Administrators
            </div>
            <div className="text-4xl font-black text-slate-900">{stats.totalAdmins || users.filter(u => u.role === 'admin').length}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4 text-slate-500 font-bold uppercase tracking-wider text-sm">
              <Target size={18} className="text-emerald-500" />
              Active Predictions
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-black text-slate-900">{stats.totalTips || 0}</div>
              <span className="text-xs text-slate-500 font-medium">Tips in database</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-white border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4 text-slate-500 font-bold uppercase tracking-wider text-sm">
              <Activity size={18} className="text-green-500" />
              Database Engine
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <div className="text-xl font-black text-slate-900">InsForge Connected</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <Database className="text-slate-400" size={20} />
            User Directory ({users.length})
          </h3>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search user or email..."
                className="pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
              />
            </div>

            <button
              onClick={handleSyncUsers}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors shadow-sm disabled:opacity-50"
              title="Sync newly registered auth users into public users table"
            >
              <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
              {syncing ? 'Syncing...' : 'Sync Auth'}
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
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
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider font-bold text-slate-500">
                  <th className="p-5">User</th>
                  <th className="p-5">Role</th>
                  <th className="p-5">Joined</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold shadow-sm">
                          {u.displayName?.charAt(0).toUpperCase() || (u.email ? u.email.charAt(0).toUpperCase() : 'U')}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{u.displayName || 'Unnamed User'}</div>
                          <div className="text-sm text-slate-500 font-mono">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <select
                        value={u.role || 'user'}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className={cn(
                          "bg-white border border-slate-200 text-sm font-bold rounded-lg focus:ring-2 focus:ring-blue-500 outline-none p-2.5 transition-all shadow-sm",
                          u.role === 'admin' ? "text-purple-700 bg-purple-50 border-purple-200" : "text-slate-700"
                        )}
                      >
                        <option value="user">User</option>
                        <option value="editor">Editor</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-5 text-slate-500 text-sm font-medium">
                      {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-5 text-right">
                      <button 
                        onClick={() => handleDeleteUser(u.id)} 
                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 opacity-0 group-hover:opacity-100"
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
