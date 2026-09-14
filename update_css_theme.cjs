const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// The reference image uses a soft, icy blue gradient, glassmorphic translucent white cards,
// heavily rounded corners, and a blue accent color instead of green.

css = css.replace(/--color-brand: #[A-F0-9]+;/i, '--color-brand: #3B82F6;'); // Blue accent
css = css.replace(/--color-app-bg: #[A-F0-9]+;/i, '--color-app-bg: #D4E1F0;'); // Soft blue fallback
css = css.replace(/--color-card-bg: #[A-F0-9]+;/i, '--color-card-bg: rgba(255, 255, 255, 0.6);'); // Translucent card
css = css.replace(/--color-text-main: #[A-F0-9]+;/i, '--color-text-main: #1E293B;'); // Dark blue-grey
css = css.replace(/--color-border-main: #[A-F0-9]+;/i, '--color-border-main: rgba(255, 255, 255, 0.5);'); // Glassy border

fs.writeFileSync('src/index.css', css, 'utf8');
