import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, User, LogOut, ChevronLeft, Bell, Settings, Check, X, Trash2, BellOff, CheckCheck, Megaphone, Newspaper, Target } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { useNotificationSystem, AppNotification } from '../../hooks/useNotificationSystem';
import { useFavorites } from '../../hooks/useFavorites';
import { useSearchAll } from '../../services/sports/hooks';
import { useDebounce } from '../../hooks/useDebounce';

function formatTimeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getNotificationIcon(type?: string) {
  switch (type) {
    case 'broadcast':
    case 'alert':
      return <Megaphone className="w-4 h-4 text-rose-600" />;
    case 'news':
      return <Newspaper className="w-4 h-4 text-cyan-600" />;
    case 'tip':
      return <Target className="w-4 h-4 text-amber-600" />;
    case 'goal':
      return <span className="text-sm">⚽</span>;
    case 'match':
      return <span className="text-sm">⏱️</span>;
    default:
      return <Bell className="w-4 h-4 text-slate-500" />;
  }
}

function getNotificationBadge(type?: string) {
  switch (type) {
    case 'broadcast':
      return { label: 'Announcement', class: 'bg-rose-100 text-rose-700 border border-rose-200/60' };
    case 'alert':
      return { label: 'Alert', class: 'bg-rose-100 text-rose-700 border border-rose-200/60' };
    case 'news':
      return { label: 'News', class: 'bg-cyan-100 text-cyan-800 border border-cyan-200/60' };
    case 'tip':
      return { label: 'Tip', class: 'bg-amber-100 text-amber-800 border border-amber-200/60' };
    case 'goal':
      return { label: 'Goal', class: 'bg-rose-100 text-rose-700 border border-rose-200/60' };
    case 'match':
      return { label: 'Match', class: 'bg-cyan-100 text-cyan-800 border border-cyan-200/60' };
    default:
      return { label: 'Update', class: 'bg-slate-100 text-slate-700 border border-slate-200/60' };
  }
}

