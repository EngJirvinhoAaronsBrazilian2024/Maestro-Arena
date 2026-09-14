const fs = require('fs');
let code = fs.readFileSync('src/pages/TeamProfile.tsx', 'utf8');

code = code.replace(
  /className="h-12 w-12 rounded-full object-cover bg-slate-100"/,
  'className="h-12 w-12 rounded-full object-cover bg-slate-100 shadow-sm border border-slate-100"'
);

fs.writeFileSync('src/pages/TeamProfile.tsx', code, 'utf8');
