import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  Plus,
  X,
  Check,
  Search,
  Bell,
  BellRing,
  Newspaper,
  Calendar,
  ArrowRight,
  Trophy,
  Globe,
  Shield,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  useFavorites,
  FavoriteItem,
  doesFavoriteMatchName,
  isFavoriteTeamOrCompMatch,
} from '../../hooks/useFavorites';
import { useFootballMatches } from '../../hooks/useFootballMatches';
import { useArticles } from '../../services/news/hooks';
import { useNotifications } from '../../context/NotificationContext';
import { NormalizedMatch } from '../../server/services/footballDataService';

export const PINNABLE_GROUPS: Array<{
  group: string;
  kind: 'club' | 'national' | 'competition';
  items: FavoriteItem[];
}> = [
  {
    group: 'Top Competitions',
    kind: 'competition',
    items: [
      { id: 'competition_2001', type: 'competition', name: 'UEFA Champions League', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2.png' },
      { id: 'competition_2021', type: 'competition', name: 'Premier League', logo: 'https://crests.football-data.org/PL.png' },
      { id: 'competition_2014', type: 'competition', name: 'La Liga', logo: 'https://crests.football-data.org/laliga.png' },
      { id: 'competition_2019', type: 'competition', name: 'Serie A', logo: 'https://crests.football-data.org/SA.png' },
      { id: 'competition_2002', type: 'competition', name: 'Bundesliga', logo: 'https://crests.football-data.org/BL1.png' },
      { id: 'competition_2015', type: 'competition', name: 'Ligue 1', logo: 'https://crests.football-data.org/FL1.png' },
      { id: 'competition_2395', type: 'competition', name: 'UEFA Nations League', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2395.png' },
      { id: 'competition_8315', type: 'competition', name: 'Africa Cup of Nations', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/8315.png' },
      { id: 'competition_2146', type: 'competition', name: 'UEFA Europa League', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2310.png' },
      { id: 'competition_3951', type: 'competition', name: 'CONMEBOL Libertadores', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2031.png' },
    ],
  },
  {
    group: 'National Teams',
    kind: 'national',
    items: [
      { id: 'team_nat_arg', type: 'team', name: 'Argentina', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/arg.png' },
      { id: 'team_nat_bra', type: 'team', name: 'Brazil', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/bra.png' },
      { id: 'team_nat_eng', type: 'team', name: 'England', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/eng.png' },
      { id: 'team_nat_fra', type: 'team', name: 'France', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/fra.png' },
      { id: 'team_nat_ger', type: 'team', name: 'Germany', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/ger.png' },
      { id: 'team_nat_esp', type: 'team', name: 'Spain', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/esp.png' },
      { id: 'team_nat_por', type: 'team', name: 'Portugal', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/por.png' },
      { id: 'team_nat_mar', type: 'team', name: 'Morocco', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/mar.png' },
      { id: 'team_nat_nga', type: 'team', name: 'Nigeria', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/nga.png' },
      { id: 'team_nat_sen', type: 'team', name: 'Senegal', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/sen.png' },
      { id: 'team_nat_uga', type: 'team', name: 'Uganda', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/uga.png' },
      { id: 'team_nat_usa', type: 'team', name: 'USA', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/usa.png' },
      { id: 'team_nat_jpn', type: 'team', name: 'Japan', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/jpn.png' },
    ],
  },
  {
    group: 'Premier League',
    kind: 'club',
    items: [
      { id: 'team_42', type: 'team', name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' },
      { id: 'team_58', type: 'team', name: 'Aston Villa', logo: 'https://media.api-sports.io/football/teams/66.png' },
      { id: 'team_49', type: 'team', name: 'Chelsea', logo: 'https://media.api-sports.io/football/teams/49.png' },
      { id: 'team_40', type: 'team', name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png' },
      { id: 'team_50', type: 'team', name: 'Manchester City', logo: 'https://media.api-sports.io/football/teams/50.png' },
      { id: 'team_33', type: 'team', name: 'Manchester United', logo: 'https://media.api-sports.io/football/teams/33.png' },
      { id: 'team_34', type: 'team', name: 'Newcastle', logo: 'https://media.api-sports.io/football/teams/34.png' },
      { id: 'team_47', type: 'team', name: 'Tottenham', logo: 'https://media.api-sports.io/football/teams/47.png' },
      { id: 'team_48', type: 'team', name: 'West Ham', logo: 'https://media.api-sports.io/football/teams/48.png' },
      { id: 'team_51', type: 'team', name: 'Brighton', logo: 'https://media.api-sports.io/football/teams/51.png' },
    ],
  },
  {
    group: 'La Liga',
    kind: 'club',
    items: [
      { id: 'team_81', type: 'team', name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png' },
      { id: 'team_86', type: 'team', name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png' },
      { id: 'team_78', type: 'team', name: 'Atletico Madrid', logo: 'https://media.api-sports.io/football/teams/530.png' },
      { id: 'team_77', type: 'team', name: 'Athletic Club', logo: 'https://media.api-sports.io/football/teams/531.png' },
      { id: 'team_92', type: 'team', name: 'Real Sociedad', logo: 'https://media.api-sports.io/football/teams/548.png' },
      { id: 'team_80', type: 'team', name: 'Sevilla', logo: 'https://media.api-sports.io/football/teams/536.png' },
    ],
  },
  {
    group: 'Serie A · Bundesliga · Ligue 1',
    kind: 'club',
    items: [
      { id: 'team_108', type: 'team', name: 'Inter Milan', logo: 'https://media.api-sports.io/football/teams/505.png' },
      { id: 'team_113', type: 'team', name: 'AC Milan', logo: 'https://media.api-sports.io/football/teams/489.png' },
      { id: 'team_109', type: 'team', name: 'Juventus', logo: 'https://media.api-sports.io/football/teams/496.png' },
      { id: 'team_114', type: 'team', name: 'Napoli', logo: 'https://media.api-sports.io/football/teams/492.png' },
      { id: 'team_5', type: 'team', name: 'Bayern Munich', logo: 'https://media.api-sports.io/football/teams/157.png' },
      { id: 'team_4', type: 'team', name: 'Borussia Dortmund', logo: 'https://media.api-sports.io/football/teams/165.png' },
      { id: 'team_11', type: 'team', name: 'Bayer Leverkusen', logo: 'https://media.api-sports.io/football/teams/168.png' },
      { id: 'team_85', type: 'team', name: 'PSG', logo: 'https://media.api-sports.io/football/teams/85.png' },
    ],
  },
];

interface FavoriteTeamsBarProps {
  showMyFeedLink?: boolean;
  showInlineFeed?: boolean;
  onFilterChange?: (selectedFav: FavoriteItem | null) => void;
}

export function FavoriteTeamsBar({
  showMyFeedLink = true,
  showInlineFeed = true,
  onFilterChange,
}: FavoriteTeamsBarProps) {
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { matches } = useFootballMatches();
  const { articles } = useArticles('published');
  const { isFollowing, toggleFollowMatch } = useNotifications();

  const [selectedFavId, setSelectedFavId] = useState<string>('ALL');
  const [showPicker, setShowPicker] = useState(false);
  const [isFeedExpanded, setIsFeedExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroup, setExpandedGroup] = useState<string>('Top Competitions');

  const activeFavorite = useMemo(
    () => favorites.find((f) => f.id === selectedFavId) || null,
    [favorites, selectedFavId]
  );

  const handleSelectChip = (id: string) => {
    setSelectedFavId(id);
    if (showInlineFeed && id !== 'ALL') {
      setIsFeedExpanded(true);
    }
    if (onFilterChange) {
      onFilterChange(id === 'ALL' ? null : favorites.find((f) => f.id === id) || null);
    }
  };

  // Match pinned items against live/upcoming/finished NormalizedMatches
  const personalizedMatches = useMemo(() => {
    if (favorites.length === 0 || !matches.length) return [];

    const scope = activeFavorite ? [activeFavorite] : favorites;
    const matched = matches.filter((m) =>
      Boolean(
        isFavoriteTeamOrCompMatch(scope, {
          homeName: m.homeTeam.name,
          awayName: m.awayTeam.name,
          competitionName: m.competition.name,
          homeId: m.homeTeam.id,
          awayId: m.awayTeam.id,
          competitionId: m.competition.id,
        })
      )
    );

    return matched.sort((a, b) => {
      const rank = (m: NormalizedMatch) => (m.isLive ? 0 : m.status === 'UPCOMING' ? 1 : 2);
      const rDiff = rank(a) - rank(b);
      if (rDiff !== 0) return rDiff;
      if (a.status === 'UPCOMING') {
        return new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime();
      }
      return new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime();
    });
  }, [favorites, activeFavorite, matches]);

  // Match pinned items against published news articles
  const personalizedArticles = useMemo(() => {
    if (favorites.length === 0 || !articles?.length) return [];
    const scope = activeFavorite ? [activeFavorite] : favorites;

    return articles
      .filter((a) =>
        scope.some(
          (f) =>
            doesFavoriteMatchName(f.name, a.title) ||
            a.title.toLowerCase().includes(f.name.toLowerCase()) ||
            (a.summary && a.summary.toLowerCase().includes(f.name.toLowerCase())) ||
            (a.category && doesFavoriteMatchName(f.name, a.category))
        )
      )
      .slice(0, 4);
  }, [favorites, activeFavorite, articles]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return PINNABLE_GROUPS;
    const q = searchQuery.toLowerCase();
    return PINNABLE_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((item) => item.name.toLowerCase().includes(q)),
    })).filter((g) => g.items.length > 0);
  }, [searchQuery]);

  const quickSuggestions = [
    PINNABLE_GROUPS[2].items[0], // Arsenal
    PINNABLE_GROUPS[3].items[1], // Real Madrid
    PINNABLE_GROUPS[3].items[0], // Barcelona
    PINNABLE_GROUPS[1].items[3], // France
    PINNABLE_GROUPS[0].items[0], // Champions League
  ];

  const livePinnedCount = useMemo(
    () => personalizedMatches.filter((m) => m.isLive).length,
    [personalizedMatches]
  );

  return (
    <>
      {/* Single-Row Slim Bar */}
      <section className="w-full rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/90 px-3 py-2.5 sm:px-4 shadow-xs space-y-2.5">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {/* Status / Count Pill */}
          <button
            type="button"
            onClick={() => handleSelectChip('ALL')}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black border transition-all whitespace-nowrap shrink-0 cursor-pointer',
              favorites.length > 0 && selectedFavId === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70'
            )}
          >
            <Star className={cn('w-3.5 h-3.5', selectedFavId === 'ALL' && favorites.length > 0 ? 'fill-amber-400 text-amber-400' : 'fill-amber-400 text-amber-500')} />
            <span>Pinned ({favorites.length})</span>
          </button>

          {/* Pinned Pills OR Quick-Pin Pills when empty */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1 min-w-0">
            {favorites.length > 0 ? (
              favorites.map((fav) => {
                const isSelected = selectedFavId === fav.id;
                return (
                  <div
                    key={fav.id}
                    className={cn(
                      'inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-xl border text-xs font-bold transition-all shrink-0',
                      isSelected
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-rose-300'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectChip(isSelected ? 'ALL' : fav.id)}
                      className="inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      {fav.logo && (
                        <img
                          src={fav.logo}
                          alt=""
                          className="w-3.5 h-3.5 object-contain bg-white rounded-full p-0.5"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      )}
                      <span>{fav.name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isSelected) handleSelectChip('ALL');
                        toggleFavorite(fav);
                      }}
                      className={cn(
                        'p-0.5 rounded-md transition-colors cursor-pointer',
                        isSelected ? 'hover:bg-white/20 text-white/90' : 'hover:bg-rose-100 text-slate-400 hover:text-rose-600'
                      )}
                      title={`Unpin ${fav.name}`}
                      aria-label={`Unpin ${fav.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            ) : (
              quickSuggestions.map((quick) => (
                <button
                  key={quick.id}
                  type="button"
                  onClick={() => toggleFavorite(quick)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-rose-50 border border-dashed border-slate-300 hover:border-rose-300 text-xs font-bold text-slate-700 hover:text-rose-700 transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3 h-3 text-rose-600" />
                  <span>{quick.name}</span>
                </button>
              ))
            )}
          </div>

          {/* Compact Right Controls: + Pin, Collapsible Toggle, Open My Feed -> */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
              title="Pin teams or leagues"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Pin</span>
            </button>

            {showInlineFeed && favorites.length > 0 && (
              <button
                type="button"
                onClick={() => setIsFeedExpanded((prev) => !prev)}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap',
                  isFeedExpanded
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                )}
                title={isFeedExpanded ? 'Hide pinned matches & news' : 'Show pinned matches & news'}
              >
                {livePinnedCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
                <span className="hidden sm:inline">
                  {isFeedExpanded ? 'Hide Feed' : `Show Pinned Matches & News (${personalizedMatches.length + personalizedArticles.length})`}
                </span>
                <span className="sm:hidden">
                  {isFeedExpanded ? 'Hide' : `Feed (${personalizedMatches.length + personalizedArticles.length})`}
                </span>
                {isFeedExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}

            {showMyFeedLink && (
              <Link
                to="/my-feed"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-rose-600 text-xs font-bold transition-colors whitespace-nowrap"
              >
                <span className="hidden sm:inline">Open My Feed</span>
                <span className="sm:hidden">My Feed</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Collapsible Pinned Matches & News Strip (hidden by default on Home to save space) */}
        {showInlineFeed && favorites.length > 0 && isFeedExpanded && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-2.5 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Fixtures & Live Score Strip (2 cols on lg) */}
            <div className="lg:col-span-2 space-y-2">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-600" />
                {activeFavorite ? `${activeFavorite.name} · Live & Next Fixtures` : 'Live & Upcoming For Your Pinned Picks'}
              </p>

              {personalizedMatches.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {personalizedMatches.slice(0, 4).map((m) => {
                    const kickoff = new Date(m.utcDate);
                    const timeStr = kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const dateStr =
                      kickoff.toDateString() === new Date().toDateString()
                        ? 'Today'
                        : kickoff.toLocaleDateString([], { month: 'short', day: 'numeric' });
                    const followed = isFollowing(String(m.id));

                    return (
                      <div
                        key={m.id}
                        className={cn(
                          'rounded-2xl border p-3 transition-all flex flex-col justify-between gap-2',
                          m.isLive
                            ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                            : 'bg-slate-50/80 border-slate-200/90 hover:bg-white'
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 text-[10px] font-bold">
                          <span className="text-slate-500 truncate">{m.competition.name}</span>
                          {m.isLive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              {m.minute || 'LIVE'}
                            </span>
                          ) : m.status === 'FINISHED' ? (
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-black">FT</span>
                          ) : (
                            <span className="text-slate-600">{dateStr} · {timeStr}</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 text-xs font-black text-slate-900">
                          <span className="truncate flex-1">{m.homeTeam.shortName || m.homeTeam.name}</span>
                          <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-mono text-xs shrink-0">
                            {m.score.home !== null ? m.score.home : '-'} : {m.score.away !== null ? m.score.away : '-'}
                          </span>
                          <span className="truncate flex-1 text-right">{m.awayTeam.shortName || m.awayTeam.name}</span>
                        </div>

                        {m.status !== 'FINISHED' && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                toggleFollowMatch(
                                  String(m.id),
                                  `${m.homeTeam.shortName || m.homeTeam.name} vs ${m.awayTeam.shortName || m.awayTeam.name}`
                                )
                              }
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold cursor-pointer transition-colors',
                                followed
                                  ? 'bg-rose-100 border-rose-300 text-rose-700'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-600'
                              )}
                            >
                              {followed ? <BellRing className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
                              <span>{followed ? 'Alerts On' : 'Remind Me'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-center text-xs text-slate-500">
                  No current matchday fixtures found for {activeFavorite ? activeFavorite.name : 'your pinned teams'}. Check Live Scores below for all competitions.
                </div>
              )}
            </div>

            {/* Team-Specific News Strip (1 col on lg) */}
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Newspaper className="w-3.5 h-3.5 text-rose-600" />
                {activeFavorite ? `${activeFavorite.name} News` : 'Pinned Team News'}
              </p>

              {personalizedArticles.length > 0 ? (
                <div className="space-y-2">
                  {personalizedArticles.slice(0, 3).map((article) => (
                    <Link
                      key={article.id}
                      to={`/news/${article.id}`}
                      className="block rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-white hover:border-rose-200 p-2.5 transition-all group"
                    >
                      <span className="text-[10px] font-black uppercase text-rose-600">{article.category || 'News'}</span>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-rose-600 line-clamp-2 leading-snug mt-0.5">
                        {article.title}
                      </h4>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-center text-xs text-slate-500">
                  No breaking headlines mentioning {activeFavorite ? activeFavorite.name : 'your pinned teams'} today.
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Clean Modal Overlay Team / League Picker (never shifts page layout) */}
      {showPicker && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/45 backdrop-blur-2xs"
            onClick={() => setShowPicker(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[82vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">Pin Teams, Nations & Leagues</h3>
                  <p className="text-[11px] text-slate-500 font-medium">{favorites.length} pinned right now</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Done</span>
              </button>
            </div>

            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search clubs, national teams or competitions..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            </div>

            <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
              {filteredGroups.length > 0 ? (
                filteredGroups.map((group) => {
                  const isOpen = expandedGroup === group.group || searchQuery.trim().length > 0;
                  return (
                    <div key={group.group} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedGroup(isOpen ? '' : group.group)}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-xs font-black text-slate-800 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          {group.kind === 'competition' ? (
                            <Trophy className="w-3.5 h-3.5 text-amber-500" />
                          ) : group.kind === 'national' ? (
                            <Globe className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Shield className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          {group.group}
                        </span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>

                      {isOpen && (
                        <div className="p-2.5 flex flex-wrap gap-1.5 border-t border-slate-100">
                          {group.items.map((item) => {
                            const pinned = isFavorite(item.id, item.name, item.type);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => toggleFavorite(item)}
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer',
                                  pinned
                                    ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-2xs'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                )}
                              >
                                {item.logo && (
                                  <img
                                    src={item.logo}
                                    alt=""
                                    className="w-4 h-4 object-contain"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                  />
                                )}
                                <span>{item.name}</span>
                                {pinned ? (
                                  <Check className="w-3 h-3 text-rose-600" />
                                ) : (
                                  <Plus className="w-3 h-3 text-slate-400" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-center py-8 text-xs text-slate-500">
                  No clubs, national teams, or competitions match "{searchQuery}".
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
