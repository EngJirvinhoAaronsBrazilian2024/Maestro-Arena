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
}

const CATEGORY_ITEMS: CategoryMeta[] = [
  { id: 'All', title: 'Mixed Arena', subtitle: 'Random questions across all football themes', tag: 'All Themes', group: 'all', icon: Sparkles, accent: 'from-red-600 to-rose-700' },
  { id: 'Premier League', title: 'Premier League', subtitle: 'English giants, drama, history & goals', tag: 'England', group: 'leagues', icon: Shield, accent: 'from-purple-700 to-indigo-800' },
  { id: 'UEFA Champions League', title: 'Champions League', subtitle: 'Europe\'s supreme club crown & nights', tag: 'Europe', group: 'tournaments', icon: Trophy, accent: 'from-blue-700 to-indigo-950' },
  { id: 'FIFA World Cup', title: 'FIFA World Cup', subtitle: 'Global legends, iconic finals & heroes', tag: 'World', group: 'tournaments', icon: Globe, accent: 'from-amber-600 to-yellow-700' },
  { id: 'La Liga', title: 'La Liga', subtitle: 'Spanish royalty, El Clásico & magicians', tag: 'Spain', group: 'leagues', icon: Shield, accent: 'from-red-600 to-orange-600' },
  { id: 'Serie A', title: 'Serie A', subtitle: 'Tactical masters, scudetto & legends', tag: 'Italy', group: 'leagues', icon: Shield, accent: 'from-sky-600 to-blue-700' },
  { id: 'Bundesliga', title: 'Bundesliga', subtitle: 'High-octane attack, records & derbies', tag: 'Germany', group: 'leagues', icon: Shield, accent: 'from-red-700 to-zinc-800' },
  { id: 'Football Players', title: 'Football Players', subtitle: 'Ballon d\'Or icons, stats & prodigies', tag: 'Legends', group: 'players', icon: Users, accent: 'from-emerald-600 to-teal-700' },
  { id: 'Football Clubs', title: 'Football Clubs', subtitle: 'Historic stadiums, badges & anthems', tag: 'Clubs', group: 'leagues', icon: Shield, accent: 'from-slate-700 to-slate-900' },
  { id: 'African Football', title: 'African Football', subtitle: 'Continental powerhouses & superstars', tag: 'Africa', group: 'leagues', icon: Flag, accent: 'from-emerald-700 to-amber-700' },
  { id: 'African Cup of Nations', title: 'AFCON', subtitle: 'Total African glory, goals & champions', tag: 'Tournament', group: 'tournaments', icon: Trophy, accent: 'from-amber-700 to-red-700' },
  { id: 'UEFA Europa League', title: 'Europa League', subtitle: 'Thrilling European knockout showdowns', tag: 'Europe', group: 'tournaments', icon: Award, accent: 'from-orange-600 to-amber-700' },
  { id: 'Football History', title: 'Football History', subtitle: 'Foundations, vintage moments & classic eras', tag: 'History', group: 'history', icon: BookOpen, accent: 'from-amber-800 to-stone-900' },
  { id: 'Football Records', title: 'Football Records', subtitle: 'Unbelievable milestones, hat-tricks & totals', tag: 'Records', group: 'history', icon: Flame, accent: 'from-rose-600 to-red-800' },
  { id: 'Football Rules', title: 'Rules & VAR', subtitle: 'Laws of the pitch, refereeing & penalties', tag: 'Tactics', group: 'history', icon: Target, accent: 'from-slate-800 to-zinc-900' },
  { id: 'Famous Managers', title: 'Famous Managers', subtitle: 'Tactical masterminds, dynasties & silver', tag: 'Tactics', group: 'players', icon: Users, accent: 'from-indigo-700 to-slate-900' },
  { id: 'World Football', title: 'World Football', subtitle: 'International clashes, nations & continental cups', tag: 'Global', group: 'all', icon: Globe, accent: 'from-cyan-700 to-blue-800' },
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
  const { user } = useAuth();
  
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
      const stats = await getUserQuizStats(user?.id);
      setUserStats(stats);
      const leaders = await getLeaderboard(5);
      setLeaderboard(leaders);
    };
    loadData();
  }, [user]);

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
    const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);
    
    const result: QuizResult = {
      userId: user?.id,
      username: user?.displayName || 'Anonymous Player',
      score: correctAnswers * 10,
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
    
    const stats = await getUserQuizStats(user?.id);
    setUserStats(stats);
    const leaders = await getLeaderboard(5);
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
                <Link
                  to="/quiz/h2h"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl font-bold text-xs sm:text-sm transition-all hover:-translate-y-0.5 shadow-md shadow-rose-600/25 flex-1 sm:flex-initial whitespace-nowrap cursor-pointer"
                >
                  <Swords className="w-4 h-4 shrink-0" />
                  <span>Head-to-Head Multiplayer</span>
                </Link>

                <Link
                  to="/quiz/daily"
                  className="inline-flex items-center justify-center gap-2 bg-white/90 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 px-4 sm:px-5 py-2.5 sm:py-3.5 rounded-2xl font-bold text-xs sm:text-sm transition-colors shadow-2xs flex-1 sm:flex-initial whitespace-nowrap cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Daily Trivia</span>
                </Link>

                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100/80 text-slate-600 text-xs font-semibold">
                  <span>Match options below ↓</span>
                </div>
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

                  {/* Difficulty Pills */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2.5">
                      Difficulty
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {DIFFICULTIES.map(diff => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setSelectedDifficulty(diff)}
                          className={cn(
                            "flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all cursor-pointer",
                            selectedDifficulty === diff 
                              ? "border-red-600 bg-red-50/70 text-red-950 shadow-sm ring-1 ring-red-500/30" 
                              : "border-slate-200/80 bg-white hover:border-slate-300 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <span className="font-extrabold text-sm mb-0.5">{diff}</span>
                          <span className="text-xs font-medium flex items-center gap-1 opacity-75">
                            <Clock className="w-3 h-3 text-red-500" /> {DIFFICULTY_TIMES[diff]}s
                          </span>
                        </button>
                      ))}
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

                {/* Category Selector Grid */}
                <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-200/80 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                        <LayoutGrid className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Choose Football Category</h2>
                        <p className="text-xs text-slate-500 font-medium">Select an arena topic or play mixed</p>
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

                  {/* Interactive Category Cards */}
                  <div className="grid sm:grid-cols-2 gap-3.5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                    {filteredCategories.map((cat) => {
                      const isSelected = selectedCategory === cat.id;
                      const Icon = cat.icon;

                      return (
                        <div
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={cn(
                            "group p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-left flex items-start gap-3.5 relative overflow-hidden",
                            isSelected 
                              ? "border-red-600 bg-red-50/50 shadow-md shadow-red-500/10 ring-2 ring-red-400/30" 
                              : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/80"
                          )}
                        >
                          <div className={cn(
                            "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                            isSelected ? "bg-red-600 text-white shadow-sm" : "bg-slate-100 text-slate-700"
                          )}>
                            <Icon className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                {cat.tag}
                              </span>
                              {isSelected && (
                                <span className="flex items-center gap-1 text-[11px] font-black text-red-600">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                                </span>
                              )}
                            </div>
                            <h3 className={cn(
                              "font-black text-base truncate",
                              isSelected ? "text-red-950" : "text-slate-900"
                            )}>
                              {cat.title}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                              {cat.subtitle}
                            </p>
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

              {/* Hall of Fame Leaderboard - Complete on mobile */}
              <div className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[32px] p-4 sm:p-6 shadow-xl shadow-slate-200/40 border border-slate-200/80 flex flex-col h-[420px] sm:h-[460px] relative overflow-hidden w-full min-w-0">
                <div className="flex items-center justify-between mb-3 sm:mb-6 relative z-10 gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-100 flex items-center justify-center border border-amber-200 text-amber-700 shadow-sm shrink-0">
                      <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">Hall of Fame</h3>
                      <p className="text-xs text-slate-500 font-medium truncate">Top Football Masters</p>
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
                      H2H
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2.5 relative z-10">
                  {leaderboard.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 py-8">
                      <Trophy className="w-8 h-8 opacity-25" />
                      <p className="text-xs font-medium">Be the first to enter the Hall of Fame!</p>
                    </div>
                  ) : (
                    leaderboard.map((result, idx) => {
                      const isGold = idx === 0;
                      const isSilver = idx === 1;
                      const isBronze = idx === 2;
                      
                      return (
                        <div 
                          key={idx} 
                          className={cn(
                            "flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl border transition-all",
                            isGold ? "bg-amber-50/70 border-amber-200" :
                            isSilver ? "bg-slate-50 border-slate-200" :
                            isBronze ? "bg-orange-50/60 border-orange-200" :
                            "bg-white border-slate-100"
                          )}
                        >
                          <div className={cn(
                            "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 font-black text-xs",
                            isGold ? "bg-amber-400 text-amber-950 shadow-sm" :
                            isSilver ? "bg-slate-300 text-slate-800" :
                            isBronze ? "bg-orange-300 text-orange-950" :
                            "bg-slate-100 text-slate-600"
                          )}>
                            {idx + 1}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                              {result.username || 'Anonymous'}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                              {result.category} • {result.difficulty}
                            </p>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className="font-black text-sm sm:text-base text-red-600">{result.score}</span>
                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 ml-1">pts</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    );
  };

  /* -------------------------------------------------------------
     RESULTS SCREEN: CELEBRATION & MATCH STATS
  ------------------------------------------------------------- */
  const renderResults = () => {
    if (!finalResult) return null;
    const percentage = Math.round((finalResult.correctAnswers / finalResult.totalQuestions) * 100);
    const isHighScore = percentage >= 60;
    
    let performanceMsg = '';
    let perfBadgeClass = '';
    let heroVisual = trophyLiftImg;

    if (percentage === 100) {
      performanceMsg = 'Outstanding Performance';
      perfBadgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
    } else if (percentage >= 80) {
      performanceMsg = 'Great Football Knowledge';
      perfBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (percentage >= 60) {
      performanceMsg = 'Solid Performance';
      perfBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
      heroVisual = trophyImg;
    } else {
      performanceMsg = 'Keep Training, Maestro';
      perfBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
      heroVisual = stadiumBg;
    }

    return (
      <div className="w-full min-w-0">
        {/* Celebration Confetti */}
        {isHighScore && <QuizConfetti active={true} />}

        {/* RESPONSIVE ARENA RESULTS */}
        <div className="w-full max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500 pb-16 min-w-0">
          <div className="bg-white/85 backdrop-blur-xl rounded-2xl sm:rounded-[40px] shadow-[0_8px_32px_rgba(15,23,42,0.06)] border border-white/90 overflow-hidden w-full min-w-0">
          
          {/* Header Banner with Stadium / Trophy Visual in Light Mode */}
          <div className="relative bg-gradient-to-b from-amber-50/60 via-rose-50/30 to-white p-6 sm:p-12 text-center overflow-hidden border-b border-slate-100">
            <div className="absolute inset-0 z-0">
              <img 
                src={heroVisual} 
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
                Full-Time Whistle
              </h2>
              <h1 className="text-2xl sm:text-5xl font-black text-slate-950 tracking-tight mb-3 sm:mb-4">
                Arena Match Results
              </h1>

              <div className={cn("inline-block px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider border shadow-2xs", perfBadgeClass)}>
                {performanceMsg}
              </div>
            </div>
          </div>
          
          {/* Stats Breakdown */}
          <div className="p-4 sm:p-10 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-10">
              {/* Final Score */}
              <div className="bg-amber-50/60 border border-amber-200/80 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl text-center shadow-2xs">
                <p className="text-[10px] sm:text-[11px] text-amber-800 font-extrabold uppercase tracking-wider mb-1">Score Points</p>
                <p className="text-2xl sm:text-4xl font-black text-slate-950">{finalResult.score}</p>
                <span className="text-[10px] sm:text-[11px] font-bold text-amber-600">+10 per goal</span>
              </div>

              {/* Accuracy */}
              <div className="bg-rose-50/50 border border-rose-200/80 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl text-center shadow-2xs">
                <p className="text-[10px] sm:text-[11px] text-rose-700 font-extrabold uppercase tracking-wider mb-1">Accuracy</p>
                <p className="text-2xl sm:text-4xl font-black text-rose-600">{percentage}%</p>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500">Strike rate</span>
              </div>

              {/* Correct */}
              <div className="bg-cyan-50/60 border border-cyan-200/80 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl text-center shadow-2xs">
                <p className="text-[10px] sm:text-[11px] text-cyan-800 font-extrabold uppercase tracking-wider mb-1">Correct</p>
                <p className="text-2xl sm:text-4xl font-black text-cyan-700">{finalResult.correctAnswers}</p>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500">Goals scored</span>
              </div>

              {/* Total Qs */}
              <div className="bg-slate-50 border border-slate-200/80 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl text-center shadow-2xs">
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-extrabold uppercase tracking-wider mb-1">Questions</p>
                <p className="text-2xl sm:text-4xl font-black text-slate-950">{finalResult.totalQuestions}</p>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500">Total chances</span>
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
