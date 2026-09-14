const fs = require('fs');

// Fix ImageInput.tsx
let imgCode = fs.readFileSync('src/components/ui/ImageInput.tsx', 'utf8');
imgCode = imgCode.replace(/res\.data\?\.path/g, 'res.data?.key');
imgCode = imgCode.replace(/getPublicUrl\(res\.data\.path\)/g, 'getPublicUrl(res.data.key)');
fs.writeFileSync('src/components/ui/ImageInput.tsx', imgCode, 'utf8');

// Fix AdminQuizManagement.tsx
let quizCode = fs.readFileSync('src/pages/admin/AdminQuizManagement.tsx', 'utf8');
quizCode = quizCode.replace(/insforge\.from/g, 'insforge.database.from');
fs.writeFileSync('src/pages/admin/AdminQuizManagement.tsx', quizCode, 'utf8');
