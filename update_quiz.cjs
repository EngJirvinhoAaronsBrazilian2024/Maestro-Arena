const fs = require('fs');
let content = fs.readFileSync('src/pages/FootballQuiz.tsx', 'utf8');

// Add imports
if (!content.includes('stadium_atmosphere')) {
  content = content.replace(
    /import \{ cn \} from '\.\.\/lib\/utils';/,
    `import { cn } from '../lib/utils';\nimport stadiumBg from '../assets/images/stadium_atmosphere_1789303106987.jpg';`
  );
}

const oldHeroRegex = /\{\/\* Premium Hero \*\/\}[\\s\\S]*?(?=<div className="grid grid-cols-1 md:grid-cols-3 gap-8">)/;

const newHero = `      {/* Premium Hero */}
      <div className="relative rounded-[32px] overflow-hidden bg-slate-900 text-white shadow-2xl mb-10">
        
        {/* Cinematic Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
          style={{ backgroundImage: \`url(\${stadiumBg})\` }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-900/80 to-indigo-900/40"></div>
        
        {/* Dynamic Player Silhouette overlay */}
        <div className="absolute bottom-0 right-0 h-full w-[100%] md:w-[50%] z-0 pointer-events-none opacity-50 md:opacity-100 flex items-end justify-end overflow-hidden">
           <div className="relative w-full h-[120%] -mb-4 flex items-end justify-end">
             {/* Player Cutout (e.g., De Bruyne) */}
             <img src="https://media.api-sports.io/football/players/629.png" className="absolute bottom-0 right-[5%] h-[85%] object-contain object-bottom drop-shadow-[0_0_40px_rgba(0,0,0,0.8)] opacity-95 hover:scale-105 transition-transform duration-1000" onError={(e) => (e.currentTarget.style.display = 'none')} />
           </div>
           <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-slate-900"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 p-8 md:p-14 md:py-24 flex flex-col items-center md:items-start text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 shadow-sm">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-white">Maestro Arena</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight leading-[1.1] drop-shadow-md">
            Football Quiz
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 max-w-md font-medium leading-relaxed mb-10 drop-shadow">
            Enter the Arena. Test your football knowledge. Become the Maestro.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <button
              onClick={startQuiz}
              disabled={transitioning}
              className="group relative inline-flex items-center justify-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all shadow-[0_8px_30px_rgb(255,255,255,0.12)] hover:shadow-[0_8px_30px_rgb(255,255,255,0.25)] hover:-translate-y-1 overflow-hidden"
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
              className="group relative inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all shadow-lg hover:-translate-y-1"
            >
              <Users className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" /> 
              <span>Play H2H</span>
            </Link>
          </div>
        </div>
      </div>

`;

if (content.match(oldHeroRegex)) {
  content = content.replace(oldHeroRegex, newHero);
  console.log("Successfully replaced quiz hero section");
} else {
  console.log("Could not find hero regex in FootballQuiz.tsx");
}

fs.writeFileSync('src/pages/FootballQuiz.tsx', content);
