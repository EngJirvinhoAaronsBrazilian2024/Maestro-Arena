const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

code = code.replace(
  /<span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 hidden md:inline-block"/,
  '<span className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900"'
);

fs.writeFileSync('src/components/layout/Header.tsx', code, 'utf8');
