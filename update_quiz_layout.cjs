const fs = require('fs');
let code = fs.readFileSync('src/pages/FootballQuiz.tsx', 'utf8');

// 1. Remove the grid layout: `<div className="grid lg:grid-cols-3 gap-8">`
// Replace it with `<div className="flex flex-col gap-8 max-w-3xl mx-auto">`
// 2. Remove `<div className="lg:col-span-2 space-y-6">`
// Replace it with `<div className="space-y-6">`
// 3. Update the leaderboard to have tabs for Solo and H2H.

code = code.replace(
  /<div className="grid lg:grid-cols-3 gap-8">/,
  '<div className="flex flex-col gap-8 w-full mx-auto">'
);

code = code.replace(
  /<div className="lg:col-span-2 space-y-6">/,
  '<div className="space-y-6 w-full">'
);

// We need to add state for Leaderboard tab
if (!code.includes('leaderboardTab')) {
  code = code.replace(
    /const \[leaderboard, setLeaderboard\] = useState<QuizResult\[\]>\(\[\]\);/,
    `const [leaderboard, setLeaderboard] = useState<QuizResult[]>([]);\n  const [leaderboardTab, setLeaderboardTab] = useState<'solo' | 'h2h'>('solo');`
  );
}

// Update the leaderboard section:
code = code.replace(
  /<div className="flex items-center justify-between mb-6">[\s\S]*?<h3 className="text-base font-bold text-slate-900">Top Players<\/h3>[\s\S]*?<\/div>[\s\S]*?<\/div>/,
  `<div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">Global Rankings</h3>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setLeaderboardTab('solo')}
                  className={\`px-3 py-1.5 text-xs font-bold rounded-md transition-colors \${leaderboardTab === 'solo' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}\`}
                >
                  Solo
                </button>
                <button 
                  onClick={() => setLeaderboardTab('h2h')}
                  className={\`px-3 py-1.5 text-xs font-bold rounded-md transition-colors \${leaderboardTab === 'h2h' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}\`}
                >
                  H2H
                </button>
              </div>
            </div>`
);

fs.writeFileSync('src/pages/FootballQuiz.tsx', code, 'utf8');
