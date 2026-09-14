const fs = require('fs');
let code = fs.readFileSync('src/pages/FootballQuiz.tsx', 'utf8');

code = code.replace(
  /{leaderboard\.length > 0 \? \([\s\S]*?No scores yet\. Be the first![\s\S]*?<\/div>\s*\)}/m,
  `{leaderboardTab === 'solo' ? (
              leaderboard.length > 0 ? (
                <div className="space-y-4">
                  {leaderboard.map((entry, idx) => {
                    const accuracy = Math.round((entry.correctAnswers / entry.totalQuestions) * 100);
                    return (
                      <div key={entry.id || idx} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                            idx === 0 ? "bg-amber-100 text-amber-700" : 
                            idx === 1 ? "bg-slate-100 text-slate-600" : 
                            idx === 2 ? "bg-orange-50 text-orange-700" : "bg-slate-50 text-slate-500"
                          )}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{entry.userName || 'Anonymous Player'}</p>
                            <p className="text-xs text-slate-500 font-medium">{accuracy}% Acc • {entry.difficulty}</p>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900 bg-slate-50 px-2 py-1 rounded-lg text-sm">{entry.score} pts</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 font-medium bg-slate-50 rounded-2xl">
                  No solo scores yet. Be the first!
                </div>
              )
            ) : (
              <div className="space-y-4">
                {/* H2H Leaderboard Mock Data */}
                {[
                  { name: 'Kisakye Aron', wins: 42, winRate: 78 },
                  { name: 'Maestro Pro', wins: 38, winRate: 71 },
                  { name: 'Football Fanatic', wins: 31, winRate: 64 },
                  { name: 'Goal Scorer', wins: 29, winRate: 62 },
                  { name: 'Soccer King', wins: 22, winRate: 58 }
                ].map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                        idx === 0 ? "bg-amber-100 text-amber-700" : 
                        idx === 1 ? "bg-slate-100 text-slate-600" : 
                        idx === 2 ? "bg-orange-50 text-orange-700" : "bg-slate-50 text-slate-500"
                      )}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{entry.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{entry.winRate}% Win Rate</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-sm">{entry.wins} Wins</span>
                  </div>
                ))}
              </div>
            )}`
);

fs.writeFileSync('src/pages/FootballQuiz.tsx', code, 'utf8');
