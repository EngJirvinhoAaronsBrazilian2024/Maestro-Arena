async function run() {
  const apiKey = process.env.SPORTS_API_KEY;
  const res = await fetch(`https://v3.football.api-sports.io/players/profiles?search=ronaldo`, {
    headers: { "x-apisports-key": apiKey }
  });
  const data = await res.json();
  console.log("Players profiles length:", data.response ? data.response.length : "none");
  console.log(data.errors);
}
run();
