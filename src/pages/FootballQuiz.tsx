import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { QuizCategory, QuizDifficulty, QuizQuestion, QuizResult, QuizUserStats } from '../types/quiz';
import { getQuizQuestions, saveQuizResult, getUserQuizStats, getLeaderboard } from '../services/quizService';
import { QuizQuestionCard } from '../components/quiz/QuizQuestionCard';
import { Link } from 'react-router-dom';
import { Trophy, Target, Clock, Activity, PlayCircle, BarChart3, RotateCcw, LayoutGrid, CheckCircle2, XCircle, Users, Globe, Shield, BookOpen, Star, Flag, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import stadiumBg from '../assets/images/stadium_atmosphere_1789303106987.jpg';





const CATEGORIES: QuizCategory[] = [
  'World Football', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 
  'UEFA Champions League', 'UEFA Europa League', 'FIFA World Cup', 
  'African Football', 'African Cup of Nations', 'Football Players', 
  'Football Clubs', 'Football History', 'Football Records', 'Football Rules', 'Famous Managers'
];

const DIFFICULTIES: QuizDifficulty[] = ['Easy', 'Medium', 'Hard', 'Expert'];
const DIFFICULTY_TIMES: Record<QuizDifficulty, number> = {
  'Easy': 30,
  'Medium': 25,
  'Hard': 20,
  'Expert': 15
};

const NUM_QUESTIONS_OPTIONS = [5, 10, 15, 20];

type GameState = 'landing' | 'loading' | 'playing' | 'results' | 'review';

const getCategoryIcon = (cat: string) => {
  if (cat.includes('World')) return Globe;
  if (cat.includes('League') || cat.includes('Liga') || cat.includes('Serie') || cat.includes('Clubs')) return Shield;
  if (cat.includes('Players') || cat.includes('Managers')) return Users;
  if (cat.includes('History') || cat.includes('Records') || cat.includes('Rules')) return BookOpen;
  if (cat.includes('African')) return Flag;
  return Star;
};

export function FootballQuiz() {
  const { user } = useAuth();
  
  const [gameState, setGameState] = useState<GameState>('landing');
          
  useEffect(() => {
    // Left empty or can be removed if not needed.
  }, [user]);

  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | 'All'>('All');
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

  // Transition state
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
      }, 1500); // Arena entry animation delay
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

  
  const renderLanding = () => (
    <div className="max-w-5xl mx-auto space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Premium Hero */}
      <div className="relative rounded-[32px] overflow-hidden bg-slate-900 text-white shadow-2xl">
        {/* Subtle arena background pattern */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-slate-900/80"></div>
        
        <div className="relative z-10 p-8 md:p-14 md:py-20 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 shadow-sm">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-white">Maestro Arena</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight leading-[1.1]">
            Football Quiz
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl font-medium leading-relaxed mb-10">
            Enter the Arena. Test your football knowledge. Become the Maestro.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={startQuiz}
              disabled={transitioning}
              className="group relative inline-flex items-center justify-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-50 transition-all shadow-[0_8px_30px_rgb(255,255,255,0.12)] hover:shadow-[0_8px_30px_rgb(255,255,255,0.25)] hover:-translate-y-1 overflow-hidden"
            >
              {transitioning ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  Entering the Arena...
                </span>
              ) : (
                <>
                  <PlayCircle className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" /> 
                  <span>Play Solo</span>
                </>
              )}
            </button>
            
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Game Setup */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <LayoutGrid className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Quiz Setup</h2>
            </div>
            
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Category</label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as QuizCategory | 'All')}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl px-5 py-4 pr-12 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="All">Mixed Arena (All Categories)</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-5 pointer-events-none text-slate-400">
                    <ChevronRight className="w-5 h-5 rotate-90" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Difficulty</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DIFFICULTIES.map(diff => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer",
                        selectedDifficulty === diff ? "border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm" : "border-slate-100 bg-white hover:border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <span className="font-bold text-base mb-1">{diff}</span>
                      <span className="text-xs font-medium flex items-center gap-1 opacity-80"><Clock className="w-3 h-3" /> {DIFFICULTY_TIMES[diff]}s</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Number of Questions</label>
                <div className="grid grid-cols-4 gap-3">
                  {NUM_QUESTIONS_OPTIONS.map(num => (
                    <button
                      key={num}
                      onClick={() => setNumQuestions(num)}
                      className={cn(
                        "flex items-center justify-center py-3 rounded-2xl border-2 font-bold transition-all",
                        numQuestions === num ? "border-blue-600 bg-blue-50 text-blue-900 shadow-sm" : "border-slate-100 bg-white hover:border-slate-200 text-slate-600"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
        </div>
        
        {/* Sidebar Config & Stats */}
        <div className="space-y-8">
          
          {userStats && (
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2"><Activity className="w-4 h-4"/> Your Arena Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Best Score</p>
                  <p className="text-2xl font-black text-slate-900">{userStats.bestScore}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Played</p>
                  <p className="text-2xl font-black text-slate-900">{userStats.totalQuizzes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Head to Head Card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-lg">Multiplayer</h3>
              </div>
              <p className="text-blue-100 text-sm font-medium mb-5 leading-relaxed">
                Challenge players worldwide in real-time Head-to-Head trivia battles.
              </p>
              <Link
                to="/quiz/h2h"
                className="flex items-center justify-center gap-2 w-full bg-white text-blue-900 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-sm"
              >
                Find Match <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-[32px] p-6 lg:p-8 shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col h-[500px] relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-100/40 to-orange-50/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200/50 shadow-sm">
                  <Trophy className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Hall of Fame</h3>
                  <p className="text-xs text-slate-500 font-medium">Top Performers</p>
                </div>
              </div>
              <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/50 backdrop-blur-sm">
                <button 
                  onClick={() => setLeaderboardTab('solo')}
                  className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300", leaderboardTab === 'solo' ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-700")}
                >
                  Solo
                </button>
                <button 
                  onClick={() => setLeaderboardTab('h2h')}
                  className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300", leaderboardTab === 'h2h' ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-700")}
                >
                  H2H
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 relative z-10">
              {leaderboard.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                  <Activity className="w-8 h-8 opacity-20" />
                  <p className="text-sm font-medium">The arena awaits its first champion.</p>
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
                        "group flex items-center gap-4 p-3.5 rounded-2xl border transition-all duration-300 hover:scale-[1.02]",
                        isGold ? "bg-gradient-to-r from-yellow-50 to-white border-yellow-200 shadow-sm shadow-yellow-100/50" :
                        isSilver ? "bg-gradient-to-r from-slate-50 to-white border-slate-200 shadow-sm shadow-slate-100/50" :
                        isBronze ? "bg-gradient-to-r from-orange-50 to-white border-orange-200 shadow-sm shadow-orange-100/50" :
                        "bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200 shadow-sm"
                      )}
                    >
                      <div className="relative shrink-0 flex items-center justify-center">
                        {isGold ? (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center shadow-md shadow-yellow-400/20 text-yellow-900 font-black text-sm border-2 border-white">1</div>
                        ) : isSilver ? (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 flex items-center justify-center shadow-md text-slate-800 font-black text-sm border-2 border-white">2</div>
                        ) : isBronze ? (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-200 to-amber-500 flex items-center justify-center shadow-md text-orange-950 font-black text-sm border-2 border-white">3</div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">{idx + 1}</div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-xs shadow-inner",
                          isGold ? "bg-yellow-100 text-yellow-700" :
                          isSilver ? "bg-slate-200 text-slate-700" :
                          isBronze ? "bg-orange-100 text-orange-700" :
                          "bg-blue-50 text-blue-600"
                        )}>
                          {(result.username || 'A')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("font-bold truncate text-sm", isGold ? "text-yellow-900" : "text-slate-900")}>
                            {result.username || 'Anonymous'}
                          </p>
                          <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                            {result.category} <span className="w-1 h-1 rounded-full bg-slate-300 inline-block"></span> {result.difficulty}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <div className="flex items-baseline gap-1 justify-end">
                          <span className={cn(
                            "font-black text-lg",
                            isGold ? "text-yellow-600" :
                            isSilver ? "text-slate-600" :
                            isBronze ? "text-orange-600" :
                            "text-slate-700"
                          )}>{result.score}</span>
                          <span className="text-xs font-bold text-slate-400">pts</span>
                        </div>
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
  );

  const renderResults = () => {
    if (!finalResult) return null;
    const percentage = Math.round((finalResult.correctAnswers / finalResult.totalQuestions) * 100);
    
    let performanceMsg = '';
    let perfColor = '';
    if (percentage === 100) {
      performanceMsg = 'Outstanding Performance';
      perfColor = 'text-purple-600 bg-purple-50 border-purple-200';
    } else if (percentage >= 80) {
      performanceMsg = 'Excellent Football Knowledge';
      perfColor = 'text-green-600 bg-green-50 border-green-200';
    } else if (percentage >= 60) {
      performanceMsg = 'Great Performance';
      perfColor = 'text-blue-600 bg-blue-50 border-blue-200';
    } else {
      performanceMsg = 'Keep Training, Maestro';
      perfColor = 'text-slate-600 bg-slate-50 border-slate-200';
    }

    return (
      <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500 pb-12">
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-900 p-12 text-center relative overflow-hidden">
             <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
             <div className="relative z-10">
               <div className="inline-flex items-center justify-center p-4 bg-white/10 rounded-full backdrop-blur-sm mb-6 border border-white/20">
                 <Trophy className="w-12 h-12 text-yellow-400" />
               </div>
               <h2 className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">Quiz Complete</h2>
               <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">Your Arena Performance</h1>
               <div className={cn("inline-block px-4 py-1.5 rounded-full text-sm font-bold tracking-widest uppercase border", perfColor)}>
                 {performanceMsg}
               </div>
             </div>
          </div>
          
          <div className="p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-[24px] text-center">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Final Score</p>
                <p className="text-4xl font-black text-slate-900">{finalResult.score}</p>
                
              </div>
              <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-[24px] text-center">
                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-2">Accuracy</p>
                <p className="text-4xl font-black text-blue-600">{percentage}%</p>
              </div>
              <div className="bg-green-50/50 border border-green-100 p-6 rounded-[24px] text-center">
                <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-2">Correct</p>
                <p className="text-4xl font-black text-green-600">{finalResult.correctAnswers}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-[24px] text-center">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Total</p>
                <p className="text-4xl font-black text-slate-900">{finalResult.totalQuestions}</p>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-3 gap-4">
              <button
                onClick={() => { setGameState('landing'); startQuiz(); }}
                className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-colors shadow-md hover:-translate-y-0.5"
              >
                <RotateCcw className="w-5 h-5" /> Play Again
              </button>
              <button
                onClick={() => setGameState('review')}
                className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-slate-900 text-white font-bold text-lg hover:bg-slate-800 transition-colors shadow-md hover:-translate-y-0.5"
              >
                <CheckCircle2 className="w-5 h-5" /> Review Answers
              </button>
              <button
                onClick={() => setGameState('landing')}
                className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-slate-50 text-slate-700 border border-slate-200 font-bold text-lg hover:bg-slate-100 transition-colors"
              >
                <LayoutGrid className="w-5 h-5" /> Back to Setup
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReview = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center justify-between bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-500"/>
          Answer Review
        </h2>
        <button
          onClick={() => setGameState('results')}
          className="px-5 py-2.5 text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
        >
          Back to Results
        </button>
      </div>
      
      <div className="space-y-6">
        {questions.map((q, idx) => {
          const userAnswer = userAnswers.find(a => a.questionId === q.id);
          const isCorrect = userAnswer?.isCorrect;
          
          return (
            <div key={q.id} className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100">
              <div className="flex items-start gap-4 md:gap-6">
                <div className="mt-1 shrink-0">
                  {isCorrect ? (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Question {idx + 1}</p>
                  <h3 className="text-xl font-bold text-slate-900 mb-6 leading-snug">{q.question}</h3>
                  
                  <div className="space-y-3 mb-6">
                    {q.options.map(opt => {
                      let optClass = "p-4 rounded-xl border-2 text-base font-semibold flex items-center justify-between ";
                      let icon = null;
                      
                      if (opt === q.correctAnswer) {
                        optClass += "border-green-500 bg-green-50 text-green-900";
                        icon = <CheckCircle2 className="w-5 h-5 text-green-600"/>;
                      } else if (opt === userAnswer?.answer) {
                        optClass += "border-red-500 bg-red-50 text-red-900";
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
                       <div className="p-4 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-900 text-base font-semibold mt-3 flex items-center gap-2">
                         <Clock className="w-5 h-5 text-amber-600" /> You did not answer this question in time.
                       </div>
                    )}
                  </div>
                  
                  {q.explanation && (
                    <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 text-slate-700 text-sm leading-relaxed">
                      <span className="font-bold text-blue-900 block mb-1 uppercase tracking-wider text-xs">Explanation</span> 
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
        className="w-full flex items-center justify-center gap-2 py-5 rounded-2xl bg-slate-900 text-white font-bold text-lg hover:bg-slate-800 transition-colors shadow-lg hover:-translate-y-0.5"
      >
        Finish Review
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 min-h-[calc(100vh-80px)] bg-slate-50/50">
      {gameState === 'loading' && (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-6 animate-in fade-in">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest animate-pulse text-sm">Compiling Results...</p>
        </div>
      )}
      
      
      {gameState === 'landing' && renderLanding()}

      
      {gameState === 'playing' && questions.length > 0 && (
        <QuizQuestionCard 
          question={questions[currentIndex]}
          currentNumber={currentIndex + 1}
          totalQuestions={questions.length}
          timeRemaining={timeRemaining}
          currentScore={userAnswers.filter(a => a.isCorrect).length * 10}
          category={selectedCategory}
          onAnswerSubmit={handleAnswerSubmit}
          onNextQuestion={nextQuestion}
        />
      )}
      
      {gameState === 'results' && renderResults()}
      {gameState === 'review' && renderReview()}
    </div>
  );
}
