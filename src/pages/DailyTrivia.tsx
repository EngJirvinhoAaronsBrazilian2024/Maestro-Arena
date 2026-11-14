import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { QuizQuestion } from '../types/quiz';
import {
  Trophy,
  Loader2,
  Target,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Play,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getQuizQuestions } from '../services/quizService';
import { insforge } from '../lib/insforge';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export function DailyTrivia() {
  const { user } = useAuth();
  const [favoriteTeam, setFavoriteTeam] = useState<string>('');
  const [isSettingTeam, setIsSettingTeam] = useState(false);
  const [loading, setLoading] = useState(true);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'finished'>(
    'setup'
  );
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserPreference();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadUserPreference = async () => {
    try {
      const { data } = await insforge.database
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && data.favorite_team) {
        setFavoriteTeam(data.favorite_team);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveFavoriteTeam = async () => {
    if (!favoriteTeam.trim()) return;
    setIsSettingTeam(true);
    try {
      const { data } = await insforge.database
        .from('user_preferences')
        .update({ favorite_team: favoriteTeam })
        .eq('user_id', user.id)
        .select();

      if (!data || data.length === 0) {
        await insforge.database
          .from('user_preferences')
          .insert([{ user_id: user.id, favorite_team: favoriteTeam }]);
      }
      toast.success(`Saved ${favoriteTeam.trim()} as your club!`);
    } catch (error) {
      console.error(error);
      toast.error('Could not save your club preference.');
    } finally {
      setIsSettingTeam(false);
    }
  };

  const generateTrivia = async () => {
    if (!favoriteTeam) return;
    setGameState('playing');
    try {
      const fetched = await getQuizQuestions('World Football', 'Medium', 5);
      if (fetched.length > 0) {
        setQuestions(fetched);
        setCurrentIndex(0);
        setScore(0);
      } else {
        toast.error("Couldn't generate personalized trivia today.");
        setGameState('setup');
      }
    } catch (error) {
      console.error(error);
      setGameState('setup');
    }
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answer);
    const correct = answer === questions[currentIndex].correctAnswer;
    if (correct) setScore((s) => s + 1);

    setTimeout(() => {
      setSelectedAnswer(null);
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((i) => i + 1);
      } else {
        setGameState('finished');
      }
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin h-8 w-8 text-rose-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 text-center shadow-sm space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
            <Calendar className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-950">Login Required</h2>
          <p className="text-sm text-slate-600 font-medium">
            Sign in to play your Daily Club Trivia and track your favorite team.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white px-6 py-3 rounded-xl font-black text-sm shadow-md shadow-rose-600/20 transition-all"
          >
            Sign In to Play
          </Link>
        </div>
      </div>
    );
  }

  if (gameState === 'setup') {
    return (
      <div className="max-w-xl mx-auto space-y-5 pb-12 animate-in fade-in duration-300">
        <Link
          to="/quiz"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Quiz Arena
        </Link>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/90 space-y-6">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/20">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">
                5 Daily Questions
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                Daily Club Trivia
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Personalize your daily 5-question football challenge around your
                favorite club.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
              Who is your favorite team?
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="e.g. Arsenal, Real Madrid, AC Milan"
                value={favoriteTeam}
                onChange={(e) => setFavoriteTeam(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10 transition-all"
              />
              <button
                type="button"
                onClick={saveFavoriteTeam}
                disabled={isSettingTeam || !favoriteTeam.trim()}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isSettingTeam ? 'Saving...' : 'Save Club'}
              </button>
            </div>
          </div>

          {favoriteTeam.trim() && (
            <button
              type="button"
              onClick={generateTrivia}
              className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-rose-600/25 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              Play Today&apos;s {favoriteTeam} Quiz
            </button>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="max-w-xl mx-auto pb-12 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-slate-200/90 text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/25">
            <Trophy className="h-8 w-8 text-amber-300" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-rose-600 mb-1">
              {favoriteTeam} Edition
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950">
              Daily Trivia Complete!
            </h1>
          </div>
          <div className="inline-flex items-baseline gap-1.5 px-5 py-3 rounded-2xl bg-rose-50 border border-rose-200 tabular-nums">
            <span className="text-3xl font-black text-rose-600">{score}</span>
            <span className="text-sm font-bold text-slate-500">
              / {questions.length} correct
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Come back tomorrow for a fresh set of {favoriteTeam} trivia.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
            <button
              type="button"
              onClick={() => setGameState('setup')}
              className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black py-3 px-6 rounded-xl text-sm shadow-md shadow-rose-600/20 transition-all cursor-pointer"
            >
              Back to Trivia Hub
            </button>
            <Link
              to="/quiz"
              className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold py-3 px-6 rounded-xl text-sm transition-colors"
            >
              Open Quiz Arena
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin h-8 w-8 text-rose-600" />
      </div>
    );
  }

  const progressPct = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12">
      <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/90 space-y-3">
        <div className="flex justify-between items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-rose-600">
              <Sparkles className="w-3 h-3" /> Daily Club Trivia
            </div>
            <h2 className="font-black text-base sm:text-lg text-slate-950 truncate">
              {favoriteTeam} Challenge
            </h2>
          </div>
          <div className="flex items-center gap-3 tabular-nums shrink-0">
            <span className="text-xs font-bold text-slate-500">
              Q{currentIndex + 1}/{questions.length}
            </span>
            <span className="px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-sm font-black text-rose-600">
              {score} pts
            </span>
          </div>
        </div>

        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-rose-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-200/90 space-y-6">
        <h2 className="text-lg sm:text-2xl font-black text-slate-950 leading-snug">
          {currentQuestion.question}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentQuestion.correctAnswer;

            let btnClass =
              'bg-white hover:bg-rose-50/40 border-slate-200 hover:border-rose-400 text-slate-900';

            if (selectedAnswer) {
              if (isSelected) {
                btnClass = isCorrect
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                  : 'crimson-vibrate shake bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-500/20';
              } else if (isCorrect) {
                btnClass =
                  'bg-emerald-50 border-emerald-500 text-emerald-950';
              } else {
                btnClass = 'bg-slate-50 border-slate-200/60 text-slate-400 opacity-50';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleAnswer(option)}
                disabled={selectedAnswer !== null}
                className={cn(
                  'p-4 rounded-2xl border-2 font-bold text-sm sm:text-base text-left transition-all flex items-center justify-between gap-3 cursor-pointer min-h-[54px]',
                  btnClass
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black flex items-center justify-center shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="leading-snug">{option}</span>
                </div>
                {selectedAnswer && isCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                {selectedAnswer && isSelected && !isCorrect && (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
