import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  QuizCategory,
  QuizDifficulty,
  QuizQuestion,
  QuizResult,
  QuizUserStats,
} from '../types/quiz';
import {
  getQuizQuestions,
  saveQuizResult,
  getUserQuizStats,
  getLeaderboard,
} from '../services/quizService';
import { QuizQuestionCard } from '../components/quiz/QuizQuestionCard';
import { QuizMatchSetup } from '../components/quiz/QuizMatchSetup';
import { QuizLeaderboardPanel } from '../components/quiz/QuizLeaderboardPanel';
import { QuizResultsView } from '../components/quiz/QuizResultsView';
import { QuizReviewView } from '../components/quiz/QuizReviewView';
import {
  CategoryGroupFilter,
  DIFFICULTY_CONFIG,
  DIFFICULTY_TIMES,
} from '../components/quiz/quizMetadata';
import { cn } from '../lib/utils';
import { Trophy, Zap } from 'lucide-react';
import { toast } from 'sonner';

// Quiz & Competition images for rotating hero (kept intact)
import uclQuizBg from '../assets/images/quiz_ucl_trophy_1790185490017.jpg';
import worldCupQuizBg from '../assets/images/quiz_world_cup_1790185501476.jpg';
import premierLeagueQuizBg from '../assets/images/quiz_premier_league_1790185513108.jpg';
import superstarsQuizBg from '../assets/images/quiz_superstars_arena_1790185526312.jpg';
import quizTrophyGlory from '../assets/images/quiz_trophy_glory_1793101111914.jpg';

export { DIFFICULTY_CONFIG };

const QUIZ_HERO_SLIDES = [
  {
    id: 'glory',
    title: 'Grand Championship Victory & Golden Glory',
    image: quizTrophyGlory,
  },
  { id: 'ucl', title: 'UEFA Champions League Glory', image: uclQuizBg },
  { id: 'worldcup', title: 'FIFA World Cup Final', image: worldCupQuizBg },
  { id: 'pl', title: 'Premier League Title Race', image: premierLeagueQuizBg },
  {
    id: 'arena',
    title: 'Championship Arena & Legends',
    image: superstarsQuizBg,
  },
];

type GameState = 'landing' | 'loading' | 'playing' | 'results' | 'review';

