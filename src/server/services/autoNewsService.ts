import { getInsforgeAdmin } from '../insforgeAdmin.js';
import crypto from 'crypto';

interface RawNewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  image?: string;
  source: string;
  category: string;
}

// Feeds covering real-time football news
// Top 5 World-Class Football News Sources
const FOOTBALL_FEEDS = [
  {
    url: 'https://feeds.bbci.co.uk/sport/football/rss.xml',
    source: 'BBC Sport Football',
    defaultCategory: 'World Football',
    badge: 'BBC Sport',
  },
  {
    url: 'https://www.skysports.com/rss/12010',
    source: 'Sky Sports Premier League',
    defaultCategory: 'Premier League',
    badge: 'Sky Sports',
  },
  {
    url: 'https://www.theguardian.com/football/rss',
    source: 'The Guardian Football',
    defaultCategory: 'Champions League',
    badge: 'The Guardian',
  },
  {
    url: 'https://e00-marca.uecdn.es/rss/en/football.xml',
    source: 'Marca Football',
    defaultCategory: 'European Football',
    badge: 'Marca',
  },
  {
    url: 'https://www.independent.co.uk/sport/football/rss',
    source: 'The Independent Football',
    defaultCategory: 'Premier League',
    badge: 'The Independent',
  },
  {
    url: 'https://www.skysports.com/rss/12087',
    source: 'Sky Sports Transfer Centre',
    defaultCategory: 'Transfers',
    badge: 'Sky Transfers',
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
    text.includes('city') ||
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
    text.includes('madrid') ||
    text.includes('atletico')
  ) {
    return 'European Football';
  }
  return defaultCat;
}

