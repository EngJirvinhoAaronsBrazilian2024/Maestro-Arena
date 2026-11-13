import { getInsforgeAdmin } from '../insforgeAdmin.js';
import crypto from 'crypto';

interface RawNewsItem {
  title: string;
  description: string;
  link: string;
  pubTime: number;
  image?: string;
  source: string;
  category: string;
}

const MAX_INGEST_AGE_DAYS = 14;
const MAX_INGEST_AGE_MS = MAX_INGEST_AGE_DAYS * 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 6 * 60 * 60 * 1000;

// Deprecated/broken feeds whose historical rows must be purged from the DB
export const DEPRECATED_STALE_SOURCES = [
  'Sky Sports Transfer Centre', // Dead since July 2018; BST timezone caused NaN -> Date.now()
  'Marca Football',             // Stale since April/May 2026
];

export const RSS_MANAGED_SOURCES = new Set([
  'BBC Sport Football',
  'Sky Sports Premier League',
  'Sky Sports Football',
  'Sky Sports Transfer Centre',
  'The Guardian Football',
  'The Independent Football',
  'Marca Football',
  'ESPN FC',
  'talkSPORT Football',
  'Evening Standard Football',
]);

// Verified live & actively updated football news feeds
const FOOTBALL_RSS_FEEDS = [
  {
    url: 'https://feeds.bbci.co.uk/sport/football/rss.xml',
    source: 'BBC Sport Football',
    defaultCategory: 'World Football',
  },
  {
    url: 'https://www.skysports.com/rss/12040',
    source: 'Sky Sports Football',
    defaultCategory: 'Premier League',
  },
  {
    url: 'https://www.theguardian.com/football/rss',
    source: 'The Guardian Football',
    defaultCategory: 'Champions League',
  },
  {
    url: 'https://www.independent.co.uk/sport/football/rss',
    source: 'The Independent Football',
    defaultCategory: 'Premier League',
  },
  {
    url: 'https://talksport.com/football/feed/',
    source: 'talkSPORT Football',
    defaultCategory: 'Transfers',
  },
  {
    url: 'https://www.standard.co.uk/sport/football/rss',
    source: 'Evening Standard Football',
    defaultCategory: 'Premier League',
  },
];

const ESPN_NEWS_ENDPOINTS = [
  {
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/all/news',
    source: 'ESPN FC',
    defaultCategory: 'World Football',
  },
  {
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/news',
    source: 'ESPN FC',
    defaultCategory: 'Champions League',
  },
  {
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news',
    source: 'ESPN FC',
    defaultCategory: 'Premier League',
  },
];

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/<[^>]+>/g, '')
    .trim();
}

