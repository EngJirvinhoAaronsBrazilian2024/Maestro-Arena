const fs = require('fs');

let headerCode = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

// Ensure that "Maestro Arena" text is hidden on small and medium screens (only visible on lg) to leave enough space.
headerCode = headerCode.replace(
  /<span className="hidden sm:inline-block text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900"/,
  '<span className="hidden lg:inline-block text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900"'
);

// We should also remove the logo from the Header if it takes up too much space? No, the logo is fine, we just need to hide the text on mobile (and tablets) so all icons fit.

// The text was hidden on small screens (`hidden sm:inline-block`), let's make it hidden on small AND medium screens (`hidden lg:inline-block`).

fs.writeFileSync('src/components/layout/Header.tsx', headerCode, 'utf8');
