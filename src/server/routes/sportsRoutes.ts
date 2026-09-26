import { Router } from "express";
import { 
  getLiveMatches, 
  getUpcomingMatches,
  getRecentMatches, 
  getCompetitions,
  getMatchDetails,
  getTeamDetails,
  getPlayerDetails,
  getStandings,
  getTransfers,
  getCompetitionResults,
  getCompetitionFixtures,
  getCompetitionTeams,
  getCompetitionTopScorers,
  getCompetitionStatistics,
  searchTeams,
  searchAll,
  getFavoriteFixtures
} from "../services/sportsService.js";

const router = Router();

router.get("/live", async (req, res) => {
  try {
    const matches = await getLiveMatches();
    res.json(matches);
  } catch (error) {
    console.error("Error fetching live matches:", error);
    res.status(500).json({ error: "Failed to fetch live matches" });
  }
});


router.get("/recent", async (req, res) => {
  try {
    const matches = await getRecentMatches();
    res.json(matches);
  } catch (error) {
    console.error("Error fetching recent matches:", error);
    res.status(500).json({ error: "Failed to fetch recent matches" });
  }
});

router.get("/upcoming", async (req, res) => {
  try {
    const matches = await getUpcomingMatches();
    res.json(matches);
  } catch (error) {
    console.error("Error fetching upcoming matches:", error);
    res.status(500).json({ error: "Failed to fetch upcoming matches" });
  }
});

router.get("/competitions", async (req, res) => {
  try {
    const competitions = await getCompetitions();
    res.json(competitions);
  } catch (error) {
    console.error("Error fetching competitions:", error);
    res.status(500).json({ error: "Failed to fetch competitions" });
  }
});

router.get("/matches/:id", async (req, res) => {
  try {
    const match = await getMatchDetails(req.params.id);
    if (!match) return res.status(404).json({ error: "Match not found" });
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch match details" });
  }
});


router.get("/teams/search", async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q) return res.json([]);
    const teams = await searchTeams(q);
    res.json(teams);
  } catch (error) {
    console.error("Error searching teams:", error);
    res.status(500).json({ error: "Failed to search teams" });
  }
});

router.get("/teams/:id", async (req, res) => {
  try {
    const team = await getTeamDetails(req.params.id);
    if (!team) return res.status(404).json({ error: "Team not found" });
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch team details" });
  }
});

router.get("/players/:id", async (req, res) => {
  try {
    const player = await getPlayerDetails(req.params.id);
    if (!player) return res.status(404).json({ error: "Player not found" });
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch player details" });
  }
});

router.get("/competitions/:id/standings", async (req, res) => {
  try {
    const standings = await getStandings(req.params.id);
    res.json(standings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch standings" });
  }
});

router.get("/competitions/:id/results", async (req, res) => {
  try {
    const results = await getCompetitionResults(req.params.id);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

router.get("/competitions/:id/fixtures", async (req, res) => {
  try {
    const fixtures = await getCompetitionFixtures(req.params.id);
    res.json(fixtures);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch fixtures" });
  }
});

router.get("/competitions/:id/teams", async (req, res) => {
  try {
    const teams = await getCompetitionTeams(req.params.id);
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

router.get("/competitions/:id/topscorers", async (req, res) => {
  try {
    const scorers = await getCompetitionTopScorers(req.params.id);
    res.json(scorers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch top scorers" });
  }
});

router.get("/competitions/:id/statistics", async (req, res) => {
  try {
    const stats = await getCompetitionStatistics(req.params.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});



router.get("/favorites/fixtures", async (req, res) => {
  try {
    const teamsStr = req.query.teams as string;
    if (!teamsStr) return res.json([]);
    const teams = teamsStr.split(',');
    const fixtures = await getFavoriteFixtures(teams);
    res.json(fixtures);
  } catch (error) {
    console.error("Error fetching favorite fixtures:", error);
    res.status(500).json({ error: "Failed to fetch favorite fixtures" });
  }
});

router.get("/search", async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q) return res.json({ teams: [], players: [], competitions: [] });
    const results = await searchAll(q);
    res.json(results);
  } catch (error) {
    console.error("Error searching all:", error);
    res.status(500).json({ error: "Failed to search" });
  }
});

export default router;
