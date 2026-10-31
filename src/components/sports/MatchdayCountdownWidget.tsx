import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Bell, BellRing, Trophy, Sparkles, ShieldCheck, Flame, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { useFootballMatches } from '../../hooks/useFootballMatches';
import { NormalizedMatch } from '../../server/services/footballDataService';

// Known iconic stadiums for premier clubs
const STADIUM_MAP: Record<string, string> = {
  'real madrid': 'Santiago Bernabéu, Madrid',
  'barcelona': 'Camp Nou, Barcelona',
  'manchester city': 'Etihad Stadium, Manchester',
  'arsenal': 'Emirates Stadium, London',
  'liverpool': 'Anfield, Liverpool',
  'manchester united': 'Old Trafford, Manchester',
  'chelsea': 'Stamford Bridge, London',
  'tottenham': 'Tottenham Hotspur Stadium, London',
  'bayern': 'Allianz Arena, Munich',
  'dortmund': 'Signal Iduna Park, Dortmund',
  'paris saint-germain': 'Parc des Princes, Paris',
  'psg': 'Parc des Princes, Paris',
  'inter': 'San Siro, Milan',
  'milan': 'San Siro, Milan',
  'juventus': 'Allianz Stadium, Turin',
  'atletico': 'Cívitas Metropolitano, Madrid',
  'napoli': 'Stadio Diego Armando Maradona, Naples',
};

// Elite club scoring dictionary
const ELITE_TEAMS: Record<string, number> = {
  'real madrid': 100,
  'manchester city': 100,
  'bayern munich': 95,
  'bayern münchen': 95,
  'barcelona': 95,
  'liverpool': 95,
  'arsenal': 92,
  'paris saint-germain': 90,
  'psg': 90,
  'inter': 88,
  'internazionale': 88,
  'inter milan': 88,
  'ac milan': 86,
  'milan': 86,
  'juventus': 86,
  'manchester united': 86,
  'chelsea': 85,
  'atletico madrid': 85,
  'atlético de madrid': 85,
  'borussia dortmund': 84,
  'bayer leverkusen': 84,
  'tottenham': 80,
  'napoli': 80,
  'aston villa': 75,
  'newcastle': 75,
};

// Fallback fixture if API returns no upcoming or live games
const DEFAULT_FALLBACK_FIXTURE = {
  id: 'marquee_rm_mci',
  competition: 'UEFA Champions League',
  competitionEmblem: 'https://crests.football-data.org/CL.png',
  round: 'Quarter-Finals • 1st Leg',
  venue: 'Santiago Bernabéu, Madrid',
  targetDate: new Date(Date.now() + (2 * 24 * 60 * 60 + 14 * 60 * 60 + 35 * 60) * 1000),
  isLive: false,
  minute: undefined as string | undefined,
  homeScore: null as number | null,
  awayScore: null as number | null,
  homeTeam: {
    name: 'Real Madrid',
    shortName: 'RMA',
    crest: 'https://crests.football-data.org/86.png',
  },
  awayTeam: {
    name: 'Manchester City',
    shortName: 'MCI',
    crest: 'https://crests.football-data.org/65.png',
  },
};

function getTeamWeight(teamName: string): number {
  const lower = teamName.toLowerCase();
  for (const [key, weight] of Object.entries(ELITE_TEAMS)) {
    if (lower.includes(key)) return weight;
  }
  return 30; // base rating
}

