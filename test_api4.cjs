async function run() {
  const apiKey = process.env.SPORTS_API_KEY;
  const res = await fetch(`https://v3.football.api-sports.io/players/profiles?search=ronaldo`, {
    headers: { "x-apisports-key": apiKey }
  });
  const data = await res.json();
  console.log(JSON.stringify(data.response[0], null, 2));
}
run();
