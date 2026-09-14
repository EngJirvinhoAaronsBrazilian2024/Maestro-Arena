const fs = require('fs');

let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Add import
const newImport = "import lightHeroTrio from '../assets/images/light_hero_trio_1789407442014.jpg';";
if (!content.includes('lightHeroTrio')) {
  content = content.replace(
    /import premiumHeroAlt from '\.\.\/assets\/images\/premium_hero_players_alt_1789403921046\.jpg';/,
    `import premiumHeroAlt from '../assets/images/premium_hero_players_alt_1789403921046.jpg';\n${newImport}`
  );
}

const heroStart = '{/* Premium Hero Section */}';
const heroEnd = '        {/* Right Content */}'; // Before right content, let's find the end of the hero
const sectionEnd = '      </div>\n\n      {/* Bento Grid Layout */}';

const startIndex = content.indexOf(heroStart);
const endIndex = content.indexOf(sectionEnd);

if (startIndex !== -1 && endIndex !== -1) {
  const newHero = `{/* Premium Hero Section */}
      <div className="relative w-full overflow-hidden rounded-[24px] shadow-sm border border-slate-200 flex flex-col md:flex-row min-h-[460px] group mb-10 bg-slate-50">
        
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
           <img src={lightHeroTrio} alt="Football Stars" className="w-full h-full object-cover object-right opacity-100" />
           {/* Gradient overlay to blend left side into the light background and ensure text readability */}
           <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent md:via-white/70"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-white/90 md:from-transparent to-transparent"></div>
        </div>

        {/* Left Content */}
        <div className="relative z-10 w-full md:w-[60%] flex flex-col items-start justify-center p-8 md:p-12 lg:p-16 pt-16">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-slate-200 mb-6 w-max shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-700">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Live Now</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-4 leading-[1.15] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            The Beautiful Game <br className="hidden md:block" /> Unites Us
          </h1>
          
          <p className="text-base md:text-lg text-slate-600 mb-8 max-w-lg leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
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
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-xl transition-all shadow-sm hover:-translate-y-0.5"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              Enter Arena
            </Link>
          </div>
        </div>

        {/* Right Content */}
        <div className="relative z-10 w-full md:w-[40%] hidden md:flex">
            {/* Kept empty to let the background image shine on the right side */}
        </div>`;
      
  const newContent = content.substring(0, startIndex) + newHero + content.substring(endIndex);
  fs.writeFileSync('src/pages/Home.tsx', newContent);
  console.log('Hero updated successfully!');
} else {
  console.log('Could not find hero markers.');
}
