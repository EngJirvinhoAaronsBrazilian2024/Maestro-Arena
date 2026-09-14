const fs = require('fs');

const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/import \{ ThemeProvider \} from '\.\/context\/ThemeContext';\n/, '');
content = content.replace(/<ThemeProvider>/g, '');
content = content.replace(/<\/ThemeProvider>/g, '');

fs.writeFileSync(path, content, 'utf8');
