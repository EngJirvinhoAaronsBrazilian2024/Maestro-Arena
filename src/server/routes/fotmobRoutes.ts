import { Router } from "express";

const router = Router();

const cache = new Map<string, { expiry: number; data: any }>();
const CACHE_TTL = 20 * 1000; // 20 seconds cache for fresh live minutes and scores

// In-memory HTML cache for instantaneous tab switching (under 5ms)
const htmlProxyCache = new Map<string, { expiry: number; html: string }>();
const HTML_PROXY_TTL = 3 * 60 * 1000; // 3 minutes cache

async function fetchAndCleanFotMob(targetUrl: string): Promise<string> {
  const cached = htmlProxyCache.get(targetUrl);
  if (cached && cached.expiry > Date.now()) {
    return cached.html;
  }

  const response = await fetch(targetUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9"
    }
  });

  if (!response.ok) {
    if (cached) return cached.html;
    throw new Error(`Failed to fetch from FotMob: ${response.statusText}`);
  }

  let html = await response.text();

  // In-page navigation, url fix, and styling
  const injectedCode = `
<script id="fotmob-url-fix">
(function() {
  try {
    var rawSearch = window.location.search;
    var params = new URLSearchParams(rawSearch);
    var p = params.get('path');
    if (p) {
      window.history.replaceState(null, '', p);
    }
  } catch(e) {}
})();
</script>
<script id="fotmob-inapp-navigation">
(function() {
  document.addEventListener('click', function(e) {
    var a = e.target.closest('a');
    if (!a || !a.getAttribute('href')) return;
    var rawHref = a.getAttribute('href');
    if (rawHref.startsWith('#') || rawHref.startsWith('javascript:')) return;
    try {
      var url = new URL(rawHref, window.location.href);
      if (url.pathname && !url.pathname.startsWith('/api/')) {
        e.preventDefault();
        window.location.href = '/api/fotmob/proxy?path=' + encodeURIComponent(url.pathname + url.search);
      }
    } catch(err) {}
  }, true);
})();
</script>
<style id="fotmob-clean-styles">
  /* Ensure page content is always visible with proper layout */
  html, body, #__next, #main-content {
    min-height: 100% !important;
    background-color: #ffffff !important;
  }

  /* Completely hide FotMob footer across all pages so it can never be reached when scrolling */
  footer,
  [class*="FooterCSS"] {
    display: none !important;
    visibility: hidden !important;
    height: 0px !important;
    max-height: 0px !important;
    padding: 0px !important;
    margin: 0px !important;
    overflow: hidden !important;
  }

  /* Hide FotMob top navigation bar so we don't have duplicate headers */
  header.eqmb82w0,
  header[class*="HeaderContainer"] {
    display: none !important;
    height: 0px !important;
    margin: 0px !important;
    padding: 0px !important;
  }

  /* Clean overlay popups, cookie consent banners and ads so all tabs load cleanly */
  #onetrust-consent-sdk,
  .qc-cmp2-container,
  [class*="Cookie"],
  [class*="cookie"],
  [class*="Consent"],
  [class*="AppBanner"],
  [class*="download-app"],
  [class*="DownloadApp"],
  [class*="install-banner"],
  [class*="AdContainer"],
  [id*="google_ads"],
  .ad-slot,
  ins.adsbygoogle,
  div[data-testid="cookie-banner"] {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
    height: 0px !important;
  }
</style>
`;

  html = html.replace("</head>", `${injectedCode}\n</head>`);

  htmlProxyCache.set(targetUrl, { expiry: Date.now() + HTML_PROXY_TTL, html });
  return html;
}

// Background pre-warm popular tabs so they load in < 5ms
setTimeout(() => {
  const warmUrls = [
    "https://www.fotmob.com/matches",
    "https://www.fotmob.com/leagues/47/overview/premier-league",
    "https://www.fotmob.com/leagues/42/overview/champions-league",
    "https://www.fotmob.com/leagues/87/overview/la-liga",
    "https://www.fotmob.com/leagues/55/overview/serie-a",
    "https://www.fotmob.com/leagues/54/overview/bundesliga",
    "https://www.fotmob.com/leagues/53/overview/ligue-1"
  ];
  warmUrls.forEach(u => fetchAndCleanFotMob(u).catch(() => {}));
}, 1000);

