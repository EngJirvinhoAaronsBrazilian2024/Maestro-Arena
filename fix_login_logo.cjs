const fs = require('fs');
let code = fs.readFileSync('src/pages/Login.tsx', 'utf8');

// The user wants ONLY the logo to be visible in the middle, and big enough.
// We should remove the background card, the borders, and just have a clean login experience,
// or perhaps they mean the logo itself should be very large and not have a white box around it if it's already a logo.
// Wait, "I want this only to be my logo of the app dont add other surrounding components should be visible enough"

// Looking at the code:
// <div className="mb-8 flex flex-col items-center text-center">
//   <div className="mb-4 overflow-hidden rounded-[24px] border-2 border-slate-100 shadow-xl bg-white p-3">
//     <img src={logo} alt="Maestro Arena Logo" className="h-28 w-28 sm:h-32 sm:w-32 object-contain" />
//   </div>
// </div>

// Let's remove the bounding box (border-2 border-slate-100 shadow-xl bg-white p-3) so the logo sits cleanly.
// And make the image bigger.

code = code.replace(
  /<div className="mb-4 overflow-hidden rounded-\[24px\] border-2 border-slate-100 shadow-xl bg-white p-3">\s*<img src=\{logo\} alt="Maestro Arena Logo" className="h-28 w-28 sm:h-32 sm:w-32 object-contain" \/>\s*<\/div>/,
  '<div className="mb-6 flex justify-center w-full"><img src={logo} alt="Maestro Arena Logo" className="h-40 w-40 sm:h-48 sm:w-48 md:h-56 md:w-56 object-contain" /></div>'
);

// We can also remove `mb-8 flex flex-col items-center text-center` surrounding it to just be normal.
code = code.replace(
  /<div className="mb-8 flex flex-col items-center text-center">\s*<div className="mb-6 flex justify-center w-full">/,
  '<div className="mb-8 flex justify-center w-full">'
);
code = code.replace(
  /<img src=\{logo\} alt="Maestro Arena Logo" className="h-40 w-40 sm:h-48 sm:w-48 md:h-56 md:w-56 object-contain" \/>\s*<\/div>\s*<\/div>/,
  '<img src={logo} alt="Maestro Arena Logo" className="h-40 w-40 sm:h-48 sm:w-48 md:h-56 md:w-56 object-contain drop-shadow-xl" /></div>'
);

fs.writeFileSync('src/pages/Login.tsx', code, 'utf8');

