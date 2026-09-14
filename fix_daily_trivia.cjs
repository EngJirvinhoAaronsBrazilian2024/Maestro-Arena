const fs = require('fs');
let code = fs.readFileSync('src/pages/DailyTrivia.tsx', 'utf8');

code = code.replace(/<div className="max-w-2xl mx-auto space-y-6 pt-4">/g, '<div className="max-w-3xl mx-auto space-y-6 pt-4">');
code = code.replace(/<div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">/g, '<div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60">');

code = code.replace(/className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"/g, 'className="flex-1 bg-white/50 backdrop-blur-sm border border-white/60 shadow-sm rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"');
code = code.replace(/bg-slate-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-800/g, 'bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-900 shadow-md');

code = code.replace(/bg-gradient-to-r from-blue-600 to-green-500 text-white py-4 rounded-xl font-bold text-lg hover:opacity-90/g, 'bg-gradient-to-r from-blue-500 to-blue-700 text-white py-4 rounded-2xl font-bold text-lg hover:opacity-90 shadow-md');
code = code.replace(/bg-blue-600 text-white py-3 rounded-xl font-bold/g, 'bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-md');

code = code.replace(/btnClass = "bg-slate-50  hover:bg-slate-100 :bg-slate-600 border-slate-200  text-slate-800 ";/g, 'btnClass = "bg-white/50 border border-white/60 shadow-sm hover:bg-white/80 text-slate-800 ";');

fs.writeFileSync('src/pages/DailyTrivia.tsx', code, 'utf8');
