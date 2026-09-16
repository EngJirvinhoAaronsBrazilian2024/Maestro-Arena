const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const heroStart = '{/* Premium Hero Section */}';
const leftContentStart = '        {/* Left Content */}';
const rightContentEnd = '      </div>\n\n      {/* Bento Grid Layout */}';

const startIndex = content.indexOf(heroStart);
const endIndex = content.indexOf(rightContentEnd);

if (startIndex !== -1 && endIndex !== -1) {
  const newHeroStructure = `{/* Premium Hero Section */}
      <div className="relative w-full overflow-hidden rounded-[24px] shadow-sm border border-slate-200 flex flex-col min-h-[650px] md:min-h-[550px] group mb-10 bg-white">
        
        {/* Full Background Image (Desktop & Mobile) */}
        <div className="absolute inset-0 z-0">
           {/* object-[80%_top] on mobile ensures we see faces at the top. md:object-[right_top] on desktop */}
           <img src={lightHeroClean} alt="Football Stars" className="w-full h-full object-cover object-[80%_top] md:object-[right_top]" />
           
           {/* Gradients tailored to keep the top half (faces/shirts) 100% clear */}
           {/* Desktop: A smooth fade from bottom-left corner targeting only where the text sits */}
           <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/70 to-transparent h-[60%] top-auto bottom-0 hidden md:block pointer-events-none"></div>
           <div className="absolute inset-y-0 left-0 w-[50%] bg-gradient-to-r from-white/95 via-white/40 to-transparent hidden md:block pointer-events-none"></div>
           
           {/* Mobile: Gradient strictly at the bottom (shorts level) where the text will be placed */}
           <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-white/95 via-white/80 to-transparent md:hidden pointer-events-none"></div>
        </div>

        {/* Content Box (Pushed to the bottom) */}
        <div className="relative z-10 w-full md:w-[70%] flex flex-col items-start justify-end p-6 sm:p-8 md:p-12 lg:p-16 mt-auto">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 mb-4 md:mb-6 w-max shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-700">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Live Now</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-3 md:mb-4 leading-[1.15] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <span className="text-slate-900">The </span>
            <span className="text-blue-600 relative inline-block">
              Beautiful
              <svg className="absolute -bottom-1 md:-bottom-2 w-full h-2 md:h-3 text-blue-200 -z-10" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 15 Q 50 0 100 15" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/></svg>
            </span>
            <span className="text-slate-900"> Game <br className="hidden md:block" /></span>
            <span className="text-red-600 font-extrabold italic pr-1"> Unites </span>
            <span className="text-slate-900">Us</span>
          </h1>
          
          <p className="text-base md:text-lg text-slate-700 font-medium mb-6 md:mb-8 max-w-lg leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 drop-shadow-sm">
            Follow live matches, explore competitions, play quizzes and get the latest football updates all in one place.
          </p>

          <div className="flex flex-wrap gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 w-full sm:w-auto">
            <Link 
              to="/livescore"
              className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 px-5 py-3 md:px-6 md:py-3.5 bg-blue-600 text-white font-bold rounded-xl transition-all shadow-md hover:bg-blue-700 hover:-translate-y-0.5 whitespace-nowrap"
            >
              Explore Matches
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/quiz"
              className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 px-5 py-3 md:px-6 md:py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-md hover:-translate-y-0.5 shadow-red-500/20 whitespace-nowrap"
            >
              <Trophy className="w-4 h-4 text-white" />
              Enter Arena
            </Link>
          </div>
        </div>
`;

  content = content.substring(0, startIndex) + newHeroStructure + content.substring(endIndex);
  fs.writeFileSync('src/pages/Home.tsx', content);
  console.log('Hero position updated to shorts level!');
} else {
  console.log('Could not find hero markers.');
}
