const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const newDashboard = `import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, updateUserRole, deleteUserRecord, UserData } from '../services/userService';
import { getTips, createTip, updateTip, deleteTip } from '../services/tipsService';
import { getAllQuizQuestions, createQuizQuestion, updateQuizQuestion, deleteQuizQuestion } from '../services/quizService';
import { Tip, TipMatch, TipCategory, TipStatus } from '../types/tips';
import { QuizQuestion, QuizCategory, QuizDifficulty } from '../types/quiz';
import { Users, Shield, Trash2, Edit2, ShieldAlert, Search, AlertCircle, FileText, CheckSquare, PlusCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';

export function AdminDashboard() {
  const { user, userData } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'users' | 'tips' | 'quizzes'>('users');
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isAdmin = userData?.role === 'admin';

  // Modal states
  const [showTipModal, setShowTipModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isAdmin, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const data = await getAllUsers();
        setUsers(data);
      } else if (activeTab === 'tips') {
        const data = await getTips();
        setTips(data);
      } else if (activeTab === 'quizzes') {
        const data = await getAllQuizQuestions();
        setQuizzes(data);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load data.');
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!user) return;
    try {
      await updateUserRole(userId, newRole, user.uid);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
    } catch (err: any) {
      alert("Failed to update role: " + err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!user || !confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUserRecord(userId, user.uid);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err: any) {
      alert("Failed to delete user: " + err.message);
    }
  };

  const handleDeleteTip = async (id: string) => {
    if (!user || !confirm('Delete this tip?')) return;
    try {
      await deleteTip(user.uid, id);
      setTips(tips.filter(t => t.id !== id));
    } catch (err: any) {
      alert("Failed to delete tip: " + err.message);
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!user || !confirm('Delete this quiz question?')) return;
    try {
      await deleteQuizQuestion(user.uid, id);
      setQuizzes(quizzes.filter(q => q.id !== id));
    } catch (err: any) {
      alert("Failed to delete question: " + err.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-slate-500">You need administrator privileges to view this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500">Manage users, betting tips, and quiz questions.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setActiveTab('users')} className={cn("px-4 py-2 font-bold border-b-2 transition-colors", activeTab === 'users' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700")}>Users</button>
        <button onClick={() => setActiveTab('tips')} className={cn("px-4 py-2 font-bold border-b-2 transition-colors", activeTab === 'tips' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700")}>Tips</button>
        <button onClick={() => setActiveTab('quizzes')} className={cn("px-4 py-2 font-bold border-b-2 transition-colors", activeTab === 'quizzes' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700")}>Quizzes</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div></div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2"><AlertCircle className="w-5 h-5" />{error}</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                    <th className="p-4 font-bold">User</th>
                    <th className="p-4 font-bold">Role</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{u.displayName || 'Unnamed User'}</div>
                        <div className="text-sm text-slate-500">{u.email}</div>
                      </td>
                      <td className="p-4">
                        <select
                          value={u.role || 'user'}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-slate-100 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                        >
                          <option value="user">User</option>
                          <option value="editor">Editor</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900 text-lg">Manage Betting Tips</h3>
                <button 
                  onClick={() => setShowTipModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                >
                  <PlusCircle className="w-4 h-4" /> Publish New Tip
                </button>
              </div>
              
              <div className="space-y-4">
                {tips.map(t => (
                  <div key={t.id} className="p-4 rounded-xl border border-slate-200 flex justify-between items-center bg-slate-50">
                    <div>
                      <div className="font-bold text-slate-900">{t.category.toUpperCase()} - {t.status}</div>
                      <div className="text-sm text-slate-600">{t.matches.length} matches | Odds: {t.odds || 'N/A'}</div>
                      {t.bookingCode && <div className="text-xs font-bold text-blue-600 mt-1">Code: {t.bookingCode}</div>}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={async () => {
                          const newStatus = prompt("Enter new status (pending, won, lost, void, postponed):", t.status) as TipStatus;
                          if (newStatus && user) {
                            try {
                              await updateTip(user.uid, t.id, { status: newStatus });
                              setTips(tips.map(tip => tip.id === t.id ? { ...tip, status: newStatus } : tip));
                            } catch (e) { alert("Failed"); }
                          }
                        }}
                        className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                        title="Update Status"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDeleteTip(t.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))}
                {tips.length === 0 && <div className="text-center py-8 text-slate-500">No tips found</div>}
              </div>
            </div>
          )}

          {activeTab === 'quizzes' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900 text-lg">Manage Quiz Questions</h3>
                <button 
                  onClick={() => setShowQuizModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                >
                  <PlusCircle className="w-4 h-4" /> Add Question
                </button>
              </div>
              
              <div className="space-y-4">
                {quizzes.map(q => (
                  <div key={q.id} className="p-4 rounded-xl border border-slate-200 flex justify-between items-center bg-slate-50">
                    <div>
                      <div className="font-bold text-slate-900">{q.question}</div>
                      <div className="text-sm text-slate-600">{q.category} | {q.difficulty} | Correct: {q.correctAnswer}</div>
                    </div>
                    <button onClick={() => handleDeleteQuiz(q.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-5 h-5" /></button>
                  </div>
                ))}
                {quizzes.length === 0 && <div className="text-center py-8 text-slate-500">No custom questions found</div>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tip Creation Modal */}
      {showTipModal && (
        <CreateTipModal 
          onClose={() => setShowTipModal(false)} 
          onSuccess={(newTip) => {
            setTips([newTip, ...tips]);
            setShowTipModal(false);
          }}
          adminId={user?.uid!}
        />
      )}

      {/* Quiz Creation Modal */}
      {showQuizModal && (
        <CreateQuizModal 
          onClose={() => setShowQuizModal(false)} 
          onSuccess={(newQ) => {
            setQuizzes([newQ, ...quizzes]);
            setShowQuizModal(false);
          }}
          adminId={user?.uid!}
        />
      )}

    </div>
  );
}

// -----------------------------------------
// Modal Components for Creation
// -----------------------------------------

function CreateTipModal({ onClose, onSuccess, adminId }: { onClose: () => void, onSuccess: (t: Tip) => void, adminId: string }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: 'single' as TipCategory,
    odds: '',
    analysis: '',
    bookingCode: '',
    homeTeam: '',
    awayTeam: '',
    competition: '',
    prediction: '',
    market: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newTip = await createTip(adminId, {
        category: formData.category,
        odds: formData.odds ? parseFloat(formData.odds) : undefined,
        analysis: formData.analysis || undefined,
        bookingCode: formData.bookingCode || undefined,
        status: 'pending',
        publishDate: Date.now(),
        matches: [{
          homeTeam: formData.homeTeam,
          awayTeam: formData.awayTeam,
          competition: formData.competition,
          prediction: formData.prediction,
          market: formData.market || 'Prediction'
        }]
      });
      onSuccess(newTip);
    } catch (err) {
      alert("Failed to create tip");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-lg">Publish New Tip</h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form id="tip-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg p-2"
                  value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}
                >
                  <option value="single">Single (1 Match)</option>
                  <option value="maestro2+">Maestro 2+ (Accumulator)</option>
                  <option value="odd4+">Odd 4+ (High Value)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Booking Code</label>
                <input type="text" className="w-full border border-slate-300 rounded-lg p-2" value={formData.bookingCode} onChange={e => setFormData({...formData, bookingCode: e.target.value})} placeholder="e.g. B9X12Z" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Total Odds</label>
                <input type="number" step="0.01" className="w-full border border-slate-300 rounded-lg p-2" value={formData.odds} onChange={e => setFormData({...formData, odds: e.target.value})} placeholder="e.g. 2.50" />
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
              <h4 className="font-bold text-slate-800 text-sm mb-2">Match Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Home Team *</label>
                  <input required type="text" className="w-full border border-slate-300 rounded-lg p-2" value={formData.homeTeam} onChange={e => setFormData({...formData, homeTeam: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Away Team *</label>
                  <input required type="text" className="w-full border border-slate-300 rounded-lg p-2" value={formData.awayTeam} onChange={e => setFormData({...formData, awayTeam: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Competition *</label>
                  <input required type="text" className="w-full border border-slate-300 rounded-lg p-2" value={formData.competition} onChange={e => setFormData({...formData, competition: e.target.value})} placeholder="e.g. Premier League" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Market</label>
                  <input type="text" className="w-full border border-slate-300 rounded-lg p-2" value={formData.market} onChange={e => setFormData({...formData, market: e.target.value})} placeholder="e.g. 1X2, Over 2.5" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Prediction / Pick *</label>
                <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 font-bold" value={formData.prediction} onChange={e => setFormData({...formData, prediction: e.target.value})} placeholder="e.g. Home Win" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Analysis / Reasoning</label>
              <textarea className="w-full border border-slate-300 rounded-lg p-2 h-20" value={formData.analysis} onChange={e => setFormData({...formData, analysis: e.target.value})} placeholder="Explain why..." />
            </div>
            
          </form>
        </div>
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 mt-auto">
          <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg">Cancel</button>
          <button type="submit" form="tip-form" disabled={loading} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Publishing...' : 'Publish Tip'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateQuizModal({ onClose, onSuccess, adminId }: { onClose: () => void, onSuccess: (q: QuizQuestion) => void, adminId: string }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    category: 'World Football' as QuizCategory,
    difficulty: 'Medium' as QuizDifficulty,
    opt1: '', opt2: '', opt3: '', opt4: '',
    correctIndex: '0',
    explanation: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const options = [formData.opt1, formData.opt2, formData.opt3, formData.opt4];
      const correctAnswer = options[parseInt(formData.correctIndex)];
      
      const newQ = await createQuizQuestion(adminId, {
        question: formData.question,
        category: formData.category,
        difficulty: formData.difficulty,
        options,
        correctAnswer,
        explanation: formData.explanation
      });
      onSuccess(newQ);
    } catch (err) {
      alert("Failed to add question");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-lg">Add Quiz Question</h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form id="quiz-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Question Text *</label>
              <textarea required className="w-full border border-slate-300 rounded-lg p-2" value={formData.question} onChange={e => setFormData({...formData, question: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                <select className="w-full border border-slate-300 rounded-lg p-2" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                  <option value="World Football">World Football</option>
                  <option value="Premier League">Premier League</option>
                  <option value="La Liga">La Liga</option>
                  <option value="UEFA Champions League">Champions League</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Difficulty</label>
                <select className="w-full border border-slate-300 rounded-lg p-2" value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value as any})}>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <h4 className="font-bold text-slate-800 text-sm">Options</h4>
              <div className="flex gap-2 items-center">
                <input type="radio" name="correct" checked={formData.correctIndex === '0'} onChange={() => setFormData({...formData, correctIndex: '0'})} className="w-4 h-4" />
                <input required type="text" className="flex-1 border border-slate-300 rounded-lg p-2 text-sm" placeholder="Option 1" value={formData.opt1} onChange={e => setFormData({...formData, opt1: e.target.value})} />
              </div>
              <div className="flex gap-2 items-center">
                <input type="radio" name="correct" checked={formData.correctIndex === '1'} onChange={() => setFormData({...formData, correctIndex: '1'})} className="w-4 h-4" />
                <input required type="text" className="flex-1 border border-slate-300 rounded-lg p-2 text-sm" placeholder="Option 2" value={formData.opt2} onChange={e => setFormData({...formData, opt2: e.target.value})} />
              </div>
              <div className="flex gap-2 items-center">
                <input type="radio" name="correct" checked={formData.correctIndex === '2'} onChange={() => setFormData({...formData, correctIndex: '2'})} className="w-4 h-4" />
                <input required type="text" className="flex-1 border border-slate-300 rounded-lg p-2 text-sm" placeholder="Option 3" value={formData.opt3} onChange={e => setFormData({...formData, opt3: e.target.value})} />
              </div>
              <div className="flex gap-2 items-center">
                <input type="radio" name="correct" checked={formData.correctIndex === '3'} onChange={() => setFormData({...formData, correctIndex: '3'})} className="w-4 h-4" />
                <input required type="text" className="flex-1 border border-slate-300 rounded-lg p-2 text-sm" placeholder="Option 4" value={formData.opt4} onChange={e => setFormData({...formData, opt4: e.target.value})} />
              </div>
              <p className="text-xs text-slate-500 mt-1">Select the radio button next to the correct answer.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Explanation (Optional)</label>
              <textarea className="w-full border border-slate-300 rounded-lg p-2 h-16" value={formData.explanation} onChange={e => setFormData({...formData, explanation: e.target.value})} />
            </div>
            
          </form>
        </div>
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 mt-auto">
          <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg">Cancel</button>
          <button type="submit" form="quiz-form" disabled={loading} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Question'}
          </button>
        </div>
      </div>
    </div>
  )
}
`;
fs.writeFileSync('src/pages/AdminDashboard.tsx', newDashboard);