export function Header() {
  const { user, userData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Automatically close notifications, search results, and dropdowns when user navigates to any other page/content
  useEffect(() => {
    setNotifOpen(false);
    setDropdownOpen(false);
    setSearchFocused(false);
    setMobileSearchOpen(false);
  }, [location.pathname, location.search]);

  // Click outside listener for notifications and user profile dropdown
  useEffect(() => {
    function handlePointerDownOutside(e: MouseEvent | TouchEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }

    if (notifOpen || dropdownOpen) {
      document.addEventListener('mousedown', handlePointerDownOutside);
      document.addEventListener('touchstart', handlePointerDownOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
    };
  }, [notifOpen, dropdownOpen]);

  // Escape key listener to dismiss notifications and open popups
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setNotifOpen(false);
        setDropdownOpen(false);
        setMobileSearchOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  
  const { 
    notifications, 
    unreadCount, 
    markAllRead, 
    markAsRead, 
    deleteNotification, 
    clearAllNotifications 
  } = useNotificationSystem();
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
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">{(team.name || 'T').charAt(0)}</div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-800">{team.name || 'Team'}</span>
                        {team.country && <span className="text-xs text-slate-400">{team.country}</span>}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        toggleFavorite({ id: team.id, name: team.name, logo: team.logoUrl, type: 'team' }); 
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${isFavorite(team.id) ? 'bg-rose-50 border-rose-200 text-rose-600' : 'hover:bg-slate-100 border-slate-200 text-slate-600'}`}
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
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">{(player.name || 'P').charAt(0)}</div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-800">{player.name || 'Player'}</span>
                        {player.country && <span className="text-xs text-slate-400">{player.country}</span>}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        toggleFavorite({ id: player.id, name: player.name, logo: player.logoUrl, type: 'player' }); 
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${isFavorite(player.id) ? 'bg-rose-50 border-rose-200 text-rose-600' : 'hover:bg-slate-100 border-slate-200 text-slate-600'}`}
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
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">{(comp.name || 'C').charAt(0)}</div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-800">{comp.name || 'Competition'}</span>
                        {comp.country && <span className="text-xs text-slate-400">{comp.country}</span>}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        toggleFavorite({ id: comp.id, name: comp.name, logo: comp.logoUrl, type: 'competition' }); 
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${isFavorite(comp.id) ? 'bg-rose-50 border-rose-200 text-rose-600' : 'hover:bg-slate-100 border-slate-200 text-slate-600'}`}
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
                className="h-10 w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
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
                <Search className="absolute left-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  placeholder="Search teams, players, leagues..."
                  className="h-10 w-full rounded-full border border-slate-200/80 bg-slate-100/80 pl-9 pr-4 text-sm outline-none focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/20 transition-all"
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
              <div className="relative" ref={notifRef}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="px-2 relative"
                  onClick={() => { 
                    const nextState = !notifOpen;
                    setNotifOpen(nextState); 
                    setDropdownOpen(false); 
                    if (nextState) markAllRead(); 
                  }}
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-rose-600 flex items-center justify-center text-[9px] font-black text-white border-2 border-white shadow-xs">
                      {unreadCount}
                    </span>
                  )}
                </Button>

                {notifOpen && (
                  <>
                    {/* Dark backdrop overlay on phone */}
                    <div 
                      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 md:hidden"
                      onClick={() => setNotifOpen(false)}
                    />

                    {/* Centered modal on mobile phone, dropdown on desktop */}
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden md:absolute md:top-auto md:left-auto md:right-0 md:translate-x-0 md:translate-y-0 md:mt-2 md:w-88 md:rounded-xl md:shadow-xl">
                      {/* Header bar with count and Clear All button */}
                      <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-rose-600" />
                          <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                          {notifications.length > 0 && (
                            <span className="text-[11px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                              {notifications.length}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          {notifications.length > 0 && (
                            <button
                              onClick={clearAllNotifications}
                              className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Clear all notifications"
                            >
                              <Trash2 className="w-3 h-3 text-slate-400 hover:text-rose-500" />
                              <span>Clear all</span>
                            </button>
                          )}
                          <button
                            onClick={() => setNotifOpen(false)}
                            className="p-1 rounded-lg hover:bg-slate-200/70 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                            aria-label="Close notifications"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Notification Items List with Individual Delete */}
                      <div className="max-h-[60vh] md:max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length > 0 ? (
                          notifications.map((notif, notifIdx) => {
                            const badge = getNotificationBadge(notif.type);
                            return (
                              <div 
                                key={`${notif.id || 'notif'}_${notifIdx}`} 
                                className="group relative p-3.5 hover:bg-slate-50 transition-colors flex items-start justify-between gap-2.5 cursor-pointer"
                                onClick={() => {
                                  markAsRead(notif.id);
                                  setNotifOpen(false);
                                  if (notif.link) {
                                    navigate(notif.link);
                                  }
                                }}
                              >
                                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                  <div className="mt-0.5 shrink-0">
                                    {getNotificationIcon(notif.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${badge.class}`}>
                                        {badge.label}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-medium">
                                        {formatTimeAgo(notif.time)}
                                      </span>
                                      {!notif.read && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0 ml-auto mr-1" />
                                      )}
                                    </div>
                                    <p className="text-xs font-bold text-slate-900 leading-snug truncate">{notif.title}</p>
                                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5 line-clamp-2">{notif.body}</p>
                                  </div>
                                </div>

                                {/* Delete one by one button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notif.id);
                                  }}
                                  title="Delete notification"
                                  className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                                  aria-label="Delete notification"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-8 text-center text-sm text-slate-500">
                            <BellOff className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="font-semibold text-slate-700">No notifications</p>
                            <p className="text-xs text-slate-400 mt-1">Published updates, news, and match alerts will appear here.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <Link to="/settings">
                <Button variant="ghost" size="sm" className="px-2">
                  <Settings className="h-5 w-5 text-slate-600 hover:text-slate-900 transition-colors" />
                </Button>
              </Link>

              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="px-2 flex items-center gap-2"
                    onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
                  >
                    <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-rose-600 to-red-700 flex items-center justify-center text-xs font-black text-white shadow-sm border border-white">
                      {(userData?.displayName || user?.email || 'User').charAt(0).toUpperCase()}
                    </div>
                  </Button>
                  
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg z-50">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-900 truncate">{userData?.displayName || 'User'}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link to="/profile" className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600" onClick={() => setDropdownOpen(false)}>
                          Profile
                        </Link>
                        {userData?.role === 'admin' && (
                          <Link to="/admin" className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600" onClick={() => setDropdownOpen(false)}>
                            Admin Dashboard
                          </Link>
                        )}
                      </div>
                      <div className="border-t border-slate-100 py-1">
                        <button onClick={handleLogout} className="flex w-full items-center px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50">
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
