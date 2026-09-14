const fs = require('fs');

let content = fs.readFileSync('src/pages/FootballQuiz.tsx', 'utf8');

const landingRegex = /const renderLanding = \(\) => \([\s\S]*?\n  \);\n\n  const renderResults/m;

const newLanding = `const renderLanding = () => (
    <div className="max-w-5xl mx-auto space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Premium Hero */}
      <div className="relative rounded-[32px] overflow-hidden bg-slate-900 text-white shadow-2xl">
        {/* Subtle arena background pattern */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/50 via-slate-900 to-indigo-900/50"></div>
        
        <div className="relative z-10 p-8 md:p-14 md:py-20 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 shadow-sm">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-white">Maestro Arena</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight leading-[1.1]">
            Football Quiz
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl font-medium leading-relaxed mb-10">
            Enter the Arena. Test your football knowledge. Become the Maestro.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={startQuiz}
              disabled={transitioning}
              className="group relative inline-flex items-center justify-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-50 transition-all shadow-[0_8px_30px_rgb(255,255,255,0.12)] hover:shadow-[0_8px_30px_rgb(255,255,255,0.25)] hover:-translate-y-1 overflow-hidden"
            >
              {transitioning ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  Entering the Arena...
                </span>
              ) : (
                <>
                  <PlayCircle className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" /> 
                  <span>Play Solo</span>
                </>
              )}
            </button>
            <Link
              to="/quiz/h2h"
              className="group relative inline-flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-500 transition-all shadow-[0_8px_30px_rgb(59,130,246,0.3)] hover:shadow-[0_8px_30px_rgb(59,130,246,0.5)] hover:-translate-y-1 overflow-hidden"
            >
              <Users className="w-6 h-6 text-white group-hover:scale-110 transition-transform" /> 
              <span>Head-to-Head</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Game Setup */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <LayoutGrid className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Quiz Setup</h2>
            </div>
            
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Category</label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as QuizCategory | 'All')}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl px-5 py-4 pr-12 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="All">Mixed Arena (All Categories)</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-5 pointer-events-none text-slate-400">
                    <ChevronRight className="w-5 h-5 rotate-90" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Difficulty</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DIFFICULTIES.map(diff => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer",
                        selectedDifficulty === diff ? "border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm" : "border-slate-100 bg-white hover:border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <span className="font-bold text-base mb-1">{diff}</span>
                      <span className="text-xs font-medium flex items-center gap-1 opacity-80"><Clock className="w-3 h-3" /> {DIFFICULTY_TIMES[diff]}s</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Number of Questions</label>
                <div className="grid grid-cols-4 gap-3">
                  {NUM_QUESTIONS_OPTIONS.map(num => (
                    <button
                      key={num}
                      onClick={() => setNumQuestions(num)}
                      className={cn(
                        "flex items-center justify-center py-3 rounded-2xl border-2 font-bold transition-all",
                        numQuestions === num ? "border-blue-600 bg-blue-50 text-blue-900 shadow-sm" : "border-slate-100 bg-white hover:border-slate-200 text-slate-600"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
        </div>
        
        {/* Sidebar Config & Stats */}
        <div className="space-y-8">
          
          {userStats && (
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2"><Activity className="w-4 h-4"/> Your Arena Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Best Score</p>
                  <p className="text-2xl font-black text-slate-900">{userStats.bestScore}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Played</p>
                  <p className="text-2xl font-black text-slate-900">{userStats.totalQuizzes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">Leaderboard</h3>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setLeaderboardTab('solo')}
                  className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", leaderboardTab === 'solo' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
                >
                  Solo
                </button>
                <button 
                  onClick={() => setLeaderboardTab('h2h')}
                  className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", leaderboardTab === 'h2h' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
                >
                  H2H
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
              {leaderboard.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No records found yet.
                </div>
              ) : (
                leaderboard.map((result, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                      idx === 0 ? "bg-yellow-100 text-yellow-700" : 
                      idx === 1 ? "bg-slate-200 text-slate-700" : 
                      idx === 2 ? "bg-amber-100 text-amber-700" : "bg-white text-slate-400"
                    )}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate text-sm">{result.username || 'Anonymous'}</p>
                      <p className="text-xs text-slate-500 truncate">{result.category}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-blue-600">{result.score}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{result.difficulty}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  const renderResults`;

content = content.replace(landingRegex, newLanding);

fs.writeFileSync('src/pages/FootballQuiz.tsx', content, 'utf8');
