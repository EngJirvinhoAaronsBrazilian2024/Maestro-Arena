import React, { useState, useRef, useEffect } from 'react';
import { QuizCategory, QuizDifficulty } from '../../types/quiz';
import {
  CATEGORY_ITEMS,
  CategoryGroupFilter,
  DIFFICULTIES,
  DIFFICULTY_CONFIG,
  DIFFICULTY_TIMES,
  NUM_QUESTIONS_OPTIONS,
} from './quizMetadata';
import { cn } from '../../lib/utils';
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  LayoutGrid,
  PlayCircle,
  Zap,
} from 'lucide-react';

interface QuizMatchSetupProps {
  selectedCategory: QuizCategory | 'All';
  onSelectCategory: (cat: QuizCategory | 'All') => void;
  categoryFilter: CategoryGroupFilter;
  onChangeCategoryFilter: (filter: CategoryGroupFilter) => void;
  selectedDifficulty: QuizDifficulty;
  onSelectDifficulty: (diff: QuizDifficulty) => void;
  numQuestions: number;
  onSelectNumQuestions: (count: number) => void;
  transitioning: boolean;
  onStartQuiz: () => void;
}

const FILTER_TABS: { id: CategoryGroupFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'leagues', label: 'Leagues' },
  { id: 'tournaments', label: 'Cups' },
  { id: 'players', label: 'Players' },
  { id: 'history', label: 'History' },
];

