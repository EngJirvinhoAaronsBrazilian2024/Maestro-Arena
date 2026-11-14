import React from 'react';
import { Link } from 'react-router-dom';
import { QuizResult, QuizUserStats } from '../../types/quiz';
import { cn } from '../../lib/utils';
import {
  Activity,
  Calendar,
  ChevronRight,
  Crown,
  RotateCw,
  Swords,
  Trophy,
} from 'lucide-react';

interface QuizLeaderboardPanelProps {
  userStats: QuizUserStats | null;
  leaderboard: QuizResult[];
  leaderboardTab: 'solo' | 'h2h';
  onChangeLeaderboardTab: (tab: 'solo' | 'h2h') => void;
  isRefreshingLeaderboard: boolean;
  onRefreshLeaderboard: () => void;
  currentUserId?: string;
  currentUsername?: string;
  userEmail?: string;
  onStartQuiz: () => void;
}

export function QuizLeaderboardPanel({
  userStats,
  leaderboard,
  leaderboardTab,
  onChangeLeaderboardTab,
  isRefreshingLeaderboard,
  onRefreshLeaderboard,
  currentUserId,
  currentUsername,
  userEmail,
  onStartQuiz,
}: QuizLeaderboardPanelProps) {
  const displayLeaders = [...(leaderboard || [])].sort((a, b) => {
    const diff = (Number(b.score) || 0) - (Number(a.score) || 0);
    if (diff !== 0) return diff;
    return (Number(b.correctAnswers) || 0) - (Number(a.correctAnswers) || 0);
  });

  const userRankIdx = displayLeaders.findIndex(
    (l) =>
      (currentUserId && l.userId === currentUserId) ||
      (currentUsername &&
        l.username?.toLowerCase() === currentUsername.toLowerCase()) ||
      (userEmail &&
        l.username?.toLowerCase() === userEmail.split('@')[0].toLowerCase())
  );

  const userPoints =
    userRankIdx !== -1
      ? Number(displayLeaders[userRankIdx].score) || 0
      : userStats?.totalScore !== undefined
        ? userStats.totalScore
        : userStats?.bestScore !== undefined
          ? userStats.bestScore
          : 0;

  const userRank =
    userRankIdx !== -1
      ? userRankIdx + 1
      : displayLeaders.filter((l) => (Number(l.score) || 0) > userPoints)
          .length + 1;

  const top10Cutoff =
    Number(
      displayLeaders[Math.min(9, Math.max(0, displayLeaders.length - 1))]?.score
    ) || 50;
  const ptsAway = Math.max(10, top10Cutoff - userPoints + 10);

  return (
    <div className="space-y-5 sm:space-y-6 w-full min-w-0">
      {/* 1. CAREER RECORDS CARD */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200/90 w-full min-w-0">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-xs font-extrabold text-slate-600 uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-600 shrink-0" />
            Career Records
          </h3>
          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200/80">
            Cumulative
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 text-center tabular-nums">
          <div className="bg-rose-50/70 rounded-2xl p-3 border border-rose-200/70 min-w-0">
            <p className="text-[10px] font-bold text-rose-700 uppercase mb-0.5 truncate">
              Total Points
            </p>
            <p className="text-lg sm:text-xl font-black text-rose-950 truncate">
              {userStats?.totalScore ?? (userStats?.bestScore || 0)}
              <span className="text-[10px] text-rose-600 font-bold ml-0.5">
                pts
              </span>
            </p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/70 min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-0.5 truncate">
              Quizzes
            </p>
            <p className="text-lg sm:text-xl font-black text-slate-900 truncate">
              {userStats ? userStats.totalQuizzes : 0}
            </p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/70 min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-0.5 truncate">
              Best Match
            </p>
            <p className="text-lg sm:text-xl font-black text-slate-900 truncate">
              {userStats ? userStats.bestScore : 0}
              <span className="text-[10px] text-slate-400 font-bold ml-0.5">
                pts
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. COMPANION MODES: H2H 1v1 & DAILY CLUB TRIVIA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-600/20">
              <Swords className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm sm:text-base text-slate-950 truncate">
                H2H 1v1 Multiplayer
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
                Challenge friends or rivals in synchronized live football battles.
              </p>
            </div>
          </div>
          <Link
            to="/quiz/h2h"
            className="inline-flex items-center justify-center gap-1.5 w-full bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xl font-black text-xs sm:text-sm transition-colors shadow-sm shadow-rose-600/20"
          >
            Find Match <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <Link
          to="/quiz/daily"
          className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-sm hover:border-rose-300 transition-colors flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm text-slate-950 truncate">
                Daily Club Trivia
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate">
                5 daily questions for your club
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>
      </div>

      {/* 3. LEADERBOARD & RIVALRY CARD */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/90 flex flex-col h-[500px] relative overflow-hidden w-full min-w-0">
        <div className="flex items-center justify-between mb-3 gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-slate-950 tracking-tight truncate">
                Leaderboard
              </h3>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                Real-time cumulative points
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onRefreshLeaderboard}
              disabled={isRefreshingLeaderboard}
              title="Refresh real-time scores"
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer disabled:opacity-50"
            >
              <RotateCw
                className={cn(
                  'w-3.5 h-3.5 transition-transform',
                  isRefreshingLeaderboard && 'animate-spin text-rose-600'
                )}
              />
            </button>

            <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
              <button
                type="button"
                onClick={() => onChangeLeaderboardTab('solo')}
                className={cn(
                  'px-2.5 py-1 rounded-md transition-all cursor-pointer',
                  leaderboardTab === 'solo'
                    ? 'bg-white text-rose-600 shadow-2xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                Solo
              </button>
              <button
                type="button"
                onClick={() => onChangeLeaderboardTab('h2h')}
                className={cn(
                  'px-2.5 py-1 rounded-md transition-all cursor-pointer',
                  leaderboardTab === 'h2h'
                    ? 'bg-white text-rose-600 shadow-2xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                Rivalry
              </button>
            </div>
          </div>
        </div>

        {displayLeaders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-3">
              <Trophy className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-slate-900 mb-1">
              Arena Leaderboard Open
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mb-4">
              No quiz results recorded in this mode yet. Play a match to claim
              #1!
            </p>
            <button
              type="button"
              onClick={onStartQuiz}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition cursor-pointer"
            >
              Play First Match
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-16 space-y-3">
              {/* Top 3 Stepped Podium */}
              <div className="pt-3 pb-1 px-1">
                <div className="flex items-end justify-center gap-2 text-center tabular-nums">
                  {/* 2nd Place */}
                  <div className="flex-1 flex flex-col items-center min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center font-black text-slate-700 text-xs mb-1">
                      {displayLeaders[1]?.username
                        ? displayLeaders[1].username.slice(0, 2).toUpperCase()
                        : '—'}
                    </div>
                    <p className="text-[11px] font-bold text-slate-900 truncate w-full">
                      {displayLeaders[1]?.username || 'Open'}
                    </p>
                    <span className="text-[10px] font-bold text-slate-500 mb-1.5">
                      {displayLeaders[1] ? `${displayLeaders[1].score} pts` : '—'}
                    </span>
                    <div className="w-full h-14 rounded-t-xl bg-slate-200 border border-slate-300 flex flex-col items-center justify-center text-slate-700">
                      <span className="text-lg font-black leading-none">2</span>
                      <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 mt-0.5">
                        Silver
                      </span>
                    </div>
                  </div>

                  {/* 1st Place */}
                  <div className="flex-1 flex flex-col items-center min-w-0">
                    <Crown className="w-4 h-4 text-amber-500 mb-0.5" />
                    <div className="w-11 h-11 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center font-black text-amber-950 text-xs mb-1">
                      {displayLeaders[0]?.username
                        ? displayLeaders[0].username.slice(0, 2).toUpperCase()
                        : '1'}
                    </div>
                    <p className="text-xs font-black text-slate-950 truncate w-full">
                      {displayLeaders[0]?.username || 'Champion'}
                    </p>
                    <span className="text-[10px] font-black text-amber-700 mb-1.5">
                      {displayLeaders[0] ? `${displayLeaders[0].score} pts` : '—'}
                    </span>
                    <div className="w-full h-20 rounded-t-xl bg-gradient-to-b from-amber-300 to-amber-400 border border-amber-400 flex flex-col items-center justify-center text-amber-950">
                      <span className="text-2xl font-black leading-none">1</span>
                      <span className="text-[8px] font-black uppercase tracking-wider text-amber-900 mt-0.5">
                        Gold
                      </span>
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div className="flex-1 flex flex-col items-center min-w-0">
                    <div className="w-9 h-9 rounded-full bg-orange-50 border-2 border-orange-300 flex items-center justify-center font-black text-orange-900 text-xs mb-1">
                      {displayLeaders[2]?.username
                        ? displayLeaders[2].username.slice(0, 2).toUpperCase()
                        : '—'}
                    </div>
                    <p className="text-[11px] font-bold text-slate-900 truncate w-full">
                      {displayLeaders[2]?.username || 'Open'}
                    </p>
                    <span className="text-[10px] font-bold text-orange-700 mb-1.5">
                      {displayLeaders[2] ? `${displayLeaders[2].score} pts` : '—'}
                    </span>
                    <div className="w-full h-11 rounded-t-xl bg-orange-200/80 border border-orange-300 flex flex-col items-center justify-center text-orange-950">
                      <span className="text-base font-black leading-none">3</span>
                      <span className="text-[8px] font-black uppercase tracking-wider text-orange-800 mt-0.5">
                        Bronze
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ranked Contenders 4+ */}
              <div className="space-y-1.5">
                {displayLeaders.slice(3).map((res, i) => {
                  const rankNum = i + 4;
                  return (
                    <div
                      key={`${res.userId || 'contender'}-${rankNum}`}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/60 text-xs min-w-0"
                    >
                      <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 font-black flex items-center justify-center text-slate-700 text-[11px] shrink-0 tabular-nums">
                        {rankNum}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate">
                          {res.username || 'Player'}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {res.category || 'All Themes'} ·{' '}
                          {res.difficulty || 'Medium'}
                        </p>
                      </div>
                      <div className="text-right shrink-0 tabular-nums">
                        <span className="font-black text-slate-950">
                          {res.score}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-0.5">
                          pts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sticky Light-Theme User Rank Footer */}
            <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-white via-white to-transparent">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-slate-900">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    {currentUsername
                      ? currentUsername.slice(0, 2).toUpperCase()
                      : 'ME'}
                  </div>
                  <div className="min-w-0 tabular-nums">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-950 truncate">
                      <span>Your Rank #{userRank}</span>
                      <span className="text-rose-300">·</span>
                      <span className="text-rose-600">{userPoints} pts</span>
                    </div>
                    <p className="text-[10px] text-slate-600 font-medium truncate">
                      {userRank <= 10
                        ? 'Inside Top 10 Masters'
                        : `${ptsAway} pts away from Top 10`}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-white border border-rose-200 text-rose-700 text-[10px] font-black uppercase tracking-wider shrink-0">
                  You
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