function extractBestImage(raw: string): string | undefined {
  // 1. Check all <media:content> tags and pick the highest resolution
  const mediaMatches = Array.from(raw.matchAll(/<media:content[^>]+url=[\"']([^\"']+)[\"'][^>]*>/gi));
  let bestMedia: { url: string; width: number } | null = null;
  for (const m of mediaMatches) {
    const fullTag = m[0];
    const url = m[1];
    if (url.includes('imrworldwide') || url.includes('tracking') || url.endsWith('.gif')) continue;
    const widthMatch = fullTag.match(/width=[\"']?(\d+)[\"']?/i);
    const width = widthMatch ? parseInt(widthMatch[1], 10) : 0;
    if (!bestMedia || width > bestMedia.width) {
      bestMedia = { url, width };
    }
  }
  if (bestMedia && bestMedia.url) {
    let img = bestMedia.url.replace(/&amp;/g, '&');
    // Upgrade Guardian image width if low-res
    if (img.includes('guim.co.uk') && img.includes('width=140')) {
      img = img.replace('width=140', 'width=800');
    }
    return img;
  }

  // 2. Check <enclosure>
  const encMatch = raw.match(/<enclosure[^>]+url=[\"']([^\"']+)[\"']/i);
  if (encMatch && !encMatch[1].includes('.gif') && !encMatch[1].includes('imrworldwide')) {
    return encMatch[1].replace(/&amp;/g, '&');
  }

  // 3. Check <media:thumbnail>
  const thumbMatch = raw.match(/<media:thumbnail[^>]+url=[\"']([^\"']+)[\"']/i);
  if (thumbMatch && !thumbMatch[1].includes('.gif') && !thumbMatch[1].includes('imrworldwide')) {
    let img = thumbMatch[1].replace(/&amp;/g, '&');
    // Upgrade BBC thumbnail
    if (img.includes('/240/')) {
      img = img.replace('/240/', '/1024/');
    }
    return img;
  }

  // 4. Check embedded <img> in description
  const imgMatch = raw.match(/<img[^>]+src=[\"']([^\"']+)[\"']/i);
  if (imgMatch && !imgMatch[1].includes('imrworldwide') && !imgMatch[1].includes('tracking') && !imgMatch[1].endsWith('.gif')) {
    return imgMatch[1].replace(/&amp;/g, '&');
  }

  return undefined;
}

function parseFeedXml(xml: string, source: string, defaultCat: string): RawNewsItem[] {
  const items: RawNewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const raw = match[1];

    const titleMatch = raw.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const descMatch = raw.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
    const linkMatch = raw.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
    const pubDateMatch = raw.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i);

    const image = extractBestImage(raw);
    const rawTitle = titleMatch ? titleMatch[1] : '';
    const rawDesc = descMatch ? descMatch[1] : '';

    const title = decodeHtmlEntities(rawTitle);
    const description = decodeHtmlEntities(rawDesc);
    const link = linkMatch ? linkMatch[1].trim() : '';
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';

    if (!title || title.length < 5) continue;

    const category = determineCategory(title, description, defaultCat);

    items.push({
      title,
      description,
      link,
      pubDate,
      image,
      source,
      category,
    });
  }

  return items;
}

let lastSyncTimestamp = 0;
let isSyncInProgress = false;

/**
 * Automatically fetch, parse, de-duplicate and insert real-time football news
 * from the top 5 world football newsrooms:
 * 1. BBC Sport
 * 2. Sky Sports
 * 3. The Guardian
 * 4. Marca (English)
 * 5. The Independent
 */
export async function autoIngestFootballNews(options: { force?: boolean; maxItems?: number } = {}) {
  const { force = false, maxItems = 25 } = options;

  // Debounce syncs unless forced (minimum 8 minutes between regular syncs)
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

    const SPECIAL_ADMIN_ID = '2886ae6d-b563-44a3-b4b8-ae932cc188ad';
    let authorId = SPECIAL_ADMIN_ID;
    try {
      // Find any valid admin or active user in the database to satisfy foreign key
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
    } catch (e) {
      console.warn('[AutoNews] Could not lookup admin ID, using fallback ID');
    }

    // 1. Fetch current articles from database to check for duplicates
    const { data: existingArticles } = await admin.database
      .from('articles')
      .select('id, title, published_at')
      .order('published_at', { ascending: false })
      .limit(150);

    const existingTitles = new Set(
      (existingArticles || []).map((a: any) => (a.title || '').toLowerCase().trim())
    );

    // 2. Fetch fresh items from all 5 top feeds in parallel
    const feedPromises = FOOTBALL_FEEDS.map(async (feed) => {
      try {
        const res = await fetch(feed.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SportsHub/2.0 NewsIngestion',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          },
          signal: AbortSignal.timeout(9000),
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

    const feedResults = await Promise.all(feedPromises);

    // 3. Balanced round-robin selection across all 5 top sources so every newsroom is represented
    const newItemsToInsert: any[] = [];
    const maxPerFeed = 6;

    // Filter candidate items per feed (newest first, non-duplicates)
    const perFeedCandidates = feedResults.map((items) => {
      const sorted = [...items].sort((a, b) => {
        const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
        const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
        return dateB - dateA;
      });
      return sorted.filter((item) => {
        const lowerTitle = item.title.toLowerCase().trim();
        return !existingTitles.has(lowerTitle);
      });
    });

    // Interleave so every source gets slots in each round
    let addedAny = true;
    let round = 0;
    while (addedAny && newItemsToInsert.length < maxItems && round < maxPerFeed) {
      addedAny = false;
      for (const feedCandidates of perFeedCandidates) {
        if (feedCandidates.length > round && newItemsToInsert.length < maxItems) {
          const item = feedCandidates[round];
          const lowerTitle = item.title.toLowerCase().trim();
          if (!existingTitles.has(lowerTitle)) {
            existingTitles.add(lowerTitle);
            const pubTime = item.pubDate ? new Date(item.pubDate).getTime() : Date.now();
            const cleanDesc = item.description || item.title;
            const content = `${cleanDesc}\n\nFull reporting and coverage from ${item.source}. Follow live tactical reactions, line-ups, and post-match quotes on SportsHub.`;

            newItemsToInsert.push({
              id: crypto.randomUUID(),
              title: item.title,
              content: content,
              summary: cleanDesc.length > 200 ? cleanDesc.slice(0, 197) + '...' : cleanDesc,
              image_url: item.image || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1024&auto=format&fit=crop&q=80',
              author_name: item.source,
              author_id: authorId,
              status: 'published',
              category: item.category,
              published_at: isNaN(pubTime) ? Date.now() : pubTime,
            });
            addedAny = true;
          }
        }
      }
      round++;
    }

    // 4. Robust insert into InsForge database (batch with item-by-item fallback)
    let insertedCount = 0;
    if (newItemsToInsert.length > 0) {
      const { error } = await admin.database
        .from('articles')
        .insert(newItemsToInsert);

      if (error) {
        console.warn('[AutoNews] Batch insert hit issue, retrying individually:', error.message || error);
        // Fallback: insert individually so one faulty item does not break the rest
        for (const singleItem of newItemsToInsert) {
          try {
            const { error: singleError } = await admin.database
              .from('articles')
              .insert([singleItem]);
            if (!singleError) {
              insertedCount++;
            } else {
              // If foreign key constraint on author_id, retry without author_id or with system fallback
              console.warn('[AutoNews] Individual insert warning:', singleError.message || singleError);
            }
          } catch (itemErr) {
            console.warn('[AutoNews] Failed single item insert:', itemErr);
          }
        }
      } else {
        insertedCount = newItemsToInsert.length;
      }

      console.log(`[AutoNews] Successfully auto-posted ${insertedCount} fresh football articles from top 5 global sources.`);
    }

    lastSyncTimestamp = Date.now();
    return {
      added: insertedCount,
      total: (existingArticles?.length || 0) + insertedCount,
      message: `Auto-sync complete. ${insertedCount} new stories added from BBC Sport, Sky Sports, The Guardian, Marca & The Independent.`,
    };
  } catch (err: any) {
    console.error('[AutoNews] Ingestion failed:', err);
    return { added: 0, message: err.message, total: 0 };
  } finally {
    isSyncInProgress = false;
  }
}