export function QuizMatchSetup({
  selectedCategory,
  onSelectCategory,
  categoryFilter,
  onChangeCategoryFilter,
  selectedDifficulty,
  onSelectDifficulty,
  numQuestions,
  onSelectNumQuestions,
  transitioning,
  onStartQuiz,
}: QuizMatchSetupProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handlePointerDownOutside);
      document.addEventListener('touchstart', handlePointerDownOutside);
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const filteredCategories = CATEGORY_ITEMS.filter((item) =>
    categoryFilter === 'all' ? true : item.group === categoryFilter
  );

  const selectedCatMeta =
    CATEGORY_ITEMS.find((c) => c.id === selectedCategory) || CATEGORY_ITEMS[0];
  const SelectedCatIcon = selectedCatMeta.icon;

  return (
    <div className="space-y-5 sm:space-y-6 w-full min-w-0">
      {/* 1. UNIFIED MATCH CONDITIONS CARD */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 shadow-sm border border-slate-200/90 space-y-5 sm:space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight truncate">
                Match Setup
              </h2>
              <p className="text-xs text-slate-500 font-medium truncate">
                Set your difficulty timer and match length
              </p>
            </div>
          </div>

          <span className="text-[11px] sm:text-xs font-extrabold text-rose-700 bg-rose-50 border border-rose-200/80 px-3 py-1 rounded-lg shrink-0 tabular-nums">
            {selectedDifficulty} · {DIFFICULTY_TIMES[selectedDifficulty]}s/Q
          </span>
        </div>

        {/* Difficulty Selector */}
        <div>
          <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2.5">
            Difficulty Level
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {DIFFICULTIES.map((diff) => {
              const dInfo = DIFFICULTY_CONFIG[diff];
              const isSelected = selectedDifficulty === diff;
              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => onSelectDifficulty(diff)}
                  className={cn(
                    'flex flex-col items-center justify-center py-3 px-2.5 rounded-2xl border transition-all cursor-pointer min-h-[64px]',
                    isSelected
                      ? 'border-rose-600 bg-rose-600 text-white shadow-md shadow-rose-600/20'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-rose-300 text-slate-800'
                  )}
                >
                  <span className="font-black text-sm flex items-center gap-1.5">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full shrink-0',
                        isSelected ? 'bg-white' : dInfo.dotColor
                      )}
                    />
                    {dInfo.label}
                  </span>
                  <span
                    className={cn(
                      'text-[11px] font-bold mt-1 flex items-center gap-1 tabular-nums',
                      isSelected ? 'text-rose-100' : 'text-slate-500'
                    )}
                  >
                    <Clock className="w-3 h-3" /> {dInfo.time}s / Q
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Match Length Selector */}
        <div>
          <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2.5">
            Match Length (Questions)
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {NUM_QUESTIONS_OPTIONS.map((num) => {
              const isSelected = numQuestions === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => onSelectNumQuestions(num)}
                  className={cn(
                    'flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border font-black text-xs sm:text-sm transition-all cursor-pointer tabular-nums min-h-[46px]',
                    isSelected
                      ? 'border-rose-600 bg-rose-50 text-rose-700 ring-2 ring-rose-600/20'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 text-slate-700'
                  )}
                >
                  <span>{num} Qs</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. CATEGORY COLLECTION DROPDOWN CARD */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 shadow-sm border border-slate-200/90 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center shrink-0">
              <LayoutGrid className="w-5 h-5 text-rose-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight truncate">
                Category Collection
              </h2>
              <p className="text-xs text-slate-500 font-medium truncate">
                Choose a competition or football topic ({CATEGORY_ITEMS.length}{' '}
                themes)
              </p>
            </div>
          </div>

          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg shrink-0">
            {selectedCatMeta.tag}
          </span>
        </div>

        {/* Interactive Light Crimson Dropdown Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
            onClick={() => setDropdownOpen((prev) => !prev)}
            className={cn(
              'w-full flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all cursor-pointer',
              dropdownOpen
                ? 'border-rose-600 bg-rose-50/50 ring-4 ring-rose-600/10'
                : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-rose-300'
            )}
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-600/20">
                <SelectedCatIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm sm:text-base text-slate-950 truncate">
                    {selectedCatMeta.title}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-100/80 border border-rose-200 px-1.5 py-0.5 rounded">
                    {selectedCatMeta.futCode}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                  {selectedCatMeta.subtitle}
                </p>
              </div>
            </div>

            <ChevronDown
              className={cn(
                'w-5 h-5 text-slate-500 shrink-0 transition-transform duration-200',
                dropdownOpen && 'rotate-180 text-rose-600'
              )}
            />
          </button>

          {dropdownOpen && (
            <div
              role="listbox"
              aria-label="Quiz Categories"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 overflow-hidden z-30 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              {/* Sticky Filter Tabs Inside Dropdown */}
              <div className="p-2 bg-slate-50 border-b border-slate-200/80 flex items-center gap-1 overflow-x-auto no-scrollbar">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onChangeCategoryFilter(tab.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                      categoryFilter === tab.id
                        ? 'bg-rose-600 text-white shadow-2xs font-black'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Scrollable Dropdown Options */}
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 custom-scrollbar p-1.5">
                {filteredCategories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const Icon = cat.icon;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onSelectCategory(cat.id);
                        setDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl text-left transition-colors cursor-pointer',
                        isSelected
                          ? 'bg-rose-50 text-rose-950'
                          : 'hover:bg-slate-50 text-slate-900'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={cn(
                            'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border',
                            isSelected
                              ? 'bg-rose-600 border-rose-600 text-white'
                              : 'bg-white border-slate-200 text-slate-700'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm truncate">
                              {cat.title}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                              {cat.tag}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {cat.subtitle}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. KICK OFF ACTION BAR */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-rose-200/80 w-full min-w-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
              <PlayCircle className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-wider text-rose-600">
                Match Ready
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-950 truncate">
                {selectedCatMeta.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate tabular-nums">
                {selectedDifficulty} · {numQuestions} Questions ·{' '}
                {DIFFICULTY_TIMES[selectedDifficulty]}s / question
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onStartQuiz}
            disabled={transitioning}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white px-7 py-3.5 rounded-2xl font-black text-sm sm:text-base shadow-lg shadow-rose-600/25 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:opacity-60 shrink-0"
          >
            {transitioning ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Entering Arena...
              </span>
            ) : (
              <>
                <PlayCircle className="w-5 h-5 shrink-0" />
                <span>Kick Off Match</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
