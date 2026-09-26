import React, { useState, useEffect, useMemo } from 'react';
import { getTips, createTip, updateTip, deleteTip } from '../../services/tipsService';
import { Tip, TipCategory, TipStatus, normalizeCategory } from '../../types/tips';
import { useAuth } from '../../context/AuthContext';
import { formatLocalDate, parseDateInputToTimestamp } from '../../lib/dateUtils';
import { Target, Plus, Trash2, Edit2, Calendar, FileText, CheckCircle2, AlertCircle, HelpCircle, X, Loader2, Image as ImageIcon, Search, Check, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { ImageInput } from '../../components/ui/ImageInput';
import toast from 'react-hot-toast';

interface MatchInput {
  homeTeam: string;
  awayTeam: string;
  competition: string;
  prediction: string;
  market: string;
}

export function AdminTipsManagement() {
  const { userData, user } = useAuth();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TipCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<TipStatus | 'all'>('all');

  // Form State
  const [category, setCategory] = useState<TipCategory>('single');
  const [matches, setMatches] = useState<MatchInput[]>([
    { homeTeam: '', awayTeam: '', competition: '', prediction: '', market: 'Full Time Result' }
  ]);
  const [odds, setOdds] = useState('');
  const [bookingCode, setBookingCode] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [imageUrl, setImageUrl] = useState('');
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
      if (tip.matches && tip.matches.length > 0) {
        setMatches(tip.matches.map(m => ({
          homeTeam: m.homeTeam || '',
          awayTeam: m.awayTeam || '',
          competition: m.competition || '',
          prediction: m.prediction || '',
          market: m.market || 'Full Time Result'
        })));
      } else {
        setMatches([{ homeTeam: '', awayTeam: '', competition: '', prediction: '', market: 'Full Time Result' }]);
      }
      setOdds(tip.odds?.toString() || '');
      setBookingCode(tip.bookingCode || '');
      setAnalysis(tip.analysis || '');
      setImageUrl(tip.imageUrl || '');
      setStatus(tip.status);
      setPublishDate(formatLocalDate(new Date(tip.publishDate)));
    } else {
      setEditingId(null);
      setCategory('single');
      setMatches([{ homeTeam: '', awayTeam: '', competition: '', prediction: '', market: 'Full Time Result' }]);
      setOdds('');
      setBookingCode('');
      setAnalysis('');
      setImageUrl('');
      setStatus('pending');
      setPublishDate(formatLocalDate());
    }
    setIsFormOpen(true);
  };

  const handleMatchChange = (index: number, field: keyof MatchInput, value: string) => {
    setMatches(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddMatch = () => {
    setMatches(prev => [
      ...prev,
      { homeTeam: '', awayTeam: '', competition: '', prediction: '', market: 'Full Time Result' }
    ]);
  };

  const handleRemoveMatch = (index: number) => {
    if (matches.length > 1) {
      setMatches(prev => prev.filter((_, i) => i !== index));
    } else {
      toast.error("A tip must have at least one match.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const adminIdentifier = user?.id || (user as any)?.uid || '2886ae6d-b563-44a3-b4b8-ae932cc188ad';

    // Validate matches
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      if (!m.homeTeam.trim() || !m.awayTeam.trim()) {
        toast.error(`Please provide both home and away teams for match #${i + 1}`);
        return;
      }
      if (!m.prediction.trim()) {
        toast.error(`Please specify a prediction for match #${i + 1}`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const tipData = {
        category,
        matches: matches.map(m => ({
          homeTeam: m.homeTeam.trim(),
          awayTeam: m.awayTeam.trim(),
          competition: m.competition.trim() || 'League',
          prediction: m.prediction.trim(),
          market: m.market.trim() || 'Full Time Result'
        })),
        odds: odds ? parseFloat(odds) : undefined,
        bookingCode: bookingCode.trim() || undefined,
        analysis: analysis.trim(),
        imageUrl: imageUrl.trim() || undefined,
        status,
        publishDate: parseDateInputToTimestamp(publishDate)
      };

      if (editingId) {
        await updateTip(adminIdentifier, editingId, tipData);
        toast.success('Tip updated successfully');
      } else {
        await createTip(adminIdentifier, tipData);
        toast.success('Tip published to database successfully');
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
    const adminIdentifier = user?.id || (user as any)?.uid || '2886ae6d-b563-44a3-b4b8-ae932cc188ad';
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

  const handleQuickStatus = async (id: string, newStatus: TipStatus) => {
    const adminIdentifier = user?.id || (user as any)?.uid || '2886ae6d-b563-44a3-b4b8-ae932cc188ad';
    try {
      await updateTip(adminIdentifier, id, { status: newStatus });
      toast.success(`Tip marked as ${newStatus.toUpperCase()}`);
      setTips(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    } catch (err: any) {
      toast.error('Failed to update status: ' + err.message);
    }
  };

  const getStatusColor = (st: string) => {
    switch (st) {
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

  const filteredTips = useMemo(() => {
    return tips.filter(tip => {
      // Category filter
      if (selectedCategory !== 'all') {
        const norm = normalizeCategory(tip.category);
        if (norm !== selectedCategory) return false;
      }
      // Status filter
      if (selectedStatus !== 'all' && tip.status !== selectedStatus) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesQuery = tip.matches.some(m => 
          m.homeTeam.toLowerCase().includes(term) ||
          m.awayTeam.toLowerCase().includes(term) ||
          m.competition.toLowerCase().includes(term) ||
          m.prediction.toLowerCase().includes(term)
        );
        const codeQuery = (tip.bookingCode || '').toLowerCase().includes(term);
        const analysisQuery = (tip.analysis || '').toLowerCase().includes(term);
        if (!matchesQuery && !codeQuery && !analysisQuery) return false;
      }
      return true;
    });
  }, [tips, selectedCategory, selectedStatus, searchTerm]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 mb-2">
            <Target className="w-3.5 h-3.5 text-rose-600" />
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Maestro Predictions Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Tips Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl">
            Publish daily predictions, manage betting odds, upload prediction slips, and distribute booking codes.
          </p>
        </div>
        <button 
          onClick={() => handleOpenForm()} 
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:-translate-y-0.5 transition-all shadow-md shadow-rose-600/25 font-bold text-xs sm:text-sm cursor-pointer"
        >
          <Plus size={16} /> New Tip Ticket
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 mr-1">Category:</span>
          {(['all', 'single', 'maestro2+', 'odd4+'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {cat === 'all' ? 'All Categories' : cat === 'single' ? 'Single' : cat === 'maestro2+' ? 'Maestro 2+' : 'Odd 4+'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="void">Void</option>
            <option value="postponed">Postponed</option>
          </select>

          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search team, code, league..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-rose-500 focus:bg-white transition-all"
            />
          </div>
        </div>
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
                <h2 className="font-black text-base sm:text-lg text-slate-900">{editingId ? 'Edit Tip Entry' : 'Create New Tip Ticket'}</h2>
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
                      Ticket Overview
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
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Total Odds</label>
                        <input type="number" step="0.01" value={odds} onChange={e => setOdds(e.target.value)} className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 focus:bg-white outline-none transition-all font-mono text-xs sm:text-sm" placeholder="e.g. 2.45" />
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Booking Code & Optional Image */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Booking Code (Optional)</label>
                      <input type="text" value={bookingCode} onChange={e => setBookingCode(e.target.value)} className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 focus:bg-white outline-none transition-all font-mono text-xs sm:text-sm uppercase" placeholder="e.g. CRB5CAN" />
                      <p className="text-[11px] text-slate-400 mt-1">Users can copy this booking code directly to place bets.</p>
                    </div>

                    <div>
                      <ImageInput 
                        label="Slip Screenshot / Match Graphic (Optional)"
                        value={imageUrl}
                        onChange={(url) => setImageUrl(url)}
                      />
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Matches List */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <FileText size={15} className="text-rose-600" />
                        Matches ({matches.length})
                      </h3>
                      <button
                        type="button"
                        onClick={handleAddMatch}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        <Plus size={14} /> Add Match
                      </button>
                    </div>

                    <div className="space-y-4">
                      {matches.map((m, idx) => (
                        <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200 relative">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                              Match #{idx + 1}
                            </span>
                            {matches.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMatch(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                                title="Remove Match"
                              >
                                <X size={15} />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">Home Team</label>
                              <input
                                type="text"
                                required
                                value={m.homeTeam}
                                onChange={e => handleMatchChange(idx, 'homeTeam', e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                                placeholder="e.g. Arsenal"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">Away Team</label>
                              <input
                                type="text"
                                required
                                value={m.awayTeam}
                                onChange={e => handleMatchChange(idx, 'awayTeam', e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                                placeholder="e.g. Chelsea"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">Competition / League</label>
                              <input
                                type="text"
                                required
                                value={m.competition}
                                onChange={e => handleMatchChange(idx, 'competition', e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                                placeholder="e.g. Premier League"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">Betting Market</label>
                              <input
                                type="text"
                                value={m.market}
                                onChange={e => handleMatchChange(idx, 'market', e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                                placeholder="e.g. Full Time Result, Over 2.5, GG"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">Prediction / Pick</label>
                              <input
                                type="text"
                                required
                                value={m.prediction}
                                onChange={e => handleMatchChange(idx, 'prediction', e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-black text-rose-600 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                                placeholder="e.g. Home Win, Over 2.5, 1X"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <hr className="border-slate-100" />
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Analysis / Insights (Optional)</label>
                    <textarea 
                      value={analysis} 
                      onChange={e => setAnalysis(e.target.value)} 
                      className="w-full p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 focus:bg-white outline-none transition-all resize-none text-xs sm:text-sm" 
                      rows={3} 
                      placeholder="Add insights, tactical statistics, or reasoning for this prediction..."
                    />
                  </div>
                  
                  <div className="flex gap-3 justify-end pt-6 border-t border-slate-100">
                    <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 text-xs sm:text-sm text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">Cancel</button>
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-rose-600/25 disabled:opacity-50 cursor-pointer"
                    >
                      {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isSaving ? 'Saving...' : editingId ? 'Update Tip' : 'Publish Tip'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {filteredTips.map((tip, tipIdx) => (
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
              
              <div className="space-y-3 mb-4 flex-1">
                {tip.matches.map((m, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{m.competition}</div>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 leading-tight">
                      <span className="truncate">{m.homeTeam}</span>
                      <span className="text-slate-400 font-normal">v</span>
                      <span className="truncate">{m.awayTeam}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-xs">
                      <span className="text-slate-500 font-medium">{m.market || 'Pick'}</span>
                      <span className="text-rose-600 font-black">{m.prediction}</span>
                    </div>
                  </div>
                ))}
              </div>

              {tip.imageUrl && (
                <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 max-h-36 bg-slate-100">
                  <img src={tip.imageUrl} alt="Prediction Slip" className="w-full h-full object-cover" />
                </div>
              )}

              {tip.analysis && (
                <p className="text-xs text-slate-500 italic mb-4 line-clamp-2">
                  "{tip.analysis}"
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-slate-100">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Total Odds</div>
                  <div className="font-black text-slate-900 text-sm sm:text-base">{tip.odds ? tip.odds.toFixed(2) : '-'}</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Booking Code</div>
                  <div className="font-mono font-black text-rose-600 text-sm truncate" title={tip.bookingCode || 'None'}>
                    {tip.bookingCode || '-'}
                  </div>
                </div>
              </div>

              {/* Quick Status Bar */}
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-auto">Mark:</span>
                <button
                  onClick={() => handleQuickStatus(tip.id, 'won')}
                  className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-colors cursor-pointer",
                    tip.status === 'won' ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  )}
                  title="Mark as Won"
                >
                  Won
                </button>
                <button
                  onClick={() => handleQuickStatus(tip.id, 'lost')}
                  className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-colors cursor-pointer",
                    tip.status === 'lost' ? "bg-red-600 text-white" : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                  )}
                  title="Mark as Lost"
                >
                  Lost
                </button>
                <button
                  onClick={() => handleQuickStatus(tip.id, 'pending')}
                  className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-colors cursor-pointer",
                    tip.status === 'pending' ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                  )}
                  title="Mark as Pending"
                >
                  Pending
                </button>
              </div>
            </div>
            
            <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex justify-between items-center">
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

      {!loading && filteredTips.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
          <Target className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-black text-slate-800">No Tips Found</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all' 
              ? 'No tips match your filter criteria. Try adjusting your filters or search term.'
              : 'Click "New Tip Ticket" to publish your first match prediction for users.'}
          </p>
        </div>
      )}
    </div>
  );
}
