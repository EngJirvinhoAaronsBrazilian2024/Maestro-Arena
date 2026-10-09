import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { QuizCategory, QuizDifficulty, QuizQuestion, QuizResult, QuizUserStats } from '../types/quiz';
import { getQuizQuestions, saveQuizResult, getUserQuizStats, getLeaderboard } from '../services/quizService';
import { QuizQuestionCard } from '../components/quiz/QuizQuestionCard';
import { QuizConfetti } from '../components/quiz/QuizConfetti';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  Target, 
  Clock, 
  Activity, 
  PlayCircle, 
  RotateCcw, 
  LayoutGrid, 
  CheckCircle2, 
  XCircle, 
  Users, 
  Globe, 
  Shield, 
  BookOpen, 
  Star, 
  Flag, 
  ChevronRight, 
  Flame, 
  Sparkles,
  Award,
  Zap,
  Swords,
  Calendar,
  ChevronDown,
  Check
} from 'lucide-react';
import { cn } from '../lib/utils';

// Authentic football images from repository
import stadiumBg from '../assets/images/stadium_atmosphere_1789303106987.jpg';
import trophyImg from '../assets/images/football_slide_champions_trophy_1788810497413.jpg';
import worldCupImg from '../assets/images/football_slide_world_cup_1788810581191.jpg';
import playerHeroImg from '../assets/images/football_stars_hero_2026_1788809874968.jpg';
import trophyLiftImg from '../assets/images/team_lifting_trophy_1_1788810980124.jpg';

// Quiz & Competition images for rotating hero
import uclQuizBg from '../assets/images/quiz_ucl_trophy_1790185490017.jpg';
import worldCupQuizBg from '../assets/images/quiz_world_cup_1790185501476.jpg';
import premierLeagueQuizBg from '../assets/images/quiz_premier_league_1790185513108.jpg';
import superstarsQuizBg from '../assets/images/quiz_superstars_arena_1790185526312.jpg';

const QUIZ_HERO_SLIDES = [
  { id: 'ucl', title: 'UEFA Champions League Glory', image: uclQuizBg },
  { id: 'worldcup', title: 'FIFA World Cup Final', image: worldCupQuizBg },
  { id: 'pl', title: 'Premier League Title Race', image: premierLeagueQuizBg },
  { id: 'arena', title: 'Championship Arena & Legends', image: superstarsQuizBg },
];

const CATEGORIES: QuizCategory[] = [
  'World Football', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 
  'UEFA Champions League', 'UEFA Europa League', 'FIFA World Cup', 
  'African Football', 'African Cup of Nations', 'Football Players', 
  'Football Clubs', 'Football History', 'Football Records', 'Football Rules', 'Famous Managers'
];

interface CategoryMeta {
  id: QuizCategory | 'All';
  title: string;
  subtitle: string;
  tag: string;
  group: 'all' | 'leagues' | 'tournaments' | 'players' | 'history';
  icon: any;
  accent: string;
  ovrRating: number;
  futCode: string;
}

export const DIFFICULTY_CONFIG: Record<QuizDifficulty, {
  label: string;
  emoji: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  time: number;
}> = {
  'Easy': { label: 'Easy', emoji: '🟢', color: 'text-emerald-700', badgeBg: 'bg-emerald-50', badgeBorder: 'border-emerald-200', badgeText: 'text-emerald-700', time: 30 },
  'Medium': { label: 'Medium', emoji: '🟡', color: 'text-amber-700', badgeBg: 'bg-amber-50', badgeBorder: 'border-amber-200', badgeText: 'text-amber-700', time: 25 },
  'Hard': { label: 'Hard', emoji: '🟠', color: 'text-orange-700', badgeBg: 'bg-orange-50', badgeBorder: 'border-orange-200', badgeText: 'text-orange-700', time: 20 },
  'Expert': { label: 'Expert', emoji: '🔴', color: 'text-rose-700', badgeBg: 'bg-rose-50', badgeBorder: 'border-rose-200', badgeText: 'text-rose-700', time: 15 },
};

const CATEGORY_ITEMS: CategoryMeta[] = [
  { id: 'Premier League', title: 'Premier League', subtitle: 'English giants, drama, history & goals', tag: 'England', group: 'leagues', icon: Shield, accent: 'from-purple-700 to-indigo-800', ovrRating: 96, futCode: 'EPL' },
  { id: 'UEFA Champions League', title: 'Champions League', subtitle: 'Europe\'s supreme club crown & nights', tag: 'Europe', group: 'tournaments', icon: Trophy, accent: 'from-blue-700 to-indigo-950', ovrRating: 99, futCode: 'UCL' },
  { id: 'FIFA World Cup', title: 'World Cup', subtitle: 'Global legends, iconic finals & heroes', tag: 'World', group: 'tournaments', icon: Globe, accent: 'from-amber-600 to-yellow-700', ovrRating: 98, futCode: 'WCP' },
  { id: 'African Cup of Nations', title: 'AFCON', subtitle: 'Total African glory, goals & champions', tag: 'Africa', group: 'tournaments', icon: Trophy, accent: 'from-amber-700 to-red-700', ovrRating: 95, futCode: 'CAF' },
  { id: 'Football Players', title: 'Legends', subtitle: 'Ballon d\'Or icons, stats & all-time greats', tag: 'Icons', group: 'players', icon: Award, accent: 'from-amber-600 to-stone-900', ovrRating: 97, futCode: 'LEG' },
  { id: 'All', title: 'Mixed Arena', subtitle: 'Random questions across all football themes', tag: 'All Themes', group: 'all', icon: Sparkles, accent: 'from-red-600 to-rose-700', ovrRating: 94, futCode: 'ALL' },
  { id: 'La Liga', title: 'La Liga', subtitle: 'Spanish royalty, El Clásico & magicians', tag: 'Spain', group: 'leagues', icon: Shield, accent: 'from-red-600 to-orange-600', ovrRating: 93, futCode: 'ESP' },
  { id: 'Serie A', title: 'Serie A', subtitle: 'Tactical masters, scudetto & legends', tag: 'Italy', group: 'leagues', icon: Shield, accent: 'from-sky-600 to-blue-700', ovrRating: 92, futCode: 'ITA' },
  { id: 'Bundesliga', title: 'Bundesliga', subtitle: 'High-octane attack, records & derbies', tag: 'Germany', group: 'leagues', icon: Shield, accent: 'from-red-700 to-zinc-800', ovrRating: 91, futCode: 'GER' },
  { id: 'Football Clubs', title: 'Football Clubs', subtitle: 'Historic stadiums, badges & anthems', tag: 'Clubs', group: 'leagues', icon: Shield, accent: 'from-slate-700 to-slate-900', ovrRating: 90, futCode: 'CLB' },
  { id: 'African Football', title: 'African Football', subtitle: 'Continental powerhouses & superstars', tag: 'Africa', group: 'leagues', icon: Flag, accent: 'from-emerald-700 to-amber-700', ovrRating: 89, futCode: 'AFR' },
  { id: 'UEFA Europa League', title: 'Europa League', subtitle: 'Thrilling European knockout showdowns', tag: 'Europe', group: 'tournaments', icon: Award, accent: 'from-orange-600 to-amber-700', ovrRating: 88, futCode: 'UEL' },
  { id: 'Football History', title: 'Football History', subtitle: 'Foundations, vintage moments & classic eras', tag: 'History', group: 'history', icon: BookOpen, accent: 'from-amber-800 to-stone-900', ovrRating: 87, futCode: 'HIS' },
  { id: 'Football Records', title: 'Football Records', subtitle: 'Unbelievable milestones, hat-tricks & totals', tag: 'Records', group: 'history', icon: Flame, accent: 'from-rose-600 to-red-800', ovrRating: 89, futCode: 'REC' },
  { id: 'Football Rules', title: 'Rules & VAR', subtitle: 'Laws of the pitch, refereeing & penalties', tag: 'Tactics', group: 'history', icon: Target, accent: 'from-slate-800 to-zinc-900', ovrRating: 86, futCode: 'LAW' },
  { id: 'Famous Managers', title: 'Famous Managers', subtitle: 'Tactical masterminds, dynasties & silver', tag: 'Tactics', group: 'players', icon: Users, accent: 'from-indigo-700 to-slate-900', ovrRating: 92, futCode: 'MGR' },
  { id: 'World Football', title: 'World Football', subtitle: 'International clashes, nations & continental cups', tag: 'Global', group: 'all', icon: Globe, accent: 'from-cyan-700 to-blue-800', ovrRating: 90, futCode: 'WLD' },
];

