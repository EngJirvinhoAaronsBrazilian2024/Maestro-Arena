const apiKey = process.env.SPORTS_API_KEY;
fetch(`https://v3.football.api-sports.io/leagues?id=39`, { headers: { "x-apisports-key": apiKey }})
  .then(r => r.json())
  .then(d => {
    const seasons = d.response[0].seasons.map(s => s.year);
    console.log("Available seasons:", seasons);
  });
