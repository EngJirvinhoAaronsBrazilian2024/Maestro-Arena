const fs = require('fs');
let homeContent = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Imports
if(!homeContent.includes('X, Check')) {
    homeContent = homeContent.replace(
        "import { Trophy, Calendar, Star, AlertCircle } from 'lucide-react';",
        "import { Trophy, Calendar, Star, AlertCircle, X, Check } from 'lucide-react';"
    );
}

// Variables & State
const hookRegex = /const \{ user, userData \} = useAuth\(\);/;
const replacementHooks = `const { user, userData, updateUserData } = useAuth() as any;
  const [showTeamBrowser, setShowTeamBrowser] = useState(false);
  const popularTeams = [
    'Arsenal', 'Manchester United', 'Real Madrid', 'Barcelona', 
    'Bayern Munich', 'PSG', 'Juventus', 'Liverpool', 
    'Manchester City', 'Chelsea', 'AC Milan', 'Inter Milan'
  ];
  const userFavorites = userData?.favoriteTeams || [];
  
  const toggleFavorite = async (team) => {
    if (!userData) return;
    const isFav = userFavorites.includes(team);
    const newFavorites = isFav 
      ? userFavorites.filter(t => t !== team)
      : [...userFavorites, team];
    
    // Update local state optimistic (handled by context) and DB
    await updateUserData({ favorite_teams: newFavorites, favoriteTeams: newFavorites });
  };
`;
homeContent = homeContent.replace(hookRegex, replacementHooks);

// Widget UI
const oldFavoritesWidget = `        {/* Favorites Widget */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-500" />
              Your Favorites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <Star className="h-8 w-8 opacity-50" />
                <p>No favorites added yet.</p>
                <button className="text-sm font-medium text-blue-600 hover:underline">
                  Follow teams and players
                </button>
              </div>
            </div>
          </CardContent>
        </Card>`;

const newFavoritesWidget = `        {/* Favorites Widget */}
        <Card className="lg:col-span-3 relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-500 fill-blue-500/20" />
              Your Favorites
            </CardTitle>
            <button 
              onClick={() => setShowTeamBrowser(!showTeamBrowser)}
              className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full transition-colors"
            >
              {showTeamBrowser ? 'Close Browser' : 'Browse Teams'}
            </button>
          </CardHeader>
          <CardContent>
            {showTeamBrowser ? (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <p className="text-sm text-slate-500 mb-4">Select teams to add to your feed.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {popularTeams.map(team => {
                    const isSelected = userFavorites.includes(team);
                    return (
                      <button
                        key={team}
                        onClick={() => toggleFavorite(team)}
                        className={\`flex items-center justify-between p-3 rounded-xl border text-left transition-all \${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }\`}
                      >
                        <span className={\`text-sm font-semibold \${isSelected ? 'text-blue-900' : 'text-slate-700'}\`}>
                          {team}
                        </span>
                        {isSelected && <Check className="h-4 w-4 text-blue-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : userFavorites.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {userFavorites.map(team => (
                  <div key={team} className="group flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 pl-4 pr-2 py-2 rounded-full transition-all">
                    <span className="text-sm font-bold text-slate-800">{team}</span>
                    <button 
                      onClick={() => toggleFavorite(team)}
                      className="p-1 rounded-full hover:bg-slate-300 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center transition-all hover:bg-slate-50">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <div className="p-3 bg-white rounded-full shadow-sm border border-slate-100">
                    <Star className="h-6 w-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">No favorites added yet</p>
                    <p className="text-sm text-slate-500 mt-1">Get personalized updates in your feed.</p>
                  </div>
                  <button 
                    onClick={() => setShowTeamBrowser(true)}
                    className="mt-2 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-all"
                  >
                    Browse Teams
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>`;

homeContent = homeContent.replace(oldFavoritesWidget, newFavoritesWidget);

fs.writeFileSync('src/pages/Home.tsx', homeContent, 'utf8');
