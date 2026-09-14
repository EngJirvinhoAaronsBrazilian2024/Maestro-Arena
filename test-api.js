const apiKey = process.env.SPORTS_API_KEY;
fetch(`https://v3.football.api-sports.io/standings?league=39&season=2026`, { headers: { "x-apisports-key": apiKey }})
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(d, null, 2)));
