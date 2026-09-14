const fs = require('fs');
let content = fs.readFileSync('src/pages/Login.tsx', 'utf8');

// Add import for the Ronaldo image
const importToAdd = `import ronaldoBg from '../assets/images/ronaldo_background_1788621952580.jpg';\n`;
if (!content.includes('ronaldoBg')) {
    content = content.replace("import { Mail", importToAdd + "import { Mail");
}

// Update the container
const oldContainer = '<div className="relative flex min-h-screen w-full items-center justify-center p-4 md:p-12 lg:p-24 overflow-hidden animate-in fade-in duration-1000 bg-slate-50">';

const newContainer = `<div className="relative flex min-h-screen w-full items-center justify-center p-4 md:p-12 lg:p-24 overflow-hidden animate-in fade-in duration-1000 bg-slate-900">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img src={ronaldoBg} alt="Cristiano Ronaldo" className="h-full w-full object-cover object-center opacity-40 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/40"></div>
      </div>
      
`;

content = content.replace(oldContainer, newContainer);
fs.writeFileSync('src/pages/Login.tsx', content);
console.log('Login.tsx updated');
