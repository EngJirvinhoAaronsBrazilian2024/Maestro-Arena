const fs = require('fs');

let login = fs.readFileSync('src/pages/Login.tsx', 'utf8');
login = login.replace("import logo from '../assets/images/premium_sports_logo_1788622412405.jpg';", "import logo from '../assets/images/maestro_arena_logo_1788967289805.jpg';");
login = login.replace(/Sports Hub/g, 'Maestro Arena');
login = login.replace('className="text-2xl font-bold tracking-tight text-slate-900"', 'className="text-2xl font-bold tracking-tight text-slate-900" style={{ fontFamily: "\'Playfair Display\', serif", letterSpacing: "-0.02em" }}');
fs.writeFileSync('src/pages/Login.tsx', login, 'utf8');

let register = fs.readFileSync('src/pages/Register.tsx', 'utf8');
register = register.replace(/Sports Hub/g, 'Maestro Arena');
fs.writeFileSync('src/pages/Register.tsx', register, 'utf8');
