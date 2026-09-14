const fs = require('fs');

// Fix Header.tsx
let header = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');
header = header.replace(/import logo from '\.\.\/\.\.\/assets\/images\/maestro_arena_logo_[0-9]+\.jpg';\s*/, '');
header = header.replace(/src=\{logo\}/g, 'src="/logo.png"');
fs.writeFileSync('src/components/layout/Header.tsx', header, 'utf8');

// Fix Login.tsx
let login = fs.readFileSync('src/pages/Login.tsx', 'utf8');
login = login.replace(/import logo from '\.\.\/assets\/images\/maestro_arena_logo_[0-9]+\.jpg';\s*/, '');
login = login.replace(/src=\{logo\}/g, 'src="/logo.png"');
fs.writeFileSync('src/pages/Login.tsx', login, 'utf8');

