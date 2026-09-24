import React, { useState, useEffect } from 'react';
import { insforge } from '../../lib/insforge';
import { Bell, Send, Trash2, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        return;
      }
    } catch (e) {
      // fallback
    }

    try {
      const { data } = await insforge.database
        .from('app_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        setNotifications(data);
      }
    } catch (e) {
      console.log('Notifications table query fallback', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, type })
      });

      if (res.ok) {
        toast.success('Notification broadcasted successfully!');
        setTitle('');
        setMessage('');
        loadNotifications();
        return;
      }
    } catch (e) {
      // fallback
    }

    try {
      const { error } = await insforge.database
        .from('app_notifications')
        .insert([{ title, message, type }]);
      
      if (error) throw error;
      
      toast.success('Notification broadcasted successfully!');
      setTitle('');
      setMessage('');
      loadNotifications();
    } catch (e: any) {
      toast.error('Failed to send notification: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotifications(notifications.filter(n => n.id !== id));
        toast.success('Notification deleted');
        return;
      }
    } catch (e) {
      // fallback
    }

    try {
      const { error } = await insforge.database
        .from('app_notifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setNotifications(notifications.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch (e: any) {
      toast.error('Failed to delete: ' + e.message);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 mb-2">
          <Bell className="w-3.5 h-3.5 text-rose-600" />
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Broadcast Center</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mb-1">Global Notifications</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">Blast real-time in-app alerts and announcements to all users.</p>
      </div>

      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
        <form onSubmit={handleSend} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">Notification Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs sm:text-sm font-semibold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-slate-400"
                placeholder="e.g. Champions League Final Starting Soon!"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">Notification Style</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs sm:text-sm font-semibold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all"
              >
                <option value="info">Info (Blue Accent)</option>
                <option value="success">Success (Emerald Accent)</option>
                <option value="warning">Warning (Amber Accent)</option>
                <option value="alert">Alert (Rose/Red Accent)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">Broadcast Message</label>
            <textarea
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs sm:text-sm font-semibold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-slate-400"
              rows={3}
              placeholder="Write the full message details for the fan community..."
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 px-6 py-3 text-xs sm:text-sm font-black text-white shadow-md shadow-rose-600/25 transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Broadcast Notification
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black text-slate-950">Recent Broadcasts</h3>
          <span className="text-xs font-bold text-slate-500">{notifications.length} Total</span>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-slate-500 text-sm font-medium">
            Loading broadcasts...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 bg-white/60 p-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Bell className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-black text-slate-900 mb-1">No notifications yet</h4>
            <p className="text-xs text-slate-500 font-medium">Create your first broadcast announcement above to reach all users.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {notifications.map((n, idx) => (
                <motion.div
                  key={`${n.id || 'notif'}_${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 flex items-start justify-between gap-4 shadow-2xs hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      n.type === 'alert'
                        ? 'bg-rose-50 text-rose-600 border border-rose-200/80'
                        : n.type === 'warning'
                        ? 'bg-amber-50 text-amber-600 border border-amber-200/80'
                        : n.type === 'success'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80'
                        : 'bg-sky-50 text-sky-600 border border-sky-200/80'
                    }`}>
                      {n.type === 'alert' && <AlertCircle className="h-4 w-4" />}
                      {n.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
                      {n.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
                      {n.type === 'info' && <Info className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900">{n.title}</h4>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          n.type === 'alert'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                            : n.type === 'warning'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
                            : n.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                            : 'bg-sky-50 text-sky-700 border border-sky-200/80'
                        }`}>
                          {n.type}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">{n.message}</p>
                      <p className="text-[11px] text-slate-400 font-bold mt-2">
                        {n.created_at ? new Date(n.created_at).toLocaleString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Delete Notification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
