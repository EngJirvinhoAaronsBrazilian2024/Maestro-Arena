const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const heroStart = '{/* Premium Hero Section */}';
const rightContentStart = '        {/* Right Content */}';

const startIndex = content.indexOf(heroStart);
const endIndex = content.indexOf(rightContentStart);

if (startIndex !== -1 && endIndex !== -1) {
  const newHeroStructure = `{/* Premium Hero Section */}
      <div className="relative w-full overflow-hidden rounded-[24px] shadow-sm border border-slate-200 flex flex-col md:flex-row min-h-[500px] md:min-h-[460px] group mb-10 bg-white">
        
        {/* Full Background Image (Desktop & Mobile) */}
        <div className="absolute inset-0 z-0">
           {/* We use object-[85%_center] on mobile to keep players visible, and object-right on desktop */}
           <img src={lightHeroClean} alt="Football Stars" className="w-full h-full object-cover object-[80%_center] md:object-right" />
           {/* Gradients to ensure text readability on all screen sizes */}
           {/* Desktop: fade from left to right */}
           <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent md:via-white/70 hidden md:block"></div>
           {/* Mobile: stronger white gradient from bottom and left to ensure text stands out */}
           <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent md:hidden"></div>
           <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-transparent md:hidden"></div>
        </div>

        {/* Left Content */}
        <div className="relative z-10 w-full md:w-[60%] flex flex-col items-start justify-center p-6 sm:p-8 md:p-12 lg:p-16 pt-24 md:pt-16">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 mb-6 w-max shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-700">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Live Now</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 leading-[1.15] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <span className="text-slate-900">The </span>
            <span className="text-blue-600 relative inline-block">
              Beautiful
              <svg className="absolute -bottom-2 w-full h-3 text-blue-200 -z-10" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 15 Q 50 0 100 15" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/></svg>
            </span>
            <span className="text-slate-900"> Game <br className="hidden md:block" /></span>
            <span className="text-red-600 font-extrabold italic pr-1"> Unites </span>
            <span className="text-slate-900">Us</span>
          </h1>
          
          <p className="text-base md:text-lg text-slate-700 font-medium mb-8 max-w-lg leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 drop-shadow-sm">
            Follow live matches, explore competitions, play quizzes and get the latest football updates all in one place.
          </p>

          <div className="flex flex-wrap gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <Link 
              to="/livescore"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white font-bold rounded-xl transition-all shadow-md hover:bg-blue-700 hover:-translate-y-0.5"
            >
              Explore Matches
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/quiz"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-md hover:-translate-y-0.5 shadow-red-500/20"
            >
              <Trophy className="w-4 h-4 text-white" />
              Enter Arena
            </Link>
          </div>
        </div>

        `;

  // We should also remove Right Content block up to the Bento grid.
  const bentoGridStart = '{/* Bento Grid Layout */}';
  const bentoIndex = content.indexOf(bentoGridStart);
  
  if (bentoIndex !== -1) {
      content = content.substring(0, startIndex) + newHeroStructure + content.substring(bentoIndex);
      fs.writeFileSync('src/pages/Home.tsx', content);
      console.log('Hero background fixed successfully!');
  } else {
      console.log('Could not find bento index');
  }
} else {
  console.log('Could not find hero markers.');
}
