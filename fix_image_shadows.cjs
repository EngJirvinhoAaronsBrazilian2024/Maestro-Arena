const fs = require('fs');

function applyModifications(filePath, isArticle, isPlayer) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  if (isArticle) {
    code = code.replace(
      /className="overflow-hidden rounded-xl bg-slate-100 aspect-\[21\/9\]"/,
      'className="overflow-hidden rounded-2xl bg-slate-100 aspect-[21/9] shadow-md border border-slate-100"'
    );
  }

  if (isPlayer) {
    code = code.replace(
      /className="h-32 w-32 rounded-full object-cover"/,
      'className="h-32 w-32 rounded-full object-cover shadow-md border-4 border-white"'
    );
  }

  fs.writeFileSync(filePath, code, 'utf8');
}

applyModifications('src/pages/ArticlePage.tsx', true, false);
applyModifications('src/pages/PlayerProfile.tsx', false, true);

