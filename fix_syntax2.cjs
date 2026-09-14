const fs = require('fs');

function fix(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/return cn\([\s\S]*?\)\s*\}/g, (match) => {
    return match + "}";
  });
  fs.writeFileSync(filePath, code, 'utf8');
}

fix('src/components/layout/Sidebar.tsx');
fix('src/components/layout/BottomNav.tsx');
