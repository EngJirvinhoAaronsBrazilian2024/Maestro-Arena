const fs = require('fs');

const path = 'src/components/ui/Button.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/bg-blue-600/g, 'bg-green-600');
content = content.replace(/bg-blue-700/g, 'bg-green-700');
content = content.replace(/ring-blue-500/g, 'ring-green-500');

fs.writeFileSync(path, content, 'utf8');
