const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

// The user's logo image already contains the text "Maestro Arena".
// So we need to remove the text span next to the logo, and make the logo itself bigger.
// Old: <img src={logo} alt="Maestro Arena Logo" className="h-12 w-12 sm:h-14 sm:w-14 object-contain shadow-sm rounded-lg" />
//      <span className="hidden lg:inline-block text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900" style={{ fontFamily: `'Playfair Display', serif`, letterSpacing: "-0.02em" }}>Maestro Arena</span>

code = code.replace(
  /<img src=\{logo\} alt="Maestro Arena Logo" className="h-12 w-12 sm:h-14 sm:w-14 object-contain shadow-sm rounded-lg" \/>\s*<span className="hidden lg:inline-block text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900" style=\{\{ fontFamily: `'Playfair Display', serif`, letterSpacing: "-0.02em" \}\}>Maestro Arena<\/span>/,
  '<img src={logo} alt="Maestro Arena Logo" className="h-16 w-auto sm:h-20 object-contain drop-shadow-sm" />'
);

// We should also remove any background/rounded classes from the logo since it looks like a clean transparent/white logo they want displayed naturally.

fs.writeFileSync('src/components/layout/Header.tsx', code, 'utf8');
