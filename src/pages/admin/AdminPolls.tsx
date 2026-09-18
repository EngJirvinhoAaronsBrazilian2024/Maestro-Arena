import React, { useState, useEffect } from 'react';
import { insforge } from '../../lib/insforge';
import { Star, Plus, Trash2, StopCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

export function AdminPolls() {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.filter(o => o.trim() !== '');
    if (validOptions.length < 2) {
      return toast.error('Need at least 2 options');
    }

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
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Live Fan Polls</h1>
        <p className="text-slate-500">Create interactive polls to engage fans on the home feed.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Poll Question</label>
            <input type="text" required value={question} onChange={e => setQuestion(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Who will win the Derby?" />
          </div>
          
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700">Options</label>
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input 
                  type="text" 
                  value={opt} 
                  onChange={e => {
                    const newOpts = [...options];
                    newOpts[i] = e.target.value;
                    setOptions(newOpts);
                  }} 
                  className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder={`Option ${i + 1}`} 
                  required={i < 2}
                />
              </div>
            ))}
            {options.length < 5 && (
              <button type="button" onClick={handleAddOption} className="text-sm font-bold text-blue-600 hover:text-blue-700">+ Add Option</button>
            )}
          </div>
          
          <div className="pt-2">
            <button type="submit" className="bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition font-bold shadow-sm">
              Publish Poll
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-slate-900">Manage Polls</h3>
        {loading ? <p>Loading...</p> : polls.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Star className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <p className="text-slate-500 font-medium">No polls active.</p>
          </div>
        ) : (
          polls.map(p => (
            <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-lg text-slate-900">{p.question}</h4>
                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block", p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600')}>
                    {p.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  {p.status === 'active' && (
                    <button onClick={() => closePoll(p.id)} className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition" title="Close Poll">
                      <StopCircle size={18} />
                    </button>
                  )}
                  <button onClick={() => deletePoll(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete Poll">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {p.options.map((opt: string, i: number) => (
                  <div key={i} className="bg-slate-50 p-2 rounded border border-slate-100 text-sm font-medium text-slate-700">
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
