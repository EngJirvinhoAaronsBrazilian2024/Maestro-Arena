const fs = require('fs');
let code = fs.readFileSync('src/pages/H2HQuiz.tsx', 'utf8');

// Basic H2H styles redesign
code = code.replace(/className="max-w-2xl mx-auto space-y-6"/g, 'className="max-w-3xl mx-auto space-y-6"');
code = code.replace(/<div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">/g, '<div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60 text-center">');
code = code.replace(/className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900"/g, 'className="w-full bg-white/50 backdrop-blur-sm border border-white/60 shadow-sm rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"');
code = code.replace(/bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700/g, 'bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 shadow-md');
code = code.replace(/bg-red-50 text-red-700 py-3 rounded-lg font-bold hover:bg-red-100/g, 'bg-red-500 text-white py-4 rounded-2xl font-bold hover:bg-red-600 shadow-md');

code = code.replace(/<div className="bg-slate-50 rounded-xl p-6 text-center">/g, '<div className="bg-white/50 border border-white/60 shadow-sm rounded-[24px] p-6 text-center">');
code = code.replace(/<div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">/g, '<div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60">');
code = code.replace(/bg-green-600 text-white py-3 rounded-xl/g, 'bg-blue-600 text-white py-4 rounded-2xl shadow-md');

code = code.replace(/btnClass = "bg-slate-50  hover:bg-slate-100 :bg-slate-600 border-slate-200  text-slate-800 ";/g, 'btnClass = "bg-white/50 border border-white/60 shadow-sm hover:bg-white/80 text-slate-800 ";');

fs.writeFileSync('src/pages/H2HQuiz.tsx', code, 'utf8');
