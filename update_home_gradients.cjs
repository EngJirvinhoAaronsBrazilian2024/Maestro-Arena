const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const oldGradients = `{/* Desktop: fade from left to right */}
           <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent md:via-white/70 hidden md:block"></div>
           {/* Mobile: stronger white gradient from bottom and left to ensure text stands out */}
           <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent md:hidden"></div>
           <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-transparent md:hidden"></div>`;

const newGradients = `{/* Desktop: fade from left to right, restricted to left side */}
           <div className="absolute inset-y-0 left-0 w-[70%] bg-gradient-to-r from-white/95 via-white/60 to-transparent hidden md:block pointer-events-none"></div>
           {/* Mobile: targeted gradients to keep the players clear */}
           <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-white/95 via-white/70 to-transparent md:hidden pointer-events-none"></div>
           <div className="absolute inset-y-0 left-0 w-[80%] bg-gradient-to-r from-white/90 via-white/40 to-transparent md:hidden pointer-events-none"></div>`;

if (content.includes('bg-gradient-to-t from-white via-white/80')) {
  content = content.replace(oldGradients, newGradients);
  fs.writeFileSync('src/pages/Home.tsx', content);
  console.log('Gradients updated successfully!');
} else {
  console.log('Could not find gradients to replace.');
}