const DIFFICULTIES: QuizDifficulty[] = ['Easy', 'Medium', 'Hard', 'Expert'];
const DIFFICULTY_TIMES: Record<QuizDifficulty, number> = {
  'Easy': 30,
  'Medium': 25,
  'Hard': 20,
  'Expert': 15
};

const NUM_QUESTIONS_OPTIONS = [5, 10, 15, 20, 25, 50];

type GameState = 'landing' | 'loading' | 'playing' | 'results' | 'review';
type CategoryGroupFilter = 'all' | 'leagues' | 'tournaments' | 'players' | 'history';

export function FootballQuiz() {
  const { user, userData } = useAuth();
  
  const [gameState, setGameState] = useState<GameState>('landing');
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<CategoryGroupFilter>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<QuizDifficulty>('Medium');
  const [numQuestions, setNumQuestions] = useState<number>(10);
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{questionId: string, answer: string, isCorrect: boolean}[]>([]);
  
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [timerActive, setTimerActive] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  
  const [userStats, setUserStats] = useState<QuizUserStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<QuizResult[]>([]);
  const [leaderboardTab, setLeaderboardTab] = useState<'solo' | 'h2h'>('solo');
  const [finalResult, setFinalResult] = useState<QuizResult | null>(null);

  // Rotating hero slides state & 3-second auto-scroll interval
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroSlide(prev => (prev + 1) % QUIZ_HERO_SLIDES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Transition animation state
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const currentUserId = user?.id || userData?.id;
      const [stats, leaders] = await Promise.all([
        getUserQuizStats(currentUserId),
        getLeaderboard(15, leaderboardTab)
      ]);
      setUserStats(stats);
      setLeaderboard(leaders);
    };
    loadData();
  }, [user?.id, userData?.id, leaderboardTab]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerActive && timeRemaining > 0) {
      timer = setTimeout(() => setTimeRemaining(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [timeRemaining, timerActive]);

  const startQuiz = async () => {
    setTransitioning(true);
    try {
      const fetched = await getQuizQuestions(selectedCategory, selectedDifficulty, numQuestions);
      if (fetched.length === 0) {
        alert("No questions found for this category and difficulty. Try another combination!");
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
      alert("Failed to load questions. Please try again.");
      setTransitioning(false);
    }
  };

  const startDailyBlitz = async () => {
    setTransitioning(true);
    try {
      const fetched = await getQuizQuestions('All', 'Medium', 5);
      if (fetched.length === 0) {
        setTransitioning(false);
        return;
      }
      setTimeout(() => {
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
    
    setUserAnswers(prev => [...prev, {
      questionId: currentQ.id,
      answer: selectedOption,
      isCorrect
    }]);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setTimeRemaining(DIFFICULTY_TIMES[selectedDifficulty]);
      setTimerActive(true);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setGameState('loading');
    const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
    const timeTaken = Math.max(1, Math.floor((Date.now() - quizStartTime) / 1000));
    
    // Each question is worth 10 points
    const earnedScore = correctAnswers * 10;
    
    const currentUserId = user?.id || userData?.id || '2886ae6d-b563-44a3-b4b8-ae932cc188ad';
    const currentUsername = userData?.displayName || (user as any)?.user_metadata?.display_name || user?.displayName || user?.email?.split('@')[0] || 'KISAKYE AARON';
    
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
      date: Date.now()
    };
    
    await saveQuizResult(result);
    setFinalResult(result);
    
    // Fetch refreshed stats and complete leaderboard
    const [stats, leaders] = await Promise.all([
      getUserQuizStats(currentUserId),
      getLeaderboard(15, leaderboardTab)
    ]);
    setUserStats(stats);
    setLeaderboard(leaders);
    
    setGameState('results');
  };

  const filteredCategories = CATEGORY_ITEMS.filter(item => {
    if (categoryFilter === 'all') return true;
    return item.group === categoryFilter;
  });

  /* -------------------------------------------------------------
     LANDING SCREEN: FOOTBALL ARENA DESIGN
  ------------------------------------------------------------- */
  const renderLanding = () => {
    const selectedCatMeta = CATEGORY_ITEMS.find(c => c.id === selectedCategory) || CATEGORY_ITEMS[0];
    const SelectedIcon = selectedCatMeta.icon;

    return (
      <div className="w-full min-w-0">
        {/* UNIFIED RESPONSIVE FOOTBALL ARENA: KICKOFF BUTTON AFTER SELECTION */}
        <div className="w-full max-w-6xl mx-auto space-y-5 sm:space-y-8 pb-16 min-w-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* LIVE PLAYER STATS CHIP: Floating badge right in the header */}
          <div className="w-full flex items-center justify-between flex-wrap gap-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 border border-slate-200/90 shadow-2xs backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">Live Player Stats</span>
            </div>

            {/* Floating Stats Badge - Fully Responsive for Mobile & Desktop */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl sm:rounded-full bg-slate-950 text-white border border-slate-800 shadow-md backdrop-blur-md text-xs font-black">
              <div className="flex items-center gap-1.5 text-amber-400 shrink-0">
                <span>🔥</span>
                <span className="text-slate-300 font-medium text-[11px] sm:text-xs">Streak:</span>
                <span className="text-white font-black">5 Days</span>
              </div>
              <span className="hidden sm:inline-block w-1 h-3 bg-slate-700 rounded-full shrink-0" />
              <div className="flex items-center gap-1.5 text-yellow-400 shrink-0">
                <span>⭐</span>
                <span className="text-slate-300 font-medium text-[11px] sm:text-xs">Total Points:</span>
                <span className="text-white font-black">
                  {(userStats?.totalScore !== undefined ? userStats.totalScore : (userStats?.bestScore !== undefined ? userStats.bestScore : 0)).toLocaleString()}
                </span>
              </div>
              <span className="hidden sm:inline-block w-1 h-3 bg-slate-700 rounded-full shrink-0" />
              <div className="flex items-center gap-1.5 text-emerald-400 shrink-0">
                <span>🎯</span>
                <span className="text-slate-300 font-medium text-[11px] sm:text-xs">Accuracy:</span>
                <span className="text-white font-black">
                  {userStats && userStats.totalQuestions > 0 ? `${Math.round((userStats.correctAnswers / userStats.totalQuestions) * 100)}%` : '100%'}
                </span>
              </div>
            </div>
          </div>

          {/* 1. HERO BANNER: Maestro Arena Football Quiz & Competitions */}
          <div className="relative w-full overflow-hidden rounded-[24px] sm:rounded-[32px] shadow-sm border border-slate-200 flex flex-col md:min-h-[460px] group mb-6 bg-white">
            
            {/* Full Image Container:
                - On Mobile (< md): Displays in true 16:9 widescreen so trophies and competition visuals are 100% visible without being cut off
                - On Desktop (md:): Spans the full card background with soft bottom-left fade */}
            <div className="relative w-full aspect-[16/9] sm:aspect-[16/9] md:aspect-auto md:absolute md:inset-0 z-0 bg-slate-900 overflow-hidden">
              {QUIZ_HERO_SLIDES.map((slide, idx) => (
                <img 
                  key={slide.id}
                  src={slide.image} 
                  alt={slide.title} 
                  referrerPolicy="no-referrer"
                  className={cn(
                    "absolute inset-0 w-full h-full object-cover object-center md:object-[right_top] transition-opacity duration-1000 ease-in-out",
                    activeHeroSlide === idx ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
                  )} 
                />
              ))}
              
              {/* Desktop Gradients: Smooth fade in bottom-left corner targeting only where text and buttons sit */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/70 to-transparent h-[65%] top-auto bottom-0 hidden md:block pointer-events-none"></div>
              <div className="absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-white/95 via-white/40 to-transparent hidden md:block pointer-events-none"></div>
              
              {/* Mobile Bottom Blend: Clean gradient transition into the controls below */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent md:hidden pointer-events-none"></div>
            </div>

            {/* Content Box:
                - On Mobile: Placed neatly below the image with comfortable padding so the visuals remain completely unobstructed
                - On Desktop: Overlays smoothly at bottom-left */}
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
                  <svg className="absolute -bottom-1 w-full h-2 text-rose-200 -z-10" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 15 Q 50 0 100 15" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/></svg>
                </span>
              </h1>
              
              <p className="text-xs sm:text-sm md:text-base text-slate-600 font-medium mb-5 sm:mb-6 max-w-xl leading-relaxed">
                From Premier League drama to Champions League royalty and World Cup history. Choose your category, set your difficulty, and kick off below.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                {/* QUICK START "DAILY BLITZ" BUTTON: Pulsing button directly on the hero allowing 1-tap entry into today's challenge */}
                <button
                  type="button"
                  onClick={startDailyBlitz}
                  disabled={transitioning}
                  className="relative group inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-5 sm:px-7 py-3 sm:py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-xl shadow-red-600/35 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer overflow-hidden border border-red-400/40 shrink-0"
                >
                  <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-red-500 via-rose-600 to-red-600 opacity-75 blur-sm group-hover:opacity-100 animate-pulse transition duration-500"></span>
                  <span className="relative z-10 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-white fill-white animate-bounce" />
                    <span>Quick Start "Daily Blitz"</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider text-white">
                      1-Tap
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. GAME CONFIGURATION & CATEGORY SELECTOR */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 w-full min-w-0">
            
            {/* Left 2 Cols: Setup & KICKOFF BUTTON */}
            <div className="lg:col-span-2 space-y-5 sm:space-y-8 w-full min-w-0">
              
              {/* MOBILE VIEW (< md): STREAMLINED SETUP WITH CLEAN DROPDOWN LISTS TO PREVENT CONGESTION */}
              <div className="block md:hidden bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/90 space-y-4 w-full min-w-0">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2 min-w-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-black text-slate-900 tracking-tight truncate">Match Setup</h2>
                      <p className="text-[11px] text-slate-500 font-medium truncate">Quick options for mobile play</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-extrabold text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
                    {selectedDifficulty} • {DIFFICULTY_TIMES[selectedDifficulty]}s/Q
                  </span>
                </div>

                {/* 1. Category Dropdown */}
                <div className="w-full min-w-0">
                  <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between gap-1">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <LayoutGrid className="w-3.5 h-3.5 text-red-500 shrink-0" /> 
                      <span className="truncate">Football Category</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold normal-case shrink-0">{CATEGORY_ITEMS.length} Themes</span>
                  </label>
                  <div className="relative w-full min-w-0">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value as QuizCategory | 'All')}
                      className="w-full max-w-full appearance-none bg-slate-50 hover:bg-slate-100/90 border-2 border-slate-200 focus:border-red-500 focus:bg-white rounded-2xl py-3 pl-3.5 pr-10 text-sm font-black text-slate-900 transition-all outline-none cursor-pointer truncate"
                    >
                      <option value="All">⚽ Mixed Arena (All Themes)</option>
                      <optgroup label="Leagues & Clubs">
                        <option value="Premier League">🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League</option>
                        <option value="La Liga">🇪🇸 La Liga</option>
                        <option value="Serie A">🇮🇹 Serie A</option>
                        <option value="Bundesliga">🇩🇪 Bundesliga</option>
                        <option value="Football Clubs">🛡️ Football Clubs</option>
                        <option value="African Football">🌍 African Football</option>
                      </optgroup>
                      <optgroup label="Tournaments & Cups">
                        <option value="UEFA Champions League">🏆 Champions League</option>
                        <option value="FIFA World Cup">🌍 FIFA World Cup</option>
                        <option value="African Cup of Nations">🏆 AFCON</option>
                        <option value="UEFA Europa League">🏅 Europa League</option>
                      </optgroup>
                      <optgroup label="Players & Managers">
                        <option value="Football Players">👑 Football Players</option>
                        <option value="Famous Managers">📋 Famous Managers</option>
                      </optgroup>
                      <optgroup label="History & Rules">
                        <option value="Football History">📜 Football History</option>
                        <option value="Football Records">🔥 Football Records</option>
                        <option value="Football Rules">🎯 Rules & VAR</option>
                        <option value="World Football">🌐 World Football</option>
                      </optgroup>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>

                  {/* Active Category Preview Banner */}
                  <div className="mt-2.5 p-3 rounded-2xl bg-gradient-to-r from-red-50/70 to-rose-50/50 border border-red-200/70 flex items-center gap-3 w-full min-w-0 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-500/25">
                      <SelectedIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-black uppercase tracking-wider text-red-700 bg-red-100 px-1.5 py-0.5 rounded shrink-0">
                          {selectedCatMeta.tag}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3" /> Active Theme
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-slate-900 truncate mt-0.5">{selectedCatMeta.title}</h4>
                      <p className="text-[11px] text-slate-500 truncate font-medium">{selectedCatMeta.subtitle}</p>
                    </div>
                  </div>
                </div>

                {/* 2 & 3: Dropdowns for Difficulty & Match Length in 2-column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
                  {/* Difficulty Dropdown */}
                  <div className="w-full min-w-0">
                    <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-red-500 shrink-0" /> Difficulty Level
                    </label>
                    <div className="relative w-full min-w-0">
                      <select
                        value={selectedDifficulty}
                        onChange={(e) => setSelectedDifficulty(e.target.value as QuizDifficulty)}
                        className="w-full max-w-full appearance-none bg-slate-50 hover:bg-slate-100/90 border-2 border-slate-200 focus:border-red-500 focus:bg-white rounded-2xl py-3 pl-3.5 pr-10 text-sm font-black text-slate-900 transition-all outline-none cursor-pointer truncate"
                      >
                        {DIFFICULTIES.map(diff => (
                          <option key={diff} value={diff}>
                            {diff} ({DIFFICULTY_TIMES[diff]}s / question)
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  </div>

                  {/* Match Length (Questions) Dropdown */}
                  <div className="w-full min-w-0">
                    <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-red-500 shrink-0" /> Match Length
                    </label>
                    <div className="relative w-full min-w-0">
                      <select
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(Number(e.target.value))}
                        className="w-full max-w-full appearance-none bg-slate-50 hover:bg-slate-100/90 border-2 border-slate-200 focus:border-red-500 focus:bg-white rounded-2xl py-3 pl-3.5 pr-10 text-sm font-black text-slate-900 transition-all outline-none cursor-pointer truncate"
                      >
                        {NUM_QUESTIONS_OPTIONS.map(num => (
                          <option key={num} value={num}>
                            {num} Questions {num === 5 ? '(Quick Match)' : num === 10 ? '(Standard Match)' : num === 15 ? '(Championship)' : num === 20 ? '(Marathon)' : num === 25 ? '(Super Cup)' : '(Grand Master)'}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Kick Off Match Button */}
                <button
                  type="button"
                  onClick={startQuiz}
                  disabled={transitioning}
                  className="w-full mt-2 group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-5 py-3.5 rounded-2xl font-black text-sm sm:text-base hover:from-red-500 hover:to-red-600 transition-all shadow-[0_8px_20px_rgba(239,68,68,0.35)] active:scale-[0.98] cursor-pointer"
                >
                  {transitioning ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Entering Arena...
                    </span>
                  ) : (
                    <>
                      <PlayCircle className="w-5 h-5 text-white shrink-0" /> 
                      <span>Kick Off Match ({numQuestions} Questions)</span>
                    </>
                  )}
                </button>
              </div>

              {/* DESKTOP VIEW (hidden md:block): SPACIOUS PILLS & INTERACTIVE CATEGORY GRID */}
              <div className="hidden md:block space-y-8">
                {/* Quick Settings: Difficulty & Question Count */}
                <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-200/80 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Match Conditions</h2>
                        <p className="text-xs text-slate-500 font-medium">Difficulty level & questions duration</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      {selectedDifficulty} • {DIFFICULTY_TIMES[selectedDifficulty]}s per Q
                    </span>
                  </div>

                  {/* Difficulty Meter Badges */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2.5">
                      Difficulty Meter
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {DIFFICULTIES.map(diff => {
                        const dInfo = DIFFICULTY_CONFIG[diff];
                        const isSelected = selectedDifficulty === diff;
                        return (
                          <button
                            key={diff}
                            type="button"
                            onClick={() => setSelectedDifficulty(diff)}
                            className={cn(
                              "flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all cursor-pointer hover:-translate-y-0.5",
                              isSelected 
                                ? "border-slate-950 bg-slate-900 text-white shadow-md ring-2 ring-slate-900/30" 
                                : "border-slate-200/80 bg-white hover:border-slate-300 text-slate-700 hover:bg-slate-50"
                            )}
                          >
                            <span className="font-extrabold text-sm mb-1 flex items-center gap-1.5">
                              <span>{dInfo.emoji}</span>
                              <span>{dInfo.label}</span>
                            </span>
                            <span className={cn(
                              "text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                              isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                            )}>
                              <Clock className="w-3 h-3 text-red-500" /> {dInfo.time}s / Q
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Questions Count */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2.5">
                      Match Length (Questions)
                    </label>
                    <div className="grid grid-cols-4 gap-2.5">
                      {NUM_QUESTIONS_OPTIONS.map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setNumQuestions(num)}
                          className={cn(
                            "flex items-center justify-center py-3 rounded-2xl border-2 font-black transition-all cursor-pointer",
                            numQuestions === num 
                              ? "border-slate-900 bg-slate-900 text-white shadow-sm" 
                              : "border-slate-200/80 bg-white hover:border-slate-300 text-slate-700"
                          )}
                        >
                          {num} Qs
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Category Selector Grid: FIFA Ultimate Team / Trading Card Aesthetic */}
                <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-200/80 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                        <LayoutGrid className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Category Card Collection</h2>
                        <p className="text-xs text-slate-500 font-medium">Select a collectible football trading card to play</p>
                      </div>
                    </div>

                    {/* Group filter tabs */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'leagues', label: 'Leagues' },
                        { id: 'tournaments', label: 'Cups' },
                        { id: 'players', label: 'Players' },
                        { id: 'history', label: 'History' },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setCategoryFilter(tab.id as CategoryGroupFilter)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap",
                            categoryFilter === tab.id 
                              ? "bg-white text-slate-900 shadow-sm" 
                              : "text-slate-500 hover:text-slate-900"
                          )}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* FUT Trading Cards Grid with hover lift and stadium neon border glow on select */}
                  <div className="grid sm:grid-cols-2 gap-4 max-h-[540px] overflow-y-auto pr-1 custom-scrollbar">
                    {filteredCategories.map((cat) => {
                      const isSelected = selectedCategory === cat.id;
                      const Icon = cat.icon;
                      const activeDiff = DIFFICULTY_CONFIG[selectedDifficulty];

                      return (
                        <div
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={cn(
                            "group rounded-3xl p-4 sm:p-5 border-2 transition-all duration-300 cursor-pointer text-left flex flex-col justify-between relative overflow-hidden hover:-translate-y-1.5",
                            isSelected 
                              ? "border-cyan-400 ring-4 ring-cyan-400/40 shadow-[0_0_28px_rgba(6,182,212,0.55)] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white" 
                              : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 text-slate-900"
                          )}
                        >
                          {/* FUT Card Top Ribbon: OVR Rating & Card Tier */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-baseline gap-1">
                              <span className={cn(
                                "font-black text-xl tracking-tight leading-none",
                                isSelected ? "text-amber-400" : "text-slate-950"
                              )}>
                                {cat.ovrRating}
                              </span>
                              <span className={cn(
                                "text-[10px] font-black uppercase tracking-wider",
                                isSelected ? "text-cyan-300" : "text-rose-600"
                              )}>
                                {cat.futCode}
                              </span>
                            </div>

                            <span className={cn(
                              "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border",
                              isSelected 
                                ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40" 
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            )}>
                              {cat.tag}
                            </span>
                          </div>

                          {/* High-Contrast Club / Trophy Badge Crest */}
                          <div className="flex items-center gap-3.5 mb-3">
                            <div className={cn(
                              "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-transform duration-300 group-hover:scale-105 shadow-md",
                              isSelected 
                                ? "bg-gradient-to-br from-cyan-500 to-blue-600 border-cyan-300 text-white shadow-cyan-500/40" 
                                : "bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-amber-400 shadow-slate-900/20"
                            )}>
                              <Icon className="w-6 h-6 sm:w-7 sm:h-7 filter drop-shadow" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className={cn(
                                "font-black text-base sm:text-lg leading-tight truncate",
                                isSelected ? "text-white" : "text-slate-950"
                              )}>
                                {cat.title}
                              </h3>
                              <p className={cn(
                                "text-xs font-medium line-clamp-1 mt-0.5",
                                isSelected ? "text-slate-300" : "text-slate-500"
                              )}>
                                {cat.subtitle}
                              </p>
                            </div>
                          </div>

                          {/* Difficulty Meter Badge: Color-coded with estimated time-per-question counter */}
                          <div className={cn(
                            "flex items-center justify-between pt-2.5 border-t mt-auto",
                            isSelected ? "border-slate-800" : "border-slate-100"
                          )}>
                            <div className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black border",
                              isSelected 
                                ? "bg-slate-800 text-amber-300 border-slate-700" 
                                : cn(activeDiff.badgeBg, activeDiff.badgeText, activeDiff.badgeBorder)
                            )}>
                              <span>{activeDiff.emoji}</span>
                              <span>{activeDiff.label}</span>
                              <span className="opacity-40">•</span>
                              <span>{activeDiff.time}s / Q</span>
                            </div>

                            {isSelected ? (
                              <span className="flex items-center gap-1 text-[11px] font-black text-cyan-400">
                                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Active
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                                Select Card →
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* KICK OFF BUTTON: POSITIONED RIGHT AFTER SELECTING CATEGORY & MATCH CONDITIONS */}
              <div className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[32px] p-4 sm:p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-200/80 w-full min-w-0">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 w-full min-w-0">
                  <div className="flex items-center gap-3 sm:gap-4 w-full min-w-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 text-white flex items-center justify-center font-bold shadow-lg shadow-red-600/30 shrink-0">
                      <PlayCircle className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-red-600 bg-red-50 px-2.5 py-0.5 sm:py-1 rounded-full border border-red-100 inline-block">
                        Setup Complete
                      </span>
                      <h3 className="text-base sm:text-xl font-black text-slate-900 tracking-tight mt-1 truncate">
                        Ready for Kickoff
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-2">
                        Theme: <strong className="text-slate-800">{selectedCategory}</strong> • Difficulty: <strong className="text-slate-800">{selectedDifficulty}</strong> • Length: <strong className="text-slate-800">{numQuestions} Qs</strong> ({DIFFICULTY_TIMES[selectedDifficulty]}s / Q)
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={startQuiz}
                    disabled={transitioning}
                    className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-2.5 sm:gap-3 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-6 sm:px-9 py-3.5 sm:py-4 rounded-2xl font-black text-base sm:text-lg hover:from-red-500 hover:to-red-600 transition-all shadow-[0_10px_25px_rgba(239,68,68,0.35)] hover:shadow-[0_12px_30px_rgba(239,68,68,0.5)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    {transitioning ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Entering Arena...
                      </span>
                    ) : (
                      <>
                        <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:scale-110 transition-transform shrink-0" /> 
                        <span>Kick Off Quiz</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>

            {/* Right Col: Stats, Multiplayer Card & Hall of Fame */}
            <div className="space-y-5 sm:space-y-8 w-full min-w-0">
              
              {/* User Arena Stats - Always complete on mobile */}
              <div className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[32px] p-4 sm:p-6 shadow-sm border border-slate-200/80 w-full min-w-0">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4 text-red-500 shrink-0"/> Career Records
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400">Arena Stats</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full min-w-0">
                  <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100 min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase mb-0.5 sm:mb-1 truncate">High Score</p>
                    <p className="text-xl sm:text-3xl font-black text-slate-900 truncate">
                      {userStats ? userStats.bestScore : 0} <span className="text-xs text-slate-400 font-bold">pts</span>
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100 min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase mb-0.5 sm:mb-1 truncate">Quizzes Taken</p>
                    <p className="text-xl sm:text-3xl font-black text-slate-900 truncate">
                      {userStats ? userStats.totalQuizzes : 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick H2H and Daily Trivia Cards - Light Mode */}
              <div className="grid gap-3.5 sm:gap-4 w-full min-w-0">
                <div className="bg-gradient-to-br from-rose-50 to-red-50/50 rounded-2xl sm:rounded-3xl md:rounded-[30px] p-4 sm:p-6 text-slate-900 shadow-2xs relative overflow-hidden border border-rose-200/80 w-full min-w-0">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="relative z-10 w-full min-w-0">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className="p-2 bg-gradient-to-br from-rose-600 to-red-700 rounded-xl text-white shadow-md shadow-rose-600/25 shrink-0">
                        <Swords className="w-5 h-5" />
                      </div>
                      <h3 className="font-black text-base sm:text-lg tracking-tight text-slate-950 truncate">H2H Multiplayer</h3>
                    </div>
                    <p className="text-slate-600 text-xs font-medium mb-4 leading-relaxed">
                      Challenge football fans worldwide in synchronous head-to-head trivia showdowns.
                    </p>
                    <Link
                      to="/quiz/h2h"
                      className="inline-flex items-center justify-center gap-2 w-full bg-gradient-to-r from-rose-600 to-red-600 text-white py-3 rounded-xl font-black text-sm hover:from-rose-500 hover:to-red-500 transition-all shadow-md shadow-rose-600/20 cursor-pointer"
                    >
                      Find Match <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[30px] p-3.5 sm:p-5 shadow-2xs border border-slate-200/80 flex items-center justify-between gap-3 sm:gap-4 w-full min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0 shadow-2xs">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-sm text-slate-900 tracking-tight truncate">Daily Football Trivia</h4>
                      <p className="text-xs text-slate-500 font-medium truncate">New match riddle every morning</p>
                    </div>
                  </div>
                  <Link
                    to="/quiz/daily"
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200/80 font-bold text-xs transition-colors shrink-0"
                  >
                    Play Today
                  </Link>
                </div>
              </div>

              {/* Leaderboard & Rivalry Tab with Stepped Podium Presentation */}
              <div className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[32px] p-4 sm:p-5 shadow-xl shadow-slate-200/40 border border-slate-200/80 flex flex-col h-[520px] relative overflow-hidden w-full min-w-0">
                <div className="flex items-center justify-between mb-3 relative z-10 gap-2 shrink-0">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-100 flex items-center justify-center border border-amber-200 text-amber-700 shadow-sm shrink-0">
                      <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">Leaderboard & Rivalry</h3>
                      <p className="text-xs text-slate-500 font-medium truncate">Top Football Masters Podium</p>
                    </div>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
                    <button 
                      onClick={() => setLeaderboardTab('solo')}
                      className={cn("px-2.5 sm:px-3 py-1 rounded-lg transition-all", leaderboardTab === 'solo' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
                    >
                      Solo
                    </button>
                    <button 
                      onClick={() => setLeaderboardTab('h2h')}
                      className={cn("px-2.5 sm:px-3 py-1 rounded-lg transition-all", leaderboardTab === 'h2h' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
                    >
                      Rivalry
                    </button>
                  </div>
                </div>
                
                {(() => {
                  const defaultLeaders: QuizResult[] = [
                    { userId: '2886ae6d-b563-44a3-b4b8-ae932cc188ad', username: 'KISAKYE AARON', score: leaderboardTab === 'h2h' ? 3605 : 1460, category: 'Premier League', difficulty: 'Easy', totalQuestions: 10, correctAnswers: 10, incorrectAnswers: 0, timeTaken: 35, date: Date.now() },
                    { userId: '39d960e9-104a-4a74-b88e-bca3ac857675', username: 'Musinguzi Mark', score: 1066, category: 'All Themes', difficulty: 'Medium', totalQuestions: 10, correctAnswers: 9, incorrectAnswers: 1, timeTaken: 38, date: Date.now() },
                    { userId: 'eefed0c5-c648-4525-8ab9-cf103e3bee57', username: 'Victor Hernandez', score: 610, category: 'All Themes', difficulty: 'Expert', totalQuestions: 10, correctAnswers: 9, incorrectAnswers: 1, timeTaken: 42, date: Date.now() },
                    { userId: 'b7d12faa-cb86-4e33-ae96-f2f6120e585f', username: 'Otim Jacob', score: 220, category: 'All Themes', difficulty: 'Medium', totalQuestions: 10, correctAnswers: 8, incorrectAnswers: 2, timeTaken: 45, date: Date.now() },
                    { userId: '63a2899b-224e-44ed-bd73-b44a1a7ffd26', username: 'Abdul-rahman Jasim', score: 160, category: 'All Themes', difficulty: 'Expert', totalQuestions: 10, correctAnswers: 8, incorrectAnswers: 2, timeTaken: 48, date: Date.now() },
                    { userId: '8e945030-bdd9-4327-b17e-f749e206ee87', username: 'sebunya', score: 100, category: 'All Themes', difficulty: 'Medium', totalQuestions: 10, correctAnswers: 7, incorrectAnswers: 3, timeTaken: 50, date: Date.now() },
                    { userId: '066b7251-8666-4570-a2a6-8887a210cfef', username: 'Kaggwa Peter', score: 90, category: 'Champions League', difficulty: 'Hard', totalQuestions: 10, correctAnswers: 7, incorrectAnswers: 3, timeTaken: 52, date: Date.now() },
                    { userId: 'fbf35d7f-e284-48d4-ae3b-44f9ed7f86e2', username: 'Elton John', score: 80, category: 'World Cup', difficulty: 'Medium', totalQuestions: 10, correctAnswers: 6, incorrectAnswers: 4, timeTaken: 54, date: Date.now() },
                    { userId: 'ee396321-9c99-4eec-a049-77b2acbc70b9', username: 'Fadil', score: 70, category: 'La Liga', difficulty: 'Medium', totalQuestions: 10, correctAnswers: 6, incorrectAnswers: 4, timeTaken: 55, date: Date.now() },
                    { userId: '7f5f1c7d-8366-47cf-b01e-d020d4a73dab', username: 'Angel Dimaria', score: 50, category: 'FIFA World Cup', difficulty: 'Easy', totalQuestions: 10, correctAnswers: 5, incorrectAnswers: 5, timeTaken: 58, date: Date.now() },
                  ];

                  const rawLeaders = leaderboard && leaderboard.length > 0 ? leaderboard : defaultLeaders;
                  // STRICT SORT: Highest score first, no 0-point player ahead of anyone with points
                  const displayLeaders = [...rawLeaders].sort((a, b) => {
                    const diff = (Number(b.score) || 0) - (Number(a.score) || 0);
                    if (diff !== 0) return diff;
                    return (Number(b.correctAnswers) || 0) - (Number(a.correctAnswers) || 0);
                  });

                  const currentUserId = user?.id || userData?.id;
                  const currentUsername = userData?.displayName || (user as any)?.user_metadata?.display_name || user?.displayName || user?.email?.split('@')[0];

                  const userRankIdx = displayLeaders.findIndex(l => 
                    (currentUserId && l.userId === currentUserId) || 
                    (currentUsername && l.username?.toLowerCase() === currentUsername.toLowerCase()) ||
                    (user?.email && l.username?.toLowerCase() === user.email.split('@')[0].toLowerCase())
                  );

                  // Current user's real points
                  const userPoints = userRankIdx !== -1 
                    ? (Number(displayLeaders[userRankIdx].score) || 0)
                    : (userStats?.totalScore !== undefined ? userStats.totalScore : (userStats?.bestScore !== undefined ? userStats.bestScore : 0));

                  // Current user's accurate rank:
                  // If in displayLeaders, their 1-indexed position;
                  // otherwise, count how many leaders have higher score + 1
                  const userRank = userRankIdx !== -1 
                    ? userRankIdx + 1 
                    : (displayLeaders.filter(l => (Number(l.score) || 0) > userPoints).length + 1);

                  const top10Cutoff = Number(displayLeaders[Math.min(9, displayLeaders.length - 1)]?.score) || 50;
                  const ptsAway = Math.max(10, top10Cutoff - userPoints + 10);

                  return (
                    <>
                      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-16 space-y-3 relative z-10">
                        {/* 1. PODIUM PRESENTATION: Top 3 stepped pedestals with avatar crests */}
                        <div className="pt-2 pb-2 px-0.5 sm:px-1">
                          <div className="flex items-end justify-center gap-1.5 sm:gap-2 max-w-sm mx-auto text-center">
                            
                            {/* 2nd Place: Silver Stepped Pedestal (Left) */}
                            <div className="flex-1 flex flex-col items-center min-w-0">
                              <div className="relative mb-1.5">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-100 border-2 border-slate-300 p-0.5 shadow-md flex items-center justify-center font-black text-slate-800 text-xs">
                                  {displayLeaders[1]?.username?.slice(0, 2).toUpperCase() || 'P2'}
                                </div>
                                <span className="absolute -top-2 -right-1 text-xs sm:text-sm">🥈</span>
                              </div>
                              <p className="text-[10px] sm:text-[11px] font-black text-slate-900 truncate w-full px-0.5">{displayLeaders[1]?.username || 'Musinguzi Mark'}</p>
                              <span className="text-[9px] sm:text-[10px] font-black text-slate-600 mb-1.5">{displayLeaders[1]?.score ?? 0} pts</span>
                              
                              <div className="w-full h-14 sm:h-20 rounded-t-2xl bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 border-t-2 border-x-2 border-slate-300 shadow-sm flex flex-col items-center justify-center text-slate-700">
                                <span className="text-lg sm:text-2xl font-black">2</span>
                                <span className="text-[7px] sm:text-[8px] uppercase font-black tracking-wider text-slate-600">SILVER</span>
                              </div>
                            </div>

                            {/* 1st Place: Gold Stepped Pedestal (Center - Highest) */}
                            <div className="flex-1 flex flex-col items-center -mt-3 sm:-mt-4 min-w-0">
                              <div className="relative mb-1.5">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-100 border-2 border-amber-400 p-0.5 shadow-lg shadow-amber-400/30 flex items-center justify-center font-black text-amber-950 text-xs sm:text-sm ring-2 ring-amber-300">
                                  {displayLeaders[0]?.username?.slice(0, 2).toUpperCase() || 'KA'}
                                </div>
                                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-base sm:text-lg drop-shadow animate-bounce">👑</span>
                              </div>
                              <p className="text-[11px] sm:text-xs font-black text-slate-950 truncate w-full px-0.5">{displayLeaders[0]?.username || 'KISAKYE AARON'}</p>
                              <span className="text-[10px] sm:text-[11px] font-black text-amber-600 mb-1.5">{displayLeaders[0]?.score ?? 0} pts</span>
                              
                              <div className="w-full h-20 sm:h-28 rounded-t-2xl bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500 border-t-2 border-x-2 border-amber-300 shadow-lg shadow-amber-500/20 flex flex-col items-center justify-center text-amber-950">
                                <span className="text-xl sm:text-3xl font-black">1</span>
                                <span className="text-[8px] sm:text-[9px] uppercase font-black tracking-wider text-amber-900">GOLD</span>
                              </div>
                            </div>

                            {/* 3rd Place: Bronze Stepped Pedestal (Right) */}
                            <div className="flex-1 flex flex-col items-center min-w-0">
                              <div className="relative mb-1.5">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-100 border-2 border-orange-300 p-0.5 shadow-md flex items-center justify-center font-black text-orange-950 text-xs">
                                  {displayLeaders[2]?.username?.slice(0, 2).toUpperCase() || 'VH'}
                                </div>
                                <span className="absolute -top-2 -right-1 text-xs sm:text-sm">🥉</span>
                              </div>
                              <p className="text-[10px] sm:text-[11px] font-black text-slate-900 truncate w-full px-0.5">{displayLeaders[2]?.username || 'Victor Hernandez'}</p>
                              <span className="text-[9px] sm:text-[10px] font-black text-orange-700 mb-1.5">{displayLeaders[2]?.score ?? 0} pts</span>
                              
                              <div className="w-full h-11 sm:h-16 rounded-t-2xl bg-gradient-to-b from-amber-600 via-orange-600 to-amber-700 border-t-2 border-x-2 border-orange-400 shadow-sm flex flex-col items-center justify-center text-white">
                                <span className="text-base sm:text-xl font-black">3</span>
                                <span className="text-[7px] sm:text-[8px] uppercase font-black tracking-wider text-orange-200">BRONZE</span>
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* List of Remaining Contenders */}
                        <div className="space-y-1.5">
                          {displayLeaders.slice(3).map((res, i) => {
                            const rankNum = i + 4;
                            return (
                              <div key={i} className="flex items-center gap-2 sm:gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs min-w-0">
                                <div className="w-6 h-6 rounded-full bg-white border border-slate-200 font-black flex items-center justify-center text-slate-700 text-[11px] shrink-0">
                                  {rankNum}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-slate-900 truncate">{res.username || 'KISAKYE AARON'}</p>
                                  <p className="text-[10px] text-slate-400 truncate">{res.category} • {res.difficulty}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="font-black text-slate-900">{res.score}</span>
                                  <span className="text-[9px] text-slate-400 ml-0.5">pts</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* "YOUR RANK" STICKY BOTTOM BAR: Pinned pill highlighting logged-in user's rank */}
                      <div className="absolute inset-x-0 bottom-0 p-2 sm:p-2.5 bg-gradient-to-t from-white via-white/95 to-transparent z-20">
                        <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-950 text-white shadow-xl shadow-slate-950/30 border border-slate-800">
                          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-600 text-white font-black text-xs flex items-center justify-center border-2 border-rose-400 shrink-0">
                              {currentUsername ? currentUsername.slice(0, 2).toUpperCase() : 'ME'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 sm:gap-1.5 text-xs font-black tracking-wide text-white truncate">
                                <span className="hidden xs:inline">Your Rank:</span>
                                <span className="text-amber-400 font-black">#{userRank}</span>
                                <span className="text-slate-500">•</span>
                                <span className="text-emerald-400 font-black">{userPoints} pts</span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium truncate">
                                {userRank <= 10 ? '🔥 Inside Top 10 Masters' : `${ptsAway} pts to Top 10`}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl bg-rose-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider shrink-0">
                            Active
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

            </div>
          </div>

        </div>
      </div>
    );
  };

  /* -------------------------------------------------------------
     RESULTS SCREEN: THE TROPHY PRESENTATION
  ------------------------------------------------------------- */
  const renderResults = () => {
    if (!finalResult) return null;
    const percentage = Math.round((finalResult.correctAnswers / finalResult.totalQuestions) * 100);
    const isHighScore = percentage >= 50;
    
    // Matchday Verdict Rating exact mapping
    let verdictEmoji = '🏆';
    let verdictRating = "Ballon d'Or Winner / World Class Genius";
    let verdictBadgeClass = 'bg-amber-100 text-amber-950 border-amber-300';

    if (percentage >= 90) {
      verdictEmoji = '🏆';
      verdictRating = "Ballon d'Or Winner / World Class Genius";
      verdictBadgeClass = 'bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-200 text-amber-950 border-amber-400 shadow-md shadow-amber-500/20';
    } else if (percentage >= 70) {
      verdictEmoji = '🥇';
      verdictRating = "Champions League Master";
      verdictBadgeClass = 'bg-gradient-to-r from-blue-100 via-indigo-100 to-blue-200 text-blue-950 border-blue-400 shadow-md shadow-blue-500/20';
    } else if (percentage >= 50) {
      verdictEmoji = '🥈';
      verdictRating = "Premier League Starter";
      verdictBadgeClass = 'bg-gradient-to-r from-slate-100 via-zinc-100 to-slate-200 text-slate-900 border-slate-300 shadow-sm';
    } else {
      verdictEmoji = '🥉';
      verdictRating = "Back to the Training Ground";
      verdictBadgeClass = 'bg-gradient-to-r from-orange-100 via-amber-100 to-orange-200 text-amber-950 border-orange-300 shadow-sm';
    }

    return (
      <div className="w-full min-w-0">
        {/* Celebration Confetti */}
        {isHighScore && <QuizConfetti active={true} />}

        {/* RESPONSIVE ARENA RESULTS */}
        <div className="w-full max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500 pb-16 min-w-0">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-[40px] shadow-[0_8px_32px_rgba(15,23,42,0.06)] border border-white/90 overflow-hidden w-full min-w-0">
          
          {/* Header Banner: The Trophy Presentation */}
          <div className="relative bg-gradient-to-b from-amber-50/70 via-rose-50/40 to-white p-6 sm:p-12 text-center overflow-hidden border-b border-slate-100">
            <div className="absolute inset-0 z-0">
              <img 
                src={percentage >= 70 ? trophyLiftImg : trophyImg} 
                alt="Match Finale" 
                className="w-full h-full object-cover opacity-10 filter contrast-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
            </div>

            <div className="relative z-10 max-w-xl mx-auto">
              <div className="inline-flex items-center justify-center p-3.5 sm:p-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl text-white shadow-xl shadow-amber-500/25 mb-4 sm:mb-5 border border-amber-300">
                <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              
              <h2 className="text-xs font-black uppercase tracking-widest text-rose-600 mb-2">
                Full-Time Whistle • Trophy Presentation
              </h2>
              <h1 className="text-2xl sm:text-5xl font-black text-slate-950 tracking-tight mb-3 sm:mb-4">
                Arena Match Results
              </h1>

              {/* Matchday Verdict Rating Badge */}
              <div className={cn("inline-flex items-center gap-2 px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider border shadow-sm", verdictBadgeClass)}>
                <span className="text-base sm:text-lg">{verdictEmoji}</span>
                <span>{verdictRating}</span>
              </div>
            </div>
          </div>
          
          {/* Clean Breakdown Grid: Time spent, accuracy percentage, and streak bonus cards */}
          <div className="p-4 sm:p-10 md:p-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-6 sm:mb-10">
              {/* Card 1: Time spent */}
              <div className="bg-slate-50 border border-slate-200/90 p-4 sm:p-5 rounded-2xl sm:rounded-3xl text-center shadow-2xs">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <p className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wider mb-0.5">Time Spent</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-950">{finalResult.timeTaken}s</p>
                <span className="text-[11px] font-bold text-blue-600">
                  ~{Math.max(1, Math.round(finalResult.timeTaken / finalResult.totalQuestions))}s / question
                </span>
              </div>

              {/* Card 2: Accuracy percentage */}
              <div className="bg-emerald-50/70 border border-emerald-200/90 p-4 sm:p-5 rounded-2xl sm:rounded-3xl text-center shadow-2xs">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Target className="w-5 h-5" />
                </div>
                <p className="text-[11px] text-emerald-800 font-extrabold uppercase tracking-wider mb-0.5">Accuracy</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600">{percentage}%</p>
                <span className="text-[11px] font-bold text-emerald-700">
                  {finalResult.correctAnswers} of {finalResult.totalQuestions} On Target
                </span>
              </div>

              {/* Card 3: Streak bonus card */}
              <div className="bg-amber-50/70 border border-amber-200/90 p-4 sm:p-5 rounded-2xl sm:rounded-3xl text-center shadow-2xs">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
                </div>
                <p className="text-[11px] text-amber-800 font-extrabold uppercase tracking-wider mb-0.5">Streak Bonus</p>
                <p className="text-2xl sm:text-3xl font-black text-amber-600">+150 <span className="text-sm font-bold">XP</span></p>
                <span className="text-[11px] font-bold text-amber-700">🔥 5 Days Active Streak</span>
              </div>

              {/* Card 4: Match Points */}
              <div className="bg-rose-50/70 border border-rose-200/90 p-4 sm:p-5 rounded-2xl sm:rounded-3xl text-center shadow-2xs">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <Star className="w-5 h-5 fill-rose-500 text-rose-500" />
                </div>
                <p className="text-[11px] text-rose-800 font-extrabold uppercase tracking-wider mb-0.5">Match Points</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-950">{finalResult.score} <span className="text-sm font-bold text-slate-400">pts</span></p>
                <span className="text-[11px] font-bold text-rose-600">⚽ {finalResult.correctAnswers} Goals Scored</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5">
              <button
                onClick={() => { setGameState('landing'); startQuiz(); }}
                className="flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-base transition-all shadow-md shadow-rose-600/25 hover:-translate-y-0.5 cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" /> Play Again
              </button>
              <button
                onClick={() => setGameState('review')}
                className="flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200 font-black text-base transition-all shadow-2xs hover:-translate-y-0.5 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5 text-cyan-600" /> Review Answers
              </button>
              <button
                onClick={() => setGameState('landing')}
                className="flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-base border border-slate-200/80 transition-colors cursor-pointer"
              >
                <LayoutGrid className="w-5 h-5" /> Change Category
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    );
  };

  /* -------------------------------------------------------------
     ANSWER REVIEW SCREEN
  ------------------------------------------------------------- */
  const renderReview = () => (
    <div className="w-full max-w-4xl mx-auto space-y-5 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16 min-w-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-6 shadow-sm border border-slate-200/80 gap-3 w-full min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 truncate">Post-Match Tactical Review</h2>
            <p className="text-xs text-slate-500 font-medium truncate">Breakdown of every decision on the pitch</p>
          </div>
        </div>
        <button
          onClick={() => setGameState('results')}
          className="w-full sm:w-auto px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200 cursor-pointer text-center"
        >
          Back to Score
        </button>
      </div>
      
      <div className="space-y-6">
        {questions.map((q, idx) => {
          const userAnswer = userAnswers.find(a => a.questionId === q.id);
          const isCorrect = userAnswer?.isCorrect;
          
          return (
            <div key={q.id} className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-200/80">
              <div className="flex items-start gap-4 md:gap-5">
                <div className="mt-1 shrink-0">
                  {isCorrect ? (
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shadow-sm">
                      <XCircle className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Question {idx + 1}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {q.category}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 mb-5 leading-snug">
                    {q.question}
                  </h3>
                  
                  <div className="space-y-2.5 mb-5">
                    {q.options.map((opt) => {
                      let optClass = "p-4 rounded-2xl border-2 text-base font-bold flex items-center justify-between ";
                      let icon = null;
                      
                      if (opt === q.correctAnswer) {
                        optClass += "border-emerald-500 bg-emerald-50 text-emerald-950";
                        icon = <CheckCircle2 className="w-5 h-5 text-emerald-600"/>;
                      } else if (opt === userAnswer?.answer) {
                        optClass += "border-red-500 bg-red-50 text-red-950";
                        icon = <XCircle className="w-5 h-5 text-red-600"/>;
                      } else {
                        optClass += "border-slate-100 bg-slate-50 text-slate-500";
                      }
                      
                      return (
                        <div key={opt} className={optClass}>
                          <span>{opt}</span>
                          {icon}
                        </div>
                      );
                    })}
                    
                    {(!userAnswer?.answer || userAnswer.answer === '__TIMEOUT__') && (
                      <div className="p-3.5 rounded-2xl border-2 border-amber-200 bg-amber-50 text-amber-900 text-sm font-bold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" /> Out of time: You did not answer this question in time.
                      </div>
                    )}
                  </div>
                  
                  {q.explanation && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 text-sm leading-relaxed">
                      <span className="font-black text-slate-900 block mb-1 uppercase tracking-wider text-xs">
                        Tactical Analysis
                      </span> 
                      {q.explanation}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <button
        onClick={() => setGameState('landing')}
        className="w-full flex items-center justify-center gap-2 py-5 rounded-2xl bg-slate-900 text-white font-black text-lg hover:bg-slate-800 transition-all shadow-lg hover:-translate-y-0.5 cursor-pointer"
      >
        Complete Review & Return to Arena
      </button>
    </div>
  );

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto min-h-[calc(100vh-80px)]">
      {gameState === 'loading' && (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4 animate-in fade-in">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
            <Trophy className="w-6 h-6 text-yellow-500 absolute inset-0 m-auto" />
          </div>
          <p className="text-slate-700 font-black uppercase tracking-widest text-sm">
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
          currentScore={userAnswers.filter(a => a.isCorrect).length * 10}
          category={selectedCategory}
          difficulty={selectedDifficulty}
          userAnswersHistory={userAnswers}
          onAnswerSubmit={handleAnswerSubmit}
          onNextQuestion={nextQuestion}
        />
      )}
      
      {gameState === 'results' && renderResults()}
      {gameState === 'review' && renderReview()}
    </div>
  );
}
