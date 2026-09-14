const fs = require('fs');

// 1. Fix Logo on Login Page
let loginCode = fs.readFileSync('src/pages/Login.tsx', 'utf8');
loginCode = loginCode.replace(
  /<div className="mb-4 overflow-hidden rounded-\[14px\] border border-slate-200 shadow-sm bg-white">/,
  '<div className="mb-4 overflow-hidden rounded-[24px] border-2 border-slate-100 shadow-xl bg-white p-3">'
);
loginCode = loginCode.replace(
  /<img src={logo} alt="Maestro Arena Logo" className="h-16 w-16 object-cover" \/>/,
  '<img src={logo} alt="Maestro Arena Logo" className="h-28 w-28 sm:h-32 sm:w-32 object-contain" />'
);
fs.writeFileSync('src/pages/Login.tsx', loginCode, 'utf8');

// 2. Add logo to Register Page to match if possible, or just skip it since request specified "logo which is on the login page".

