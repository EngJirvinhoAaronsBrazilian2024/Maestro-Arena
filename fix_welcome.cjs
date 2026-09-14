const fs = require('fs');
let homeContent = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const oldGreeting = `{userData && (
          <div className="relative z-10 w-full text-center md:text-left">
            <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-50/80 backdrop-blur-xl border border-blue-200/60 shadow-sm text-blue-900 text-sm font-bold tracking-wide">
              Welcome back, {userData.displayName} 👋
            </span>
          </div>
        )}`;

const newGreeting = `{userData && (
          <div className="relative z-10 w-full flex justify-center md:justify-start mb-2">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 font-bold tracking-wide animate-in fade-in slide-in-from-top-4">
              <span>👋</span>
              <span>Welcome back, {userData.displayName}!</span>
            </div>
          </div>
        )}`;

homeContent = homeContent.replace(oldGreeting, newGreeting);

// Also let's adjust the Hero padding to ensure it's not hidden
homeContent = homeContent.replace(
  'group p-6 sm:p-8 md:p-12 lg:p-16 gap-8',
  'group p-6 sm:p-8 md:p-12 lg:p-16 pt-10 sm:pt-12 gap-8'
);

fs.writeFileSync('src/pages/Home.tsx', homeContent, 'utf8');
