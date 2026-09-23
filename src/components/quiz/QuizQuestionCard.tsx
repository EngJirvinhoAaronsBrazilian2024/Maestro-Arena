import React, { useState, useEffect } from 'react';
import { QuizQuestion, QuizCategory } from '../../types/quiz';
import { cn } from '../../lib/utils';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Clock, 
  ChevronRight, 
  Trophy, 
  Flame, 
  Sparkles,
  Shield,
  Globe,
  Users,
  BookOpen,
  Flag,
  Award
} from 'lucide-react';

interface QuizQuestionCardProps {
  question: QuizQuestion;
  currentNumber: number;
  totalQuestions: number;
  timeRemaining: number | null;
  maxTime?: number;
  currentScore?: number;
  category?: QuizCategory | 'All' | string;
  difficulty?: string;
  userAnswersHistory?: { questionId: string; answer: string; isCorrect: boolean }[];
  onAnswerSubmit: (selectedOption: string) => void;
  onNextQuestion: () => void;
}

const getCategoryIcon = (cat: string) => {
  if (cat.includes('World') || cat.includes('FIFA')) return Globe;
  if (cat.includes('League') || cat.includes('Liga') || cat.includes('Serie') || cat.includes('Clubs') || cat.includes('Bundesliga')) return Shield;
  if (cat.includes('Players') || cat.includes('Managers')) return Users;
  if (cat.includes('History') || cat.includes('Records') || cat.includes('Rules')) return BookOpen;
  if (cat.includes('African')) return Flag;
  return Trophy;
};

