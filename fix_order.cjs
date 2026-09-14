const fs = require('fs');
let homeContent = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Give Image Content order-1 on mobile, and Text Content order-2 on mobile.
homeContent = homeContent.replace(
  'md:w-[50%] flex flex-col justify-center text-center md:text-left',
  'md:w-[50%] flex flex-col justify-center text-center md:text-left order-2 md:order-1'
);

homeContent = homeContent.replace(
  'md:w-[45%] flex flex-col items-center md:items-end',
  'md:w-[45%] flex flex-col items-center md:items-end order-1 md:order-2'
);

fs.writeFileSync('src/pages/Home.tsx', homeContent, 'utf8');
