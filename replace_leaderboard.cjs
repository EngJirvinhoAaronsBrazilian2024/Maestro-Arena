const fs = require('fs');

let content = fs.readFileSync('src/pages/FootballQuiz.tsx', 'utf8');

const startMarker = '{/* Leaderboard */}';
const endMarker = '  const renderResults = () => {';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    // Find where the containing divs close, right before renderResults
    const previousClose = content.substring(startIndex, endIndex).lastIndexOf('</div>\n    </div>\n  );');
    
    // We just replace everything between startMarker and the end of the div tree.
    // Let's use a simpler substring approach.
    const toReplace = content.substring(startIndex, endIndex);
    
    const newLeaderboard = `{/* Leaderboard */}
          <div className="bg-white rounded-[32px] p-6 lg:p-8 shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col h-[500px] relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-100/40 to-orange-50/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200/50 shadow-sm">
                  <Trophy className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Hall of Fame</h3>
                  <p className="text-xs text-slate-500 font-medium">Top Performers</p>
                </div>
              </div>
              <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/50 backdrop-blur-sm">
                <button 
                  onClick={() => setLeaderboardTab('solo')}
                  className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300", leaderboardTab === 'solo' ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-700")}
                >
                  Solo
                </button>
                <button 
                  onClick={() => setLeaderboardTab('h2h')}
                  className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300", leaderboardTab === 'h2h' ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-700")}
                >
                  H2H
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 relative z-10">
              {leaderboard.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                  <Activity className="w-8 h-8 opacity-20" />
                  <p className="text-sm font-medium">The arena awaits its first champion.</p>
                </div>
              ) : (
                leaderboard.map((result, idx) => {
                  const isGold = idx === 0;
                  const isSilver = idx === 1;
                  const isBronze = idx === 2;
                  
                  return (
                    <div 
                      key={idx} 
                      className={cn(
                        "group flex items-center gap-4 p-3.5 rounded-2xl border transition-all duration-300 hover:scale-[1.02]",
                        isGold ? "bg-gradient-to-r from-yellow-50 to-white border-yellow-200 shadow-sm shadow-yellow-100/50" :
                        isSilver ? "bg-gradient-to-r from-slate-50 to-white border-slate-200 shadow-sm shadow-slate-100/50" :
                        isBronze ? "bg-gradient-to-r from-orange-50 to-white border-orange-200 shadow-sm shadow-orange-100/50" :
                        "bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200 shadow-sm"
                      )}
                    >
                      <div className="relative shrink-0 flex items-center justify-center">
                        {isGold ? (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center shadow-md shadow-yellow-400/20 text-yellow-900 font-black text-sm border-2 border-white">1</div>
                        ) : isSilver ? (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 flex items-center justify-center shadow-md text-slate-800 font-black text-sm border-2 border-white">2</div>
                        ) : isBronze ? (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-200 to-amber-500 flex items-center justify-center shadow-md text-orange-950 font-black text-sm border-2 border-white">3</div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">{idx + 1}</div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-xs shadow-inner",
                          isGold ? "bg-yellow-100 text-yellow-700" :
                          isSilver ? "bg-slate-200 text-slate-700" :
                          isBronze ? "bg-orange-100 text-orange-700" :
                          "bg-blue-50 text-blue-600"
                        )}>
                          {(result.username || 'A')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("font-bold truncate text-sm", isGold ? "text-yellow-900" : "text-slate-900")}>
                            {result.username || 'Anonymous'}
                          </p>
                          <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                            {result.category} <span className="w-1 h-1 rounded-full bg-slate-300 inline-block"></span> {result.difficulty}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <div className="flex items-baseline gap-1 justify-end">
                          <span className={cn(
                            "font-black text-lg",
                            isGold ? "text-yellow-600" :
                            isSilver ? "text-slate-600" :
                            isBronze ? "text-orange-600" :
                            "text-slate-700"
                          )}>{result.score}</span>
                          <span className="text-xs font-bold text-slate-400">pts</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

`;

    content = content.replace(toReplace, newLeaderboard);
    fs.writeFileSync('src/pages/FootballQuiz.tsx', content);
    console.log('Leaderboard updated successfully via replace');
} else {
    console.log('Could not find markers');
}
