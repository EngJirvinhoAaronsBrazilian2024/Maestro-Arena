import React, { useState, useEffect } from 'react';
import { getTips, createTip, updateTip, deleteTip } from '../../services/tipsService';
import { Tip, TipCategory, TipStatus } from '../../types/tips';
import { useAuth } from '../../context/AuthContext';
import { formatLocalDate, parseDateInputToTimestamp } from '../../lib/dateUtils';
import { Target, Plus, Trash2, Edit2, Calendar, FileText, ChevronRight, CheckCircle2, AlertCircle, HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

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
  const [bookingCode, setBookingCode] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [status, setStatus] = useState<TipStatus>('pending');
  const [publishDate, setPublishDate] = useState(() => formatLocalDate());

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
      setBookingCode(tip.bookingCode || '');
      setAnalysis(tip.analysis || '');
      setStatus(tip.status);
      setPublishDate(formatLocalDate(new Date(tip.publishDate)));
    } else {
      setEditingId(null);
      setCategory('single');
      setHomeTeam('');
      setAwayTeam('');
      setCompetition('');
      setPrediction('');
      setMarket('');
      setOdds('');
      setBookingCode('');
      setAnalysis('');
      setStatus('pending');
      setPublishDate(formatLocalDate());
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
        bookingCode: bookingCode || undefined,
        analysis,
        status,
        publishDate: parseDateInputToTimestamp(publishDate)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won': return 'bg-green-100 text-green-700 border-green-200';
      case 'lost': return 'bg-red-100 text-red-700 border-red-200';
      case 'void': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'postponed': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200'; // pending
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Tips Manager</h1>
          <p className="text-slate-500 max-w-2xl">Publish daily predictions, manage betting odds, and distribute booking codes to users.</p>
        </div>
        <button onClick={() => handleOpenForm()} className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition shadow-sm font-bold">
          <Plus size={18} /> New Tip
        </button>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h2 className="font-bold text-lg text-slate-900">{editingId ? 'Edit Tip Entry' : 'Create New Tip'}</h2>
                <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* General Details */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Target size={16} className="text-blue-500" />
                      General Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                        <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all">
                          <option value="single">Single</option>
                          <option value="maestro2+">Maestro 2+</option>
                          <option value="odd4+">Odd 4+</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all">
                          <option value="pending">Pending</option>
                          <option value="won">Won</option>
                          <option value="lost">Lost</option>
                          <option value="void">Void</option>
                          <option value="postponed">Postponed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Publish Date</label>
                        <input type="date" required value={publishDate} onChange={e => setPublishDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Booking Code</label>
                        <input type="text" value={bookingCode} onChange={e => setBookingCode(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-mono placeholder:font-sans" placeholder="e.g. B9X12Z" />
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Match Details */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <FileText size={16} className="text-blue-500" />
                      Match & Prediction
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                      <div className="lg:col-span-2 grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Home Team</label>
                          <input type="text" required value={homeTeam} onChange={e => setHomeTeam(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" placeholder="e.g. Arsenal" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Away Team</label>
                          <input type="text" required value={awayTeam} onChange={e => setAwayTeam(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" placeholder="e.g. Chelsea" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Competition</label>
                        <input type="text" required value={competition} onChange={e => setCompetition(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" placeholder="e.g. Premier League" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Market</label>
                        <input type="text" value={market} onChange={e => setMarket(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" placeholder="e.g. Full Time Result" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Prediction</label>
                        <input type="text" required value={prediction} onChange={e => setPrediction(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold" placeholder="e.g. Home to Win" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Odds</label>
                        <input type="number" step="0.01" value={odds} onChange={e => setOdds(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" placeholder="e.g. 1.75" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Analysis (Optional)</label>
                    <textarea value={analysis} onChange={e => setAnalysis(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all resize-none" rows={3} placeholder="Add insights or reasoning for this prediction..."></textarea>
                  </div>
                  
                  <div className="flex gap-4 justify-end pt-6 border-t border-slate-100">
                    <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                    <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-sm">Save Tip</button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tips.map(tip => (
          <div key={tip.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">{tip.category}</span>
                <span className={cn("text-xs font-bold px-3 py-1 rounded-full border uppercase tracking-wider flex items-center gap-1", getStatusColor(tip.status))}>
                  {tip.status === 'won' && <CheckCircle2 size={12} />}
                  {tip.status === 'lost' && <X size={12} />}
                  {tip.status === 'pending' && <HelpCircle size={12} />}
                  {tip.status}
                </span>
              </div>
              
              <div className="space-y-4 mb-4 flex-1">
                {tip.matches.map((m, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{m.competition}</div>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900 leading-tight">
                        <span className="truncate">{m.homeTeam}</span>
                        <span className="text-slate-400 font-normal">v</span>
                        <span className="truncate">{m.awayTeam}</span>
                      </div>
                      <div className="text-blue-600 text-sm font-semibold mt-1 bg-blue-50 inline-block px-2 py-0.5 rounded">
                        {m.prediction}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Odds</div>
                  <div className="font-bold text-slate-900">{tip.odds ? tip.odds.toFixed(2) : '-'}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Booking Code</div>
                  <div className="font-mono font-bold text-slate-900 truncate" title={tip.bookingCode || 'None'}>{tip.bookingCode || '-'}</div>
                </div>
              </div>
            </div>
            
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <Calendar size={14} />
                {new Date(tip.publishDate).toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                <button onClick={() => handleOpenForm(tip)} className="p-2 text-blue-600 hover:bg-blue-100 bg-white border border-slate-200 rounded-lg transition-colors shadow-sm" title="Edit Tip">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(tip.id)} className="p-2 text-red-600 hover:bg-red-50 bg-white border border-slate-200 rounded-lg transition-colors shadow-sm" title="Delete Tip">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {tips.length === 0 && !loading && (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
          <Target className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Tips Published</h3>
          <p className="text-slate-500 mb-6">You haven't created any predictions yet.</p>
          <button onClick={() => handleOpenForm()} className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition shadow-sm font-bold">
            <Plus size={18} /> Create First Tip
          </button>
        </div>
      )}
    </div>
  );
}