function calculateMatchScore(match: NormalizedMatch): number {
  let score = 0;
  const compCode = (match.competition?.code || '').toLowerCase();
  const compName = (match.competition?.name || '').toLowerCase();

  // 1. Competition weight
  if (compCode === 'cl' || compName.includes('champions league')) score += 160;
  else if (compCode === 'pl' || compName.includes('premier league')) score += 130;
  else if (compCode === 'pd' || compName.includes('primera') || compName.includes('la liga')) score += 115;
  else if (compCode === 'sa' || compName.includes('serie a')) score += 95;
  else if (compCode === 'bl1' || compName.includes('bundesliga')) score += 95;
  else if (compCode === 'fl1' || compName.includes('ligue 1')) score += 85;
  else score += 50;

  // 2. Elite teams weight
  const homeWeight = getTeamWeight(match.homeTeam.name);
  const awayWeight = getTeamWeight(match.awayTeam.name);
  score += homeWeight + awayWeight;

  // 3. Blockbuster derby clash bonus (both teams elite)
  if (homeWeight >= 80 && awayWeight >= 80) {
    score += 200; // Giant clash (e.g., Arsenal vs Man City, El Clásico, Real vs Bayern)
  } else if (homeWeight >= 70 && awayWeight >= 70) {
    score += 120;
  }

  // 4. Time proximity
  const matchTime = new Date(match.utcDate).getTime();
  const now = Date.now();
  const diffHours = (matchTime - now) / (1000 * 60 * 60);

  if (match.isLive) {
    score += 150; // In play right now
  } else if (diffHours >= 0 && diffHours <= 6) {
    score += 100; // Kickoff today in a few hours
  } else if (diffHours > 6 && diffHours <= 24) {
    score += 75; // Tomorrow
  } else if (diffHours > 24 && diffHours <= 72) {
    score += 50; // Within 3 days
  } else if (diffHours > 72 && diffHours <= 168) {
    score += 25; // Within 1 week
  }

  return score;
}