export function normalizeNewsHeadline(title: string): string {
  return (title || '')
    .toLowerCase()
    .replace(/['"`’‘“”]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses RSS / ISO dates safely, handling named UK/EU/US timezones (e.g. BST, CEST, EDT)
 * that V8 Date.parse() treats as Invalid Date (NaN).
 * NEVER returns Date.now() on failure — returns null so unparseable/undated items are rejected.
 */
export function parseFeedDateMs(rawDate: string | undefined | null): number | null {
  if (!rawDate || typeof rawDate !== 'string') return null;
  let cleaned = rawDate.trim();
  if (!cleaned) return null;

  const tzOffsets: Record<string, string> = {
    GMT: '+0000',
    UTC: '+0000',
    UT: '+0000',
    Z: '+0000',
    BST: '+0100',
    WEST: '+0100',
    WET: '+0000',
    CEST: '+0200',
    CET: '+0100',
    EEST: '+0300',
    EET: '+0200',
    EDT: '-0400',
    EST: '-0500',
    CDT: '-0500',
    CST: '-0600',
    MDT: '-0600',
    MST: '-0700',
    PDT: '-0700',
    PST: '-0800',
  };

  cleaned = cleaned.replace(
    /\b(GMT|UTC|UT|BST|WEST|WET|CEST|CET|EEST|EET|EDT|EST|CDT|CST|MDT|MST|PDT|PST)\b$/i,
    (abbr) => tzOffsets[abbr.toUpperCase()] || abbr
  );

  const ts = Date.parse(cleaned);
  if (!Number.isFinite(ts) || ts <= 0) return null;
  return ts;
}

/**
 * Ensures an article timestamp is genuinely current & fresh (not from previous years or >14 days old)
 */
export function isFreshNewsTimestamp(pubTime: number, maxAgeMs = MAX_INGEST_AGE_MS): boolean {
  if (!Number.isFinite(pubTime) || pubTime <= 0) return false;
  const now = Date.now();

  // Reject future-skewed timestamps beyond 6 hours
  if (pubTime > now + MAX_FUTURE_SKEW_MS) return false;

  // Reject anything older than the freshness window (default 14 days)
  if (now - pubTime > maxAgeMs) return false;

  // Guard against previous calendar years except the first days of January within the age window
  const nowDate = new Date(now);
  const pubDate = new Date(pubTime);
  const currentYear = nowDate.getUTCFullYear();
  const pubYear = pubDate.getUTCFullYear();
  const isEarlyJanuary = nowDate.getUTCMonth() === 0 && nowDate.getUTCDate() <= Math.ceil(maxAgeMs / (24 * 60 * 60 * 1000));
  if (pubYear < currentYear && !(isEarlyJanuary && pubYear === currentYear - 1)) {
    return false;
  }

  return true;
}

function determineCategory(title: string, desc: string, defaultCat: string): string {
  const text = `${title} ${desc}`.toLowerCase();

  if (text.includes('transfer') || text.includes('signing') || text.includes('deal') || text.includes('bid') || text.includes('fee') || text.includes('contract') || text.includes('loan')) {
    return 'Transfers';
  }
  if (text.includes('champions league') || text.includes('ucl') || text.includes('uefa') || text.includes('europa') || text.includes('conference league')) {
    return 'Champions League';
  }
  if (
    text.includes('premier league') ||
    text.includes('arsenal') ||
    text.includes('chelsea') ||
    text.includes('liverpool') ||
    text.includes('manchester') ||
    text.includes('tottenham') ||
    text.includes('newcastle') ||
    text.includes('aston villa') ||
    text.includes('everton')
  ) {
    return 'Premier League';
  }
  if (
    text.includes('real madrid') ||
    text.includes('barcelona') ||
    text.includes('bayern') ||
    text.includes('psg') ||
    text.includes('juventus') ||
    text.includes('inter') ||
    text.includes('milan') ||
    text.includes('la liga') ||
    text.includes('serie a') ||
    text.includes('bundesliga') ||
    text.includes('atletico')
  ) {
    return 'European Football';
  }
  return defaultCat;
}

function extractBestImage(raw: string): string | undefined {
  const mediaMatches = Array.from(raw.matchAll(/<media:content[^>]+url=["']([^"']+)["'][^>]*>/gi));
  let bestMedia: { url: string; width: number } | null = null;
  for (const m of mediaMatches) {
    const fullTag = m[0];
    const url = m[1];
    if (url.includes('imrworldwide') || url.includes('tracking') || url.endsWith('.gif')) continue;
    const widthMatch = fullTag.match(/width=["']?(\d+)["']?/i);
    const width = widthMatch ? parseInt(widthMatch[1], 10) : 0;
    if (!bestMedia || width > bestMedia.width) {
      bestMedia = { url, width };
    }
  }
  if (bestMedia && bestMedia.url) {
    let img = bestMedia.url.replace(/&amp;/g, '&');
    if (img.includes('guim.co.uk') && img.includes('width=140')) {
      img = img.replace('width=140', 'width=800');
    }
    return img;
  }

  const encMatch = raw.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
  if (encMatch && !encMatch[1].includes('.gif') && !encMatch[1].includes('imrworldwide')) {
    return encMatch[1].replace(/&amp;/g, '&');
  }

  const thumbMatch = raw.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
  if (thumbMatch && !thumbMatch[1].includes('.gif') && !thumbMatch[1].includes('imrworldwide')) {
    let img = thumbMatch[1].replace(/&amp;/g, '&');
    if (img.includes('/240/')) {
      img = img.replace('/240/', '/1024/');
    }
    return img;
  }

  const imgMatch = raw.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && !imgMatch[1].includes('imrworldwide') && !imgMatch[1].includes('tracking') && !imgMatch[1].endsWith('.gif')) {
    return imgMatch[1].replace(/&amp;/g, '&');
  }

  return undefined;
}

function stripHtmlTagsKeepParagraphs(html: string): string {
  if (!html) return '';
  return html
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const BOILERPLATE_PARA_REGEX = /\b(cookie|cookies|consent|subscribe|subscription|newsletter|sign up|sign in|create a free account|privacy policy|terms of service|terms and conditions|all rights reserved|enable javascript|download the app|stream sky sports|watch live on|follow us on|more on this story|related topics|got a story|get involved|advertisement|promoted content|this content cannot be played|browser is not supported)\b/i;

function extractCleanParagraphsFromHtml(html: string): string {
  if (!html) return '';

  // Remove non-article structural blocks first
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<aside[\s\S]*?<\/aside>/gi, ' ')
    .replace(/<form[\s\S]*?<\/form>/gi, ' ');

  // Narrow down to <article> or <main> container when substantial
  const articleMatch = cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (articleMatch && articleMatch[1].length > 500) {
    cleaned = articleMatch[1];
  } else if (mainMatch && mainMatch[1].length > 500) {
    cleaned = mainMatch[1];
  }

  const rawParagraphs = [...cleaned.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) =>
    decodeHtmlEntities(m[1]).replace(/\s+/g, ' ').trim()
  );

  const seen = new Set<string>();
  const paragraphs: string[] = [];
  let totalChars = 0;

  for (const p of rawParagraphs) {
    if (!p || p.length < 45) continue;
    if (p.length > 1400) continue; // Skip embedded JSON/widget blobs
    if (BOILERPLATE_PARA_REGEX.test(p)) continue;
    if (/^by\s+[a-z\s.-]{2,40}$/i.test(p)) continue;
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    paragraphs.push(p);
    totalChars += p.length;
    if (paragraphs.length >= 14 || totalChars >= 5500) break;
  }

  return paragraphs.join('\n\n');
}

const headlineLinkCache = new Map<string, { link: string; description: string; source: string; updatedAt: number }>();
const HEADLINE_CACHE_TTL_MS = 30 * 60 * 1000;

export async function extractFullStoryFromUrl(url: string, fallbackDesc = ''): Promise<string> {
  if (!url || !url.startsWith('http')) return fallbackDesc;
  try {
    const cleanUrl = url.replace(/&amp;/g, '&').trim();
    const res = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) return fallbackDesc;
    const html = await res.text();
    const extracted = extractCleanParagraphsFromHtml(html);
    if (extracted && extracted.length >= Math.max(280, fallbackDesc.length + 100)) {
      return extracted;
    }
    return fallbackDesc;
  } catch {
    return fallbackDesc;
  }
}

export function isShortOrPlaceholderContent(content?: string): boolean {
  if (!content) return true;
  const trimmed = content.trim();
  if (trimmed.includes('Follow live tactical reactions, line-ups, and post-match quotes on Maestro Arena.')) {
    return true;
  }
  return trimmed.length < 450;
}

function parseFeedXml(xml: string, source: string, defaultCat: string): RawNewsItem[] {
  const items: RawNewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const raw = match[1];

    const titleMatch = raw.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const descMatch = raw.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
    const contentEncodedMatch = raw.match(/<content:encoded>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/i);
    const linkMatch = raw.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
    const pubDateMatch = raw.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i);

    const rawTitle = titleMatch ? titleMatch[1] : '';
    const rawDesc = descMatch ? descMatch[1] : '';
    const rawContentEncoded = contentEncodedMatch ? stripHtmlTagsKeepParagraphs(contentEncodedMatch[1]) : '';
    const title = decodeHtmlEntities(rawTitle);
    const plainDesc = decodeHtmlEntities(rawDesc);
    const description = rawContentEncoded.length > plainDesc.length + 60 ? rawContentEncoded : plainDesc;
    const link = linkMatch ? linkMatch[1].replace(/&amp;/g, '&').trim() : '';
    const rawPubDate = pubDateMatch ? pubDateMatch[1].trim() : '';

    if (!title || title.length < 5) continue;

    // Strictly require a valid, fresh, current-period date
    const pubTime = parseFeedDateMs(rawPubDate);
    if (pubTime === null || !isFreshNewsTimestamp(pubTime)) {
      continue;
    }

    const image = extractBestImage(raw);
    const category = determineCategory(title, description, defaultCat);

    const normTitle = normalizeNewsHeadline(title);
    if (normTitle && link) {
      headlineLinkCache.set(normTitle, { link, description, source, updatedAt: Date.now() });
    }

    items.push({
      title,
      description,
      link,
      pubTime,
      image,
      source,
      category,
    });
  }

  return items;
}

