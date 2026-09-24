import React, { useState, useEffect } from 'react';
import { getTips, createTip, updateTip, deleteTip } from '../../services/tipsService';
import { Tip, TipCategory, TipStatus, normalizeCategory } from '../../types/tips';
import { useAuth } from '../../context/AuthContext';
import { formatLocalDate, parseDateInputToTimestamp } from '../../lib/dateUtils';
import { Target, Plus, Trash2, Edit2, Calendar, FileText, ChevronRight, CheckCircle2, AlertCircle, HelpCircle, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

export function AdminTipsManagement() {
  const { userData, user } = useAuth();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
    try {
      const data = await getTips();
      setTips(data);
    } catch (err: any) {
      console.error('Failed to fetch tips:', err);
      toast.error('Failed to load tips from database');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (tip?: Tip) => {
    if (tip) {
      setEditingId(tip.id);
      setCategory(normalizeCategory(tip.category));
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
    const adminIdentifier = user?.id || (user as any)?.uid || 'admin';

    setIsSaving(true);
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
        await updateTip(adminIdentifier, editingId, tipData);
        toast.success('Tip updated successfully');
      } else {
        await createTip(adminIdentifier, tipData);
        toast.success('Tip created and stored in InsForge successfully');
      }
      setIsFormOpen(false);
      await fetchTips();
    } catch (err: any) {
      console.error('Error saving tip:', err);
      toast.error(err.message || 'Error saving tip');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const adminIdentifier = user?.id || (user as any)?.uid || 'admin';
    if (!confirm('Are you sure you want to delete this tip?')) return;
    try {
      await deleteTip(adminIdentifier, id);
      toast.success('Tip deleted');
      await fetchTips();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to delete tip');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won': return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'lost': return 'bg-red-50 text-red-700 border-red-200/80';
      case 'void': return 'bg-slate-100 text-slate-700 border-slate-200/80';
      case 'postponed': return 'bg-amber-50 text-amber-700 border-amber-200/80';
      default: return 'bg-blue-50 text-blue-700 border-blue-200/80'; // pending
    }
  };

  const getCategoryBadge = (cat: string) => {
    const norm = normalizeCategory(cat);
    switch (norm) {
      case 'single':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'maestro2+':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'odd4+':
        return 'bg-amber-50 text-amber-800 border-amber-300';
    }
  };

  const getCategoryLabel = (cat: string) => {
    const norm = normalizeCategory(cat);
    switch (norm) {
      case 'single': return 'Single';
      case 'maestro2+': return 'Maestro 2+';
      case 'odd4+': return 'Odd 4+';
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 mb-2">
            <Target className="w-3.5 h-3.5 text-rose-600" />
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Maestro Predictions Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Tips Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl">Publish daily predictions, manage betting odds, and distribute booking codes to users.</p>
        </div>
        <button 
          onClick={() => handleOpenForm()} 
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:-translate-y-0.5 transition-all shadow-md shadow-rose-600/25 font-bold text-xs sm:text-sm cursor-pointer"
        >
          <Plus size={16} /> New Tip
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
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex justify-between items-center">
                <h2 className="font-black text-base sm:text-lg text-slate-900">{editingId ? 'Edit Tip Entry' : 'Create New Tip'}</h2>
                <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* General Details */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Target size={15} className="text-rose-600" />
                      General Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Category</label>
                        <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 focus:bg-white outline-none transition-all text-xs sm:text-sm font-medium cursor-pointer">
                          <option value="single">Single</option>
                          <option value="maestro2+">Maestro 2+</option>
                          <option value="odd4+">Odd 4+</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 focus:bg-white outline-none transition-all text-xs sm:text-sm font-medium cursor-pointer">
                          <option value="pending">Pending</option>
                          <option value="won">Won</option>
                          <option value="lost">Lost</option>
                          <option value="void">Void</option>
                          <option value="postponed">Postponed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Publish Date</label>
                        <input type="date" required value={publishDate} onChange={e => setPublishDate(e.target.value)} className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 focus:bg-white outline-none transition-all text-xs sm:text-sm font-medium" />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Booking Code</label>
                        <input type="text" value={bookingCode} onChange={e => setBookingCode(e.target.value)} className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 focus:bg-white outline-none transition-all font-mono text-xs sm:text-sm" placeholder="e.g. B9X12Z" />
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Match Details */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <FileText size={15} className="text-rose-600" />
                      Match & Prediction
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
                      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Home Team</label>
                          <input type="text" required value={homeTeam} onChange={e => setHomeTeam(e.target.value)} className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 focus:bg-white outline-none transition-all text-xs sm:text-sm" placeholder="e.g. Arsenal" />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Away Team</label>
                          <input type="text" required value={awayTeam} onChange={e => setAwayTeam(e.target.value)} className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 focus:bg-white outline-none transition-all text-xs sm:text-sm" placeholder="e.g. Chelsea" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Competition</label>
                        <input type="text" required value={competition} onChange={e => setCompetition(e.target.value)} className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 focus:bg-white outline-none transition-all text-xs sm:text-sm" placeholder="e.g. Premier League" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Market</label>
                        <input type="text" value={market} onChange={e => setMarket(e.target.value)} className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 focus:bg-white outline-none transition-all text-xs sm:text-sm" placeholder="e.g. Full Time Result" />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Prediction</label>
                        <input type="text" required value={prediction} onChange={e => setPrediction(e.target.value)} className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 focus:bg-white outline-none transition-all font-bold text-xs sm:text-sm text-slate-900" placeholder="e.g. Home to Win" />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Odds</label>
                        <input type="number" step="0.01" value={odds} onChange={e => setOdds(e.target.value)} className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 focus:bg-white outline-none transition-all text-xs sm:text-sm font-mono" placeholder="e.g. 1.75" />
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Analysis (Optional)</label>
                    <textarea value={analysis} onChange={e => setAnalysis(e.target.value)} className="w-full p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 focus:bg-white outline-none transition-all resize-none text-xs sm:text-sm" rows={3} placeholder="Add insights or reasoning for this prediction..."></textarea>
                  </div>
                  
                  <div className="flex gap-3 justify-end pt-6 border-t border-slate-100">
                    <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 text-xs sm:text-sm text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">Cancel</button>
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-rose-600/25 disabled:opacity-50 cursor-pointer"
                    >
                      {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isSaving ? 'Saving...' : 'Save Tip'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {tips.map((tip, tipIdx) => (
          <div key={`${tip.id || 'tip'}_${tipIdx}`} className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-md transition-shadow group flex flex-col">
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className={cn("text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border", getCategoryBadge(tip.category))}>
                  {getCategoryLabel(tip.category)}
                </span>
                <span className={cn("text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1", getStatusColor(tip.status))}>
                  {tip.status === 'won' && <CheckCircle2 size={11} />}
                  {tip.status === 'lost' && <X size={11} />}
                  {tip.status === 'pending' && <HelpCircle size={11} />}
                  {tip.status}
                </span>
              </div>
              
              <div className="space-y-4 mb-4 flex-1">
                {tip.matches.map((m, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{m.competition}</div>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900 leading-tight">
                        <span className="truncate">{m.homeTeam}</span>
                        <span className="text-slate-400 font-normal">v</span>
                        <span className="truncate">{m.awayTeam}</span>
                      </div>
                      <div className="text-rose-600 text-xs font-bold mt-1.5 bg-rose-50 border border-rose-200/70 inline-block px-2.5 py-0.5 rounded-md">
                        {m.prediction}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-slate-100">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Total Odds</div>
                  <div className="font-black text-slate-900 text-sm sm:text-base">{tip.odds ? tip.odds.toFixed(2) : '-'}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Booking Code</div>
                  <div className="font-mono font-black text-rose-600 text-sm sm:text-base truncate" title={tip.bookingCode || 'None'}>{tip.bookingCode || '-'}</div>
                </div>
              </div>
            </div>
            
            <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" />
                {new Date(tip.publishDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenForm(tip)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
                  title="Edit Tip"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(tip.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete Tip"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && tips.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
          <Target className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-black text-slate-800">No Tips Posted Yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">Click "New Tip" to publish your first match prediction for users.</p>
        </div>
      )}
    </div>
  );
}
