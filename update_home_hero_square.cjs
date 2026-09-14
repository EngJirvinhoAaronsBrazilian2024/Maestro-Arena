const fs = require('fs');
let homeContent = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const oldHero = `      {/* Premium Hero Section */}
      <div className="relative w-full overflow-hidden rounded-[32px] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col md:flex-row items-stretch min-h-[450px] group">
        
        {/* Background Decorative Elements for the Left Side Text */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-50/90 to-transparent z-0 pointer-events-none md:w-2/3"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50/60 via-transparent to-transparent z-0 pointer-events-none"></div>

        {/* Text Content */}
        <div className="relative z-10 w-full md:w-[55%] p-8 md:p-12 lg:p-16 flex flex-col justify-center text-center md:text-left order-2 md:order-1">
          {userData ? (
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-50/80 backdrop-blur-xl border border-blue-200/60 shadow-sm mb-6 mx-auto md:mx-0 w-max text-blue-900">
              <span className="text-sm font-bold tracking-wide">Welcome back, {userData.displayName} 👋</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-xl border border-slate-200/60 shadow-sm mb-6 mx-auto md:mx-0 w-max">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-800">The World's Best</span>
            </div>
          )}
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-5 leading-[1.15]">
            Football <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">Lives Here</span>
          </h1>
          
          <p className="text-base md:text-lg text-slate-500 mb-8 max-w-md mx-auto md:mx-0 leading-relaxed font-medium">
            Follow the stars. Track every match. Test your football knowledge.
          </p>

          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <Link to="/livescore" className="px-8 py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] hover:-translate-y-0.5">
              Live Scores
            </Link>
            <Link to="/news" className="px-8 py-3.5 rounded-2xl bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-0.5">
              Read News
            </Link>
          </div>
        </div>

        {/* Image / Graphic Content */}
        <div className="relative z-10 w-full md:w-[45%] h-64 sm:h-80 md:h-auto overflow-hidden rounded-t-[32px] md:rounded-tl-none md:rounded-r-[32px] order-1 md:order-2">
           {/* Subtle gradient overlay to blend the image seamlessly into the text area on desktop */}
           <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent md:bg-gradient-to-r md:from-slate-50 md:via-transparent md:to-transparent z-10 pointer-events-none"></div>
           
           <div className="absolute inset-0 w-full h-full overflow-hidden">
             {slides.map((slide, index) => (
               <img 
                 key={index}
                 src={slide} 
                 alt={\`Football Slide \${index + 1}\`} 
                 className="absolute inset-0 w-full h-full object-cover object-center md:object-right transition-transform duration-700 ease-in-out"
                 style={{ transform: \`translateX(\${(index - currentSlide) * 100}%)\` }}
               />
             ))}
           </div>
           
           {/* Golden subtle overlay for premium feel */}
           <div className="absolute inset-0 mix-blend-overlay opacity-20 bg-gradient-to-tr from-amber-200 to-transparent pointer-events-none"></div>
        </div>
      </div>`;

const newHero = `      {/* Premium Hero Section */}
      <div className="relative w-full overflow-hidden rounded-[32px] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col md:flex-row items-center justify-between min-h-[450px] group p-8 md:p-12 lg:p-16 gap-12">
        
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50/60 via-transparent to-transparent z-0 pointer-events-none"></div>

        {/* Text Content */}
        <div className="relative z-10 w-full md:w-[50%] flex flex-col justify-center text-center md:text-left order-2 md:order-1">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-xl border border-slate-200/60 shadow-sm mb-6 mx-auto md:mx-0 w-max">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-800">The World's Best</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-5 leading-[1.15]">
            Football <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">Lives Here</span>
          </h1>
          
          <p className="text-base md:text-lg text-slate-500 mb-8 max-w-md mx-auto md:mx-0 leading-relaxed font-medium">
            Follow the stars. Track every match. Test your football knowledge.
          </p>

          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <Link to="/livescore" className="px-8 py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] hover:-translate-y-0.5">
              Live Scores
            </Link>
            <Link to="/news" className="px-8 py-3.5 rounded-2xl bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-0.5">
              Read News
            </Link>
          </div>
        </div>

        {/* Image / Graphic Content */}
        <div className="relative z-10 w-full md:w-[45%] flex flex-col items-center md:items-end order-1 md:order-2">
           {/* Welcoming Personalized Greeting */}
           {userData && (
             <div className="mb-4 w-full max-w-md text-left md:text-right">
               <span className="inline-block px-5 py-2 rounded-full bg-blue-50/80 backdrop-blur-xl border border-blue-200/60 shadow-sm text-blue-900 text-sm font-bold tracking-wide">
                 Welcome back, {userData.displayName} 👋
               </span>
             </div>
           )}
           
           {/* Square Image Grid Card */}
           <div className="relative w-full max-w-md aspect-square overflow-hidden rounded-[32px] shadow-2xl border-4 border-white/80 bg-slate-100">
             <div className="absolute inset-0 w-full h-full overflow-hidden">
               {slides.map((slide, index) => (
                 <img 
                   key={index}
                   src={slide} 
                   alt={\`Football Slide \${index + 1}\`} 
                   className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-in-out"
                   style={{ transform: \`translateX(\${(index - currentSlide) * 100}%)\` }}
                 />
               ))}
             </div>
             {/* Golden subtle overlay for premium feel */}
             <div className="absolute inset-0 mix-blend-overlay opacity-20 bg-gradient-to-tr from-amber-200 to-transparent pointer-events-none"></div>
           </div>
        </div>
      </div>`;

homeContent = homeContent.replace(oldHero, newHero);

fs.writeFileSync('src/pages/Home.tsx', homeContent, 'utf8');
