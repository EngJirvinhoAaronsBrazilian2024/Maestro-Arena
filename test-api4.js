const apiKey = process.env.SPORTS_API_KEY;
fetch(`https://v3.football.api-sports.io/standings?league=39&season=2024`, { headers: { "x-apisports-key": apiKey }})
  .then(r => r.json())
  .then(d => console.log(d.response.length > 0 ? "SUCCESS 2024" : d.errors));
