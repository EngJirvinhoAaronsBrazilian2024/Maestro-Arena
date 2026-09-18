import React, { useState, useEffect, useMemo } from 'react';
import { getTips } from '../services/tipsService';
import { Tip, TipCategory } from '../types/tips';
import { Card, CardContent } from '../components/ui/Card';
import { isSameDay } from '../lib/dateUtils';
import { Calendar, AlertCircle, Info, RefreshCw, ChevronLeft, ChevronRight, Check } from 'lucide-react';

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
  
  // Date selection
  const [selectedDate, setSelectedDate] = useState<number>(() => Date.now());

  const fetchTips = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getTips(selectedDate);
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
  }, [selectedDate]);

  const filteredTips = useMemo(() => tips.filter(t => t.category === category), [tips, category]);

  // Count tips in each category for the selected date
  const categoryCounts = useMemo(() => {
    const counts: Record<TipCategory, number> = {
      'single': 0,
      'maestro2+': 0,
      'odd4+': 0
    };
    tips.forEach(t => {
      if (counts[t.category] !== undefined) {
        counts[t.category]++;
      }
    });
    return counts;
  }, [tips]);

  const handlePrevDay = () => setSelectedDate(prev => prev - 86400000);
  const handleNextDay = () => setSelectedDate(prev => prev + 86400000);
  const handleToday = () => setSelectedDate(Date.now());

  const isToday = isSameDay(selectedDate, Date.now());
  const maxFutureDate = Date.now() + 7 * 86400000;
  const isMaxFuture = selectedDate > maxFutureDate;
  
  const statusColor = (status: string) => {
    switch (status) {
      case 'won': return 'bg-green-100 text-green-700 border-green-200';
      case 'lost': return 'bg-red-100 text-red-700 border-red-200';
      case 'void': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'postponed': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200'; // pending
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white text-center shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
          <Calendar size={120} />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-white">
          Maestro Arena Tips
        </h1>
        <p className="text-slate-300 mb-6">Daily football predictions and expert selections</p>
        
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
          <button 
            onClick={handlePrevDay} 
            className="p-2 hover:bg-slate-800 rounded-full transition"
            title="Previous Day"
          >
            <ChevronLeft size={20}/>
          </button>
          
          <div className="bg-slate-800 px-4 py-2 rounded-full border border-slate-700 min-w-[150px] text-center font-bold">
            {isToday ? "TODAY" : new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>

          <button 
            onClick={handleNextDay} 
            className="p-2 hover:bg-slate-800 rounded-full transition disabled:opacity-40 disabled:cursor-not-allowed" 
            disabled={isMaxFuture}
            title="Next Day"
          >
            <ChevronRight size={20}/>
          </button>

          {!isToday && (
            <button
              onClick={handleToday}
              className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-full transition font-semibold"
            >
              Back to Today
            </button>
          )}

          <button
            onClick={fetchTips}
            className="p-2 hover:bg-slate-800 rounded-full transition text-slate-300 hover:text-white"
            title="Refresh Tips"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* TABS WITH BADGES */}
      <div className="flex bg-white rounded-xl shadow-sm p-1 border border-slate-100 gap-1 overflow-x-auto hide-scrollbar">
        {CATEGORIES.map(c => {
          const count = categoryCounts[c.id];
          return (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm whitespace-nowrap transition-all flex items-center justify-center gap-2 ${
                category === c.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>{c.label}</span>
              {count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                  category === c.id ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* CONTENT */}
      <div>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-white h-40 rounded-xl border border-slate-100 shadow-sm p-6">
                <div className="h-4 bg-slate-200 w-1/4 rounded mb-4"></div>
                <div className="h-8 bg-slate-200 w-3/4 rounded mb-2"></div>
                <div className="h-4 bg-slate-200 w-1/2 rounded"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-8 rounded-xl text-center border border-red-100">
            <AlertCircle className="mx-auto h-8 w-8 mb-3" />
            <p className="font-medium mb-4">Unable to load tips from the server.</p>
            <button onClick={fetchTips} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 mx-auto">
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        ) : filteredTips.length === 0 ? (
          <div className="bg-white p-10 rounded-xl text-center border border-slate-200 shadow-sm">
            <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">NO TIPS AVAILABLE</h3>
            <p className="text-slate-500 mb-4">
              There are no {CATEGORIES.find(c => c.id === category)?.label} tips available for this date.
            </p>

            {/* If tips exist in another category on this date, guide the user */}
            {tips.length > 0 && (
              <div className="inline-flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-100 mt-2">
                <span className="text-xs text-slate-400 font-medium">Tips available in other categories:</span>
                {CATEGORIES.filter(c => c.id !== category && categoryCounts[c.id] > 0).map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className="text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-3 py-1 rounded-full font-bold transition"
                  >
                    View {c.label} ({categoryCounts[c.id]})
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredTips.map((tip) => (
              <Card key={tip.id} className="overflow-hidden hover:shadow-md transition-shadow border-slate-200">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex justify-between items-center text-sm font-medium text-slate-500">
                  <span className="uppercase tracking-wider">{CATEGORIES.find(cat => cat.id === tip.category)?.label || tip.category}</span>
                  <span className={`px-2.5 py-0.5 rounded-full border text-xs font-bold uppercase tracking-wide ${statusColor(tip.status)}`}>
                    {tip.status}
                  </span>
                </div>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {tip.matches.map((match, idx) => (
                      <div key={idx} className="p-5 flex flex-col md:flex-row gap-4 items-center md:items-stretch">
                        <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{match.competition}</p>
                          <div className="flex items-center gap-3 w-full justify-center md:justify-start">
                            {match.homeLogo && <img src={match.homeLogo} alt="" className="w-8 h-8 object-contain" />}
                            <span className="font-bold text-slate-800 text-lg">{match.homeTeam}</span>
                          </div>
                          <div className="text-slate-400 text-sm font-medium my-1">vs</div>
                          <div className="flex items-center gap-3 w-full justify-center md:justify-start">
                            {match.awayLogo && <img src={match.awayLogo} alt="" className="w-8 h-8 object-contain" />}
                            <span className="font-bold text-slate-800 text-lg">{match.awayTeam}</span>
                          </div>
                          {match.kickoff && (
                            <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                              <Calendar size={12} /> {new Date(match.kickoff).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          )}
                        </div>
                        <div className="w-full md:w-auto min-w-[200px] flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5">
                          <div className="bg-blue-50 text-blue-900 rounded-lg p-3 text-center">
                            <p className="text-xs font-semibold text-blue-600/70 uppercase mb-1">{match.market || 'Prediction'}</p>
                            <p className="font-bold text-[15px] leading-tight">{match.prediction}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {(tip.odds || tip.analysis || tip.bookingCode) && (
                    <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-3">
                      {tip.analysis && <p className="text-sm text-slate-600 italic max-w-lg">"{tip.analysis}"</p>}
                      <div className="ml-auto flex items-center gap-3">
                        {tip.bookingCode && (
                          <div className="flex items-center gap-2 bg-blue-100 text-blue-900 px-3 py-1.5 rounded-lg font-bold shadow-sm border border-blue-200">
                            <span className="text-xs uppercase text-blue-600">Booking Code:</span>
                            <span className="font-mono tracking-wider">{tip.bookingCode}</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(tip.bookingCode!);
                                alert('Booking code copied: ' + tip.bookingCode);
                              }}
                              className="ml-1 text-blue-600 hover:text-blue-800 transition-colors"
                              title="Copy Booking Code"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            </button>
                          </div>
                        )}
                        {tip.odds && (
                          <div className="bg-amber-100 text-amber-900 px-4 py-1.5 rounded-lg font-bold shadow-sm border border-amber-200">
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
      <div className="mt-12 bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-sm text-slate-500">
        <Info className="flex-shrink-0 mt-0.5 text-slate-400" size={18} />
        <p>
          Tips are predictions for entertainment and informational purposes. Results are not guaranteed. Please make your own decisions and avoid risking money you cannot afford to lose.
        </p>
      </div>

    </div>
  );
}