export const MatchdayCountdownWidget: React.FC = () => {
  const { matches, isLoading } = useFootballMatches();

  // Automatically select the biggest upcoming game or live marquee clash from API
  const marqueeMatch = useMemo(() => {
    if (!matches || matches.length === 0) {
      return DEFAULT_FALLBACK_FIXTURE;
    }

    const now = Date.now();
    // Prioritize upcoming matches or live matches
    const candidates = matches.filter((m) => {
      if (m.isLive) return true;
      if (m.status === 'UPCOMING') return true;
      const matchTime = new Date(m.utcDate).getTime();
      return matchTime > now - 2 * 60 * 60 * 1000; // within past 2 hours or in future
    });

    const pool = candidates.length > 0 ? candidates : matches;

    // Sort by calculated marquee blockbuster score descending
    const sorted = [...pool].sort((a, b) => calculateMatchScore(b) - calculateMatchScore(a));
    const topMatch = sorted[0];

    if (!topMatch) {
      return DEFAULT_FALLBACK_FIXTURE;
    }

    // Determine venue
    const homeLower = (topMatch.homeTeam.name || '').toLowerCase();
    let venue = `${topMatch.homeTeam.name} Stadium`;
    for (const [key, val] of Object.entries(STADIUM_MAP)) {
      if (homeLower.includes(key)) {
        venue = val;
        break;
      }
    }

    return {
      id: String(topMatch.id),
      competition: topMatch.competition?.name || 'Top League Clash',
      competitionEmblem: topMatch.competition?.emblem || undefined,
      round: topMatch.matchday ? `Matchday ${topMatch.matchday}` : (topMatch.isLive ? 'Live in Play' : 'Upcoming Fixture'),
      venue,
      targetDate: new Date(topMatch.utcDate),
      isLive: Boolean(topMatch.isLive),
      minute: topMatch.minute,
      homeScore: topMatch.score?.home,
      awayScore: topMatch.score?.away,
      homeTeam: {
        name: topMatch.homeTeam.name,
        shortName: topMatch.homeTeam.shortName || topMatch.homeTeam.tla || topMatch.homeTeam.name.substring(0, 3).toUpperCase(),
        crest: topMatch.homeTeam.crest || '',
      },
      awayTeam: {
        name: topMatch.awayTeam.name,
        shortName: topMatch.awayTeam.shortName || topMatch.awayTeam.tla || topMatch.awayTeam.name.substring(0, 3).toUpperCase(),
        crest: topMatch.awayTeam.crest || '',
      },
    };
  }, [matches]);

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const [reminderSet, setReminderSet] = useState<boolean>(false);
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  const [selectedPrediction, setSelectedPrediction] = useState<'home' | 'draw' | 'away' | null>(null);
  const [showPredictModal, setShowPredictModal] = useState<boolean>(false);
  const [votes, setVotes] = useState({ home: 52, draw: 20, away: 28 });

  // Sync reminder and prediction from localStorage when the selected match changes
  useEffect(() => {
    try {
      const savedReminder = localStorage.getItem(`sh_reminder_${marqueeMatch.id}`) === 'true';
      setReminderSet(savedReminder);

      const savedPred = localStorage.getItem(`sh_prediction_${marqueeMatch.id}`) as 'home' | 'draw' | 'away' | null;
      setSelectedPrediction(savedPred || null);
    } catch {
      // ignore
    }
  }, [marqueeMatch.id]);

  // Live countdown ticker
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = marqueeMatch.targetDate.getTime() - now;

      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [marqueeMatch.targetDate]);

  const handleToggleReminder = () => {
    const nextState = !reminderSet;
    setReminderSet(nextState);
    try {
      localStorage.setItem(`sh_reminder_${marqueeMatch.id}`, String(nextState));
    } catch {
      // ignore
    }

    if (nextState) {
      setReminderToast(`Reminder set for ${marqueeMatch.homeTeam.shortName} vs ${marqueeMatch.awayTeam.shortName}!`);
    } else {
      setReminderToast('Reminder cancelled.');
    }

    setTimeout(() => {
      setReminderToast(null);
    }, 4000);
  };

  const handlePredict = (choice: 'home' | 'draw' | 'away') => {
    setSelectedPrediction(choice);
    try {
      localStorage.setItem(`sh_prediction_${marqueeMatch.id}`, choice);
    } catch {
      // ignore
    }

    if (choice === 'home') setVotes({ home: 55, draw: 18, away: 27 });
    if (choice === 'draw') setVotes({ home: 48, draw: 26, away: 26 });
    if (choice === 'away') setVotes({ home: 46, draw: 19, away: 35 });
  };

  const padZero = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/60 bg-white/75 backdrop-blur-md shadow-[0_8px_32px_rgba(15,23,42,0.04)] hover:shadow-emerald-500/10 transition-all p-4 sm:p-6 mb-6 group">
      {/* Ambient background glows */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none transition-all group-hover:bg-emerald-500/15" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar: Auto-selected marquee badge + competition */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 pb-3.5 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {marqueeMatch.isLive ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/95 border border-emerald-300/80 text-emerald-800 text-[10px] font-black uppercase tracking-wider shadow-[0_0_12px_rgba(16,185,129,0.3)] backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span className="font-mono">{marqueeMatch.minute ? `${marqueeMatch.minute} • ` : ''}LIVE IN PLAY</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/95 border border-emerald-300/80 text-emerald-800 text-[10px] font-black uppercase tracking-wider shadow-xs">
              <Flame className="w-3 h-3 text-rose-500 fill-rose-500" />
              <span>Marquee Matchday Derby</span>
            </div>
          )}

          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">•</span>
          
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hidden sm:flex">
            {marqueeMatch.competitionEmblem ? (
              <img src={marqueeMatch.competitionEmblem} alt="" className="w-4 h-4 object-contain inline" />
            ) : (
              <Trophy className="w-3.5 h-3.5 text-amber-500 inline" />
            )}
            <span>{marqueeMatch.competition}</span>
            <span className="text-slate-400 font-normal">({marqueeMatch.round})</span>
          </div>
        </div>

        <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{marqueeMatch.venue}</span>
        </div>
      </div>

      {/* Main Grid: Teams, Countdown Clock & Actions */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Teams Matchup Showcase (5 cols) */}
        <div className="lg:col-span-5 flex items-center justify-between sm:justify-around px-2">
          {/* Home Team */}
          <div className="flex flex-col items-center text-center group/team flex-1">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-slate-200/80 p-2 shadow-xs flex items-center justify-center transition-transform group-hover/team:scale-105">
              {marqueeMatch.homeTeam.crest ? (
                <img
                  src={marqueeMatch.homeTeam.crest}
                  alt={marqueeMatch.homeTeam.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-slate-100 font-black text-slate-800 flex items-center justify-center text-sm">
                  {marqueeMatch.homeTeam.shortName}
                </div>
              )}
            </div>
            <span className="mt-2 text-xs sm:text-sm font-black text-slate-900 leading-tight truncate max-w-[120px]">
              {marqueeMatch.homeTeam.name}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Home
            </span>
          </div>

          {/* Central Match Status / Score */}
          <div className="flex flex-col items-center justify-center px-2 shrink-0">
            {marqueeMatch.isLive ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-300/80 bg-emerald-50/90 text-emerald-800 font-mono font-black text-lg shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                  <span>{marqueeMatch.homeScore ?? 0}</span>
                  <span className="text-xs text-emerald-400">:</span>
                  <span>{marqueeMatch.awayScore ?? 0}</span>
                </div>
                <span className="text-[9px] font-black text-emerald-600 mt-1 uppercase tracking-wider animate-pulse">
                  {marqueeMatch.minute || 'LIVE'}
                </span>
              </div>
            ) : (
              <>
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-md shadow-slate-900/10 border border-slate-800">
                  VS
                </div>
                <span className="text-[10px] font-bold text-rose-600 mt-1 uppercase tracking-wider">
                  Derby
                </span>
              </>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center text-center group/team flex-1">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-slate-200/80 p-2 shadow-xs flex items-center justify-center transition-transform group-hover/team:scale-105">
              {marqueeMatch.awayTeam.crest ? (
                <img
                  src={marqueeMatch.awayTeam.crest}
                  alt={marqueeMatch.awayTeam.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-slate-100 font-black text-slate-800 flex items-center justify-center text-sm">
                  {marqueeMatch.awayTeam.shortName}
                </div>
              )}
            </div>
            <span className="mt-2 text-xs sm:text-sm font-black text-slate-900 leading-tight truncate max-w-[120px]">
              {marqueeMatch.awayTeam.name}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Away
            </span>
          </div>
        </div>

        {/* Dynamic Countdown Clock (4 cols) */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center py-2 sm:py-0 border-y lg:border-y-0 lg:border-x border-slate-100 lg:px-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-emerald-600 animate-spin" style={{ animationDuration: '6s' }} />
            {marqueeMatch.isLive ? 'Match in Progress' : 'Kickoff Countdown'}
          </span>

          {marqueeMatch.isLive ? (
            <div className="flex items-center gap-2 py-1 px-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span className="text-xs font-black text-emerald-800 font-mono uppercase tracking-wider">
                {marqueeMatch.minute || 'LIVE NOW'} • Playing Live
              </span>
            </div>
          ) : (
            /* Digital Countdown Digit Boxes */
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Days */}
              <div className="flex flex-col items-center">
                <div className="w-11 sm:w-13 h-12 sm:h-14 rounded-xl bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur-md flex items-center justify-center">
                  <span className="font-mono text-lg sm:text-xl font-black text-slate-900">
                    {padZero(timeLeft.days)}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Days</span>
              </div>

              <span className="font-mono font-black text-slate-300 text-lg mb-4">:</span>

              {/* Hours */}
              <div className="flex flex-col items-center">
                <div className="w-11 sm:w-13 h-12 sm:h-14 rounded-xl bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur-md flex items-center justify-center">
                  <span className="font-mono text-lg sm:text-xl font-black text-slate-900">
                    {padZero(timeLeft.hours)}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Hours</span>
              </div>

              <span className="font-mono font-black text-slate-300 text-lg mb-4">:</span>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <div className="w-11 sm:w-13 h-12 sm:h-14 rounded-xl bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur-md flex items-center justify-center">
                  <span className="font-mono text-lg sm:text-xl font-black text-slate-900">
                    {padZero(timeLeft.minutes)}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Mins</span>
              </div>

              <span className="font-mono font-black text-slate-300 text-lg mb-4">:</span>

              {/* Seconds */}
              <div className="flex flex-col items-center">
                <div className="w-11 sm:w-13 h-12 sm:h-14 rounded-xl bg-emerald-50/80 border border-emerald-300/80 shadow-xs backdrop-blur-md flex items-center justify-center">
                  <span className="font-mono text-lg sm:text-xl font-black text-emerald-700">
                    {padZero(timeLeft.seconds)}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mt-1">Secs</span>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Action Buttons (3 cols) */}
        <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col gap-2.5">
          {/* Quick "Set Reminder" Button */}
          <button
            type="button"
            onClick={handleToggleReminder}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer",
              reminderSet
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:border-slate-300"
            )}
          >
            {reminderSet ? (
              <>
                <BellRing className="w-4 h-4 text-emerald-100 animate-bounce" />
                <span>Reminder Set!</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 text-slate-500" />
                <span>Set Reminder</span>
              </>
            )}
          </button>

          {/* Quick "Predict Outcome" Button */}
          <button
            type="button"
            onClick={() => setShowPredictModal(!showPredictModal)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-xs shadow-rose-600/20 cursor-pointer transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>{selectedPrediction ? 'Change Prediction' : 'Predict Outcome'}</span>
          </button>
        </div>
      </div>

      {/* Toast alert banner if user sets reminder */}
      {reminderToast && (
        <div className="mt-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{reminderToast}</span>
          </div>
          <button
            onClick={() => setReminderToast(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-1.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Interactive Predict Outcome Drawer / Consensus */}
      {showPredictModal && (
        <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              Who will claim victory? Cast your prediction:
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              {selectedPrediction ? 'Prediction recorded' : 'Pick one'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Home Win */}
            <button
              onClick={() => handlePredict('home')}
              className={cn(
                "p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1",
                selectedPrediction === 'home'
                  ? "bg-rose-50 border-rose-300 ring-2 ring-rose-500/20 text-rose-900 font-black shadow-xs"
                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-bold"
              )}
            >
              <span className="text-xs truncate max-w-full">{marqueeMatch.homeTeam.shortName} Win</span>
              <span className="text-[10px] text-slate-400">{votes.home}% fans</span>
            </button>

            {/* Draw */}
            <button
              onClick={() => handlePredict('draw')}
              className={cn(
                "p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1",
                selectedPrediction === 'draw'
                  ? "bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 text-amber-900 font-black shadow-xs"
                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-bold"
              )}
            >
              <span className="text-xs">Draw</span>
              <span className="text-[10px] text-slate-400">{votes.draw}% fans</span>
            </button>

            {/* Away Win */}
            <button
              onClick={() => handlePredict('away')}
              className={cn(
                "p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1",
                selectedPrediction === 'away'
                  ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 text-blue-900 font-black shadow-xs"
                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-bold"
              )}
            >
              <span className="text-xs truncate max-w-full">{marqueeMatch.awayTeam.shortName} Win</span>
              <span className="text-[10px] text-slate-400">{votes.away}% fans</span>
            </button>
          </div>

          {/* Fan Consensus Bar */}
          <div className="mt-3">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div style={{ width: `${votes.home}%` }} className="bg-rose-500 transition-all duration-500" title={`${marqueeMatch.homeTeam.shortName}: ${votes.home}%`} />
              <div style={{ width: `${votes.draw}%` }} className="bg-amber-400 transition-all duration-500" title={`Draw: ${votes.draw}%`} />
              <div style={{ width: `${votes.away}%` }} className="bg-blue-500 transition-all duration-500" title={`${marqueeMatch.awayTeam.shortName}: ${votes.away}%`} />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mt-1 px-0.5">
              <span>{marqueeMatch.homeTeam.shortName} ({votes.home}%)</span>
              <span>Draw ({votes.draw}%)</span>
              <span>{marqueeMatch.awayTeam.shortName} ({votes.away}%)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