async function fetchEspnNewsItems(): Promise<RawNewsItem[]> {
  const results = await Promise.all(
    ESPN_NEWS_ENDPOINTS.map(async (ep) => {
      try {
        const res = await fetch(ep.url, {
          headers: {
            'User-Agent': 'SportsHub/2.0',
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(7000),
        });
        if (!res.ok) return [];
        const json = await res.json();
        const articles: any[] = json?.articles || [];
        const parsed: RawNewsItem[] = [];
        for (const a of articles) {
          const title = decodeHtmlEntities(a.headline || '');
          const description = decodeHtmlEntities(a.description || title);
          const pubTime = parseFeedDateMs(a.published || a.lastModified);
          if (!title || title.length < 5 || pubTime === null || !isFreshNewsTimestamp(pubTime)) {
            continue;
          }
          const link = a.links?.web?.href || '';
          const normTitle = normalizeNewsHeadline(title);
          if (normTitle && link) {
            headlineLinkCache.set(normTitle, { link, description, source: ep.source, updatedAt: Date.now() });
          }
          parsed.push({
            title,
            description,
            link,
            pubTime,
            image: a.images?.[0]?.url,
            source: ep.source,
            category: determineCategory(title, description, ep.defaultCategory),
          });
        }
        return parsed;
      } catch {
        return [];
      }
    })
  );
  return results.flat();
}

/**
 * Purges corrupted 2018/deprecated feed rows, stale articles older than 14 days,
 * and duplicate headlines from the database so only current & fresh news remains.
 */
async function cleanupStaleArticles(admin: ReturnType<typeof getInsforgeAdmin>) {
  try {
    const { data: allArticles, error } = await admin.database
      .from('articles')
      .select('id, title, author_name, published_at, status')
      .order('published_at', { ascending: false })
      .limit(1000);

    if (error || !Array.isArray(allArticles)) return 0;

    const seenTitles = new Set<string>();
    const idsToDelete: string[] = [];

    for (const a of allArticles) {
      const id = a.id;
      if (!id) continue;

      const author = String(a.author_name || '');
      const pubTime = Number(a.published_at || 0);
      const normTitle = normalizeNewsHeadline(a.title || '');

      // 1. Delete all items from discontinued/archived feeds (2018 Sky Transfers & stale Marca)
      if (DEPRECATED_STALE_SOURCES.includes(author)) {
        idsToDelete.push(id);
        continue;
      }

      // 2. Delete published articles that are older than 14 days or from previous years
      if (a.status === 'published' && !isFreshNewsTimestamp(pubTime, MAX_INGEST_AGE_MS)) {
        idsToDelete.push(id);
        continue;
      }

      // 3. Delete duplicate headlines (keep the newest one since list is ordered DESC)
      if (normTitle && seenTitles.has(normTitle)) {
        idsToDelete.push(id);
        continue;
      }
      if (normTitle) {
        seenTitles.add(normTitle);
      }
    }

    if (idsToDelete.length > 0) {
      // Delete in chunks of 50 to stay well within query limits
      for (let i = 0; i < idsToDelete.length; i += 50) {
        const chunk = idsToDelete.slice(i, i + 50);
        await admin.database.from('articles').delete().in('id', chunk);
      }
      console.log(`[AutoNews] Cleaned up ${idsToDelete.length} stale, duplicate, or outdated news articles.`);
    }
    return idsToDelete.length;
  } catch (err) {
    console.warn('[AutoNews] Cleanup warning:', err);
    return 0;
  }
}

let lastSyncTimestamp = 0;
let isSyncInProgress = false;

/**
 * Automatically fetch, parse, freshness-filter, de-duplicate and insert real-time football news
 * from active global football newsrooms (BBC Sport, Sky Sports, The Guardian, The Independent, ESPN FC, talkSPORT, Evening Standard).
 */
export async function autoIngestFootballNews(options: { force?: boolean; maxItems?: number } = {}) {
  const { force = false, maxItems = 25 } = options;

  const now = Date.now();
  if (!force && now - lastSyncTimestamp < 8 * 60 * 1000) {
    return { added: 0, message: 'Recent sync still valid (debounced)', total: 0 };
  }

  if (isSyncInProgress) {
    return { added: 0, message: 'Sync already in progress', total: 0 };
  }

  isSyncInProgress = true;

  try {
    const admin = getInsforgeAdmin();

    // 0. Clean up any outdated, deprecated (2018), or duplicate articles first
    await cleanupStaleArticles(admin);

    const SPECIAL_ADMIN_ID = '2886ae6d-b563-44a3-b4b8-ae932cc188ad';
    let authorId = SPECIAL_ADMIN_ID;
    try {
      const { data: adminUsers } = await admin.database
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (adminUsers && adminUsers.length > 0 && adminUsers[0]?.id) {
        authorId = adminUsers[0].id;
      } else {
        const { data: anyUsers } = await admin.database
          .from('users')
          .select('id')
          .limit(1);
        if (anyUsers && anyUsers.length > 0 && anyUsers[0]?.id) {
          authorId = anyUsers[0].id;
        }
      }
    } catch {
      console.warn('[AutoNews] Could not lookup admin ID, using fallback ID');
    }

    // 1. Fetch current articles from database for strict de-duplication
    const { data: existingArticles } = await admin.database
      .from('articles')
      .select('id, title, published_at')
      .order('published_at', { ascending: false })
      .limit(600);

    const existingTitles = new Set(
      (existingArticles || []).map((a: any) => normalizeNewsHeadline(a.title || ''))
    );

    // 2. Fetch fresh items from all active feeds + ESPN FC in parallel
    const rssPromises = FOOTBALL_RSS_FEEDS.map(async (feed) => {
      try {
        const res = await fetch(feed.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SportsHub/2.0 NewsIngestion',
            Accept: 'application/rss+xml, application/xml, text/xml, */*',
          },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) {
          console.warn(`[AutoNews] Feed HTTP ${res.status} for ${feed.source}`);
          return [];
        }
        const xml = await res.text();
        return parseFeedXml(xml, feed.source, feed.defaultCategory);
      } catch (err) {
        console.warn(`[AutoNews] Error fetching feed ${feed.source}:`, err);
        return [];
      }
    });

    const [espnItems, ...rssResults] = await Promise.all([fetchEspnNewsItems(), ...rssPromises]);
    const allFeedBuckets = [...rssResults, espnItems];

    // 3. Balanced round-robin selection across all fresh sources (newest first, strictly non-duplicate)
    const newItemsToInsert: any[] = [];
    const maxPerFeed = 6;

    const perFeedCandidates = allFeedBuckets.map((items) => {
      const sorted = [...items].sort((a, b) => b.pubTime - a.pubTime);
      return sorted.filter((item) => {
        const normTitle = normalizeNewsHeadline(item.title);
        return normTitle.length > 0 && !existingTitles.has(normTitle);
      });
    });

    const pendingInsertRaw: { item: RawNewsItem; normTitle: string }[] = [];
    let addedAny = true;
    let round = 0;
    while (addedAny && pendingInsertRaw.length < maxItems && round < maxPerFeed) {
      addedAny = false;
      for (const feedCandidates of perFeedCandidates) {
        if (feedCandidates.length > round && pendingInsertRaw.length < maxItems) {
          const item = feedCandidates[round];
          const normTitle = normalizeNewsHeadline(item.title);
          if (normTitle && !existingTitles.has(normTitle)) {
            existingTitles.add(normTitle);
            pendingInsertRaw.push({ item, normTitle });
            addedAny = true;
          }
        }
      }
      round++;
    }

    // Fetch full multi-paragraph story content in parallel batches of 5
    const BATCH_SIZE = 5;
    for (let i = 0; i < pendingInsertRaw.length; i += BATCH_SIZE) {
      const batch = pendingInsertRaw.slice(i, i + BATCH_SIZE);
      const batchRows = await Promise.all(
        batch.map(async ({ item }) => {
          const cleanDesc = item.description || item.title;
          let fullContent = cleanDesc;
          if (cleanDesc.length < 700 && item.link) {
            fullContent = await extractFullStoryFromUrl(item.link, cleanDesc);
          }
          return {
            id: crypto.randomUUID(),
            title: item.title,
            content: fullContent,
            summary: cleanDesc.length > 200 ? cleanDesc.slice(0, 197) + '...' : cleanDesc,
            image_url: item.image || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1024&auto=format&fit=crop&q=80',
            author_name: item.source,
            author_id: authorId,
            status: 'published',
            category: item.category,
            published_at: item.pubTime,
          };
        })
      );
      newItemsToInsert.push(...batchRows);
    }

    // 4. Insert fresh articles into database
    let insertedCount = 0;
    if (newItemsToInsert.length > 0) {
      const { error } = await admin.database
        .from('articles')
        .insert(newItemsToInsert);

      if (error) {
        console.warn('[AutoNews] Batch insert hit issue, retrying individually:', error.message || error);
        for (const singleItem of newItemsToInsert) {
          try {
            const { error: singleError } = await admin.database
              .from('articles')
              .insert([singleItem]);
            if (!singleError) {
              insertedCount++;
            }
          } catch (itemErr) {
            console.warn('[AutoNews] Failed single item insert:', itemErr);
          }
        }
      } else {
        insertedCount = newItemsToInsert.length;
      }

      console.log(`[AutoNews] Successfully auto-posted ${insertedCount} fresh football articles.`);
    }

    lastSyncTimestamp = Date.now();
    return {
      added: insertedCount,
      total: (existingArticles?.length || 0) + insertedCount,
      message: `Auto-sync complete. ${insertedCount} fresh current stories synced from global football newsrooms.`,
    };
  } catch (err: any) {
    console.error('[AutoNews] Ingestion failed:', err);
    return { added: 0, message: err.message, total: 0 };
  } finally {
    isSyncInProgress = false;
  }
}

