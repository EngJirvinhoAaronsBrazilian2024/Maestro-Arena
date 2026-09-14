const fs = require('fs');
let content = fs.readFileSync('src/pages/FootballQuiz.tsx', 'utf8');

// Remove H2H button from hero
const heroH2HRegex = /<Link\s+to="\/quiz\/h2h"[\s\S]*?<\/Link>/;
content = content.replace(heroH2HRegex, '');

// Add H2H card above Leaderboard
const leaderboardRegex = /\{\/\* Leaderboard \*\/\}/;
const h2hCard = `{/* Head to Head Card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-lg">Multiplayer</h3>
              </div>
              <p className="text-blue-100 text-sm font-medium mb-5 leading-relaxed">
                Challenge players worldwide in real-time Head-to-Head trivia battles.
              </p>
              <Link
                to="/quiz/h2h"
                className="flex items-center justify-center gap-2 w-full bg-white text-blue-900 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-sm"
              >
                Find Match <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Leaderboard */}`;

content = content.replace(leaderboardRegex, h2hCard);

fs.writeFileSync('src/pages/FootballQuiz.tsx', content, 'utf8');