export function FootballQuiz() {
  const { user, userData } = useAuth();

  const [gameState, setGameState] = useState<GameState>('landing');
  const [selectedCategory, setSelectedCategory] = useState<
    QuizCategory | 'All'
  >('All');
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryGroupFilter>('all');
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<QuizDifficulty>('Medium');
  const [numQuestions, setNumQuestions] = useState<number>(10);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<
    { questionId: string; answer: string; isCorrect: boolean }[]
  >([]);

  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [timerActive, setTimerActive] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<number>(0);

  const [userStats, setUserStats] = useState<QuizUserStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<QuizResult[]>([]);
  const [leaderboardTab, setLeaderboardTab] = useState<'solo' | 'h2h'>('solo');
  const [finalResult, setFinalResult] = useState<QuizResult | null>(null);

  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [isRefreshingLeaderboard, setIsRefreshingLeaderboard] = useState(false);
  const isFetchingLeaderboardRef = useRef(false);

  // Rotating hero slides state & 3-second auto-scroll interval
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroSlide((prev) => (prev + 1) % QUIZ_HERO_SLIDES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const [transitioning, setTransitioning] = useState(false);

  const fetchLeaderboardData = useCallback(
    async (isManual: boolean = false) => {
      if (isFetchingLeaderboardRef.current) return;
      isFetchingLeaderboardRef.current = true;
      if (isManual) {
        setIsRefreshingLeaderboard(true);
      } else if (leaderboard.length === 0) {
        setIsLeaderboardLoading(true);
      }

      try {
        const currentUserId = user?.id || userData?.id;
        const [stats, leaders] = await Promise.all([
          getUserQuizStats(currentUserId),
          getLeaderboard(15, leaderboardTab),
        ]);
        setUserStats(stats);
        setLeaderboard(leaders);
      } catch (err) {
        console.error('Failed to fetch real-time leaderboard:', err);
      } finally {
        setIsLeaderboardLoading(false);
        setIsRefreshingLeaderboard(false);
        isFetchingLeaderboardRef.current = false;
      }
    },
    [user?.id, userData?.id, leaderboardTab, leaderboard.length]
  );

  // Initial load and tab changes
  useEffect(() => {
    try {
      const resetDone = localStorage.getItem('quiz_fresh_leaderboard_2026');
      if (!resetDone) {
        localStorage.removeItem('quizStats');
        localStorage.setItem('quiz_fresh_leaderboard_2026', 'true');
      }
    } catch {}
    fetchLeaderboardData(false);
  }, [fetchLeaderboardData]);

  // Real-time automatic background polling (every 15s) + visibility change + custom event sync
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeaderboardData(false);
    }, 15000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLeaderboardData(false);
      }
    };

    const handleScoreUpdated = () => {
      fetchLeaderboardData(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('quiz-score-updated', handleScoreUpdated);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('quiz-score-updated', handleScoreUpdated);
    };
  }, [fetchLeaderboardData]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (timerActive && timeRemaining > 0) {
      timer = setTimeout(() => setTimeRemaining((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [timeRemaining, timerActive]);

  const startQuiz = async () => {
    setTransitioning(true);
    try {
      const fetched = await getQuizQuestions(
        selectedCategory,
        selectedDifficulty,
        numQuestions
      );
      if (fetched.length === 0) {
        toast.error(
          'No questions found for this category and difficulty. Try another combination!'
        );
        setTransitioning(false);
        return;
      }
      setTimeout(() => {
        setQuestions(fetched);
        setCurrentIndex(0);
        setUserAnswers([]);
        setQuizStartTime(Date.now());
        setTimeRemaining(DIFFICULTY_TIMES[selectedDifficulty]);
        setGameState('playing');
        setTimerActive(true);
        setTransitioning(false);
      }, 900);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load questions. Please try again.');
      setTransitioning(false);
    }
  };

  const startDailyBlitz = async () => {
    setTransitioning(true);
    try {
      const fetched = await getQuizQuestions('All', 'Medium', 5);
      if (fetched.length === 0) {
        toast.error('Daily Blitz questions could not be loaded. Try again.');
        setTransitioning(false);
        return;
      }
      setTimeout(() => {
        setSelectedCategory('All');
        setSelectedDifficulty('Medium');
        setNumQuestions(5);
        setQuestions(fetched);
        setCurrentIndex(0);
        setUserAnswers([]);
        setQuizStartTime(Date.now());
        setTimeRemaining(DIFFICULTY_TIMES['Medium']);
        setGameState('playing');
        setTimerActive(true);
        setTransitioning(false);
      }, 700);
    } catch (err) {
      console.error(err);
      setTransitioning(false);
    }
  };

  const handleAnswerSubmit = (selectedOption: string) => {
    setTimerActive(false);
    const currentQ = questions[currentIndex];
    const isCorrect = selectedOption === currentQ.correctAnswer;

    setUserAnswers((prev) => [
      ...prev,
      {
        questionId: currentQ.id,
        answer: selectedOption,
        isCorrect,
      },
    ]);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTimeRemaining(DIFFICULTY_TIMES[selectedDifficulty]);
      setTimerActive(true);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setGameState('loading');
    const correctAnswers = userAnswers.filter((a) => a.isCorrect).length;
    const timeTaken = Math.max(
      1,
      Math.floor((Date.now() - quizStartTime) / 1000)
    );

    // Each question is worth 10 points
    const earnedScore = correctAnswers * 10;

    const currentUserId =
      user?.id || userData?.id || '2886ae6d-b563-44a3-b4b8-ae932cc188ad';
    const currentUsername =
      userData?.displayName ||
      (user as any)?.user_metadata?.display_name ||
      user?.displayName ||
      user?.email?.split('@')[0] ||
      'KISAKYE AARON';

    const result: QuizResult = {
      userId: currentUserId,
      username: currentUsername,
      score: earnedScore,
      totalQuestions: questions.length,
      correctAnswers,
      incorrectAnswers: questions.length - correctAnswers,
      timeTaken,
      category: selectedCategory,
      difficulty: selectedDifficulty,
      date: Date.now(),
    };

    await saveQuizResult(result);
    setFinalResult(result);

    const [stats, leaders] = await Promise.all([
      getUserQuizStats(currentUserId),
      getLeaderboard(15, leaderboardTab),
    ]);
    setUserStats(stats);
    setLeaderboard(leaders);

    setGameState('results');
  };

  const currentUserId = user?.id || userData?.id;
  const currentUsername =
    userData?.displayName ||
    (user as any)?.user_metadata?.display_name ||
    user?.displayName ||
    user?.email?.split('@')[0];

  const renderLanding = () => (
    <div className="w-full min-w-0">
      <div className="w-full max-w-6xl mx-auto space-y-5 sm:space-y-7 pb-16 min-w-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* 1. HERO BANNER HEADER (Preserved per user confirmation) */}
        <div className="relative w-full overflow-hidden rounded-[24px] sm:rounded-[32px] shadow-sm border border-slate-200 flex flex-col md:min-h-[460px] group mb-6 bg-white">
          <div className="relative w-full aspect-[16/9] sm:aspect-[16/9] md:aspect-auto md:absolute md:inset-0 z-0 bg-slate-900 overflow-hidden">
            {QUIZ_HERO_SLIDES.map((slide, idx) => (
              <img
                key={slide.id}
                src={slide.image}
                alt={slide.title}
                referrerPolicy="no-referrer"
                className={cn(
                  'absolute inset-0 w-full h-full object-cover object-center md:object-[right_top] transition-opacity duration-1000 ease-in-out',
                  activeHeroSlide === idx
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-105 pointer-events-none'
                )}
              />
            ))}

            <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/70 to-transparent h-[65%] top-auto bottom-0 hidden md:block pointer-events-none" />
            <div className="absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-white/95 via-white/40 to-transparent hidden md:block pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent md:hidden pointer-events-none" />
          </div>

          <div className="relative z-10 w-full md:w-[70%] lg:w-[65%] flex flex-col items-start justify-end p-5 sm:p-7 md:p-10 md:mt-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50/90 backdrop-blur-md border border-rose-200/80 mb-3 w-max shadow-2xs">
              <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-rose-700">
                Maestro Arena Football Quiz
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight mb-2 sm:mb-3 leading-[1.15] text-slate-950">
              Prove Your{' '}
              <span className="text-rose-600 relative inline-block">
                Football IQ
                <svg
                  className="absolute -bottom-1 w-full h-2 text-rose-200 -z-10"
                  viewBox="0 0 100 20"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 15 Q 50 0 100 15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-slate-600 font-medium mb-5 sm:mb-6 max-w-xl leading-relaxed">
              From Premier League drama to Champions League royalty and World Cup
              history. Choose your category, set your difficulty, and kick off
              below.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={startDailyBlitz}
                disabled={transitioning}
                className="relative group inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-5 sm:px-7 py-3 sm:py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-xl shadow-red-600/35 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer overflow-hidden border border-red-400/40 shrink-0"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-white fill-white" />
                  <span>Quick Start &quot;Daily Blitz&quot;</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider text-white">
                    1-Tap
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. UNIFIED LIGHT-THEME MATCH SETUP & ARENA SIDEBAR */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-7 w-full min-w-0">
          <div className="lg:col-span-2 w-full min-w-0">
            <QuizMatchSetup
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              categoryFilter={categoryFilter}
              onChangeCategoryFilter={setCategoryFilter}
              selectedDifficulty={selectedDifficulty}
              onSelectDifficulty={setSelectedDifficulty}
              numQuestions={numQuestions}
              onSelectNumQuestions={setNumQuestions}
              transitioning={transitioning}
              onStartQuiz={startQuiz}
            />
          </div>

          <div className="w-full min-w-0">
            <QuizLeaderboardPanel
              userStats={userStats}
              leaderboard={leaderboard}
              leaderboardTab={leaderboardTab}
              onChangeLeaderboardTab={setLeaderboardTab}
              isRefreshingLeaderboard={
                isRefreshingLeaderboard || isLeaderboardLoading
              }
              onRefreshLeaderboard={() => fetchLeaderboardData(true)}
              currentUserId={currentUserId}
              currentUsername={currentUsername}
              userEmail={user?.email}
              onStartQuiz={startQuiz}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto min-h-[calc(100vh-80px)]">
      {gameState === 'loading' && (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4 animate-in fade-in">
          <div className="relative">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-rose-600 border-t-transparent" />
            <Trophy className="w-5 h-5 text-amber-500 absolute inset-0 m-auto" />
          </div>
          <p className="text-slate-700 font-black uppercase tracking-widest text-xs sm:text-sm">
            Calculating Arena Score...
          </p>
        </div>
      )}

      {gameState === 'landing' && renderLanding()}

      {gameState === 'playing' && questions.length > 0 && (
        <QuizQuestionCard
          question={questions[currentIndex]}
          currentNumber={currentIndex + 1}
          totalQuestions={questions.length}
          timeRemaining={timeRemaining}
          maxTime={DIFFICULTY_TIMES[selectedDifficulty]}
          currentScore={userAnswers.filter((a) => a.isCorrect).length * 10}
          category={selectedCategory}
          difficulty={selectedDifficulty}
          userAnswersHistory={userAnswers}
          onAnswerSubmit={handleAnswerSubmit}
          onNextQuestion={nextQuestion}
        />
      )}

      {gameState === 'results' && finalResult && (
        <QuizResultsView
          finalResult={finalResult}
          onPlayAgain={() => {
            setGameState('landing');
            startQuiz();
          }}
          onReviewAnswers={() => setGameState('review')}
          onChangeCategory={() => setGameState('landing')}
        />
      )}

      {gameState === 'review' && (
        <QuizReviewView
          questions={questions}
          userAnswers={userAnswers}
          onBackToResults={() => setGameState('results')}
          onReturnToArena={() => setGameState('landing')}
        />
      )}
    </div>
  );
}
