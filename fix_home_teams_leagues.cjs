const fs = require('fs');
let homeContent = fs.readFileSync('src/pages/Home.tsx', 'utf8');

if(!homeContent.includes('ChevronDown')) {
    homeContent = homeContent.replace(
        "import { Trophy, Clock, Star, AlertCircle, ArrowRight, X, Check } from 'lucide-react';",
        "import { Trophy, Clock, Star, AlertCircle, ArrowRight, X, Check, ChevronDown, ChevronUp } from 'lucide-react';"
    );
}

const oldTeamsRegex = /const popularTeams = \[\s*\{ id: 'team_42',[\s\S]*?\{ id: 'team_108', type: 'team' as const, name: 'Inter Milan' \}\s*\];/;
const newLeagues = `const [expandedLeague, setExpandedLeague] = useState<string | null>(null);
  const topLeagues = [
    {
      name: 'Premier League',
      teams: [
        { id: 'team_42', type: 'team' as const, name: 'Arsenal' },
        { id: 'team_33', type: 'team' as const, name: 'Manchester United' },
        { id: 'team_40', type: 'team' as const, name: 'Liverpool' },
        { id: 'team_50', type: 'team' as const, name: 'Manchester City' },
        { id: 'team_49', type: 'team' as const, name: 'Chelsea' },
        { id: 'team_47', type: 'team' as const, name: 'Tottenham' },
        { id: 'team_34', type: 'team' as const, name: 'Newcastle' },
        { id: 'team_58', type: 'team' as const, name: 'Aston Villa' },
      ]
    },
    {
      name: 'La Liga',
      teams: [
        { id: 'team_86', type: 'team' as const, name: 'Real Madrid' },
        { id: 'team_81', type: 'team' as const, name: 'Barcelona' },
        { id: 'team_78', type: 'team' as const, name: 'Atletico Madrid' },
        { id: 'team_90', type: 'team' as const, name: 'Real Betis' },
        { id: 'team_92', type: 'team' as const, name: 'Real Sociedad' },
        { id: 'team_80', type: 'team' as const, name: 'Sevilla' },
      ]
    },
    {
      name: 'Serie A',
      teams: [
        { id: 'team_109', type: 'team' as const, name: 'Juventus' },
        { id: 'team_113', type: 'team' as const, name: 'AC Milan' },
        { id: 'team_108', type: 'team' as const, name: 'Inter Milan' },
        { id: 'team_111', type: 'team' as const, name: 'Roma' },
        { id: 'team_110', type: 'team' as const, name: 'Lazio' },
        { id: 'team_114', type: 'team' as const, name: 'Napoli' },
      ]
    },
    {
      name: 'Bundesliga',
      teams: [
        { id: 'team_5', type: 'team' as const, name: 'Bayern Munich' },
        { id: 'team_4', type: 'team' as const, name: 'Borussia Dortmund' },
        { id: 'team_11', type: 'team' as const, name: 'Bayer Leverkusen' },
        { id: 'team_1', type: 'team' as const, name: 'RB Leipzig' },
      ]
    },
    {
      name: 'Ligue 1',
      teams: [
        { id: 'team_85', type: 'team' as const, name: 'PSG' },
        { id: 'team_71', type: 'team' as const, name: 'Marseille' },
        { id: 'team_72', type: 'team' as const, name: 'Monaco' },
        { id: 'team_66', type: 'team' as const, name: 'Lyon' },
        { id: 'team_70', type: 'team' as const, name: 'Lille' },
      ]
    }
  ];`;
homeContent = homeContent.replace(oldTeamsRegex, newLeagues);


const oldBrowserUI = `              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <p className="text-sm text-slate-500 mb-4">Select teams to add to your feed.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {popularTeams.map(team => {
                    const isSelected = isFavorite(team.id);
                    return (
                      <button
                        key={team.id}
                        onClick={() => toggleFavorite(team)}
                        className={\`flex items-center justify-between p-3 rounded-xl border text-left transition-all \${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }\`}
                      >
                        <span className={\`text-sm font-semibold \${isSelected ? 'text-blue-900' : 'text-slate-700'}\`}>
                          {team.name}
                        </span>
                        {isSelected && <Check className="h-4 w-4 text-blue-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>`;

const newBrowserUI = `              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <p className="text-sm text-slate-500 mb-4">Select leagues to view and add top teams to your feed.</p>
                <div className="space-y-3">
                  {topLeagues.map(league => (
                    <div key={league.name} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                      <button 
                        onClick={() => setExpandedLeague(expandedLeague === league.name ? null : league.name)}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <span className="font-bold text-slate-800">{league.name}</span>
                        {expandedLeague === league.name ? (
                          <ChevronUp className="h-5 w-5 text-slate-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-500" />
                        )}
                      </button>
                      
                      {expandedLeague === league.name && (
                        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-white border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                          {league.teams.map(team => {
                            const isSelected = isFavorite(team.id);
                            return (
                              <button
                                key={team.id}
                                onClick={() => toggleFavorite(team)}
                                className={\`flex items-center justify-between p-3 rounded-xl border text-left transition-all \${
                                  isSelected 
                                    ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }\`}
                              >
                                <span className={\`text-sm font-semibold \${isSelected ? 'text-blue-900' : 'text-slate-700'}\`}>
                                  {team.name}
                                </span>
                                {isSelected && <Check className="h-4 w-4 text-blue-500" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>`;

homeContent = homeContent.replace(oldBrowserUI, newBrowserUI);

fs.writeFileSync('src/pages/Home.tsx', homeContent, 'utf8');
