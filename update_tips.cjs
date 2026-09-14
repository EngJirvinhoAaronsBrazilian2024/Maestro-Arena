const fs = require('fs');
let content = fs.readFileSync('src/pages/Tips.tsx', 'utf8');

if (!content.includes('stadium_atmosphere')) {
  content = content.replace(
    /import \{ ArrowRight, ChevronLeft, ChevronRight, Calendar, AlertCircle, X, ExternalLink, Lock \} from 'lucide-react';/,
    `import { ArrowRight, ChevronLeft, ChevronRight, Calendar, AlertCircle, X, ExternalLink, Lock } from 'lucide-react';\nimport stadiumBg from '../assets/images/stadium_atmosphere_1789303106987.jpg';\nimport { FootballEmptyState } from '../components/ui/FootballEmptyState';`
  );
}

const headerRegex = /\{\/\* HEADER \*\/\}[\\s\\S]*?(?=\{\/\* TABS \*\*\/|\{\/\* TABS \*\/)/;

const newHeader = `      {/* HEADER */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden mb-6 border border-slate-800 flex flex-col md:flex-row items-center md:items-end justify-between min-h-[220px]">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-50 mix-blend-overlay"
          style={{ backgroundImage: \`url(\${stadiumBg})\` }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>
        
        {/* Player Cutout (e.g. Salah 306) */}
        <div className="absolute bottom-0 right-0 h-full w-[60%] md:w-[40%] z-0 pointer-events-none opacity-60 md:opacity-100 flex items-end justify-end overflow-hidden">
           <img src="https://media.api-sports.io/football/players/306.png" className="absolute bottom-0 right-[5%] md:right-10 h-[115%] object-contain object-bottom drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] opacity-95 grayscale mix-blend-luminosity hover:grayscale-0 hover:mix-blend-normal transition-all duration-700" onError={(e) => (e.currentTarget.style.display = 'none')} />
           <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-slate-900"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 w-full text-center md:text-left flex-1 md:pr-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-500/30 text-xs font-bold uppercase tracking-widest text-amber-200 mb-4 shadow-sm mx-auto md:mx-0">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse"></span>
            Daily Predictions
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 drop-shadow-md">
            Maestro Arena Tips
          </h1>
          <p className="text-slate-400 mb-8 max-w-sm mx-auto md:mx-0 text-sm md:text-base font-medium">Expert football analysis, match previews, and statistical selections.</p>
          
          <div className="flex items-center justify-center md:justify-start gap-4 text-sm font-medium">
            <button onClick={handlePrevDay} className="p-2.5 bg-slate-800/80 hover:bg-slate-700 backdrop-blur border border-slate-700 rounded-full transition shadow-lg text-slate-300 hover:text-white"><ChevronLeft size={20}/></button>
            <div className="bg-slate-800/80 backdrop-blur px-6 py-2.5 rounded-full border border-slate-700 min-w-[160px] text-center font-bold tracking-wide shadow-lg">
              {isToday ? <span className="text-amber-400">TODAY</span> : new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
            <button onClick={handleNextDay} className="p-2.5 bg-slate-800/80 hover:bg-slate-700 backdrop-blur border border-slate-700 rounded-full transition shadow-lg disabled:opacity-50 text-slate-300 hover:text-white" disabled={isToday}><ChevronRight size={20}/></button>
          </div>
        </div>
      </div>

`;

content = content.replace(headerRegex, newHeader);

// Update Empty State
const emptyStateRegex = /<div className=\\\"text-center py-16 bg-white rounded-xl shadow-sm border border-slate-100\\\">[\\s\\S]*?<\/div>/;
const newEmptyState = `<FootballEmptyState 
            icon={Calendar} 
            title="No Tips Available" 
            message={category === 'all' 
              ? "There are no predictions available for this date yet. Please check back later." 
              : "There are no predictions for this specific category today."} 
          />`;

content = content.replace(emptyStateRegex, newEmptyState);

fs.writeFileSync('src/pages/Tips.tsx', content);
