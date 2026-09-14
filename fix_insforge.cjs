const fs = require('fs');
let code = fs.readFileSync('src/lib/insforge.ts', 'utf8');

// Strip trailing slashes
code = code.replace(
  /const insforgeUrl = import.meta.env.VITE_INSFORGE_URL \|\| 'https:\/\/gci83gu5.us-east.insforge.app';/,
  "const rawUrl = import.meta.env.VITE_INSFORGE_URL || 'https://gci83gu5.us-east.insforge.app';\nconst insforgeUrl = rawUrl.replace(/\\/$/, '');"
);

fs.writeFileSync('src/lib/insforge.ts', code, 'utf8');
