import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getLeaguePriority = (competition: { id?: string | number, name?: string, country?: string }): number => {
  const id = String(competition.id);
  // Priority map based on API-Sports IDs for top leagues and tournaments
  const LEAGUE_PRIORITY: Record<string, number> = {
    '1': 1, // World Cup
    '4': 2, // Euro
    '9': 3, // Copa America
    '2': 4, // Champions League
    '3': 5, // Europa League
    '848': 6, // Conference League
    '39': 10, // Premier League (England)
    '140': 11, // La Liga (Spain)
    '135': 12, // Serie A (Italy)
    '78': 13, // Bundesliga (Germany)
    '61': 14, // Ligue 1 (France)
    '71': 20, // Serie A (Brazil)
    '305': 21, // Liga Profesional (Argentina)
    '88': 22, // Eredivisie (Netherlands)
    '94': 23, // Primeira Liga (Portugal)
    '144': 24, // Jupiler Pro League (Belgium)
    '253': 25, // MLS (USA)
  };
  
  if (LEAGUE_PRIORITY[id]) return LEAGUE_PRIORITY[id];
  
  // Fallback heuristic based on names in case IDs mismatch
  const name = (competition.name || '').toLowerCase();
  const country = (competition.country || '').toLowerCase();
  
  if (name.includes('world cup')) return 1;
  if (name.includes('euro') && name.includes('championship')) return 2;
  if (name.includes('champions league')) return 4;
  if (name.includes('europa league')) return 5;
  if (country === 'england' && name.includes('premier league')) return 10;
  if (country === 'spain' && (name.includes('la liga') || name.includes('primera'))) return 11;
  if (country === 'italy' && name.includes('serie a')) return 12;
  if (country === 'germany' && name.includes('bundesliga')) return 13;
  if (country === 'france' && name.includes('ligue 1')) return 14;

  return 999; // Default lowest priority
};

export function formatTimeEAT(dateInput: number | string | Date): string {
  return new Date(dateInput).toLocaleTimeString('en-US', {
    timeZone: 'Africa/Nairobi',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateEAT(dateInput: number | string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(dateInput).toLocaleString('en-US', {
    timeZone: 'Africa/Nairobi',
    hour12: true,
    ...options
  });
}
