const fs = require('fs');

let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Add import
if (!content.includes('premiumHeroAlt')) {
  content = content.replace(
    /import madridTrioHero from '\.\.\/assets\/images\/madrid_trio_hero_1789305202373\.jpg';/,
    `import madridTrioHero from '../assets/images/madrid_trio_hero_1789305202373.jpg';\nimport premiumHeroAlt from '../assets/images/premium_hero_players_alt_1789403921046.jpg';`
  );
}

const heroStart = '{/* Premium Hero Section */}';
const heroEnd = '{/* Bento Grid Layout */}';

const startIndex = content.indexOf(heroStart);
const endIndex = content.indexOf(heroEnd);

if (startIndex !== -1 && endIndex !== -1) {
  const newHero = `{/* Premium Hero Section */}
      <div className="relative w-full overflow-hidden rounded-[24px] shadow-2xl flex flex-col md:flex-row min-h-[460px] group mb-10 bg-[#7B0813]">
        
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
           <img src={premiumHeroAlt} alt="Football Stars" className="w-full h-full object-cover object-right opacity-100" />
           {/* Gradient overlay to blend left side into the dark red and ensure text readability */}
           <div className="absolute inset-0 bg-gradient-to-r from-[#8b0000] via-[#8b0000]/80 to-transparent md:via-[#8b0000]/60"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-[#5a0000]/90 md:from-transparent to-transparent"></div>
        </div>

        {/* Left Content */}
        <div className="relative z-10 w-full md:w-[60%] flex flex-col items-start justify-center p-8 md:p-12 lg:p-16 pt-16">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/40 backdrop-blur-md border border-red-400/30 mb-6 w-max shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-700">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-red-100">Live Now</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 leading-[1.15] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            The Beautiful Game <br className="hidden md:block" /> Unites Us
          </h1>
          
          <p className="text-base md:text-lg text-red-100/90 mb-8 max-w-lg leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            Follow live matches, explore competitions, play quizzes and get the latest football updates all in one place.
          </p>

          <div className="flex flex-wrap gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <Link 
              to="/livescore"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 text-white font-bold rounded-xl transition-all shadow-lg hover:bg-red-500 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-900/20"
            >
              Explore Matches
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/quiz"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Trophy className="w-4 h-4" />
              Enter Arena
            </Link>
          </div>
        </div>

        {/* Right Content */}
        <div className="relative z-10 w-full md:w-[40%] hidden md:flex">
            {/* Kept empty to let the background image (with the 4 players) shine on the right side */}
        </div>
      </div>

      `;
      
  const newContent = content.substring(0, startIndex) + newHero + content.substring(endIndex);
  fs.writeFileSync('src/pages/Home.tsx', newContent);
  console.log('Hero updated successfully!');
} else {
  console.log('Could not find hero markers.');
}
