import React, { useState, useEffect } from 'react';
import { QuizQuestion } from '../../types/quiz';
import { cn } from '../../lib/utils';
import { CheckCircle2, XCircle, HelpCircle, Clock, ChevronRight, Trophy } from 'lucide-react';

interface QuizQuestionCardProps {
  question: QuizQuestion;
  currentNumber: number;
  totalQuestions: number;
  timeRemaining: number | null;
  currentScore?: number;
  category?: string;
  onAnswerSubmit: (selectedOption: string) => void;
  onNextQuestion: () => void;
}

export function QuizQuestionCard({
  question,
  currentNumber,
  totalQuestions,
  timeRemaining,
  currentScore = 0,
  category = 'Mixed',
  onAnswerSubmit,
  onNextQuestion
}: QuizQuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [animatingOut, setAnimatingOut] = useState(false);

  useEffect(() => {
    setSelectedAnswer(null);
    setShowHint(false);
    setAnimatingOut(false);
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
    }, 300);
  };

  const isAnswerCorrect = selectedAnswer === question.correctAnswer;
  const progressPercent = ((currentNumber) / totalQuestions) * 100;
  
  const OPTION_LABELS = ['A', 'B', 'C', 'D'];

  return (
    <div className={cn(
      "w-full max-w-4xl mx-auto space-y-6 transition-all duration-300",
      animatingOut ? "opacity-0 -translate-x-8" : "animate-in fade-in slide-in-from-right-8 duration-500"
    )}>
      
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
            <Trophy className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Maestro Arena</h2>
            <p className="text-sm font-black text-slate-800">{category === 'All' ? 'Mixed' : category}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 md:gap-8">
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Question</p>
            <p className="text-sm font-black text-slate-800">{currentNumber} <span className="text-slate-400">/ {totalQuestions}</span></p>
          </div>
          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Score</p>
            <p className="text-sm font-black text-blue-600">{currentScore}</p>
          </div>
          
          {timeRemaining !== null && (
            <div className={cn(
              "flex flex-col items-center justify-center w-12 h-12 rounded-full border-4 transition-colors duration-300",
              timeRemaining <= 5 ? "border-red-500 text-red-600 animate-pulse bg-red-50" : "border-slate-900 text-slate-900"
            )}>
              <span className="text-sm font-black leading-none">{timeRemaining}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
        <div 
          className="h-full bg-blue-600 transition-all duration-500 ease-out rounded-full" 
          style={{ width: `${progressPercent}%` }} 
        />
      </div>

      {/* Question Text */}
      <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-slate-100 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute -right-12 -top-12 opacity-[0.03] text-slate-900 pointer-events-none">
          <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
        </div>
        
        {question.image && (
          <div className="w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden mb-8 bg-slate-100 relative shadow-inner">
            <img 
              src={question.image} 
              alt="Quiz visual" 
              className="absolute inset-0 w-full h-full object-cover" 
            />
          </div>
        )}
        
        <h2 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight mb-2 relative z-10">
          {question.question}
        </h2>
        
        {question.hint && !selectedAnswer && (
          <div className="mt-8">
            {!showHint ? (
              <button 
                onClick={() => setShowHint(true)}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 font-bold transition-colors bg-slate-50 hover:bg-blue-50 px-4 py-2.5 rounded-xl"
              >
                <HelpCircle className="w-4 h-4" /> Need a hint?
              </button>
            ) : (
              <div className="p-5 bg-blue-50/50 text-blue-900 rounded-2xl text-sm border border-blue-100 font-medium flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase tracking-wider text-xs block mb-1 text-blue-600">Hint</span>
                  {question.hint}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Options */}
      <div className="grid sm:grid-cols-2 gap-4">
        {shuffledOptions.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrectOption = option === question.correctAnswer;
          
          let btnClass = "w-full text-left p-5 md:p-6 rounded-2xl border-2 transition-all duration-300 text-lg md:text-xl font-bold flex items-center gap-4 relative overflow-hidden outline-none ";
          let labelClass = "flex items-center justify-center w-10 h-10 rounded-xl text-sm shrink-0 font-black transition-colors ";
          
          if (!selectedAnswer) {
            btnClass += "border-slate-100 bg-white shadow-sm hover:border-slate-300 hover:bg-slate-50 text-slate-800 focus:ring-4 focus:ring-slate-100 cursor-pointer hover:-translate-y-1";
            labelClass += "bg-slate-100 text-slate-500";
          } else {
            if (isCorrectOption) {
              btnClass += "border-green-500 bg-green-50 text-green-900 shadow-sm z-10 scale-[1.02]";
              labelClass += "bg-green-500 text-white";
            } else if (isSelected && !isCorrectOption) {
              btnClass += "border-red-500 bg-red-50 text-red-900 shadow-sm animate-in shake";
              labelClass += "bg-red-500 text-white";
            } else {
              btnClass += "border-slate-100 bg-white opacity-40 text-slate-400";
              labelClass += "bg-slate-100 text-slate-400";
            }
          }

          return (
            <button
              key={index}
              disabled={selectedAnswer !== null}
              onClick={() => handleOptionClick(option)}
              className={btnClass}
            >
              <div className={labelClass}>
                {OPTION_LABELS[index] || String.fromCharCode(65 + index)}
              </div>
              <span className="flex-1 leading-snug">{option}</span>
              
              {selectedAnswer && isCorrectOption && (
                <div className="absolute right-4 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0 animate-in zoom-in">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              )}
              {selectedAnswer && isSelected && !isCorrectOption && (
                <div className="absolute right-4 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 animate-in zoom-in">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation & Next Button */}
      {selectedAnswer && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-8 duration-500 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {isAnswerCorrect ? (
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle2 className="w-7 h-7 text-green-600" /></div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"><XCircle className="w-7 h-7 text-red-600" /></div>
              )}
              <h3 className={cn("font-black text-2xl md:text-3xl", isAnswerCorrect ? "text-green-600" : "text-red-600")}>
                {isAnswerCorrect ? 'Correct!' : (selectedAnswer === '__TIMEOUT__' ? 'Time\'s Up!' : 'Incorrect!')}
              </h3>
            </div>
            {question.explanation && (
              <p className="text-base font-medium text-slate-600 leading-relaxed md:pr-8">{question.explanation}</p>
            )}
          </div>
          
          <button
            onClick={handleNext}
            className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-5 rounded-2xl font-bold text-lg hover:bg-slate-800 shadow-[0_8px_20px_rgba(15,23,42,0.15)] hover:-translate-y-1 transition-all group"
          >
            {currentNumber === totalQuestions ? 'Final Results' : 'Next Question'} 
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}
