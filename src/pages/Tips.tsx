import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getTips } from '../services/tipsService';
import { Tip, TipCategory, normalizeCategory } from '../types/tips';
import { Card, CardContent } from '../components/ui/Card';
import { isSameDay } from '../lib/dateUtils';
import { Calendar, AlertCircle, Info, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import manUtdTipsBg from '../assets/images/manutd_pl_tips_1790183435495.jpg';
import arsenalTipsBg from '../assets/images/arsenal_pl_tips_1790184270568.jpg';
import mancityTipsBg from '../assets/images/mancity_pl_tips_1790184285657.jpg';
import chelseaTipsBg from '../assets/images/chelsea_pl_tips_1790184303424.jpg';

const TIPS_SLIDES = [
  { id: 'manutd', team: 'Manchester United', image: manUtdTipsBg },
  { id: 'arsenal', team: 'Arsenal', image: arsenalTipsBg },
  { id: 'mancity', team: 'Manchester City', image: mancityTipsBg },
  { id: 'chelsea', team: 'Chelsea', image: chelseaTipsBg },
];

const CATEGORIES: { id: TipCategory; label: string }[] = [
  { id: 'single', label: 'SINGLE' },
  { id: 'maestro2+', label: 'MAESTRO 2+' },
  { id: 'odd4+', label: 'ODD 4+' }
];

export function Tips() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [category, setCategory] = useState<TipCategory>('single');
  const [activeSlide, setActiveSlide] = useState(0);
  
  // Date filtering: defaults to Today (Date.now()) so user instantly knows the tips are for that day
  const [dateFilter, setDateFilter] = useState<number | null>(() => Date.now());

  // Auto-scroll hero images every 3 seconds with smooth crossfade
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % TIPS_SLIDES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const fetchTips = async () => {
    setLoading(true);
    setError(false);
    try {
      // Fetch all tips from InsForge database so client has complete catalog
      const data = await getTips();
      setTips(data);
    } catch (e) {
      console.error("Error loading tips:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTips();

    // Auto-refresh tips every 30 seconds so new admin uploads appear promptly
    const pollInterval = setInterval(() => {
      getTips().then(data => {
        if (data && data.length > 0) {
          setTips(data);
        }
      }).catch(() => {});
    }, 30000);

    return () => clearInterval(pollInterval);
  }, []);

  // Filtered tips strictly by selected category, then by date (if set)
  const filteredTips = useMemo(() => {
    return tips.filter(t => {
      // Category filter
      const norm = normalizeCategory(t.category);
      if (norm !== category) return false;

      // Date filter (if set)
      if (dateFilter !== null) {
        if (!isSameDay(t.publishDate, dateFilter)) return false;
      }
      return true;
    });
  }, [tips, category, dateFilter]);

  // Count tips in each category across the active date scope
  const categoryCounts = useMemo(() => {
    const counts: Record<TipCategory, number> = {
      single: 0,
      'maestro2+': 0,
      'odd4+': 0
    };

    tips.forEach(t => {
      if (dateFilter !== null && !isSameDay(t.publishDate, dateFilter)) {
        return;
      }
      const norm = normalizeCategory(t.category);
      if (counts[norm] !== undefined) {
        counts[norm]++;
      }
    });

    return counts;
  }, [tips, dateFilter]);

  const handlePrevDay = () => {
    const base = dateFilter || Date.now();
    setDateFilter(base - 86400000);
  };

  const handleNextDay = () => {
    const base = dateFilter || Date.now();
    setDateFilter(base + 86400000);
  };

  const handleToday = () => {
    setDateFilter(Date.now());
  };

  const handleAllDates = () => {
    setDateFilter(null);
  };

  const isToday = dateFilter !== null && isSameDay(dateFilter, Date.now());
  
  const statusColor = (status: string) => {
    switch (status) {
      case 'won': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'lost': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'void': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'postponed': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-cyan-50 text-cyan-800 border-cyan-200'; // pending
    }
  };

  const getCategoryStyles = (cat: TipCategory, isActive: boolean) => {
    switch (cat) {
      case 'single':
        return isActive 
          ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/25'
          : 'text-slate-700 hover:text-rose-700 hover:bg-rose-50/60';
      case 'maestro2+':
        return isActive 
          ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-600/25'
          : 'text-slate-700 hover:text-cyan-700 hover:bg-cyan-50/60';
      case 'odd4+':
        return isActive 
          ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-black shadow-md shadow-amber-500/25'
          : 'text-slate-700 hover:text-amber-800 hover:bg-amber-50/60';
    }
  };

  const getCategoryCardBorder = (cat: string) => {
    const norm = normalizeCategory(cat);
    switch (norm) {
      case 'single': return 'border-l-4 border-rose-600';
      case 'maestro2+': return 'border-l-4 border-cyan-500';
      case 'odd4+': return 'border-l-4 border-amber-500';
      default: return 'border-l-4 border-slate-400';
    }
  };

  const getCategoryPredictionBox = (cat: string) => {
    const norm = normalizeCategory(cat);
    switch (norm) {
      case 'single': return 'bg-rose-50/80 border border-rose-200 text-rose-950';
      case 'maestro2+': return 'bg-cyan-50/80 border border-cyan-200 text-cyan-950';
      case 'odd4+': return 'bg-amber-50/80 border border-amber-200 text-amber-950';
      default: return 'bg-slate-50 border border-slate-200 text-slate-950';
    }
  };

  const getCategoryDisplayLabel = (cat: string) => {
    const norm = normalizeCategory(cat);
    switch (norm) {
      case 'single': return 'SINGLE';
      case 'maestro2+': return 'MAESTRO 2+';
      case 'odd4+': return 'ODD 4+';
      default: return String(cat).toUpperCase();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      
      {/* MAESTRO ARENA TIPS HERO */}
      <div className="relative w-full overflow-hidden rounded-[24px] shadow-sm border border-slate-200 flex flex-col md:min-h-[460px] group mb-6 bg-white">
        
        {/* Full Image Container */}
        <div className="relative w-full aspect-[16/9] sm:aspect-[16/9] md:aspect-auto md:absolute md:inset-0 z-0 bg-slate-900 overflow-hidden">
          {TIPS_SLIDES.map((slide, idx) => (
            <img 
              key={slide.id}
              src={slide.image} 
              alt={slide.team} 
              referrerPolicy="no-referrer"
              className={cn(
                "absolute inset-0 w-full h-full object-cover object-center md:object-[right_top] transition-opacity duration-1000 ease-in-out",
                activeSlide === idx ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
              )} 
            />
          ))}
          
          {/* Desktop Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/70 to-transparent h-[65%] top-auto bottom-0 hidden md:block pointer-events-none"></div>
          <div className="absolute inset-y-0 left-0 w-[55%] bg-gradient-to-r from-white/95 via-white/40 to-transparent hidden md:block pointer-events-none"></div>
          
          {/* Mobile Bottom Blend */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent md:hidden pointer-events-none"></div>
        </div>

        {/* Content Box */}
        <div className="relative z-10 w-full md:w-[65%] lg:w-[60%] flex flex-col items-start justify-end p-5 sm:p-7 md:p-10 md:mt-auto">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50/90 backdrop-blur-md border border-rose-200/80 mb-3 w-max shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-rose-700">
              Maestro Tips Feed
            </span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight mb-2 leading-[1.15]">
            <span className="text-slate-950">Maestro Arena </span>
            <span className="text-rose-600 relative inline-block">
              Tips
              <svg className="absolute -bottom-1 w-full h-2 text-rose-200 -z-10" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 15 Q 50 0 100 15" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/></svg>
            </span>
          </h1>
          
          <p className="text-xs sm:text-sm md:text-base text-slate-600 font-medium mb-5 max-w-lg leading-relaxed">
            Verified football predictions, match odds, and booking codes.
          </p>

          {/* Date Selector & Scope Controls */}
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold w-full sm:w-auto">
            <button 
              onClick={handlePrevDay} 
              className="p-2 bg-white/90 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 rounded-full transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
              title="Navigate backwards for previous tips"
            >
              <ChevronLeft size={16}/>
              <span className="text-xs font-bold hidden sm:inline">Previous Day</span>
            </button>
            
            <button
              onClick={handleToday}
              className={cn(
                "px-4 py-2 rounded-full border text-xs sm:text-sm font-black transition-all cursor-pointer shadow-2xs flex items-center gap-1.5",
                isToday 
                  ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20" 
                  : "bg-white text-slate-800 border-slate-300 hover:bg-rose-50 hover:text-rose-600"
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{isToday ? "TODAY" : new Date(dateFilter || Date.now()).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            </button>

            <button 
              onClick={handleNextDay} 
              className="p-2 bg-white/90 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 rounded-full transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
              title="Next Day"
            >
              <span className="text-xs font-bold hidden sm:inline">Next Day</span>
              <ChevronRight size={16}/>
            </button>

            <button
              onClick={fetchTips}
              className="p-2 bg-white/90 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-full transition-colors shadow-2xs cursor-pointer ml-auto sm:ml-0"
              title="Refresh Tips"
            >
              <RefreshCw size={15} className={loading ? "animate-spin text-rose-600" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* CATEGORY TABS - ONLY SPECIFIC CATEGORIES: SINGLE, MAESTRO 2+, ODD 4+ */}
      <div className="flex bg-white/80 backdrop-blur-md rounded-2xl shadow-2xs p-1.5 border border-white/90 gap-1.5 overflow-x-auto hide-scrollbar">
        {CATEGORIES.map(c => {
          const count = categoryCounts[c.id] || 0;
          const isActive = category === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`flex-1 py-3 px-3.5 sm:px-4 rounded-xl font-black text-xs sm:text-sm whitespace-nowrap transition-all flex items-center justify-center gap-2 cursor-pointer ${getCategoryStyles(c.id, isActive)}`}
            >
              <span>{c.label}</span>
              {count > 0 && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                  isActive ? 'bg-black/15 text-current' : 'bg-slate-100 text-slate-700'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ACTIVE DATE SCOPE BANNER */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl px-4 sm:px-5 py-3 text-xs sm:text-sm shadow-2xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="text-slate-600">
            Showing tips for:{' '}
            <strong className="text-slate-900 font-black">
              {isToday 
                ? `Today (${new Date(dateFilter || Date.now()).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })})` 
                : new Date(dateFilter || Date.now()).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </strong>
          </span>
          {isToday && (
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-200/80">
              Live Today
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="text-xs font-bold text-slate-600 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
            title="Navigate backwards for previous tips"
          >
            <ChevronLeft size={14} /> Previous Day
          </button>
          {!isToday ? (
            <button
              onClick={handleToday}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
            >
              Back to Today
            </button>
          ) : (
            <button
              onClick={handleAllDates}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
            >
              View All Dates
            </button>
          )}
        </div>
      </div>

      {/* CONTENT FEED */}
      <div>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-white/70 h-40 rounded-2xl border border-slate-100 shadow-2xs p-6">
                <div className="h-4 bg-slate-200 w-1/4 rounded mb-4"></div>
                <div className="h-8 bg-slate-200 w-3/4 rounded mb-2"></div>
                <div className="h-4 bg-slate-200 w-1/2 rounded"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-rose-50 text-rose-700 p-8 rounded-2xl text-center border border-rose-200 font-medium">
            <AlertCircle className="mx-auto h-8 w-8 mb-3" />
            <p className="font-bold mb-4">Unable to load tips from the InsForge database.</p>
            <button onClick={fetchTips} className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 mx-auto cursor-pointer">
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        ) : filteredTips.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-md p-10 rounded-2xl text-center border border-white/90 shadow-2xs">
            <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-black text-slate-900 mb-2">NO TIPS POSTED FOR THIS DATE</h3>
            <p className="text-slate-600 mb-4 text-sm font-medium max-w-md mx-auto leading-relaxed">
              There are no {CATEGORIES.find(c => c.id === category)?.label} tips posted for{' '}
              <strong className="text-slate-900">
                {isToday ? 'Today' : new Date(dateFilter || Date.now()).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </strong>
              . You can navigate backwards to browse previous tips or view all available tips.
            </p>

            {/* Backwards navigation and View All buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <button
                onClick={handlePrevDay}
                className="px-4 py-2.5 bg-white border border-slate-200 hover:border-rose-300 text-slate-800 hover:text-rose-600 font-bold text-xs sm:text-sm rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="View tips from the previous day"
              >
                <ChevronLeft size={16} /> Browse Previous Day
              </button>
              <button
                onClick={handleAllDates}
                className="px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs sm:text-sm rounded-xl border border-rose-200 transition-colors cursor-pointer"
              >
                View All Available Tips
              </button>
            </div>

            {/* Guide user to other categories if tips exist */}
            {tips.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-4 border-t border-slate-100 mt-2">
                <span className="text-xs text-slate-500 font-semibold">Tips in other categories:</span>
                {CATEGORIES.filter(c => c.id !== category && (categoryCounts[c.id] || 0) > 0).map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className="text-xs bg-slate-100 text-slate-700 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 px-3 py-1 rounded-full font-bold transition-colors cursor-pointer"
                  >
                    View {c.label} ({categoryCounts[c.id]})
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredTips.map((tip, tipIdx) => (
              <Card key={`${tip.id || 'tip'}_${tipIdx}`} className={`overflow-hidden hover:shadow-lg transition-all border-slate-200/90 bg-white/95 ${getCategoryCardBorder(tip.category)}`}>
                <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-100 flex justify-between items-center text-sm font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="uppercase tracking-wider font-extrabold text-xs sm:text-sm">
                      {getCategoryDisplayLabel(tip.category)}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      {new Date(tip.publishDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full border text-xs font-black uppercase tracking-wide ${statusColor(tip.status)}`}>
                    {tip.status}
                  </span>
                </div>

                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {tip.matches.map((match, idx) => (
                      <div key={idx} className="p-5 flex flex-col md:flex-row gap-4 items-center md:items-stretch">
                        <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left">
                          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">{match.competition}</p>
                          <div className="flex items-center gap-3 w-full justify-center md:justify-start">
                            {match.homeLogo && <img src={match.homeLogo} alt="" className="w-8 h-8 object-contain" />}
                            <span className="font-bold text-slate-900 text-lg">{match.homeTeam}</span>
                          </div>
                          <div className="text-slate-400 text-xs font-bold uppercase tracking-widest my-1">vs</div>
                          <div className="flex items-center gap-3 w-full justify-center md:justify-start">
                            {match.awayLogo && <img src={match.awayLogo} alt="" className="w-8 h-8 object-contain" />}
                            <span className="font-bold text-slate-900 text-lg">{match.awayTeam}</span>
                          </div>
                          {match.kickoff && (
                            <p className="text-xs text-slate-500 font-semibold mt-3 flex items-center gap-1">
                              <Calendar size={12} className="text-cyan-600" /> {new Date(match.kickoff).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          )}
                        </div>
                        <div className="w-full md:w-auto min-w-[210px] flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5">
                          <div className={`rounded-xl p-3.5 text-center shadow-2xs ${getCategoryPredictionBox(tip.category)}`}>
                            <p className="text-[11px] font-black uppercase tracking-wider opacity-75 mb-1">{match.market || 'Prediction'}</p>
                            <p className="font-black text-base leading-tight">{match.prediction}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {tip.imageUrl && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-center">
                      <img 
                        src={tip.imageUrl} 
                        alt="Prediction Slip / Visual" 
                        className="max-h-64 rounded-xl object-contain border border-slate-200 shadow-2xs" 
                      />
                    </div>
                  )}

                  {(tip.odds || tip.analysis || tip.bookingCode) && (
                    <div className="bg-slate-50/80 p-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-3">
                      {tip.analysis && <p className="text-sm text-slate-600 italic max-w-lg">"{tip.analysis}"</p>}
                      <div className="ml-auto flex items-center gap-3 flex-wrap">
                        {tip.bookingCode && (
                          <div className="flex items-center gap-2 bg-cyan-50 text-cyan-950 px-3.5 py-1.5 rounded-xl font-bold shadow-2xs border border-cyan-200">
                            <span className="text-xs uppercase font-black text-cyan-700">Booking Code:</span>
                            <span className="font-mono tracking-wider font-extrabold">{tip.bookingCode}</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(tip.bookingCode!);
                                toast.success('Booking code copied: ' + tip.bookingCode);
                              }}
                              className="ml-1 text-cyan-700 hover:text-cyan-900 transition-colors cursor-pointer"
                              title="Copy Booking Code"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            </button>
                          </div>
                        )}
                        {tip.odds && (
                          <div className="bg-amber-50 text-amber-950 px-4 py-1.5 rounded-xl font-black shadow-2xs border border-amber-300">
                            ODDS: {tip.odds.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* DISCLAIMER */}
      <div className="mt-12 bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-xs sm:text-sm text-slate-500">
        <Info className="flex-shrink-0 mt-0.5 text-slate-400" size={18} />
        <div className="space-y-1">
          <p>
            Tips and football predictions are provided strictly for entertainment and informational purposes. Results are not guaranteed. Please make your own decisions and avoid risking money you cannot afford to lose. 18+ only.
          </p>
          <p className="text-xs text-slate-400">
            For our complete non-liability terms and responsible gambling guidelines, please read our{' '}
            <Link to="/terms" className="text-rose-600 hover:underline font-bold">
              Betting Disclaimer & Terms of Service
            </Link>.
          </p>
        </div>
      </div>

    </div>
  );
}
