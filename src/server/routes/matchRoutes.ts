import { Router } from "express";
import { getMatches } from "../services/footballDataService.js";

const router = Router();

// GET /api/matches (and /api/football-data/matches)
router.get("/", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true" || req.query.refresh === "1";
    const statusFilter = req.query.status as string | undefined;
    const competitionFilter = req.query.competition as string | undefined;

    const data = await getMatches({ forceRefresh });

    let filteredMatches = data.matches;

    // Filter by status if specified
    if (statusFilter) {
      const upperStatus = statusFilter.toUpperCase();
      if (upperStatus === "LIVE") {
        filteredMatches = filteredMatches.filter((m) => m.isLive);
      } else if (upperStatus === "UPCOMING" || upperStatus === "SCHEDULED") {
        filteredMatches = filteredMatches.filter((m) => m.status === "UPCOMING");
      } else if (upperStatus === "FINISHED") {
        filteredMatches = filteredMatches.filter((m) => m.status === "FINISHED");
      }
    }

    // Filter by competition code or id if specified
    if (competitionFilter) {
      const compCodes = competitionFilter.split(",").map((c) => c.trim().toUpperCase());
      filteredMatches = filteredMatches.filter((m) =>
        compCodes.includes(m.competition.code.toUpperCase()) ||
        compCodes.includes(String(m.competition.id))
      );
    }

    res.json({
      ...data,
      count: filteredMatches.length,
      matches: filteredMatches,
    });
  } catch (error: any) {
    console.error("[MatchRoutes] Error fetching matches:", error);
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      error: error.message || "Failed to retrieve matches from football-data.org",
      retryAfter: error.retryAfter,
    });
  }
});

// GET /api/matches/live
router.get("/live", async (req, res) => {
  try {
    const data = await getMatches();
    const liveMatches = data.matches.filter((m) => m.isLive);
    res.json({
      ...data,
      count: liveMatches.length,
      matches: liveMatches,
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.message });
  }
});

// GET /api/matches/upcoming
router.get("/upcoming", async (req, res) => {
  try {
    const data = await getMatches();
    const upcomingMatches = data.matches.filter((m) => m.status === "UPCOMING");
    res.json({
      ...data,
      count: upcomingMatches.length,
      matches: upcomingMatches,
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.message });
  }
});

// GET /api/matches/finished
router.get("/finished", async (req, res) => {
  try {
    const data = await getMatches();
    const finishedMatches = data.matches.filter((m) => m.status === "FINISHED");
    res.json({
      ...data,
      count: finishedMatches.length,
      matches: finishedMatches,
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.message });
  }
});

export default router;
