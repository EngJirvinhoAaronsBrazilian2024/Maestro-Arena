async function run() {
  const apiKey = process.env.SPORTS_API_KEY;
  const res = await fetch(`https://v3.football.api-sports.io/players?search=ronaldo&league=39`, {
    headers: { "x-apisports-key": apiKey }
  });
  const data = await res.json();
  console.log("Players length:", data.response ? data.response.length : "none");
  console.log(data.errors);
  
  const res2 = await fetch(`https://v3.football.api-sports.io/leagues?search=premier`, {
    headers: { "x-apisports-key": apiKey }
  });
  const data2 = await res2.json();
  console.log("Leagues length:", data2.response ? data2.response.length : "none");
  console.log(data2.errors);
}
run();
