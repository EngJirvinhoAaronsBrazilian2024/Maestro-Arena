const fs = require('fs');

// 1. Fix Header - hide text on mobile to make room for icons
let headerCode = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

// Hide text on mobile (sm:hidden md:inline-block) so icons fit
headerCode = headerCode.replace(
  /<span className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900"/,
  '<span className="hidden sm:inline-block text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900"'
);

// Make sure icons container doesn't overflow
headerCode = headerCode.replace(
  /<div className="flex flex-1 items-center justify-end space-x-2 relative">/,
  '<div className="flex flex-1 items-center justify-end space-x-1 sm:space-x-2 relative">'
);

fs.writeFileSync('src/components/layout/Header.tsx', headerCode, 'utf8');

// 2. Fix Login - remove text, only big logo
let loginCode = fs.readFileSync('src/pages/Login.tsx', 'utf8');

// Remove the Maestro Arena text on login
loginCode = loginCode.replace(
  /<h1 className="text-2xl font-bold tracking-tight text-slate-900" style=\{\{ fontFamily: "'Playfair Display', serif", letterSpacing: "-0.02em" \}\}>Maestro Arena<\/h1>/,
  ''
);
// Remove the "Your world of sports..." text
loginCode = loginCode.replace(
  /<p className="mt-2 text-sm font-medium text-slate-500">\s*Your world of sports, all in one place.\s*<\/p>/,
  ''
);

fs.writeFileSync('src/pages/Login.tsx', loginCode, 'utf8');

