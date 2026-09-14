const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

code = code.replace(
  /<div className="absolute inset-0 bg-gradient-to-t from-black\/40 via-transparent to-black\/10 mix-blend-overlay"><\/div>/,
  '<div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>'
);

fs.writeFileSync('src/pages/Home.tsx', code, 'utf8');
