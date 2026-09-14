const fs = require('fs');

let code = fs.readFileSync('src/pages/MyFeed.tsx', 'utf8');

const importStar = "import { Star, Newspaper } from 'lucide-react';";
const newImportStar = "import { Star, Newspaper, X } from 'lucide-react';";
if (!code.includes('X } from')) {
    code = code.replace(importStar, newImportStar);
}

const originalHeader = `      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">My Feed</h1>
        <p className="text-slate-500">Your personalized sports hub based on your favorites.</p>
      </div>`;

const newHeader = `      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">My Feed</h1>
        <p className="text-slate-500 mb-6">Your personalized sports hub based on your favorites.</p>
        
        <div className="flex overflow-x-auto pb-4 hide-scrollbar gap-3">
          {favorites.filter(f => f.type === 'team').map(team => (
            <div key={team.id} className="flex-shrink-0 flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 pl-2 pr-1.5 py-1.5 rounded-full shadow-sm transition-all">
              {team.logo ? (
                <img src={team.logo} alt={team.name} className="w-6 h-6 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">{team.name.charAt(0)}</div>
              )}
              <span className="text-sm font-bold text-slate-800">{team.name}</span>
            </div>
          ))}
        </div>
      </div>`;

code = code.replace(originalHeader, newHeader);

// In case the `toggleFavorite` logic expects we need it, we can add X button, but let's just show them for now.
// Actually, let's include the X so they can unfollow if they want.

const newHeaderWithX = `      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">My Feed</h1>
        <p className="text-slate-500 mb-6">Your personalized sports hub based on your favorites.</p>
        
        <div className="flex overflow-x-auto pb-4 hide-scrollbar gap-3">
          {favorites.filter(f => f.type === 'team').map(team => (
            <div key={team.id} className="flex-shrink-0 flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 pl-2 pr-1.5 py-1.5 rounded-full shadow-sm transition-all">
              {team.logo ? (
                <img src={team.logo} alt={team.name} className="w-6 h-6 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">{team.name.charAt(0)}</div>
              )}
              <span className="text-sm font-bold text-slate-800">{team.name}</span>
            </div>
          ))}
        </div>
      </div>`;

fs.writeFileSync('src/pages/MyFeed.tsx', code, 'utf8');