let lastHeadlineIndexRefresh = 0;

async function refreshHeadlineLinkCacheIfNeeded() {
  if (Date.now() - lastHeadlineIndexRefresh < HEADLINE_CACHE_TTL_MS && headlineLinkCache.size > 0) {
    return;
  }
  lastHeadlineIndexRefresh = Date.now();
  await Promise.allSettled([
    fetchEspnNewsItems(),
    ...FOOTBALL_RSS_FEEDS.map(async (feed) => {
      try {
        const res = await fetch(feed.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SportsHub/2.0 NewsIngestion',
            Accept: 'application/rss+xml, application/xml, text/xml, */*',
          },
          signal: AbortSignal.timeout(5500),
        });
        if (!res.ok) return;
        const xml = await res.text();
        parseFeedXml(xml, feed.source, feed.defaultCategory);
      } catch {
        // ignore
      }
    }),
  ]);
}

/**
 * On-demand enrichment for existing short/teaser articles so users always read the full multi-paragraph story.
 */
export async function resolveAndEnrichArticleContent(articleRow: {
  id: string;
  title: string;
  content?: string;
  summary?: string;
  author_name?: string;
}): Promise<string> {
  const currentContent = String(articleRow.content || '').trim();
  if (!isShortOrPlaceholderContent(currentContent)) {
    return currentContent;
  }

  const baseClean = currentContent
    .replace(/\n*Full reporting and coverage from .*?Maestro Arena\./is, '')
    .trim() || String(articleRow.summary || articleRow.title || '').trim();

  const normTitle = normalizeNewsHeadline(articleRow.title || '');
  let entry = normTitle ? headlineLinkCache.get(normTitle) : undefined;
  if (!entry) {
    await refreshHeadlineLinkCacheIfNeeded();
    entry = normTitle ? headlineLinkCache.get(normTitle) : undefined;
  }

  if (entry?.link) {
    const fullText = await extractFullStoryFromUrl(entry.link, baseClean);
    if (fullText && fullText.length > baseClean.length + 120) {
      try {
        const admin = getInsforgeAdmin();
        await admin.database
          .from('articles')
          .update({ content: fullText })
          .eq('id', articleRow.id);
      } catch (err) {
        console.warn('[AutoNews] Could not persist enriched article content:', err);
      }
      return fullText;
    }
  }

  return baseClean;
}
