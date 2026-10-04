import { Router } from "express";

const router = Router();

const cache = new Map<string, { expiry: number; data: any }>();
const CACHE_TTL = 20 * 1000; // 20 seconds cache for fresh live minutes and scores

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

export default router;
