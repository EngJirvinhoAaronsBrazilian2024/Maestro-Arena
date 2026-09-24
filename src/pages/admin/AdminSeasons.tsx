import React, { useState, useEffect } from 'react';
import { insforge } from '../../lib/insforge';
import { Award, Plus, Trash2, Power, Calendar, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export function AdminSeasons() {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadSeasons();
  }, []);

  const loadSeasons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/seasons');
      if (res.ok) {
        const data = await res.json();
        setSeasons(data);
        return;
      }
    } catch (e) {
      // fallback
    }

    try {
      const { data, error } = await insforge.database
        .from('quiz_seasons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setSeasons(data);
      }
    } catch (e) {
      console.log('Seasons table not ready');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, start_date: startDate, end_date: endDate })
      });

      if (res.ok) {
        toast.success('Season created successfully!');
        setName('');
        setStartDate('');
        setEndDate('');
        loadSeasons();
        return;
      }
    } catch (e) {
      // fallback
    }

    try {
      const { error } = await insforge.database
        .from('quiz_seasons')
        .insert([{ name, start_date: startDate, end_date: endDate }]);
      
      if (error) throw error;
      
      toast.success('Season created successfully!');
      setName('');
      setStartDate('');
      setEndDate('');
      loadSeasons();
    } catch (e: any) {
      toast.error('Failed to create: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/seasons/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStatus })
      });

      if (res.ok) {
        toast.success(currentStatus ? 'Season deactivated' : 'Season activated');
        loadSeasons();
        return;
      }
    } catch (e) {
      // fallback
    }

    try {
      // Deactivate all others first if we are activating
      if (!currentStatus) {
        await insforge.database.from('quiz_seasons').update({ is_active: false }).neq('id', id);
      }
      
      await insforge.database.from('quiz_seasons').update({ is_active: !currentStatus }).eq('id', id);
      toast.success(currentStatus ? 'Season deactivated' : 'Season activated');
      loadSeasons();
    } catch (e: any) {
      toast.error('Failed to update season');
    }
  };

  const deleteSeason = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/seasons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Season deleted');
        loadSeasons();
        return;
      }
    } catch (e) {
      // fallback
    }

    try {
      await insforge.database.from('quiz_seasons').delete().eq('id', id);
      toast.success('Season deleted');
      loadSeasons();
    } catch (e) {}
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 mb-2">
          <Award className="w-3.5 h-3.5 text-rose-600" />
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Tournament Structure</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mb-1">Leaderboard Seasons</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">Manage competitive trivia cycles to reset monthly rankings and reward top performers.</p>
      </div>

      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">Season Title</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs sm:text-sm font-semibold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-slate-400"
                placeholder="e.g. October Grand Championship"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs sm:text-sm font-semibold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs sm:text-sm font-semibold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all"
              />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 px-6 py-3 text-xs sm:text-sm font-black text-white shadow-md shadow-rose-600/25 transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create Season
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black text-slate-950">Seasons History</h3>
          <span className="text-xs font-bold text-slate-500">{seasons.length} Total</span>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-slate-500 text-sm font-medium">
            Loading seasons...
          </div>
        ) : seasons.length === 0 ? (
          <div className="rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 bg-white/60 p-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Award className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-black text-slate-900 mb-1">No seasons configured</h4>
            <p className="text-xs text-slate-500 font-medium">Set up a season above to start official tournament tracking.</p>
          </div>
        ) : (
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 min-w-[550px]">
                <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-black border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Season</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  <AnimatePresence>
                    {seasons.map(s => (
                      <motion.tr
                        key={s.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-rose-50/20 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">{s.name}</div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{s.start_date}</span>
                            <span className="text-slate-400">to</span>
                            <span>{s.end_date}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {s.is_active ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => toggleActive(s.id, s.is_active)}
                              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                                s.is_active
                                  ? 'text-amber-600 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={s.is_active ? "Deactivate Season" : "Activate Season"}
                            >
                              <Power size={17} />
                            </button>
                            <button
                              onClick={() => deleteSeason(s.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                              title="Delete Season"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
