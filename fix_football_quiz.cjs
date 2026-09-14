const fs = require('fs');
let code = fs.readFileSync('src/pages/FootballQuiz.tsx', 'utf8');

// Header Hero redesign
code = code.replace(/bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-8 md:p-12 text-white shadow-xl/g, 'bg-gradient-to-br from-blue-600 to-blue-400 rounded-[32px] p-8 md:p-12 text-white shadow-lg border border-white/20');
code = code.replace(/bg-green-600 border border-blue-400 text-white/g, 'bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30');

// Setup Card redesign
code = code.replace(/<div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">/g, '<div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60">');
code = code.replace(/className="w-full appearance-none bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 pr-10 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"/g, 'className="w-full appearance-none bg-white/50 backdrop-blur-md border border-white/60 shadow-sm text-slate-900 rounded-2xl px-4 py-3 pr-10 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"');
code = code.replace(/selectedDifficulty === diff\s*\?\s*"border-blue-500 bg-green-50 text-blue-700\s*"/g, 'selectedDifficulty === diff ? "border-blue-500 bg-blue-500 text-white shadow-md"');
code = code.replace(/:\s*"border-slate-200 bg-white text-slate-600 hover:border-slate-200\s*"/g, ': "border-white/60 bg-white/50 shadow-sm text-slate-600 hover:bg-white/80"');
code = code.replace(/bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700/g, 'bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700');

// Leaderboard redesign
code = code.replace(/<div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">/g, '<div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60">');
code = code.replace(/<div key=\{idx\} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">/g, '<div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/50 border border-white/60 shadow-sm">');
code = code.replace(/<select className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">/g, '<select className="text-xs bg-white/50 border border-white/60 shadow-sm rounded-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500">');

// Results redesign
code = code.replace(/<div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 text-center">/g, '<div className="bg-white/60 backdrop-blur-xl rounded-[40px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/60 text-center">');
code = code.replace(/<div className="bg-slate-50 p-4 rounded-2xl">/g, '<div className="bg-white/50 border border-white/60 shadow-sm p-5 rounded-[24px]">');
code = code.replace(/bg-green-600 text-white font-bold hover:bg-green-700/g, 'bg-blue-600 text-white font-bold hover:bg-blue-700');
code = code.replace(/bg-slate-900 text-white font-bold hover:bg-slate-800/g, 'bg-slate-800 text-white font-bold hover:bg-slate-900');
code = code.replace(/bg-white text-slate-700 border-2 border-slate-200 font-bold hover:bg-slate-50/g, 'bg-white/50 text-slate-700 border border-white/60 shadow-sm font-bold hover:bg-white/80');

// Review redesign
code = code.replace(/<div key=\{q\.id\} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">/g, '<div key={q.id} className="bg-white/60 backdrop-blur-xl rounded-[32px] p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60">');
code = code.replace(/optClass \+= "border-slate-200 bg-slate-50 text-slate-500  ";/g, 'optClass += "border-white/60 bg-white/50 shadow-sm text-slate-600";');
code = code.replace(/<button\s+onClick=\{\(\) => setGameState\('landing'\)\}\s+className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"\s+>/g, '<button onClick={() => setGameState(\'landing\')} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-md">');

fs.writeFileSync('src/pages/FootballQuiz.tsx', code, 'utf8');
