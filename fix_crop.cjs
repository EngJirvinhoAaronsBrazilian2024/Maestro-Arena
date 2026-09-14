const fs = require('fs');

// Fix Header.tsx
let header = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');
header = header.replace(
  /<img src="\/logo\.png" alt="Maestro Arena Logo" className="h-16 w-auto sm:h-20 object-contain drop-shadow-sm" \/>/,
  `<div className="w-12 h-12 sm:w-14 sm:h-14 overflow-hidden rounded-full flex items-center justify-center shrink-0 border border-slate-100 shadow-sm bg-white">
                <img src="/logo.png" alt="Maestro Arena Logo" className="w-[160%] h-[160%] max-w-none object-cover object-center" />
              </div>`
);
fs.writeFileSync('src/components/layout/Header.tsx', header, 'utf8');

// Fix Login.tsx
let login = fs.readFileSync('src/pages/Login.tsx', 'utf8');
login = login.replace(
  /<div className="mb-8 flex justify-center w-full"><img src="\/logo\.png" alt="Maestro Arena Logo" className="h-40 w-40 sm:h-48 sm:w-48 md:h-56 md:w-56 object-contain drop-shadow-xl" \/><\/div>/,
  `<div className="mb-8 flex justify-center w-full">
            <div className="w-28 h-28 sm:w-36 sm:h-36 overflow-hidden rounded-full flex items-center justify-center shadow-xl border-4 border-white bg-white">
              <img src="/logo.png" alt="Maestro Arena Logo" className="w-[160%] h-[160%] max-w-none object-cover object-center" />
            </div>
          </div>`
);
fs.writeFileSync('src/pages/Login.tsx', login, 'utf8');