export function QuizQuestionCard({
  question,
  currentNumber,
  totalQuestions,
  timeRemaining,
  maxTime = 25,
  currentScore = 0,
  category = 'Mixed',
  difficulty = 'Medium',
  userAnswersHistory = [],
  onAnswerSubmit,
  onNextQuestion
}: QuizQuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [animatingOut, setAnimatingOut] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setSelectedAnswer(null);
    setShowHint(false);
    setAnimatingOut(false);
    setImageError(false);
    // Shuffle options cleanly once per question
    setShuffledOptions([...question.options].sort(() => 0.5 - Math.random()));
  }, [question]);

  useEffect(() => {
    if (timeRemaining === 0 && !selectedAnswer) {
      handleOptionClick('__TIMEOUT__'); 
    }
  }, [timeRemaining, selectedAnswer]);

  const handleOptionClick = (option: string) => {
    if (selectedAnswer) return; 
    setSelectedAnswer(option);
    onAnswerSubmit(option);
  };

  const handleNext = () => {
    setAnimatingOut(true);
    setTimeout(() => {
      onNextQuestion();
    }, 280);
  };

  const isAnswerCorrect = selectedAnswer === question.correctAnswer;
  const progressPercent = (currentNumber / totalQuestions) * 100;
  const isTimeLow = timeRemaining !== null && timeRemaining <= 5;
  const CategoryIcon = getCategoryIcon(category);

  // SVG Circular countdown geometry
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const timeProgress = timeRemaining !== null ? Math.max(0, Math.min(1, timeRemaining / (maxTime || 25))) : 1;
  const strokeOffset = circumference * (1 - timeProgress);

  const OPTION_LABELS = ['A', 'B', 'C', 'D'];

  return (
    <div className={cn(
      "w-full transition-all duration-300",
      animatingOut ? "opacity-0 -translate-x-6 scale-[0.98]" : "animate-in fade-in slide-in-from-right-6 duration-400"
    )}>
      
      {/* RESPONSIVE FOOTBALL ARENA QUESTION CARD (Mobile & Desktop) */}
      <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* 1. QUIZ HEADER: 100% Light Mode Football Header */}
      <div className="relative overflow-hidden rounded-[28px] bg-white/80 backdrop-blur-xl border border-white/90 text-slate-900 shadow-[0_8px_32px_rgba(15,23,42,0.04)]">
        {/* Pitch line graphics & subtle brand glow */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 p-5 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            {/* Title & Brand */}
            <div className="flex items-center gap-3.5">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 text-white shadow-md shadow-rose-600/25 border border-rose-400/30">
                <Trophy className="h-6 w-6 text-amber-300" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-950 flex items-center gap-1.5">
                    Maestro Quiz
                  </h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-cyan-50 text-cyan-800 border border-cyan-200">
                    Live
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold flex items-center gap-2 mt-0.5">
                  <span>Test your football knowledge</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-rose-600 font-bold">{difficulty}</span>
                </p>
              </div>
            </div>

            {/* Score & Circular Countdown Timer */}
            <div className="flex items-center gap-4 self-end sm:self-center">
              {/* Current Score Tag - Gold Accent */}
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-amber-50/80 border border-amber-200/80 shadow-2xs backdrop-blur-md">
                <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-600">
                  <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-800">Score</div>
                  <div className="text-lg font-black leading-none text-slate-950">{currentScore} <span className="text-xs font-bold text-amber-700">pts</span></div>
                </div>
              </div>

              {/* Circular Timer Component */}
              {timeRemaining !== null && (
                <div className="relative flex items-center justify-center">
                  <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 54 54">
                    {/* Background track */}
                    <circle
                      cx="27"
                      cy="27"
                      r={radius}
                      className="stroke-slate-100"
                      strokeWidth="4"
                      fill="transparent"
                    />
                    {/* Countdown track */}
                    <circle
                      cx="27"
                      cy="27"
                      r={radius}
                      stroke={isTimeLow ? '#E11D48' : '#0891B2'}
                      strokeWidth="4"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeOffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <div className={cn(
                    "absolute flex flex-col items-center justify-center transition-transform",
                    isTimeLow ? "scale-110 text-rose-600 animate-pulse" : "text-slate-900"
                  )}>
                    <span className="text-sm font-black leading-none">{timeRemaining}</span>
                    <span className="text-[8px] font-black uppercase text-slate-400 leading-none mt-0.5">sec</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stepper Dots & Current Question Progress */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold">
                <CategoryIcon className="w-3.5 h-3.5 text-rose-600" />
                {category === 'All' ? 'Mixed Arena' : category}
              </span>
              <span className="text-slate-500 font-medium">
                Question <strong className="text-slate-950 font-black">{currentNumber}</strong> of {totalQuestions}
              </span>
            </div>

            {/* Micro Question Step Indicators */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
              {Array.from({ length: totalQuestions }).map((_, idx) => {
                const pastAnswer = userAnswersHistory[idx];
                const isCurrent = idx === currentNumber - 1;
                
                let dotClass = "w-6 h-2 rounded-full transition-all ";
                if (pastAnswer) {
                  dotClass += pastAnswer.isCorrect ? "bg-cyan-500 shadow-xs shadow-cyan-500/40" : "bg-rose-500 shadow-xs shadow-rose-500/40";
                } else if (isCurrent) {
                  dotClass += "bg-rose-600 ring-2 ring-rose-400/50 scale-110 shadow-xs shadow-rose-600/50 animate-pulse";
                } else {
                  dotClass += "bg-slate-200";
                }

                return (
                  <div 
                    key={idx} 
                    title={`Question ${idx + 1}`}
                    className={dotClass}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Global Progress Bar on bottom edge */}
        <div className="h-1.5 w-full bg-slate-100 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-rose-600 via-rose-500 to-cyan-500 transition-all duration-500 ease-out" 
            style={{ width: `${progressPercent}%` }} 
          />
        </div>
      </div>

      {/* 2. QUESTION CARD: Deep Navy Typography & Clean Light Card */}
      <div className="bg-white/85 backdrop-blur-xl rounded-3xl sm:rounded-[32px] p-4 sm:p-6 md:p-10 shadow-[0_8px_32px_rgba(15,23,42,0.04)] border border-white/90 relative overflow-hidden">
        {/* Subtle decorative football geometry watermark */}
        <div className="absolute -right-10 -bottom-10 opacity-[0.03] text-slate-950 pointer-events-none">
          <svg width="240" height="240" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <polygon points="12,7 16,10 14.5,15 9.5,15 8,10" fill="currentColor" opacity="0.4" />
          </svg>
        </div>

        {/* Meta tags atop question */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 mb-4 sm:mb-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
              Question {currentNumber}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              10 Pts
            </span>
          </div>

          {question.hint && !selectedAnswer && (
            <button 
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-rose-600 font-bold transition-colors bg-white hover:bg-rose-50 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-slate-200 shadow-2xs cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-rose-500" />
              {showHint ? "Hide Tactical Hint" : "Need a Hint?"}
            </button>
          )}
        </div>

        {/* Optional Question Football Image with fallback */}
        {question.image && !imageError && (
          <div className="w-full max-h-56 sm:max-h-72 md:max-h-80 rounded-2xl overflow-hidden mb-4 sm:mb-6 bg-slate-100 relative shadow-inner border border-slate-200/80 group">
            <img 
              src={question.image} 
              alt="Question Visual" 
              onError={() => setImageError(true)}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute bottom-2.5 left-3 text-xs font-bold text-white/90 drop-shadow-md flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-300" /> Visual Clue
            </div>
          </div>
        )}

        {/* Question Text - Deep Navy / Indigo */}
        <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-950 leading-[1.3] tracking-tight relative z-10 mb-2">
          {question.question}
        </h2>

        {/* Tactical Hint Dropdown */}
        {showHint && question.hint && (
          <div className="mt-4 sm:mt-5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-950 text-xs sm:text-sm font-medium flex items-start gap-2.5 sm:gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <span className="font-extrabold uppercase tracking-wider text-[10px] sm:text-xs block mb-0.5 text-amber-800">Tactical Coach Hint</span>
              <p className="text-amber-900 leading-relaxed">{question.hint}</p>
            </div>
          </div>
        )}
      </div>

      {/* 3. ANSWER OPTIONS: Interactive Football Gaming Cards with Electric Aqua for correct */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 md:gap-4">
        {shuffledOptions.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrectOption = option === question.correctAnswer;
          
          let btnClass = "w-full text-left p-3.5 sm:p-4 md:p-5 rounded-2xl border-2 transition-all duration-200 text-sm sm:text-base md:text-lg font-bold flex items-center gap-3 sm:gap-4 relative overflow-hidden outline-none cursor-pointer min-h-[52px] ";
          let labelBadgeClass = "flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl text-xs sm:text-sm shrink-0 font-black transition-all ";

          if (!selectedAnswer) {
            // Idle state before answer
            btnClass += "bg-white/90 border-slate-200/90 hover:border-cyan-400 hover:bg-cyan-50/30 text-slate-800 shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0";
            labelBadgeClass += "bg-slate-100 text-slate-700 border border-slate-200";
          } else {
            // Evaluated states after answer: Aqua for correct, Coral/Rose for warning incorrect
            if (isCorrectOption) {
              btnClass += "border-cyan-500 bg-cyan-50/90 text-cyan-950 shadow-md shadow-cyan-500/15 scale-[1.01] ring-2 ring-cyan-400/40";
              labelBadgeClass += "bg-cyan-600 text-white shadow-2xs";
            } else if (isSelected && !isCorrectOption) {
              btnClass += "border-rose-400 bg-rose-50/90 text-rose-950 shadow-md shadow-rose-500/15 shake";
              labelBadgeClass += "bg-rose-600 text-white shadow-2xs";
            } else {
              btnClass += "border-slate-100 bg-slate-50/50 opacity-45 text-slate-400 cursor-not-allowed";
              labelBadgeClass += "bg-slate-100 text-slate-400";
            }
          }

          return (
            <button
              key={index}
              disabled={selectedAnswer !== null}
              onClick={() => handleOptionClick(option)}
              className={btnClass}
              type="button"
            >
              {/* Option Key Letter (A, B, C, D) */}
              <div className={labelBadgeClass}>
                {OPTION_LABELS[index] || String.fromCharCode(65 + index)}
              </div>

              {/* Option Text */}
              <span className="flex-1 leading-snug break-words pr-7 sm:pr-8">
                {option}
              </span>
              
              {/* Status Icons */}
              {selectedAnswer && isCorrectOption && (
                <div className="absolute right-3 sm:right-4 w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 animate-in zoom-in-75 duration-200">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              )}
              {selectedAnswer && isSelected && !isCorrectOption && (
                <div className="absolute right-3 sm:right-4 w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 animate-in zoom-in-75 duration-200">
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. EXPLANATION & ACTION CARD */}
      {selectedAnswer && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-400 bg-white/90 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-3xl sm:rounded-[28px] border border-white/90 shadow-[0_8px_32px_rgba(15,23,42,0.06)] flex flex-col md:flex-row gap-4 sm:gap-6 items-stretch md:items-center justify-between">
          <div className="flex-1 flex items-start gap-3 sm:gap-4">
            <div className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs",
              isAnswerCorrect ? "bg-cyan-100 text-cyan-700" : "bg-rose-100 text-rose-600"
            )}>
              {isAnswerCorrect ? <CheckCircle2 className="w-5 h-5 sm:w-7 sm:h-7" /> : <XCircle className="w-5 h-5 sm:w-7 sm:h-7" />}
            </div>
            
            <div className="space-y-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={cn("font-black text-base sm:text-xl md:text-2xl", isAnswerCorrect ? "text-cyan-800" : "text-rose-700")}>
                  {isAnswerCorrect ? 'Goal! Correct Answer' : (selectedAnswer === '__TIMEOUT__' ? 'Full Time! Out of Time' : 'Missed Chance! Incorrect')}
                </h3>
                {isAnswerCorrect && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-cyan-100 text-cyan-900 shrink-0">
                    +10 Pts
                  </span>
                )}
              </div>
              {question.explanation ? (
                <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed max-w-2xl">
                  {question.explanation}
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-slate-500">
                  {isAnswerCorrect ? 'Great football knowledge!' : `The correct answer is: ${question.correctAnswer}`}
                </p>
              )}
            </div>
          </div>
          
          <button
            onClick={handleNext}
            className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2.5 bg-gradient-to-r from-rose-600 via-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-black text-sm sm:text-base shadow-md shadow-rose-600/30 active:scale-[0.98] transition-all cursor-pointer group"
          >
            <span>{currentNumber === totalQuestions ? 'Final Whistle (Results)' : 'Next Question'}</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
