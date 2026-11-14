import React from 'react';
import { QuizQuestion } from '../../types/quiz';
import { ArrowLeft, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface QuizReviewViewProps {
  questions: QuizQuestion[];
  userAnswers: { questionId: string; answer: string; isCorrect: boolean }[];
  onBackToResults: () => void;
  onReturnToArena: () => void;
}

export function QuizReviewView({
  questions,
  userAnswers,
  onBackToResults,
  onReturnToArena,
}: QuizReviewViewProps) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400 pb-16 min-w-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200/90 gap-3 w-full min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-black text-slate-950 truncate">
              Post-Match Tactical Review
            </h2>
            <p className="text-xs text-slate-500 font-medium truncate">
              Breakdown of every decision on the pitch ({questions.length}{' '}
              questions)
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onBackToResults}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Score
        </button>
      </div>

      <div className="space-y-4 sm:space-y-5">
        {questions.map((q, idx) => {
          const userAnswer = userAnswers.find((a) => a.questionId === q.id);
          const isCorrect = userAnswer?.isCorrect;

          return (
            <div
              key={q.id}
              className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200/90"
            >
              <div className="flex items-start gap-3.5 sm:gap-4">
                <div className="mt-0.5 shrink-0">
                  {isCorrect ? (
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                      <XCircle className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 text-[11px] font-bold text-slate-500">
                    <span className="uppercase tracking-wider text-rose-600 font-black">
                      Question {idx + 1}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span>{q.category}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-950 mb-4 leading-snug">
                    {q.question}
                  </h3>

                  <div className="space-y-2 mb-4">
                    {q.options.map((opt) => {
                      let optClass =
                        'p-3.5 rounded-xl border text-sm font-bold flex items-center justify-between gap-3 ';
                      let icon = null;

                      if (opt === q.correctAnswer) {
                        optClass +=
                          'border-emerald-500 bg-emerald-50 text-emerald-950';
                        icon = (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        );
                      } else if (opt === userAnswer?.answer) {
                        optClass +=
                          'border-rose-500 bg-rose-50 text-rose-950';
                        icon = (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        );
                      } else {
                        optClass +=
                          'border-slate-200/80 bg-slate-50/70 text-slate-500';
                      }

                      return (
                        <div key={opt} className={optClass}>
                          <span>{opt}</span>
                          {icon}
                        </div>
                      );
                    })}

                    {(!userAnswer?.answer ||
                      userAnswer.answer === '__TIMEOUT__') && (
                      <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs sm:text-sm font-bold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        Out of time: You did not answer this question in time.
                      </div>
                    )}
                  </div>

                  {q.explanation && (
                    <div className="p-3.5 sm:p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-700 text-xs sm:text-sm leading-relaxed">
                      <span className="font-black text-slate-900 block mb-1 uppercase tracking-wider text-[10px]">
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
        type="button"
        onClick={onReturnToArena}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-base shadow-md shadow-rose-600/25 transition-all cursor-pointer"
      >
        Complete Review & Return to Arena
      </button>
    </div>
  );
}
