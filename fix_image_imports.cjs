const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const newImports = `import heroImage from '../assets/images/football_stars_hero_2026_1788809874968.jpg';
import imgCel1 from '../assets/images/player_celebration_1_1788810962003.jpg';
import imgTrophy1 from '../assets/images/team_lifting_trophy_1_1788810980124.jpg';
import imgCel2 from '../assets/images/player_celebration_2_1788810996405.jpg';
import imgTrophy2 from '../assets/images/team_lifting_trophy_2_1788811011169.jpg';
import imgCel3 from '../assets/images/player_celebration_3_1788811026045.jpg';
import imgTrophy3 from '../assets/images/team_lifting_trophy_3_1788811040761.jpg';
import imgCel4 from '../assets/images/player_celebration_4_1788811055901.jpg';`;

code = code.replace(/import heroImage from '\.\.\/assets\/hero_bg\.png';[\s\S]*?import imgCel4 from '\.\.\/assets\/img_cel4\.jpg';/, newImports);

fs.writeFileSync('src/pages/Home.tsx', code, 'utf8');
