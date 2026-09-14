const fs = require('fs');
let homeContent = fs.readFileSync('src/pages/Home.tsx', 'utf8');

homeContent = homeContent.replace(
  "football_slide_world_cup_1788810563459.jpg",
  "football_slide_world_cup_1788810581191.jpg"
);

fs.writeFileSync('src/pages/Home.tsx', homeContent, 'utf8');
