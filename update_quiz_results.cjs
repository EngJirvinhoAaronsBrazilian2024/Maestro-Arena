const fs = require('fs');
let content = fs.readFileSync('src/pages/FootballQuiz.tsx', 'utf8');

const oldResultsRegex = /\{\/\* Celebrate background \*\/\}[\\s\\S]*?(?=<div className="p-8 md:p-12">)/;

const newResults = `      {/* Celebrate background */}
          <div className="relative overflow-hidden bg-slate-900 px-8 py-16 md:px-16 md:py-24 text-center">
             <div 
               className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
               style={{ backgroundImage: \`url(\${stadiumBg})\` }}
             />
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900"></div>
             
             {/* Player Celebration Cutout (e.g. Ronaldo 874) */}
             <div className="absolute bottom-0 right-0 md:right-10 h-[120%] w-[50%] z-0 pointer-events-none opacity-40 md:opacity-80 flex items-end justify-end">
                <img src="https://media.api-sports.io/football/players/874.png" className="absolute bottom-0 right-0 h-[85%] object-contain object-bottom drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] opacity-95 transition-all duration-1000 grayscale mix-blend-luminosity hover:grayscale-0 hover:mix-blend-normal" onError={(e) => (e.currentTarget.style.display = 'none')} />
             </div>
             
             <div className="relative z-10 flex flex-col items-center">
               <div className="inline-flex items-center justify-center p-4 bg-white/10 rounded-full backdrop-blur-md mb-6 border border-white/20 shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                 <Trophy className="w-12 h-12 text-yellow-400" />
               </div>
               <h2 className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-2">Quiz Complete</h2>
               <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6 drop-shadow-md">Your Arena Performance</h1>
               <div className={cn("inline-block px-5 py-2 rounded-full text-sm font-bold tracking-widest uppercase border backdrop-blur-md", perfColor)}>
                 {performanceMsg}
               </div>
             </div>
          </div>
          
          `;

if (content.match(oldResultsRegex)) {
  content = content.replace(oldResultsRegex, newResults);
  console.log("Successfully replaced quiz results section");
} else {
  console.log("Could not find results regex in FootballQuiz.tsx");
}

fs.writeFileSync('src/pages/FootballQuiz.tsx', content);
