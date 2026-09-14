const fs = require('fs');
let code = fs.readFileSync('src/components/quiz/QuizQuestionCard.tsx', 'utf8');

// Container redesign
code = code.replace(/<div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">/g, '<div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60">');
code = code.replace(/bg-green-600/g, 'bg-blue-600'); // Progress bar and correct marks
code = code.replace(/bg-slate-100 text-slate-700/g, 'bg-white/50 text-slate-700 border border-white/60 shadow-sm'); // Timer

// Options redesign
code = code.replace(/border-slate-200 bg-white hover:border-blue-300 hover:bg-green-50 text-slate-700/g, 'border-white/60 bg-white/50 shadow-sm hover:bg-white/80 text-slate-700');
code = code.replace(/border-slate-200 bg-slate-50 opacity-50 text-slate-500/g, 'border-white/60 bg-white/30 shadow-sm opacity-50 text-slate-500');

// Explanation and Next button
code = code.replace(/bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800/g, 'bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 shadow-md');

fs.writeFileSync('src/components/quiz/QuizQuestionCard.tsx', code, 'utf8');
