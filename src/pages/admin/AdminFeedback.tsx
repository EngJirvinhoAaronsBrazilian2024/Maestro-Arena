import React, { useState, useEffect } from 'react';
import { insforge } from '../../lib/insforge';
import { HelpCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/feedback');
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
        return;
      }
    } catch (e) {
      // fallback
    }

    try {
      const { data, error } = await insforge.database
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setFeedbacks(data);
      }
    } catch (e) {
      console.log('Feedback table not ready');
    } finally {
      setLoading(false);
    }
  };

  const resolveFeedback = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/feedback/${id}/resolve`, { method: 'PUT' });
      if (res.ok) {
        toast.success('Marked as resolved');
        loadFeedback();
        return;
      }
    } catch (e) {
      // fallback
    }

    try {
      await insforge.database.from('feedback').update({ status: 'resolved' }).eq('id', id);
      toast.success('Marked as resolved');
      loadFeedback();
    } catch (e) {}
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">User Feedback Inbox</h1>
        <p className="text-slate-500">Review bug reports, suggestions, and support requests from users.</p>
      </div>

      <div className="space-y-4">
        {loading ? <p>Loading...</p> : feedbacks.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200 shadow-sm">
            <HelpCircle className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <p className="text-slate-500 font-medium">Inbox is empty. No feedback yet.</p>
          </div>
        ) : (
          feedbacks.map(f => (
            <div key={f.id} className={`p-5 rounded-xl border transition shadow-sm ${f.status === 'resolved' ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-blue-200'}`}>
              <div className="flex justify-between items-start mb-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${f.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {f.status}
                </span>
                <span className="text-xs text-slate-400">{new Date(f.created_at).toLocaleString()}</span>
              </div>
              <p className="text-slate-900 font-medium mb-4 whitespace-pre-wrap">{f.message}</p>
              <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-3">
                <span className="text-slate-500 font-mono text-xs">User ID: {f.user_id}</span>
                {f.status !== 'resolved' && (
                  <button onClick={() => resolveFeedback(f.id)} className="flex items-center gap-1 text-green-600 font-bold hover:text-green-700 transition">
                    <CheckCircle size={16} /> Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
