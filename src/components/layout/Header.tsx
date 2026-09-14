import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, ChevronLeft, Bell, Settings, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { useNotificationSystem } from '../../hooks/useNotificationSystem';
import { useFavorites } from '../../hooks/useFavorites';
import { useSearchAll } from '../../services/sports/hooks';
import { useDebounce } from '../../hooks/useDebounce';

export function Header() {
  const { user, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  
  const { notifications, unreadCount, markAllRead } = useNotificationSystem();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { results: searchResults, isLoading: isSearching } = useSearchAll(debouncedQuery);

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigate('/');
  };

  
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
                    navigate(`/teams/${team.id.replace('team_', '')}`);
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
                      className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${isFavorite(team.id) ? 'bg-blue-50 border-blue-200 text-blue-600' : 'hover:bg-slate-100 border-slate-200 text-slate-600'}`}
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
                    navigate(`/players/${player.id.replace('player_', '')}`);
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
                      className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${isFavorite(player.id) ? 'bg-blue-50 border-blue-200 text-blue-600' : 'hover:bg-slate-100 border-slate-200 text-slate-600'}`}
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
                      className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${isFavorite(comp.id) ? 'bg-blue-50 border-blue-200 text-blue-600' : 'hover:bg-slate-100 border-slate-200 text-slate-600'}`}
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


  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="flex h-16 items-center px-4 md:px-6 relative">
        
        {mobileSearchOpen ? (
          <div className="flex-1 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
            <Button variant="ghost" size="sm" onClick={() => setMobileSearchOpen(false)} className="px-2">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any team in the world..."
                className="h-10 w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-green-500 transition-all"
              />
              <button 
                onClick={() => setSearchQuery('')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 ${searchQuery ? 'block' : 'hidden'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {searchQuery.length > 0 && (
               <div className="absolute top-12 left-0 w-full bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden z-50">
                 {renderSearchResults()}
               </div>
            )}
          </div>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="px-2 mr-2">
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
            <Link to="/" className="flex items-center mr-6 shrink-0">
              <img src="/logo.png" alt="Maestro Arena Logo" className="h-10 sm:h-12 w-auto object-contain" />
            </Link>
            
            <div className="flex flex-1 items-center justify-end space-x-1 sm:space-x-2 relative">
              
              {/* Desktop Active Search */}
              <div className="hidden md:flex relative w-full max-w-sm items-center">
                <Search className="absolute left-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  placeholder="Search teams, players, leagues..."
                  className="h-10 w-full rounded-full border border-slate-200 bg-slate-100 pl-9 pr-4 text-sm outline-none focus:border-green-500 focus:bg-white transition-all"
                />
                {/* Search Dropdown overlay */}
                {searchFocused && searchQuery.length > 1 && (
                  <div className="absolute top-12 left-0 w-full bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden z-[60]">
                    {renderSearchResults()}
                  </div>
                )}
              </div>
              
              {/* Mobile Search Toggle */}
              <Button variant="ghost" size="sm" className="px-2 md:hidden" onClick={() => setMobileSearchOpen(true)}>
                <Search className="h-5 w-5 text-slate-600" />
              </Button>
              
              {/* Functional Notifications */}
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="px-2 relative"
                  onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); if (!notifOpen) markAllRead(); }}
                >
                  <Bell className="h-5 w-5 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-[9px] font-bold text-white border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </Button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
                    <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(notif => (
                          <div key={notif.id} className="p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <p className="text-xs font-bold text-green-600 mb-1">{notif.title}</p>
                            <p className="text-sm text-slate-700">{notif.body}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{new Date(notif.time).toLocaleTimeString()}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-sm text-slate-500">
                          <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          No new notifications
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link to="/settings">
                <Button variant="ghost" size="sm" className="px-2">
                  <Settings className="h-5 w-5 text-slate-600 hover:text-slate-900 transition-colors" />
                </Button>
              </Link>

              {user ? (
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="px-2 flex items-center gap-2"
                    onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
                  >
                    <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-green-400 to-green-600 flex items-center justify-center text-xs font-bold text-white shadow-sm border border-white">
                      {userData?.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  </Button>
                  
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg z-50">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-900 truncate">{userData?.displayName || 'User'}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link to="/profile" className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-green-600" onClick={() => setDropdownOpen(false)}>
                          Profile
                        </Link>
                        {userData?.role === 'admin' && (
                          <Link to="/admin" className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-green-600" onClick={() => setDropdownOpen(false)}>
                            Admin Dashboard
                          </Link>
                        )}
                      </div>
                      <div className="border-t border-slate-100 py-1">
                        <button onClick={handleLogout} className="flex w-full items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login">
                  <Button size="sm" className="rounded-full px-5">Sign In</Button>
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
