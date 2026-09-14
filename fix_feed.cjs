const fs = require('fs');
let code = fs.readFileSync('src/pages/MyFeed.tsx', 'utf8');

code = code.replace(
  /<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">/,
  '<div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">'
);
code = code.replace(
  /<div className="lg:col-span-2 space-y-6">/g,
  '<div className="space-y-6 w-full">'
);
code = code.replace(
  /<div className="lg:col-span-1 space-y-6">/g,
  '<div className="space-y-6 w-full">'
);
code = code.replace(
  /<div className="grid grid-cols-1 md:grid-cols-2 gap-4">/g,
  '<div className="flex flex-col gap-4 w-full">'
);
fs.writeFileSync('src/pages/MyFeed.tsx', code, 'utf8');
