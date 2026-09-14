const fs = require('fs');
let code = fs.readFileSync('src/components/layout/BottomNav.tsx', 'utf8');

const newNavInner = `
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all',
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 bg-transparent'
              )
            }
          >
            <item.icon className="h-5 w-5 mb-0.5" />
            <span className="text-[9px] font-medium leading-none">{item.label}</span>
          </NavLink>
`;

code = code.replace(/<NavLink[\s\S]*?<\/NavLink>/, newNavInner.trim());
fs.writeFileSync('src/components/layout/BottomNav.tsx', code, 'utf8');
