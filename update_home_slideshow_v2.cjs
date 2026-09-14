const fs = require('fs');
let homeContent = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Update image imports
const oldImports = `import imgStadium from '../assets/images/football_slide_stadium_1788810479046.jpg';
import imgTrophy from '../assets/images/football_slide_champions_trophy_1788810497413.jpg';
import imgTactics from '../assets/images/football_slide_tactics_1788810511995.jpg';
import imgFans from '../assets/images/football_slide_fans_1788810529547.jpg';
import imgBoots from '../assets/images/football_slide_boots_1788810542292.jpg';
import imgNet from '../assets/images/football_slide_ball_net_1788810554602.jpg';
import imgWorldCup from '../assets/images/football_slide_world_cup_1788810581191.jpg';`;

const newImports = `import imgCel1 from '../assets/images/player_celebration_1_1788810962003.jpg';
import imgTrophy1 from '../assets/images/team_lifting_trophy_1_1788810980124.jpg';
import imgCel2 from '../assets/images/player_celebration_2_1788810996405.jpg';
import imgTrophy2 from '../assets/images/team_lifting_trophy_2_1788811011169.jpg';
import imgCel3 from '../assets/images/player_celebration_3_1788811026045.jpg';
import imgTrophy3 from '../assets/images/team_lifting_trophy_3_1788811040761.jpg';
import imgCel4 from '../assets/images/player_celebration_4_1788811055901.jpg';`;

homeContent = homeContent.replace(oldImports, newImports);

// Update slides array
const oldSlidesArray = `  const slides = [
    heroImage,
    imgStadium,
    imgTrophy,
    imgFans,
    imgBoots,
    imgNet,
    imgTactics,
    imgWorldCup
  ];`;

const newSlidesArray = `  const slides = [
    heroImage,
    imgCel1,
    imgTrophy1,
    imgCel2,
    imgTrophy2,
    imgCel3,
    imgTrophy3,
    imgCel4
  ];`;
  
homeContent = homeContent.replace(oldSlidesArray, newSlidesArray);

// Update sliding animation
const oldRender = `           {slides.map((slide, index) => (
             <img 
               key={index}
               src={slide} 
               alt={\`Football Slide \${index + 1}\`} 
               className={\`absolute inset-0 w-full h-full object-cover object-center md:object-right transition-opacity duration-1000 ease-in-out \${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}\`}
             />
           ))}`;

const newRender = `           <div className="absolute inset-0 w-full h-full overflow-hidden">
             {slides.map((slide, index) => (
               <img 
                 key={index}
                 src={slide} 
                 alt={\`Football Slide \${index + 1}\`} 
                 className="absolute inset-0 w-full h-full object-cover object-center md:object-right transition-transform duration-700 ease-in-out"
                 style={{ transform: \`translateX(\${(index - currentSlide) * 100}%)\` }}
               />
             ))}
           </div>`;

homeContent = homeContent.replace(oldRender, newRender);

fs.writeFileSync('src/pages/Home.tsx', homeContent, 'utf8');
