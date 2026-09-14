const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const oldFavoritesList = `                  {favorites.map(team => (
                    <div key={team.id} className="group flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 pl-3 pr-1.5 py-1.5 rounded-full transition-all">
                      <span className="text-xs font-bold text-slate-800">{team.name}</span>
                      <button 
                        onClick={() => toggleFavorite(team)}
                        className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}`;

const newFavoritesList = `                  {favorites.map(team => (
                    <div key={team.id} className="group flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 pl-2 pr-1.5 py-1.5 rounded-full shadow-sm transition-all">
                      <img src={\`https://media.api-sports.io/football/teams/\${team.id.replace('team_', '').replace('_fr', '')}.png\`} alt={team.name} className="w-5 h-5 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      <span className="text-xs font-bold text-slate-800">{team.name}</span>
                      <button 
                        onClick={() => toggleFavorite(team)}
                        className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-red-500 transition-colors ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}`;

code = code.replace(oldFavoritesList, newFavoritesList);

const oldTeamsList = `                            {league.teams.map(team => {
                              const isSelected = isFavorite(team.id);
                              return (
                                <button
                                  key={team.id}
                                  onClick={() => toggleFavorite(team)}
                                  className={\`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all \${
                                    isSelected 
                                      ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                                      : 'border-transparent hover:bg-slate-50'
                                  }\`}
                                >
                                  <span className={\`text-sm font-medium \${isSelected ? 'text-blue-900' : 'text-slate-700'}\`}>
                                    {team.name}
                                  </span>
                                  {isSelected && <Check className="h-4 w-4 text-blue-500" />}
                                </button>
                              );
                            })}`;

const newTeamsList = `                            {league.teams.map(team => {
                              const isSelected = isFavorite(team.id);
                              return (
                                <button
                                  key={team.id}
                                  onClick={() => toggleFavorite(team)}
                                  className={\`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all \${
                                    isSelected 
                                      ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                                      : 'border-transparent hover:bg-slate-50'
                                  }\`}
                                >
                                  <div className="flex items-center gap-3">
                                    <img src={\`https://media.api-sports.io/football/teams/\${team.id.replace('team_', '').replace('_fr', '')}.png\`} alt={team.name} className="w-6 h-6 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    <span className={\`text-sm font-medium \${isSelected ? 'text-blue-900' : 'text-slate-700'}\`}>
                                      {team.name}
                                    </span>
                                  </div>
                                  {isSelected && <Check className="h-4 w-4 text-blue-500" />}
                                </button>
                              );
                            })}`;

code = code.replace(oldTeamsList, newTeamsList);

fs.writeFileSync('src/pages/Home.tsx', code, 'utf8');
