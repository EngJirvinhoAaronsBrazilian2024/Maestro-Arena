const fs = require('fs');
let homeContent = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Add useAuth and imports
if (!homeContent.includes('useAuth')) {
  homeContent = homeContent.replace(
    "import { getLeaguePriority } from '../lib/utils';",
    "import { getLeaguePriority } from '../lib/utils';\nimport { useAuth } from '../context/AuthContext';\nimport { useState, useEffect } from 'react';"
  );
} else if (!homeContent.includes('useState')) {
    homeContent = homeContent.replace(
    "import React, { useMemo } from 'react';",
    "import React, { useMemo, useState, useEffect } from 'react';"
  );
}

// Add image imports
const imgImports = `
import imgStadium from '../assets/images/football_slide_stadium_1788810479046.jpg';
import imgTrophy from '../assets/images/football_slide_champions_trophy_1788810497413.jpg';
import imgTactics from '../assets/images/football_slide_tactics_1788810511995.jpg';
import imgFans from '../assets/images/football_slide_fans_1788810529547.jpg';
import imgBoots from '../assets/images/football_slide_boots_1788810542292.jpg';
import imgNet from '../assets/images/football_slide_ball_net_1788810554602.jpg';
import imgWorldCup from '../assets/images/football_slide_world_cup_1788810563459.jpg';
`;
homeContent = homeContent.replace(
  "import heroImage from '../assets/images/football_stars_hero_2026_1788809874968.jpg';",
  "import heroImage from '../assets/images/football_stars_hero_2026_1788809874968.jpg';" + imgImports
);

// Add useAuth and Slide Logic inside Home component
const hooksStr = `
  const { user, userData } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    heroImage,
    imgStadium,
    imgTrophy,
    imgFans,
    imgBoots,
    imgNet,
    imgTactics,
    imgWorldCup
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [slides.length]);
`;

homeContent = homeContent.replace(
  "const { matches: liveMatches, isLoading: isLoadingLive, isError: isErrorLive } = useLiveMatches();",
  hooksStr + "\n  const { matches: liveMatches, isLoading: isLoadingLive, isError: isErrorLive } = useLiveMatches();"
);

// Add Greeting
const oldBadge = `<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-xl border border-slate-200/60 shadow-sm mb-6 mx-auto md:mx-0 w-max">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-800">The World's Best</span>
          </div>`;

const newBadge = `          {userData ? (
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-50/80 backdrop-blur-xl border border-blue-200/60 shadow-sm mb-6 mx-auto md:mx-0 w-max text-blue-900">
              <span className="text-sm font-bold tracking-wide">Welcome back, {userData.displayName} 👋</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-xl border border-slate-200/60 shadow-sm mb-6 mx-auto md:mx-0 w-max">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-800">The World's Best</span>
            </div>
          )}`;

homeContent = homeContent.replace(oldBadge, newBadge);

// Add image slider
const oldImg = `<img 
             src={heroImage} 
             alt="Football Superstars" 
             className="absolute inset-0 w-full h-full object-cover object-center md:object-right transition-transform duration-[1.5s] ease-out group-hover:scale-105"
           />`;

const newImg = `
           {slides.map((slide, index) => (
             <img 
               key={index}
               src={slide} 
               alt={\`Football Slide \${index + 1}\`} 
               className={\`absolute inset-0 w-full h-full object-cover object-center md:object-right transition-opacity duration-1000 ease-in-out \${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}\`}
             />
           ))}
`;

homeContent = homeContent.replace(oldImg, newImg);

fs.writeFileSync('src/pages/Home.tsx', homeContent, 'utf8');