router.get("/matches", async (req, res) => {
  try {
    const liveOnly = req.query.liveOnly !== "false"; // Defaults to true: strictly live games only!
    let dateStr = req.query.date as string;
    if (!dateStr || dateStr.length !== 8) {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      dateStr = `${year}${month}${day}`;
    }

    const cacheKey = `matches_${dateStr}_live_${liveOnly}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return res.json(cached.data);
    }

    const url = `https://www.fotmob.com/api/data/matches?date=${dateStr}&timezone=UTC&ccode3=USA`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    if (!response.ok) {
      if (cached) return res.json(cached.data);
      return res.status(response.status).json({ error: "Failed to fetch from FotMob", leagues: [] });
    }

    const raw = await response.json();
    let totalMatchesInFeed = 0;
    let liveCount = 0;

    const allLeagues = (raw.leagues || []).map((l: any) => {
      const matches = (l.matches || []).map((m: any) => {
        totalMatchesInFeed++;
        const isLive = Boolean(
          m.status?.ongoing === true ||
          (m.status?.started === true && !m.status?.finished && !m.status?.cancelled)
        );

        if (isLive) {
          liveCount++;
        }

        // Format minute display: clean string like '90', '55', 'HT', 'FT', '18:00'
        let minute = "NS";
        if (m.status?.finished) {
          minute = "FT";
        } else if (m.status?.started) {
          const rawShort = m.status?.liveTime?.short || m.status?.scoreStr || "";
          // Strip unicode marks
          const cleanShort = rawShort.replace(/[\u200E\u200F\u202A-\u202E]/g, "").trim();
          if (cleanShort.toLowerCase().includes("ht") || cleanShort.toLowerCase().includes("half")) {
            minute = "HT";
          } else {
            // e.g. "80‎’‎" -> "80'"
            const numMatch = cleanShort.match(/\d+/);
            minute = numMatch ? `${numMatch[0]}'` : (cleanShort || "LIVE");
          }
        } else {
          minute = m.time || "NS";
        }

        return {
          id: m.id,
          leagueId: l.id,
          leagueName: l.name,
          time: m.time,
          timeTS: m.timeTS,
          isLive,
          minute,
          status: m.status?.finished ? "FT" : m.status?.started ? minute : "NS",
          statusDetail: m.status?.reason?.short || m.time || minute,
          home: {
            id: m.home?.id,
            name: m.home?.name || m.home?.longName || "Home",
            score: m.home?.score !== undefined ? m.home.score : null,
            logo: m.home?.id ? `https://images.fotmob.com/image_resources/logo/teamlogo/${m.home.id}.png` : undefined
          },
          away: {
            id: m.away?.id,
            name: m.away?.name || m.away?.longName || "Away",
            score: m.away?.score !== undefined ? m.away.score : null,
            logo: m.away?.id ? `https://images.fotmob.com/image_resources/logo/teamlogo/${m.away.id}.png` : undefined
          }
        };
      });

      // If liveOnly is true, only keep live matches in the league!
      const filteredMatches = liveOnly ? matches.filter((m: any) => m.isLive) : matches;

      return {
        id: l.id,
        name: l.name,
        ccode: l.ccode,
        logo: `https://images.fotmob.com/image_resources/logo/leaguelogo/${l.primaryId || l.id}.png`,
        matches: filteredMatches
      };
    }).filter((l: any) => l.matches.length > 0);

    const payload = {
      date: dateStr,
      liveOnly,
      totalMatches: totalMatchesInFeed,
      liveCount,
      lastUpdated: Date.now(),
      leagues: allLeagues
    };

    cache.set(cacheKey, { expiry: Date.now() + CACHE_TTL, data: payload });
    res.json(payload);
  } catch (error: any) {
    console.error("Error in FotMob matches route:", error);
    res.status(500).json({ error: "Internal server error fetching FotMob matches", leagues: [] });
  }
});

// Proxy FotMob HTML pages to completely mask and remove the FotMob footer across all pages
router.get("/proxy", async (req, res) => {
  try {
    let targetPath = (req.query.path as string) || "/matches";
    let targetUrl = req.query.url as string;

    if (!targetUrl) {
      if (!targetPath.startsWith("/")) {
        targetPath = `/${targetPath}`;
      }
      targetUrl = `https://www.fotmob.com${targetPath}`;
    }

    const parsed = new URL(targetUrl);
    if (!parsed.hostname.endsWith("fotmob.com")) {
      return res.status(403).send("Forbidden domain");
    }

    const html = await fetchAndCleanFotMob(targetUrl);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=180, stale-while-revalidate=300");
    res.removeHeader("X-Frame-Options");
    res.setHeader("Content-Security-Policy", "frame-ancestors 'self' *");
    res.setHeader("Permissions-Policy", "autoplay=(self '*'), fullscreen=(self '*'), picture-in-picture=(self '*')");
    return res.send(html);
  } catch (error: any) {
    console.error("Error in FotMob proxy:", error);
    return res.status(500).send("Proxy error");
  }
});

export default router;
