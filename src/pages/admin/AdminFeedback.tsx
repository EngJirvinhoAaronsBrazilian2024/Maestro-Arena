import React, { useState, useEffect } from 'react';
import { insforge } from '../../lib/insforge';
import { HelpCircle, CheckCircle, MessageSquare, Clock, User, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
    <div className="mx-auto w-full max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 mb-2">
          <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Community Signals</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mb-1">User Feedback Inbox</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">Review bug reports, suggestions, feature ideas, and support requests directly from fans.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black text-slate-950">Messages</h3>
          <span className="text-xs font-bold text-slate-500">{feedbacks.length} Submissions</span>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-slate-500 text-sm font-medium">
            Loading messages...
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 bg-white/60 p-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-black text-slate-900 mb-1">Inbox is empty</h4>
            <p className="text-xs text-slate-500 font-medium">No customer or user feedback messages received yet.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            <AnimatePresence>
              {feedbacks.map(f => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`rounded-2xl sm:rounded-3xl border p-5 sm:p-6 transition-all shadow-2xs hover:shadow-sm ${
                    f.status === 'resolved'
                      ? 'bg-slate-50/70 border-slate-200/80 opacity-75'
                      : 'bg-white border-rose-200/60'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                      f.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                        : 'bg-rose-50 text-rose-700 border border-rose-200/80'
                    }`}>
                      {f.status || 'open'}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold">
                      <Clock className="h-3 w-3" />
                      <span>{f.created_at ? new Date(f.created_at).toLocaleString() : 'Recent'}</span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-800 font-medium mb-4 whitespace-pre-wrap leading-relaxed">
                    {f.message}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-bold text-slate-800">{f.user_name || 'Fan'}</span>
                      {f.user_email && <span className="text-slate-400 text-[11px] font-mono">({f.user_email})</span>}
                    </div>
                    {f.status !== 'resolved' && (
                      <button
                        onClick={() => resolveFeedback(f.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 text-xs font-black text-emerald-700 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                      >
                        <CheckCircle size={14} /> Mark Resolved
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
