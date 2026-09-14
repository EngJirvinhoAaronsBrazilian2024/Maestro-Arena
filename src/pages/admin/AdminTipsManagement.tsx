import React, { useState, useEffect } from 'react';
import { getTips, createTip, updateTip, deleteTip } from '../../services/tipsService';
import { Tip, TipCategory, TipStatus } from '../../types/tips';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { Target, Plus, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';

export function AdminTipsManagement() {
  const { userData, user } = useAuth();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Form State
  const [category, setCategory] = useState<TipCategory>('single');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [competition, setCompetition] = useState('');
  const [prediction, setPrediction] = useState('');
  const [market, setMarket] = useState('');
  const [odds, setOdds] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [status, setStatus] = useState<TipStatus>('pending');
  const [publishDate, setPublishDate] = useState(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d.toISOString().split('T')[0];
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTips();
  }, []);

  const fetchTips = async () => {
    setLoading(true);
    const data = await getTips();
    setTips(data);
    setLoading(false);
  };

  const handleOpenForm = (tip?: Tip) => {
    if (tip) {
      setEditingId(tip.id);
      setCategory(tip.category);
      setHomeTeam(tip.matches[0]?.homeTeam || '');
      setAwayTeam(tip.matches[0]?.awayTeam || '');
      setCompetition(tip.matches[0]?.competition || '');
      setPrediction(tip.matches[0]?.prediction || '');
      setMarket(tip.matches[0]?.market || '');
      setOdds(tip.odds?.toString() || '');
      setAnalysis(tip.analysis || '');
      setStatus(tip.status);
      const d = new Date(tip.publishDate);
      setPublishDate(d.toISOString().split('T')[0]);
    } else {
      setEditingId(null);
      setCategory('single');
      setHomeTeam('');
      setAwayTeam('');
      setCompetition('');
      setPrediction('');
      setMarket('');
      setOdds('');
      setAnalysis('');
      setStatus('pending');
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const tipData = {
        category,
        matches: [{
          homeTeam,
          awayTeam,
          competition,
          prediction,
          market
        }],
        odds: odds ? parseFloat(odds) : undefined,
        analysis,
        status,
        publishDate: new Date(publishDate).getTime()
      };

      if (editingId) {
        await updateTip(user.id, editingId, tipData);
      } else {
        await createTip(user.id, tipData);
      }
      setIsFormOpen(false);
      fetchTips();
    } catch (err) {
      console.error(err);
      alert('Error saving tip');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Delete tip?')) return;
    try {
      await deleteTip(user.id, id);
      fetchTips();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
            <Target size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Tips</h1>
            <p className="text-slate-500">Create and publish daily predictions</p>
          </div>
        </div>
        <button onClick={() => handleOpenForm()} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-800 transition font-medium">
          <Plus size={18} /> New Tip
        </button>
      </div>

      {isFormOpen && (
        <Card className="border-blue-100 shadow-md">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle>{editingId ? 'Edit Tip' : 'Create New Tip'}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="single">Single</option>
                    <option value="maestro2+">Maestro 2+</option>
                    <option value="odd4+">Odd 4+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Publish Date</label>
                  <input type="date" required value={publishDate} onChange={e => setPublishDate(e.target.value)} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Competition</label>
                  <input type="text" required value={competition} onChange={e => setCompetition(e.target.value)} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Premier League" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Market</label>
                  <input type="text" value={market} onChange={e => setMarket(e.target.value)} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Full Time Result" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Home Team</label>
                  <input type="text" required value={homeTeam} onChange={e => setHomeTeam(e.target.value)} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Away Team</label>
                  <input type="text" required value={awayTeam} onChange={e => setAwayTeam(e.target.value)} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Prediction</label>
                  <input type="text" required value={prediction} onChange={e => setPrediction(e.target.value)} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Home to Win" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Odds</label>
                  <input type="number" step="0.01" value={odds} onChange={e => setOdds(e.target.value)} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 1.75" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Analysis (Optional)</label>
                <textarea value={analysis} onChange={e => setAnalysis(e.target.value)} className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={3}></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="pending">Pending</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                  <option value="void">Void</option>
                  <option value="postponed">Postponed</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-sm">Save Tip</button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tips.map(tip => (
          <Card key={tip.id} className="hover:shadow-md transition">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">{tip.category}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded uppercase border ${tip.status === 'won' ? 'bg-green-50 text-green-700 border-green-200' : tip.status === 'lost' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{tip.status}</span>
              </div>
              <div className="space-y-1 mb-4">
                {tip.matches.map((m, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-bold">{m.homeTeam}</span> vs <span className="font-bold">{m.awayTeam}</span>
                    <div className="text-slate-500 text-xs mt-0.5">{m.prediction}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-500">{new Date(tip.publishDate).toLocaleDateString()}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenForm(tip)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(tip.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
