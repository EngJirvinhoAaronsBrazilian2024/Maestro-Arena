import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, updateUserRole, deleteUserRecord, UserData } from '../services/userService';
import { Users, Shield, Trash2, ShieldAlert, AlertCircle, Activity, UserPlus, Database, Star } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card, CardContent } from '../components/ui/Card';

export function AdminDashboard() {
  const { user, userData } = useAuth();
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
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
      const data = await getAllUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load data.');
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!user) return;
    try {
      await updateUserRole(userId, newRole, user.uid);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
    } catch (err: any) {
      alert("Failed to update role: " + err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!user || !confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUserRecord(userId, user.uid);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err: any) {
      alert("Failed to delete user: " + err.message);
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

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Platform Overview</h1>
        <p className="text-slate-500">Manage user accounts, roles, and monitor platform health.</p>
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
            <div className="text-4xl font-black">{users.length}</div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-white border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4 text-slate-500 font-bold uppercase tracking-wider text-sm">
              <Shield size={18} className="text-purple-500" />
              Administrators
            </div>
            <div className="text-4xl font-black text-slate-900">{users.filter(u => u.role === 'admin').length}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4 text-slate-500 font-bold uppercase tracking-wider text-sm">
              <Star size={18} className="text-orange-500" />
              Engagement
            </div>
            <div className="flex flex-col">
              <div className="text-sm font-bold text-slate-900">Manage Polls & Seasons</div>
              <p className="text-xs text-slate-500 mt-1">Use the sidebar to view active features.</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-white border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4 text-slate-500 font-bold uppercase tracking-wider text-sm">
              <Activity size={18} className="text-green-500" />
              System Status
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <div className="text-xl font-black text-slate-900">Operational</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <Database className="text-slate-400" size={20} />
            User Directory
          </h3>
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
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold shadow-sm">
                          {u.displayName?.charAt(0).toUpperCase() || (u.email ? u.email.charAt(0).toUpperCase() : 'U')}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{u.displayName || 'Unnamed User'}</div>
                          <div className="text-sm text-slate-500">{u.email}</div>
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
