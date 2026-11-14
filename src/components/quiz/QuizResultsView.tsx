import React from 'react';
import { QuizResult } from '../../types/quiz';
import { QuizConfetti } from './QuizConfetti';
import { cn } from '../../lib/utils';
import {
  CheckCircle2,
  Clock,
  LayoutGrid,
  RotateCcw,
  Star,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import trophyImg from '../../assets/images/football_slide_champions_trophy_1788810497413.jpg';
import trophyLiftImg from '../../assets/images/team_lifting_trophy_1_1788810980124.jpg';

interface QuizResultsViewProps {
  finalResult: QuizResult;
  onPlayAgain: () => void;
  onReviewAnswers: () => void;
  onChangeCategory: () => void;
}

export function QuizResultsView({
  finalResult,
  onPlayAgain,
  onReviewAnswers,
  onChangeCategory,
}: QuizResultsViewProps) {
  const percentage = Math.round(
    (finalResult.correctAnswers / finalResult.totalQuestions) * 100
  );
  const isHighScore = percentage >= 50;
  const avgSecondsPerQ = Math.max(
    1,
    Math.round(finalResult.timeTaken / finalResult.totalQuestions)
  );

  let verdictEmoji = '🏆';
  let verdictRating = "Ballon d'Or Winner / World Class Genius";
  let verdictBadgeClass =
    'bg-amber-50 text-amber-900 border-amber-300';

  if (percentage >= 90) {
    verdictEmoji = '🏆';
    verdictRating = "Ballon d'Or Winner / World Class Genius";
    verdictBadgeClass = 'bg-amber-50 text-amber-950 border-amber-300';
  } else if (percentage >= 70) {
    verdictEmoji = '🥇';
    verdictRating = 'Champions League Master';
    verdictBadgeClass = 'bg-rose-50 text-rose-900 border-rose-200';
  } else if (percentage >= 50) {
    verdictEmoji = '🥈';
    verdictRating = 'Premier League Starter';
    verdictBadgeClass = 'bg-slate-100 text-slate-900 border-slate-300';
  } else {
    verdictEmoji = '🥉';
    verdictRating = 'Back to the Training Ground';
    verdictBadgeClass = 'bg-orange-50 text-orange-900 border-orange-200';
  }

  return (
    <div className="w-full min-w-0">
      {isHighScore && <QuizConfetti active={true} />}

      <div className="w-full max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-400 pb-16 min-w-0">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden w-full min-w-0">
          {/* Header Banner: Trophy Presentation */}
          <div className="relative bg-gradient-to-b from-rose-50/70 via-white to-white p-6 sm:p-10 text-center overflow-hidden border-b border-slate-100">
            <div className="absolute inset-0 z-0">
              <img
                src={percentage >= 70 ? trophyLiftImg : trophyImg}
                alt="Match Finale"
                className="w-full h-full object-cover opacity-10"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-transparent" />
            </div>

            <div className="relative z-10 max-w-xl mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-rose-600 to-red-700 rounded-2xl sm:rounded-3xl text-white shadow-lg shadow-rose-600/25 mb-4">
                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300" />
              </div>

              <p className="text-[11px] font-black uppercase tracking-widest text-rose-600 mb-1.5">
                Full-Time Whistle · {finalResult.category}
              </p>
              <h1 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight mb-4">
                Arena Match Results
              </h1>

              <div
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black border',
                  verdictBadgeClass
                )}
              >
                <span>{verdictEmoji}</span>
                <span>{verdictRating}</span>
              </div>
            </div>
          </div>

          {/* 4-Card Genuine Performance Breakdown */}
          <div className="p-4 sm:p-8 md:p-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 tabular-nums">
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl text-center">
                <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-rose-600" />
                </div>
                <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mb-0.5">
                  Time Spent
                </p>
                <p className="text-2xl font-black text-slate-950">
                  {finalResult.timeTaken}s
                </p>
                <span className="text-[11px] font-semibold text-slate-500">
                  ~{avgSecondsPerQ}s / question
                </span>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200/90 p-4 rounded-2xl text-center">
                <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <p className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider mb-0.5">
                  Accuracy
                </p>
                <p className="text-2xl font-black text-emerald-700">
                  {percentage}%
                </p>
                <span className="text-[11px] font-semibold text-emerald-700">
                  {finalResult.correctAnswers} of {finalResult.totalQuestions}{' '}
                  Correct
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl text-center">
                <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mb-0.5">
                  Match Level
                </p>
                <p className="text-2xl font-black text-slate-950">
                  {finalResult.difficulty}
                </p>
                <span className="text-[11px] font-semibold text-slate-500">
                  {finalResult.incorrectAnswers} Missed
                </span>
              </div>

              <div className="bg-rose-50/70 border border-rose-200/90 p-4 rounded-2xl text-center">
                <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-rose-600 text-rose-600" />
                </div>
                <p className="text-[10px] text-rose-800 font-extrabold uppercase tracking-wider mb-0.5">
                  Points Earned
                </p>
                <p className="text-2xl font-black text-rose-600">
                  +{finalResult.score}{' '}
                  <span className="text-xs font-bold text-rose-500">pts</span>
                </p>
                <span className="text-[11px] font-semibold text-emerald-700">
                  Saved to Leaderboard
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={onPlayAgain}
                className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm sm:text-base transition-all shadow-md shadow-rose-600/25 cursor-pointer active:scale-[0.98]"
              >
                <RotateCcw className="w-4 h-4" /> Play Again
              </button>
              <button
                type="button"
                onClick={onReviewAnswers}
                className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm sm:text-base transition-all shadow-sm cursor-pointer active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Review
                Answers
              </button>
              <button
                type="button"
                onClick={onChangeCategory}
                className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-black text-sm sm:text-base border border-slate-200 transition-colors cursor-pointer active:scale-[0.98]"
              >
                <LayoutGrid className="w-4 h-4 text-rose-600" /> Change
                Category
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
