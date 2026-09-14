const fs = require('fs');
let homeContent = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Remove the external greeting
const externalGreeting = `      {/* Welcoming Personalized Greeting */}
      {userData && (
        <div className="w-full">
          <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white shadow-sm border border-slate-200 text-slate-800 text-sm font-bold tracking-wide">
            Welcome back, {userData.displayName} 👋
          </span>
        </div>
      )}`;
homeContent = homeContent.replace(externalGreeting, '');

// Update Hero Section
const oldHeroStart = `      {/* Premium Hero Section */}
      <div className="relative w-full overflow-hidden rounded-[32px] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col md:flex-row items-center justify-between min-h-[450px] group p-8 md:p-12 lg:p-16 gap-8 md:gap-12">
        
        {/* Background Decorative Elements */}`;

const newHeroStart = `      {/* Premium Hero Section */}
      <div className="relative w-full overflow-hidden rounded-[32px] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col items-center min-h-[450px] group p-6 sm:p-8 md:p-12 lg:p-16 gap-8">
        
        {/* Background Decorative Elements */}`;
homeContent = homeContent.replace(oldHeroStart, newHeroStart);

// Update internal structure to use a wrapper for desktop columns
const textAndImageRegex = /\{\/\* Text Content \*\/\}[\s\S]*?mix-blend-overlay opacity-30.*?<\/div>\s*<\/div>\s*<\/div>/m;
const match = homeContent.match(textAndImageRegex);

if (match) {
  let content = match[0];
  
  // Extract text content and image content
  const textContentRegex = /\{\/\* Text Content \*\/\}[\s\S]*?<\/div>\s*<\/div>/;
  const imageContentRegex = /\{\/\* Image \/ Graphic Content \*\/\}[\s\S]*?<\/div>\s*<\/div>/;
  
  let textContent = content.match(textContentRegex)[0];
  let imageContent = content.match(imageContentRegex)[0];
  
  // Clean up order classes and width classes
  textContent = textContent.replace('md:w-[50%] flex flex-col justify-center text-center md:text-left order-2 md:order-1', 'md:w-[50%] flex flex-col justify-center text-center md:text-left');
  imageContent = imageContent.replace('md:w-[45%] flex flex-col items-center md:items-end order-1 md:order-2', 'md:w-[45%] flex flex-col items-center md:items-end');
  
  const newStructure = `
        {/* Welcoming Personalized Greeting - Always on Top */}
        {userData && (
          <div className="relative z-10 w-full text-center md:text-left">
            <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-50/80 backdrop-blur-xl border border-blue-200/60 shadow-sm text-blue-900 text-sm font-bold tracking-wide">
              Welcome back, {userData.displayName} 👋
            </span>
          </div>
        )}

        <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 flex-1">
          ${textContent}
          ${imageContent}
        </div>
      </div>`;
      
  homeContent = homeContent.replace(match[0], newStructure);
}

fs.writeFileSync('src/pages/Home.tsx', homeContent, 'utf8');
