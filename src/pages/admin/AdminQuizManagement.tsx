
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { insforge } from '../../lib/insforge';
import { useAuth } from '../../context/AuthContext';
import { createQuizQuestion, updateQuizQuestion, deleteQuizQuestion, getAllQuizQuestions } from '../../services/quizService';
import { Brain, Search, Edit2, Plus, Trash2, X, CheckCircle, Clock, Upload, Download, FileText, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { QuizQuestion, QuizCategory, QuizDifficulty } from '../../types/quiz';
import { ImageInput } from '../../components/ui/ImageInput';
import { toast } from 'sonner';

export const AdminQuizManagement: React.FC = () => {
  const { userData } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentQ, setCurrentQ] = useState<Partial<QuizQuestion>>({});

  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await getAllQuizQuestions();
      setQuestions(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load questions from database");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      if (!currentQ.question || !currentQ.correctAnswer || !currentQ.options || currentQ.options.length < 2) {
        toast.error("Please fill all required fields properly.");
        return;
      }

      if (currentQ.id) {
        await updateQuizQuestion(userData?.id || '', currentQ.id, currentQ);
        toast.success("Question updated successfully!");
      } else {
        await createQuizQuestion(userData?.id || '', {
          question: currentQ.question,
          category: currentQ.category || 'World Football',
          difficulty: currentQ.difficulty || 'Medium',
          options: currentQ.options,
          correctAnswer: currentQ.correctAnswer,
          explanation: currentQ.explanation || '',
          hint: currentQ.hint || null,
          image: currentQ.image || null,
          source: currentQ.source || null,
          status: 'PUBLISHED'
        } as any);
        toast.success("New question published to database!");
      }
      
      setIsEditing(false);
      setCurrentQ({});
      loadQuestions();
    } catch (error: any) {
      console.error("Error saving question:", error);
      toast.error(error.message || "Failed to save question.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this question?")) {
      try {
        await deleteQuizQuestion(userData?.id || '', id);
        toast.success("Question deleted.");
        loadQuestions();
      } catch (err: any) {
        toast.error("Error deleting question: " + err.message);
      }
    }
  };

  const handleSeedQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/quiz/seed?force=true', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Seeded ${data.seeded || 10} official football questions!`);
        loadQuestions();
      } else {
        toast.error(data.error || "Failed to seed questions.");
      }
    } catch (e: any) {
      toast.error("Error seeding questions: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const newOpts = [...(currentQ.options || ['', '', '', ''])];
    newOpts[index] = val;
    setCurrentQ({ ...currentQ, options: newOpts });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map((row: any) => ({
          question: row.Question || row.question || '',
          category: row.Category || row.category || 'World Football',
          difficulty: row.Difficulty || row.difficulty || 'Medium',
          options: [
            row['Option A'] || row.optionA || row.option_a || '',
            row['Option B'] || row.optionB || row.option_b || '',
            row['Option C'] || row.optionC || row.option_c || '',
            row['Option D'] || row.optionD || row.option_d || ''
          ].filter(Boolean),
          correctAnswer: row['Correct Answer'] || row.correctAnswer || row.correct_answer || row.correctanswer || '',
          explanation: row.Explanation || row.explanation || '',
          status: 'PUBLISHED'
        }));
        setBulkPreview(parsed);
      },
      error: (error: any) => {
        toast.error("Error parsing CSV: " + error.message);
      }
    });
    // Reset file input
    e.target.value = '';
  };

  const handleSaveBulk = async () => {
    if (bulkPreview.length === 0) return;
    setBulkLoading(true);
    try {
      const validQuestions = bulkPreview.filter(q => q.question && q.correctAnswer && q.options && q.options.length >= 2);
      
      if (validQuestions.length === 0) {
        toast.error("No valid questions found. Please check your CSV format.");
        setBulkLoading(false);
        return;
      }

      const res = await fetch('/api/admin/quiz/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: validQuestions })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to bulk import');
      }
      
      toast.success(`Successfully imported ${validQuestions.length} questions into database!`);
      setIsBulkUploadOpen(false);
      setBulkPreview([]);
      loadQuestions();
    } catch (error: any) {
      console.error("Error bulk saving:", error);
      toast.error("Failed to save questions: " + error.message);
    }
    setBulkLoading(false);
  };

  const downloadTemplate = () => {
    const template = "Question,Category,Difficulty,Option A,Option B,Option C,Option D,Correct Answer,Explanation\nWho won the 2022 World Cup?,World Football,Easy,France,Argentina,Brazil,Spain,Argentina,Argentina beat France in the final on penalties.\n";
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'quiz_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredQs = questions.filter(q => q.question?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isEditing) {
    return (
      <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Maestro Trivia Vault</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">{currentQ.id ? 'Edit Question' : 'Add New Question'}</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Create engaging trivia for users to test their knowledge.</p>
          </div>
          <button
            onClick={() => { setIsEditing(false); setCurrentQ({}); }}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-bold text-slate-700">Question Text</label>
              <textarea
                placeholder="e.g., Who won the 2022 FIFA World Cup?"
                className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm font-medium text-slate-900 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-slate-400"
                rows={2}
                value={currentQ.question || ''}
                onChange={(e) => setCurrentQ({ ...currentQ, question: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs sm:text-sm font-bold text-slate-700">Category</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all cursor-pointer font-medium"
                  value={currentQ.category || 'World Football'}
                  onChange={(e) => setCurrentQ({ ...currentQ, category: e.target.value as QuizCategory })}
                >
                  <option value="World Football">World Football</option>
                  <option value="Premier League">Premier League</option>
                  <option value="La Liga">La Liga</option>
                  <option value="Serie A">Serie A</option>
                  <option value="UEFA Champions League">Champions League</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs sm:text-sm font-bold text-slate-700">Difficulty</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all cursor-pointer font-medium"
                  value={currentQ.difficulty || 'Medium'}
                  onChange={(e) => setCurrentQ({ ...currentQ, difficulty: e.target.value as QuizDifficulty })}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-bold text-slate-700">Question Image (Optional)</label>
              <ImageInput 
                value={currentQ.image || ''} 
                onChange={(url) => setCurrentQ({ ...currentQ, image: url })}
              />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="mb-3 block text-xs sm:text-sm font-bold text-slate-700">Options</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-600 shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <input
                      type="text"
                      placeholder={`Option ${i + 1}`}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all"
                      value={currentQ.options?.[i] || ''}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <label className="mb-1.5 block text-xs sm:text-sm font-bold text-slate-700">Correct Answer</label>
              <select
                className="w-full rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs sm:text-sm font-bold text-emerald-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer"
                value={currentQ.correctAnswer || ''}
                onChange={(e) => setCurrentQ({ ...currentQ, correctAnswer: e.target.value })}
              >
                <option value="">Select the correct option...</option>
                {currentQ.options?.map((opt, i) => (
                  opt && <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-bold text-slate-700">Explanation (Optional)</label>
              <textarea
                placeholder="Explain why this answer is correct..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-slate-400"
                rows={3}
                value={currentQ.explanation || ''}
                onChange={(e) => setCurrentQ({ ...currentQ, explanation: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
            <button
              onClick={() => { setIsEditing(false); setCurrentQ({}); }}
              className="rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 px-6 py-2.5 text-xs sm:text-sm font-black text-white shadow-md shadow-rose-600/25 transition-all cursor-pointer"
            >
              <CheckCircle className="h-4 w-4" />
              Save Question
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isBulkUploadOpen) {
    return (
      <div className="mx-auto max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Batch Processing</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Bulk Upload Questions</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Upload a CSV file containing multiple questions.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Template
            </button>
            <button
              onClick={() => { setIsBulkUploadOpen(false); setBulkPreview([]); }}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-8 rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/30 p-8 text-center transition-colors hover:bg-rose-50/50">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <Upload className="h-6 w-6" />
            </div>
            <h3 className="mb-1 text-base font-black text-slate-900">Upload CSV File</h3>
            <p className="mb-6 text-xs sm:text-sm text-slate-500 font-medium">Drag and drop your file here, or click to browse</p>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-6 py-2.5 text-xs sm:text-sm font-black text-white hover:from-rose-500 hover:to-red-500 transition-all shadow-md shadow-rose-600/25">
              <span>Select File</span>
              <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>

          {bulkPreview.length > 0 && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-base sm:text-lg font-black text-slate-900">Preview ({bulkPreview.length} questions)</h3>
                <button
                  onClick={handleSaveBulk}
                  disabled={bulkLoading}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 px-5 py-2.5 text-xs sm:text-sm font-black text-white transition-all shadow-md shadow-rose-600/25 disabled:opacity-50 cursor-pointer"
                >
                  {bulkLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Save All Questions
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 min-w-[500px]">
                  <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-black border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">Question</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Difficulty</th>
                      <th className="px-4 py-3">Answer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bulkPreview.slice(0, 10).map((q, i) => (
                      <tr key={i} className="hover:bg-rose-50/20">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">{q.question || <span className="text-red-500">Missing</span>}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800">
                            {q.category || 'World Football'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-md bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-xs font-black text-amber-800">
                            {q.difficulty || 'Medium'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-emerald-700 truncate block max-w-[150px] text-xs sm:text-sm">{q.correctAnswer || q.correct_answer}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {bulkPreview.length > 10 && (
                  <div className="py-3 text-center text-xs font-bold text-slate-500 bg-slate-50 rounded-b-xl">
                    + {bulkPreview.length - 10} more questions
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 mb-2">
            <Brain className="w-3.5 h-3.5 text-rose-600" />
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Maestro Trivia Vault</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Quiz Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Manage trivia questions for the football quizzes.</p>
        </div>
        <div className="flex flex-wrap gap-2.5 sm:gap-3">
          <button
            onClick={handleSeedQuestions}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-emerald-700 hover:bg-emerald-100 shadow-2xs transition-colors cursor-pointer"
            title="Seed official football trivia into the database"
          >
            <Sparkles className="h-4 w-4" />
            Seed Questions
          </button>
          <button
            onClick={() => setIsBulkUploadOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200/80 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            Bulk Upload
          </button>
          <button
            onClick={() => { 
              setCurrentQ({ options: ['', '', '', ''] }); 
              setIsEditing(true); 
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 px-5 py-2.5 text-xs sm:text-sm font-black text-white shadow-md shadow-rose-600/25 transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Question
          </button>
        </div>
      </div>

      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 p-4 bg-slate-50/70 items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs sm:text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 min-w-[600px]">
            <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-black border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Question</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Difficulty</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              <AnimatePresence>
                {filteredQs.map(q => (
                  <motion.tr 
                    key={q.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-rose-50/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2">{q.question}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-800 whitespace-nowrap">
                        {q.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider",
                        q.difficulty === 'Easy' ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80" :
                        q.difficulty === 'Medium' ? "bg-amber-50 text-amber-700 border border-amber-200/80" :
                        "bg-rose-50 text-rose-700 border border-rose-200/80"
                      )}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setCurrentQ(q); setIsEditing(true); }}
                          className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Edit Question"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete Question"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {filteredQs.length === 0 && (
            <div className="p-12 text-center text-slate-500 font-medium text-sm">
              No questions found. {questions.length === 0 && !loading ? 'Your quiz database is empty.' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
