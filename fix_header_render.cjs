const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

const newRenderSearchResults = `
  const renderSearchResults = () => {
    // searchResults is an object: { teams: [], players: [], competitions: [] }
    const teams = searchResults?.teams || [];
    const players = searchResults?.players || [];
    const competitions = searchResults?.competitions || [];
    const hasResults = teams.length > 0 || players.length > 0 || competitions.length > 0;

    return (
      <div className="max-h-[80vh] overflow-y-auto p-2">
        {isSearching ? (
          <div className="p-4 text-center text-sm text-slate-500">Searching...</div>
        ) : hasResults ? (
          <>
            {teams.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-400 px-2 pb-2 uppercase">Teams</p>
                {teams.map((team: any) => (
                  <div key={team.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer" onClick={() => {
                    navigate(\`/teams/\${team.id.replace('team_', '')}\`);
                    setSearchFocused(false);
                    setMobileSearchOpen(false);
                  }}>
                    <div className="flex items-center gap-3">
                      {team.logoUrl ? (
                        <img src={team.logoUrl} className="w-8 h-8 object-contain" alt="logo" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">{team.name.charAt(0)}</div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-800">{team.name}</span>
                        {team.country && <span className="text-xs text-slate-400">{team.country}</span>}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        toggleFavorite({ id: team.id, name: team.name, logo: team.logoUrl, type: 'team' }); 
                      }}
                      className={\`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors \${isFavorite(team.id) ? 'bg-blue-50 border-blue-200 text-blue-600' : 'hover:bg-slate-100 border-slate-200 text-slate-600'}\`}
                    >
                      {isFavorite(team.id) ? <Check className="w-4 h-4" /> : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {players.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-400 px-2 pb-2 uppercase">Players</p>
                {players.map((player: any) => (
                  <div key={player.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer" onClick={() => {
                    navigate(\`/players/\${player.id.replace('player_', '')}\`);
                    setSearchFocused(false);
                    setMobileSearchOpen(false);
                  }}>
                    <div className="flex items-center gap-3">
                      {player.logoUrl ? (
                        <img src={player.logoUrl} className="w-8 h-8 object-contain rounded-full" alt="logo" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">{player.name.charAt(0)}</div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-800">{player.name}</span>
                        {player.country && <span className="text-xs text-slate-400">{player.country}</span>}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        toggleFavorite({ id: player.id, name: player.name, logo: player.logoUrl, type: 'player' }); 
                      }}
                      className={\`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors \${isFavorite(player.id) ? 'bg-blue-50 border-blue-200 text-blue-600' : 'hover:bg-slate-100 border-slate-200 text-slate-600'}\`}
                    >
                      {isFavorite(player.id) ? <Check className="w-4 h-4" /> : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {competitions.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-400 px-2 pb-2 uppercase">Competitions</p>
                {competitions.map((comp: any) => (
                  <div key={comp.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer" onClick={() => {
                    // Navigate to competition page when it exists, for now just close
                    setSearchFocused(false);
                    setMobileSearchOpen(false);
                  }}>
                    <div className="flex items-center gap-3">
                      {comp.logoUrl ? (
                        <img src={comp.logoUrl} className="w-8 h-8 object-contain" alt="logo" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">{comp.name.charAt(0)}</div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-800">{comp.name}</span>
                        {comp.country && <span className="text-xs text-slate-400">{comp.country}</span>}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        toggleFavorite({ id: comp.id, name: comp.name, logo: comp.logoUrl, type: 'competition' }); 
                      }}
                      className={\`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors \${isFavorite(comp.id) ? 'bg-blue-50 border-blue-200 text-blue-600' : 'hover:bg-slate-100 border-slate-200 text-slate-600'}\`}
                    >
                      {isFavorite(comp.id) ? <Check className="w-4 h-4" /> : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : debouncedQuery.length > 1 ? (
          <div className="p-4 text-center text-sm text-slate-500">No results found</div>
        ) : (
          <div className="p-4 text-center text-sm text-slate-500">Type to search teams, players, leagues...</div>
        )}
      </div>
    );
  };
`;

code = code.replace(/const renderSearchResults = \(\) => \([\s\S]*?Type to search for any team<\/div>\s*\)\s*\}\s*<\/div>\s*\);/, newRenderSearchResults);

fs.writeFileSync('src/components/layout/Header.tsx', code, 'utf8');
