const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

code = code.replace(
  /<img src={logo} alt="Maestro Arena Logo" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" \/>/,
  '<img src={logo} alt="Maestro Arena Logo" className="h-12 w-12 sm:h-14 sm:w-14 object-contain shadow-sm rounded-lg" />'
);

code = code.replace(
  /<span className="text-2xl sm:text-3xl font-extrabold tracking-tight hidden md:inline-block" style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "-0.02em" }}>Maestro Arena<\/span>/,
  '<span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 hidden md:inline-block" style={{ fontFamily: `\'Playfair Display\', serif`, letterSpacing: "-0.02em" }}>Maestro Arena</span>'
);

fs.writeFileSync('src/components/layout/Header.tsx', code, 'utf8');
