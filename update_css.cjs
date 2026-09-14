const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace(/--color-app-bg: #[A-F0-9]+;/i, '--color-app-bg: #F1F5F9;');
css = css.replace(/--color-text-main: #[A-F0-9]+;/i, '--color-text-main: #0F172A;');
css = css.replace(/--color-text-secondary: #[A-F0-9]+;/i, '--color-text-secondary: #64748B;');
css = css.replace(/--color-border-main: #[A-F0-9]+;/i, '--color-border-main: #E2E8F0;');
fs.writeFileSync('src/index.css', css, 'utf8');
