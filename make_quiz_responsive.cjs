const fs = require('fs');

// 1. Make the QuizQuestionCard Progress bar sticky on mobile
let card = fs.readFileSync('src/components/quiz/QuizQuestionCard.tsx', 'utf8');
card = card.replace(
  /<div className="flex items-center justify-between mb-2">/,
  '<div className="sticky top-16 z-20 bg-[#E6F0FA]/90 backdrop-blur-md pt-2 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pt-0 sm:bg-transparent"><div className="flex items-center justify-between mb-2">'
);
card = card.replace(
  /style={{ width: `\${progressPercent}%` }}\s*\/>\s*<\/div>/,
  'style={{ width: `${progressPercent}%` }} /></div></div>'
);
fs.writeFileSync('src/components/quiz/QuizQuestionCard.tsx', card, 'utf8');

