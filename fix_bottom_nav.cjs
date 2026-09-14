const fs = require('fs');
let code = fs.readFileSync('src/components/layout/BottomNav.tsx', 'utf8');

// The reference image has a floating white pill at the bottom with circular active states
code = code.replace(
  /<div className="md:hidden fixed bottom-0 left-0 z-50 w-full border-t border-slate-200 bg-white\/90 backdrop-blur-lg safe-area-bottom">/g, 
  '<div className="md:hidden fixed bottom-4 left-4 right-4 z-50 rounded-full border border-white/60 bg-white/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] safe-area-bottom">'
);

code = code.replace(
  /<nav className="flex h-16 items-center justify-around px-2">/g,
  '<nav className="flex h-16 items-center justify-around px-4">'
);

// We need to change the active state styling to the circular blue background from the image
const newNavInner = `
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'relative flex items-center justify-center w-12 h-12 rounded-full transition-all',
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 bg-transparent'
              )
            }
          >
            <item.icon className="h-5 w-5" />
          </NavLink>
`;

code = code.replace(/<NavLink[\s\S]*?<\/NavLink>/, newNavInner.trim());

fs.writeFileSync('src/components/layout/BottomNav.tsx', code, 'utf8');
