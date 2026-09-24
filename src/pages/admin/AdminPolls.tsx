import React, { useState, useEffect } from 'react';
import { insforge } from '../../lib/insforge';
import { Star, Plus, Trash2, StopCircle, Vote, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

export function AdminPolls() {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/polls');
      if (res.ok) {
        const data = await res.json();
        setPolls(data);
        return;
      }
    } catch (e) {
      // fallback
    }

    try {
      const { data, error } = await insforge.database
        .from('polls')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setPolls(data);
      }
    } catch (e) {
      console.log('Polls table not ready');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = () => {
    if (options.length < 5) setOptions([...options, '']);
  };

  const handleRemoveOption = (indexToRemove: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, idx) => idx !== indexToRemove));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.filter(o => o.trim() !== '');
    if (validOptions.length < 2) {
      return toast.error('Need at least 2 options');
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, options: validOptions })
      });

      if (res.ok) {
        toast.success('Poll created successfully!');
        setQuestion('');
        setOptions(['', '']);
        loadPolls();
        return;
      }
    } catch (e) {
      // fallback
    }

    try {
      const { error } = await insforge.database
        .from('polls')
        .insert([{ question, options: validOptions }]);
      
      if (error) throw error;
      
      toast.success('Poll created successfully!');
      setQuestion('');
      setOptions(['', '']);
      loadPolls();
    } catch (e: any) {
      toast.error('Failed to create poll: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const closePoll = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/polls/${id}/close`, { method: 'PUT' });
      if (res.ok) {
        toast.success('Poll closed');
        loadPolls();
        return;
      }
    } catch (e) {
      // fallback
    }

    try {
      await insforge.database.from('polls').update({ status: 'closed' }).eq('id', id);
      toast.success('Poll closed');
      loadPolls();
    } catch (e) {}
  };

  const deletePoll = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/polls/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Poll deleted');
        loadPolls();
        return;
      }
    } catch (e) {
      // fallback
    }

    try {
      await insforge.database.from('polls').delete().eq('id', id);
      toast.success('Poll deleted');
      loadPolls();
    } catch (e) {}
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 mb-2">
          <Vote className="w-3.5 h-3.5 text-rose-600" />
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Fan Engagement</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mb-1">Live Fan Polls</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">Create interactive voting polls to engage fans across the platform.</p>
      </div>

      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">Poll Question</label>
            <input
              type="text"
              required
              value={question}
              onChange={e => setQuestion(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs sm:text-sm font-semibold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-slate-400"
              placeholder="e.g. Who will win the El Clásico derby this weekend?"
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">Answer Options</label>
              <span className="text-[11px] font-bold text-slate-400">Up to 5 options</span>
            </div>

            <div className="space-y-2.5">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-[11px] font-black text-rose-700 border border-rose-200/80">
                    {i + 1}
                  </div>
                  <input 
                    type="text" 
                    value={opt} 
                    onChange={e => {
                      const newOpts = [...options];
                      newOpts[i] = e.target.value;
                      setOptions(newOpts);
                    }} 
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs sm:text-sm font-semibold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-slate-400" 
                    placeholder={`Option ${i + 1}`} 
                    required={i < 2}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(i)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 5 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="inline-flex items-center gap-1.5 text-xs font-black text-rose-600 hover:text-rose-700 transition-colors pt-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Another Option
              </button>
            )}
          </div>
          
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 px-6 py-3 text-xs sm:text-sm font-black text-white shadow-md shadow-rose-600/25 transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Star className="h-4 w-4" />
              )}
              Publish Live Poll
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black text-slate-950">Active & Past Polls</h3>
          <span className="text-xs font-bold text-slate-500">{polls.length} Total</span>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-slate-500 text-sm font-medium">
            Loading polls...
          </div>
        ) : polls.length === 0 ? (
          <div className="rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 bg-white/60 p-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Vote className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-black text-slate-900 mb-1">No polls created yet</h4>
            <p className="text-xs text-slate-500 font-medium">Launch your first community poll using the creator above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {polls.map(p => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs hover:shadow-sm transition-all relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 to-red-600" />
                  
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className={cn(
                          "text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block mb-2",
                          p.status === 'active' 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80" 
                            : "bg-slate-100 text-slate-600"
                        )}>
                          {p.status || 'active'}
                        </span>
                        <h4 className="font-black text-sm sm:text-base text-slate-900 leading-snug">{p.question}</h4>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        {p.status === 'active' && (
                          <button
                            onClick={() => closePoll(p.id)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                            title="Close Poll"
                          >
                            <StopCircle size={17} />
                          </button>
                        )}
                        <button
                          onClick={() => deletePoll(p.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          title="Delete Poll"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 mt-3">
                      {p.options && p.options.map((opt: string, i: number) => (
                        <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50/70 border border-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700">
                          <span className="truncate">{opt}</span>
                          <span className="text-[10px] font-black text-slate-400">Option {i + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-bold">
                    <span>{p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Active'}</span>
                    <span className="text-rose-600 font-black">Live on Feed</span>
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
