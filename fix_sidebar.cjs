const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

code = code.replace(
  /<aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 fixed h-\[calc\(100vh-4rem\)\] top-16">\s*<nav className="flex-1 space-y-2">/,
  `<aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white fixed h-[calc(100vh-4rem)] top-16 pb-4 pt-0">
      {userData && (
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white font-bold shadow-sm">
              {userData.displayName?.charAt(0).toUpperCase() || (userData.email ? userData.email.charAt(0).toUpperCase() : 'F')}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Welcome,</p>
              <p className="truncate text-sm font-bold text-slate-900">{userData.displayName || (userData.email ? userData.email.split('@')[0] : 'Fan')}</p>
            </div>
          </div>
        </div>
      )}
      <nav className="flex-1 space-y-2 px-4 overflow-y-auto">`
);

code = code.replace(
  /<div className="mt-auto">\s*<button\s*onClick={logout}\s*className="w-full flex items-center justify-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200 transition-colors"\s*>\s*<LogOut className="h-4 w-4" \/>\s*Logout\s*<\/button>\s*<\/div>/,
  `<div className="mt-auto px-4 pt-4 border-t border-slate-100 bg-white">
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>`
);

fs.writeFileSync('src/components/layout/Sidebar.tsx', code, 'utf8');
