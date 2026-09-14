const fs = require('fs');

// 1. Home.tsx
let homeCode = fs.readFileSync('src/pages/Home.tsx', 'utf8');
homeCode = homeCode.replace(
  /<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">/,
  '<div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">'
);
homeCode = homeCode.replace(
  /<div className="lg:col-span-2 space-y-6">/g,
  '<div className="space-y-6 w-full">'
);
homeCode = homeCode.replace(
  /<div className="lg:col-span-1 space-y-6">/g,
  '<div className="space-y-6 w-full">'
);
fs.writeFileSync('src/pages/Home.tsx', homeCode, 'utf8');

// 2. NewsList.tsx
let newsCode = fs.readFileSync('src/pages/NewsList.tsx', 'utf8');
newsCode = newsCode.replace(
  /<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">/,
  '<div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">'
);
fs.writeFileSync('src/pages/NewsList.tsx', newsCode, 'utf8');

// 3. Livescore.tsx
let livescoreCode = fs.readFileSync('src/pages/Livescore.tsx', 'utf8');
livescoreCode = livescoreCode.replace(
  /<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">/,
  '<div className="flex flex-col gap-4 w-full max-w-3xl mx-auto">'
);
fs.writeFileSync('src/pages/Livescore.tsx', livescoreCode, 'utf8');

