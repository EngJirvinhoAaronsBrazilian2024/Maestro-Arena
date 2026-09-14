const fs = require('fs');
const path = 'src/pages/Settings.tsx';

let content = fs.readFileSync(path, 'utf8');

// Remove useTheme
content = content.replace(/import \{ useTheme \} from '\.\.\/context\/ThemeContext';\n/, '');
content = content.replace(/const \{ theme, toggleTheme \} = useTheme\(\);\n/, '');
content = content.replace(/Moon, Sun, /, '');

// Remove Appearance card
content = content.replace(/<Card>\s*<CardHeader>\s*<CardTitle className="text-lg flex items-center gap-2">\s*<Monitor className="h-5 w-5 text-blue-500" \/>\s*Appearance\s*<\/CardTitle>\s*<\/CardHeader>\s*<CardContent className="space-y-4">\s*<div className="flex items-center justify-between">\s*<div>\s*<p className="font-medium">Dark Mode<\/p>\s*<p className="text-sm text-slate-500">Toggle dark theme for the application.<\/p>\s*<\/div>\s*<button(.|\n)*?<\/button>\s*<\/div>\s*<\/CardContent>\s*<\/Card>\s*/, '');

fs.writeFileSync(path, content, 'utf8');
