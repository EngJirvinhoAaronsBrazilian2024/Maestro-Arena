const fs = require('fs');
let content = fs.readFileSync('src/pages/UserProfile.tsx', 'utf8');

if (!content.includes('stadium_atmosphere')) {
  content = content.replace(
    /import \{ User, Mail, Shield, LogOut, Bookmark \} from 'lucide-react';/,
    `import { User, Mail, Shield, LogOut, Bookmark, Star, Calendar } from 'lucide-react';\nimport stadiumBg from '../assets/images/stadium_atmosphere_1789303106987.jpg';\nimport premiumTexture from '../assets/images/premium_football_texture_1789303121778.jpg';`
  );
}

const headerRegex = /<div>[\\s\\S]*?<p className=\\\"text-sm text-slate-500 mt-1\\\">[\\s\\S]*?<\/p>[\\s\\S]*?<\/div>/;

const newHeader = `      <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-xl mb-8">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-overlay"
          style={{ backgroundImage: \`url(\${stadiumBg})\` }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent"></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 p-8 md:p-12">
          <div className="flex items-center gap-6">
            <div className="relative shrink-0 group">
              <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-emerald-400 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-slate-800 border-4 border-slate-900 text-slate-300 shadow-2xl">
                <User className="h-10 w-10 opacity-70" />
              </div>
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">{profile.displayName || 'Sports Fan'}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm font-medium text-slate-300">
                <span className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                  <Mail className="h-4 w-4 text-slate-400" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 backdrop-blur-sm capitalize">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  {profile.role}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
             <button 
                onClick={() => logout()}
                className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 px-6 py-3 text-sm font-bold text-white transition-all shadow-lg hover:-translate-y-0.5"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
          </div>
        </div>
      </div>`;

content = content.replace(headerRegex, newHeader);

// Now remove the duplicate card on the left side that had the same info.
const leftCardRegex = /<Card className=\\\"md:col-span-1 h-fit\\\">[\\s\\S]*?<\/Card>/;
// We'll replace it with a smaller "Stats/Actions" card
const newLeftCard = `        <Card className="md:col-span-1 h-fit bg-white/50 backdrop-blur-sm border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex flex-col space-y-4">
             <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs mb-2">Account Actions</h3>
            <div className="w-full space-y-3">
              {profile.role === 'admin' && (
                <Link to="/admin" className="flex w-full items-center justify-start gap-3 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 text-red-700 px-5 py-4 text-sm font-bold hover:shadow-md transition-all border border-red-100/50">
                  <Shield className="h-5 w-5 text-red-500" />
                  Admin Dashboard
                </Link>
              )}
              {(profile.role === 'admin' || profile.role === 'editor') && (
                <Link to="/editor" className="flex w-full items-center justify-start gap-3 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 px-5 py-4 text-sm font-bold hover:shadow-md transition-all border border-purple-100/50">
                  <User className="h-5 w-5 text-purple-500" />
                  Editor Dashboard
                </Link>
              )}
            </div>
            
            <div className="pt-4 mt-4 border-t border-slate-100">
               <div className="relative overflow-hidden rounded-xl bg-slate-900 p-6 text-center text-white">
                  <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: \`url(\${premiumTexture})\` }}></div>
                  <div className="relative z-10 flex flex-col items-center">
                     <Star className="w-8 h-8 text-amber-400 mb-2" />
                     <h4 className="font-bold mb-1">Maestro Pro</h4>
                     <p className="text-xs text-slate-300">Upgrade to unlock ad-free live scores and premium predictions.</p>
                  </div>
               </div>
            </div>
          </CardContent>
        </Card>`;

content = content.replace(leftCardRegex, newLeftCard);

fs.writeFileSync('src/pages/UserProfile.tsx', content);
