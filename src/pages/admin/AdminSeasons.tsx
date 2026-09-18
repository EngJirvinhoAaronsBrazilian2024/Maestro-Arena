import React, { useState, useEffect } from 'react';
import { insforge } from '../../lib/insforge';
import { Award, Plus, Trash2, Power } from 'lucide-react';
import { toast } from 'sonner';

export function AdminSeasons() {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Leaderboard Seasons</h1>
        <p className="text-slate-500">Manage quiz seasons to reset leaderboards and declare winners.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Season Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. September League" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Start Date</label>
              <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">End Date</label>
              <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <button type="submit" className="bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition font-bold shadow-sm">
            Create Season
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {loading ? <p>Loading...</p> : seasons.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Award className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <p className="text-slate-500 font-medium">No seasons created.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                <tr>
                  <th className="p-4 font-bold">Season</th>
                  <th className="p-4 font-bold">Duration</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {seasons.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-900">{s.name}</td>
                    <td className="p-4 text-slate-600">{s.start_date} to {s.end_date}</td>
                    <td className="p-4">
                      {s.is_active ? (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold uppercase">Active</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-full text-xs font-bold uppercase">Inactive</span>
                      )}
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button onClick={() => toggleActive(s.id, s.is_active)} className={`p-2 rounded-lg transition ${s.is_active ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`} title={s.is_active ? "Deactivate" : "Activate"}>
                        <Power size={18} />
                      </button>
                      <button onClick={() => deleteSeason(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete">
                        <Trash2 size={18} />
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
