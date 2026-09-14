const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const oldHeroRegex = /\{\/\* Premium Hero Section \*\/\}[\\s\\S]*?(?=\{\/\* Bento Grid Layout \*\/)/;

const newHero = `      {/* Premium Hero Section */}
      <div className="relative w-full overflow-hidden rounded-[32px] shadow-2xl border border-slate-800 flex flex-col items-center min-h-[500px] group mb-10 bg-slate-900">
        
        {/* Dynamic Backgrounds */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center mix-blend-overlay opacity-60"
          style={{ backgroundImage: \`url(\${stadiumBg})\` }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-900/40"></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80"></div>
        
        {/* Player Cutouts on the right */}
        <div className="absolute bottom-0 right-0 h-full w-[100%] md:w-[60%] z-0 pointer-events-none opacity-40 md:opacity-100 flex items-end justify-end overflow-hidden">
           <div className="relative w-full h-[110%] -mb-2 mr-0 md:-mr-12 flex items-end justify-end drop-shadow-[0_0_30px_rgba(0,0,0,0.6)]">
             {/* Player 1 */}
             <img src="https://media.api-sports.io/football/players/738.png" className="absolute bottom-0 right-[25%] h-[75%] object-contain object-bottom opacity-90 drop-shadow-2xl grayscale mix-blend-luminosity hover:mix-blend-normal transition-all duration-700 hover:grayscale-0" onError={(e) => (e.currentTarget.style.display = 'none')} />
             {/* Player 2 */}
             <img src="https://media.api-sports.io/football/players/278.png" className="absolute bottom-0 right-[5%] h-[85%] object-contain object-bottom opacity-90 drop-shadow-2xl grayscale mix-blend-luminosity hover:mix-blend-normal transition-all duration-700 hover:grayscale-0" onError={(e) => (e.currentTarget.style.display = 'none')} />
             {/* Player 3 */}
             <img src="https://media.api-sports.io/football/players/154.png" className="absolute bottom-0 right-[-10%] h-[95%] object-contain object-bottom drop-shadow-[0_0_40px_rgba(0,0,0,1)] grayscale mix-blend-luminosity hover:mix-blend-normal transition-all duration-700 hover:grayscale-0" onError={(e) => (e.currentTarget.style.display = 'none')} />
           </div>
           {/* Atmospheric Fade */}
           <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-slate-900"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 w-full flex flex-col items-start justify-center flex-1 p-6 sm:p-8 md:p-14 lg:p-20 pt-16 sm:pt-20">
          
          {userData && (
            <div className="mb-6 inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white shadow-xl font-bold tracking-wide">
              <span>👋</span>
              <span>Welcome back, {userData.displayName}!</span>
            </div>
          )}

          <div className="max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-500/30 mb-6 w-max shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">Maestro Arena</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1] drop-shadow-md">
              The World's Best <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-emerald-300">Football Platform</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-lg leading-relaxed font-medium drop-shadow">
              Follow the stars, track live scores, test your knowledge, and access premium daily tips.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link 
                to="/livescore"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:-translate-y-0.5"
              >
                Live Scores
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                to="/quiz"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold rounded-2xl transition-all shadow-lg hover:-translate-y-0.5"
              >
                Play Quiz
              </Link>
            </div>
          </div>
        </div>
      </div>

`;

if (content.match(oldHeroRegex)) {
  content = content.replace(oldHeroRegex, newHero);
  console.log("Successfully replaced hero section");
} else {
  console.log("Could not find hero regex in Home.tsx");
}

fs.writeFileSync('src/pages/Home.tsx', content);
