const fs = require('fs');
const content = `
import React, { useState, useEffect } from 'react';
import { insforge } from '../../lib/insforge';
import { useAuth } from '../../context/AuthContext';
import { Brain, Search, Edit2, Plus, Trash2, X, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { QuizQuestion, QuizCategory, QuizDifficulty } from '../../types/quiz';
import { ImageInput } from '../../components/ui/ImageInput';

export const AdminQuizManagement: React.FC = () => {
  const { userData } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentQ, setCurrentQ] = useState<Partial<QuizQuestion>>({});

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await insforge.from('quiz_questions').select('*').order('created_at', { ascending: false });
      if (error) {
        // Fallback for mock if table doesnt exist yet
        console.warn('Quiz table error, falling back to mock or empty');
      } else if (data) {
        setQuestions(data as unknown as QuizQuestion[]);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      if (!currentQ.question || !currentQ.correctAnswer || !currentQ.options || currentQ.options.length < 2) {
        alert("Please fill all required fields properly.");
        return;
      }
      
      const payload = {
        question: currentQ.question,
        category: currentQ.category || 'World Football',
        difficulty: currentQ.difficulty || 'Medium',
        options: currentQ.options,
        correct_answer: currentQ.correctAnswer,
        explanation: currentQ.explanation || '',
        image: currentQ.image || null,
        status: 'published'
      };

      if (currentQ.id) {
        await insforge.from('quiz_questions').update(payload).eq('id', currentQ.id);
      } else {
        await insforge.from('quiz_questions').insert([payload]);
      }
      
      setIsEditing(false);
      setCurrentQ({});
      loadQuestions();
    } catch (error) {
      console.error("Error saving question:", error);
      alert("Failed to save question. Make sure the database schema is updated.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this question?")) {
      await insforge.from('quiz_questions').delete().eq('id', id);
      loadQuestions();
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const newOpts = [...(currentQ.options || ['', '', '', ''])];
    newOpts[index] = val;
    setCurrentQ({ ...currentQ, options: newOpts });
  };

  const filteredQs = questions.filter(q => q.question?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isEditing) {
    return (
      <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{currentQ.id ? 'Edit Question' : 'Add New Question'}</h1>
            <p className="text-sm text-slate-500">Create engaging trivia for users to test their knowledge.</p>
          </div>
          <button
            onClick={() => { setIsEditing(false); setCurrentQ({}); }}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Question Text</label>
              <textarea
                placeholder="e.g., Who won the 2022 FIFA World Cup?"
                className="w-full resize-none rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm font-medium text-slate-900 outline-none focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 transition-all"
                rows={2}
                value={currentQ.question || ''}
                onChange={(e) => setCurrentQ({ ...currentQ, question: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Category</label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 transition-all"
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
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Difficulty</label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 transition-all"
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
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Question Image (Optional)</label>
              <ImageInput 
                value={currentQ.image || ''} 
                onChange={(url) => setCurrentQ({ ...currentQ, image: url })}
              />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="mb-3 block text-sm font-semibold text-slate-700">Options</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <input
                      type="text"
                      placeholder={\`Option \${i + 1}\`}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 transition-all"
                      value={currentQ.options?.[i] || ''}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Correct Answer</label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm font-medium text-green-700 outline-none focus:border-green-500 focus:bg-white focus:ring-1 focus:ring-green-500 transition-all"
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
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Explanation (Optional)</label>
              <textarea
                placeholder="Explain why this answer is correct..."
                className="w-full resize-none rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 transition-all"
                rows={3}
                value={currentQ.explanation || ''}
                onChange={(e) => setCurrentQ({ ...currentQ, explanation: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
            <button
              onClick={() => { setIsEditing(false); setCurrentQ({}); }}
              className="rounded-lg px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors shadow-sm"
            >
              <CheckCircle className="h-4 w-4" />
              Save Question
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quiz Management</h1>
          <p className="text-sm text-slate-500">Manage trivia questions for the football quizzes.</p>
        </div>
        <button
          onClick={() => { 
            setCurrentQ({ options: ['', '', '', ''] }); 
            setIsEditing(true); 
          }}
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Question
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 p-4 bg-slate-50 items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
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
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 line-clamp-2">{q.question}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 whitespace-nowrap">
                        {q.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        q.difficulty === 'Easy' ? "bg-green-100 text-green-800" :
                        q.difficulty === 'Medium' ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      )}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setCurrentQ(q); setIsEditing(true); }}
                          className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
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
            <div className="p-12 text-center text-slate-500">
              No questions found. {questions.length === 0 && !loading ? 'Your quiz database is empty.' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
`
fs.writeFileSync('src/pages/admin/AdminQuizManagement.tsx', content, 'utf8');
