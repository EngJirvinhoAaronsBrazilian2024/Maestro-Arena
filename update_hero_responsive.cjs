const fs = require('fs');

let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const heroStart = '{/* Premium Hero Section */}';
const leftContentStart = '        {/* Left Content */}';

const startIndex = content.indexOf(heroStart);
const endIndex = content.indexOf(leftContentStart);

if (startIndex !== -1 && endIndex !== -1) {
  const newHeroStructure = `{/* Premium Hero Section */}
      <div className="relative w-full overflow-hidden rounded-[24px] shadow-sm border border-slate-200 flex flex-col md:flex-row min-h-[460px] group mb-10 bg-white">
        
        {/* Mobile Image (Visible only on small screens) */}
        <div className="w-full h-[300px] sm:h-[350px] relative md:hidden shrink-0">
           <img src={lightHeroTrio} alt="Football Stars" className="w-full h-full object-cover object-[center_top]" />
           {/* Bottom gradient to blend into the text area smoothly */}
           <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
        </div>

        {/* Desktop Background Image (Hidden on small screens) */}
        <div className="absolute inset-0 z-0 hidden md:block">
           <img src={lightHeroTrio} alt="Football Stars" className="w-full h-full object-cover object-right" />
           {/* Gradient overlay to blend left side into the light background and ensure text readability */}
           <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent md:via-white/70"></div>
        </div>

`;
  
  content = content.substring(0, startIndex) + newHeroStructure + content.substring(endIndex);
  
  // Also adjust the padding on the left content so it looks better on mobile
  content = content.replace(
    '<div className="relative z-10 w-full md:w-[60%] flex flex-col items-start justify-center p-8 md:p-12 lg:p-16 pt-16">',
    '<div className="relative z-10 w-full md:w-[60%] flex flex-col items-start justify-center p-6 sm:p-8 md:p-12 lg:p-16 -mt-10 md:mt-0">'
  );

  fs.writeFileSync('src/pages/Home.tsx', content);
  console.log('Hero made mobile responsive successfully!');
} else {
  console.log('Could not find hero markers.');
}
