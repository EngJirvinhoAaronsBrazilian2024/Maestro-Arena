const fs = require('fs');
let code = fs.readFileSync('src/components/ui/Card.tsx', 'utf8');

// The reference image has highly rounded cards (looks like 24px or 32px), translucent white backgrounds, and white borders
code = code.replace(/rounded-\[16px\]/g, 'rounded-[28px]');
code = code.replace(/bg-white/g, 'bg-white/60 backdrop-blur-xl');
code = code.replace(/border-slate-200/g, 'border-white/60');
code = code.replace(/shadow-sm/g, 'shadow-[0_8px_32px_rgba(0,0,0,0.04)]');

fs.writeFileSync('src/components/ui/Card.tsx', code, 'utf8');
