const fs = require('fs');
let code = fs.readFileSync('src/pages/Login.tsx', 'utf8');

code = code.replace(
  /<div className="relative flex min-h-screen w-full items-center justify-center p-4 md:p-12 lg:p-24 overflow-hidden animate-in fade-in duration-1000 bg-slate-50"><\/div>/,
  '<div className="relative flex min-h-screen w-full items-center justify-center p-4 md:p-12 lg:p-24 overflow-hidden animate-in fade-in duration-1000 bg-slate-50">'
);

fs.writeFileSync('src/pages/Login.tsx', code, 'utf8');
