import React, { useState, useEffect } from 'react';
import { QuizQuestion, QuizCategory } from '../../types/quiz';
import { cn } from '../../lib/utils';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  Trophy,
  Flame,
  Sparkles,
  Award,
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
  onNextQuestion,
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
  const isAmberTime =
    timeRemaining !== null && timeRemaining > 5 && timeRemaining <= 10;

  // SVG Circular countdown geometry
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const timeProgress =
    timeRemaining !== null
      ? Math.max(0, Math.min(1, timeRemaining / (maxTime || 25)))
      : 1;
  const strokeOffset = circumference * (1 - timeProgress);

  const timerStrokeColor = isTimeLow
    ? '#E11D48'
    : isAmberTime
      ? '#F59E0B'
      : '#059669';

  const OPTION_LABELS = ['A', 'B', 'C', 'D'];

  return (
    <div
      className={cn(
        'w-full transition-all duration-300',
        animatingOut
          ? 'opacity-0 -translate-x-6 scale-[0.98]'
          : 'animate-in fade-in slide-in-from-right-6 duration-300'
      )}
    >
      <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-5 pb-12">
        {/* 1. MATCHDAY TELEMETRY HEADER & PITCH PROGRESS */}
        <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 text-slate-900 shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 text-white shadow-md shadow-rose-600/20">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-amber-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-slate-950 truncate">
                    Maestro Match Pitch
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                    {difficulty}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold truncate mt-0.5">
                  {category === 'All' ? 'Mixed Arena' : category}
                </p>
              </div>
            </div>

            {/* Score & Circular Timer */}
            <div className="flex items-center gap-3.5 self-end sm:self-center tabular-nums">
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-rose-50/70 border border-rose-200/80">
                <div className="w-8 h-8 rounded-xl bg-white border border-rose-200 flex items-center justify-center text-rose-600">
                  <Flame className="w-4 h-4 fill-rose-600 text-rose-600" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-black uppercase tracking-wider text-rose-700">
                    Score
                  </div>
                  <div className="text-base sm:text-lg font-black leading-none text-slate-950">
                    {currentScore}{' '}
                    <span className="text-xs font-bold text-rose-600">pts</span>
                  </div>
                </div>
              </div>

              {timeRemaining !== null && (
                <div className="relative flex items-center justify-center">
                  <svg
                    className="w-14 h-14 transform -rotate-90"
                    viewBox="0 0 54 54"
                  >
                    <circle
                      cx="27"
                      cy="27"
                      r={radius}
                      className="stroke-slate-100"
                      strokeWidth="4"
                      fill="transparent"
                    />
                    <circle
                      cx="27"
                      cy="27"
                      r={radius}
                      stroke={timerStrokeColor}
                      strokeWidth="4"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeOffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <div
                    className={cn(
                      'absolute flex flex-col items-center justify-center transition-all',
                      isTimeLow
                        ? 'scale-110 text-rose-600 animate-pulse'
                        : isAmberTime
                          ? 'text-amber-600'
                          : 'text-emerald-700'
                    )}
                  >
                    <span className="text-sm font-black leading-none">
                      {timeRemaining}
                    </span>
                    <span className="text-[8px] font-black uppercase leading-none mt-0.5">
                      sec
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stadium Pitch Progress Strip */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-bold mb-2 tabular-nums">
              <div className="flex items-center gap-2">
                <span className="text-slate-900 font-black">
                  Question{' '}
                  <span className="text-rose-600">{currentNumber}</span> of{' '}
                  {totalQuestions}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <span className="uppercase tracking-wider text-[10px] font-bold text-slate-400">
                  Match Min:
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-900 font-black">
                  {Math.min(
                    90,
                    Math.round((currentNumber / totalQuestions) * 90)
                  )}
                  &apos;
                </span>
              </div>
            </div>

            <div className="relative h-10 sm:h-11 w-full rounded-xl overflow-hidden bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 border border-emerald-700/70 shadow-inner flex items-center select-none">
              {/* Pitch Grass Stripes */}
              <div className="absolute inset-0 opacity-20 flex pointer-events-none">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex-1 h-full',
                      i % 2 === 0 ? 'bg-black/35' : 'bg-white/15'
                    )}
                  />
                ))}
              </div>

              {/* Pitch Markings */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-10 sm:w-14 h-7 border-r border-y border-white/30 pointer-events-none" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-white/35 pointer-events-none" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border border-white/30 pointer-events-none" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-10 sm:w-14 h-7 border-l border-y border-white/30 pointer-events-none" />

              {/* Progress fill */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-emerald-500/35 to-emerald-400/50 transition-all duration-500 ease-out border-r-2 border-white/80"
                style={{ width: `${progressPercent}%` }}
              />

              {/* Checkpoints */}
              <div className="relative z-10 w-full flex items-center justify-between px-3 sm:px-5 pointer-events-none">
                {Array.from({ length: totalQuestions }).map((_, idx) => {
                  const isCurrent = idx === currentNumber - 1;
                  const pastAnswer = userAnswersHistory[idx];

                  return (
                    <div key={idx} className="flex flex-col items-center">
                      <div
                        className={cn(
                          'w-2.5 h-2.5 rounded-full border transition-all duration-300',
                          pastAnswer?.isCorrect
                            ? 'bg-emerald-400 border-white'
                            : pastAnswer && !pastAnswer.isCorrect
                              ? 'bg-rose-500 border-white'
                              : isCurrent
                                ? 'bg-white border-amber-300 scale-125'
                                : 'bg-emerald-950/80 border-emerald-500/50'
                        )}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Ball marker */}
              <div
                className="absolute top-1/2 -translate-y-1/2 z-20 transition-all duration-500 ease-out pointer-events-none flex items-center justify-center"
                style={{
                  left: `calc(${Math.min(95, Math.max(3, progressPercent))}% - 11px)`,
                }}
              >
                <span className="text-base drop-shadow">⚽</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. QUESTION CARD */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-9 shadow-sm border border-slate-200/90 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 sm:mb-5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200 tabular-nums">
                Question {currentNumber}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                <Sparkles className="w-3 h-3 text-rose-600" />
                +10 Pts
              </span>
            </div>

            {question.hint && !selectedAnswer && (
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-rose-600 font-bold transition-colors bg-slate-50 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
                {showHint ? 'Hide Tactical Hint' : 'Need a Hint?'}
              </button>
            )}
          </div>

          {question.image && !imageError && (
            <div className="w-full max-h-56 sm:max-h-72 rounded-2xl overflow-hidden mb-5 bg-slate-100 relative border border-slate-200/80">
              <img
                src={question.image}
                alt="Question Visual"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-2.5 left-3 text-xs font-bold text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-300" /> Visual Clue
              </div>
            </div>
          )}

          <h2 className="text-lg sm:text-2xl md:text-[28px] font-black text-slate-950 leading-[1.32] tracking-tight">
            {question.question}
          </h2>

          {showHint && question.hint && (
            <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs sm:text-sm font-medium flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-black uppercase tracking-wider text-[10px] block mb-0.5 text-amber-800">
                  Tactical Coach Hint
                </span>
                <p className="text-amber-900 leading-relaxed">{question.hint}</p>
              </div>
            </div>
          )}
        </div>

        {/* 3. ANSWER OPTIONS (2x2 GRID) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
          {shuffledOptions.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrectOption = option === question.correctAnswer;

            let btnClass =
              'w-full text-left p-3.5 sm:p-4 md:p-5 rounded-2xl border-2 transition-all duration-200 text-sm sm:text-base font-bold flex items-center gap-3.5 relative overflow-hidden outline-none cursor-pointer min-h-[56px] ';
            let labelBadgeClass =
              'flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs sm:text-sm shrink-0 font-black transition-all ';

            if (!selectedAnswer) {
              btnClass +=
                'bg-white border-slate-200 hover:border-rose-400 hover:bg-rose-50/35 text-slate-900 shadow-2xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0';
              labelBadgeClass +=
                'bg-slate-100 text-slate-700 border border-slate-200';
            } else {
              if (isCorrectOption && isSelected) {
                btnClass +=
                  'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-sm ring-2 ring-emerald-500/20';
                labelBadgeClass += 'bg-emerald-600 text-white';
              } else if (isSelected && !isCorrectOption) {
                btnClass +=
                  'crimson-vibrate shake border-rose-500 bg-rose-50 text-rose-950 shadow-sm ring-2 ring-rose-500/20';
                labelBadgeClass += 'bg-rose-600 text-white';
              } else if (!isSelected && isCorrectOption) {
                btnClass +=
                  'border-emerald-500 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/15';
                labelBadgeClass += 'bg-emerald-600 text-white';
              } else {
                btnClass +=
                  'border-slate-200/60 bg-slate-50/60 opacity-45 text-slate-400 cursor-not-allowed';
                labelBadgeClass += 'bg-slate-100 text-slate-400';
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
                <div className={labelBadgeClass}>
                  {OPTION_LABELS[index] || String.fromCharCode(65 + index)}
                </div>

                <span className="flex-1 leading-snug break-words pr-6">
                  {option}
                </span>

                {selectedAnswer && isCorrectOption && isSelected && (
                  <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Correct</span>
                  </div>
                )}
                {selectedAnswer && isSelected && !isCorrectOption && (
                  <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 text-white font-black text-[11px]">
                    <XCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Missed</span>
                  </div>
                )}
                {selectedAnswer && !isSelected && isCorrectOption && (
                  <div className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-black text-[10px] border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">Answer</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 4. EXPLANATION & NEXT QUESTION STRIP */}
        {selectedAnswer && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row gap-4 sm:gap-6 items-stretch md:items-center justify-between">
            <div className="flex-1 flex items-start gap-3.5">
              <div
                className={cn(
                  'w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0',
                  isAnswerCorrect
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-600'
                )}
              >
                {isAnswerCorrect ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <XCircle className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-1 text-left min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    className={cn(
                      'font-black text-base sm:text-lg',
                      isAnswerCorrect ? 'text-emerald-800' : 'text-rose-700'
                    )}
                  >
                    {isAnswerCorrect
                      ? 'Goal! Correct Answer'
                      : selectedAnswer === '__TIMEOUT__'
                        ? 'Full Time! Out of Time'
                        : 'Missed Chance! Incorrect Choice'}
                  </h3>
                  {isAnswerCorrect && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
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
                    {isAnswerCorrect
                      ? 'World class football knowledge!'
                      : `The correct answer is: ${question.correctAnswer}`}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white px-6 sm:px-7 py-3.5 rounded-xl font-black text-sm sm:text-base shadow-md shadow-rose-600/25 active:scale-[0.98] transition-all cursor-pointer group"
            >
              <span>
                {currentNumber === totalQuestions
                  ? 'Final Whistle (Results)'
                  : 'Next Question'}
              </span>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
