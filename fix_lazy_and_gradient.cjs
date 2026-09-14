const fs = require('fs');

function applyModifications(filePath, isLogin) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // Add loading="lazy" to images that don't have it (careful with login logo, hero images)
  // Actually, let's just globally replace `<img ` with `<img loading="lazy" `
  // But wait, hero images shouldn't be lazy loaded.
  
  if (isLogin) {
    code = code.replace(
      /<div className="mb-4 overflow-hidden rounded-\[14px\] border border-slate-200 shadow-sm bg-white">/,
      '<div className="mb-6 overflow-hidden rounded-[24px] border-2 border-slate-100 shadow-xl bg-white p-3">'
    );
    code = code.replace(
      /<img src=\{logo\} alt="Maestro Arena Logo" className="h-16 w-16 object-cover" \/>/,
      '<img src={logo} alt="Maestro Arena Logo" className="h-32 w-32 sm:h-40 sm:w-40 object-contain" />'
    );
  }

  // Find all <img that are not already loading="lazy"
  // For NewsList.tsx
  if (filePath.includes('NewsList.tsx')) {
    code = code.replace(
      /<img\s+src=\{article\.imageUrl\}/,
      '<img loading="lazy" src={article.imageUrl}'
    );
  }

  fs.writeFileSync(filePath, code, 'utf8');
}

applyModifications('src/pages/Login.tsx', true);
applyModifications('src/pages/NewsList.tsx', false);

