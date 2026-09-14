const fs = require('fs');
let code = fs.readFileSync('src/pages/MatchCentre.tsx', 'utf8');

// Replace standard generic tabs with the pill segmented control from reference image
const oldTabs = /<div className="flex w-full space-x-1 rounded-xl bg-slate-100 p-1">[\s\S]*?<\/div>\s*<\/div>/;
const newTabs = `
        <div className="flex w-full space-x-2 rounded-full bg-white/50 backdrop-blur-md p-1.5 shadow-sm border border-white/60">
          <button
            onClick={() => setActiveTab('lineups')}
            className={cn(
              "flex-1 rounded-full py-2.5 text-sm font-medium transition-all duration-200",
              activeTab === 'lineups'
                ? "bg-blue-500 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Line up
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={cn(
              "flex-1 rounded-full py-2.5 text-sm font-medium transition-all duration-200",
              activeTab === 'stats'
                ? "bg-blue-500 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Statistics
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={cn(
              "flex-1 rounded-full py-2.5 text-sm font-medium transition-all duration-200",
              activeTab === 'events'
                ? "bg-blue-500 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Timeline
          </button>
        </div>
      </div>
`;
code = code.replace(oldTabs, newTabs);

// Update progress bars to match the rounded reference design
// The reference image uses blue for home, dark grey for away.
code = code.replace(/<div className="bg-green-600" style={{ width: `\${homePercent}%` }}><\/div>/g, '<div className="bg-blue-500 rounded-full" style={{ width: `${homePercent}%` }}></div>');
code = code.replace(/<div className="bg-slate-300" style={{ width: `\${awayPercent}%` }}><\/div>/g, '<div className="bg-slate-800 rounded-full" style={{ width: `${awayPercent}%` }}></div>');
code = code.replace(/<div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">/g, '<div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200 gap-1">');

// Update match scoreboard background in MatchCentre to be glassmorphic
code = code.replace(/<div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">/g, '<div className="overflow-hidden rounded-[28px] bg-white/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60 relative">');
code = code.replace(/<div className="bg-slate-50 px-6 py-3 text-center text-sm font-medium text-slate-500">/g, '<div className="pt-8 text-center text-sm font-medium text-slate-500 relative z-10 border-b-0 pb-0">');

// Clean up some old live indicators to match the pill style
code = code.replace(
  /<div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-600">/g,
  '<div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-red-500 shadow-sm border border-slate-100 absolute top-4 left-1/2 -translate-x-1/2">'
);

// We need to make sure the LiveIndicator is red
code = code.replace(/<LiveIndicator className="mr-1" \/>/g, '<span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>');

fs.writeFileSync('src/pages/MatchCentre.tsx', code, 'utf8');
