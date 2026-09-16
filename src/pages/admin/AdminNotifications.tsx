import React, { useState, useEffect } from 'react';
import { insforge } from '../../lib/insforge';
import { Target, Send, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await insforge.database
        .from('app_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error && error.code !== 'PGRST116') {
        // Table might not exist yet
      } else if (data) {
        setNotifications(data);
      }
    } catch (e) {
      console.log('Notifications table not ready', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
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
    }
  };

  const handleDelete = async (id: string) => {
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
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Global Notifications</h1>
        <p className="text-slate-500">Blast in-app alerts to all users instantly.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSend} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Big Match Starting!" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="info">Info (Blue)</option>
                <option value="success">Success (Green)</option>
                <option value="warning">Warning (Orange)</option>
                <option value="alert">Alert (Red)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
            <textarea required value={message} onChange={e => setMessage(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" rows={3} placeholder="Write your message here..."></textarea>
          </div>
          <button type="submit" className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition font-bold">
            <Send size={18} /> Broadcast Notification
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-slate-900">Recent Broadcasts</h3>
        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Target className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <p className="text-slate-500 font-medium">No notifications sent yet.</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-start shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${n.type === 'alert' ? 'bg-red-500' : n.type === 'warning' ? 'bg-orange-500' : n.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                  <h4 className="font-bold text-slate-900">{n.title}</h4>
                </div>
                <p className="text-sm text-slate-600">{n.message}</p>
                <p className="text-xs text-slate-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => handleDelete(n.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
