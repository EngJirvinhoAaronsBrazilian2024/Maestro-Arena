const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/const EditorDashboard = React\.lazy\(\(\) => import\('\.\/pages\/EditorDashboard'\)\.then\(m => \(\{\s*default: m\.EditorDashboard\s*\}\)\)\);\n/g, '');
code = code.replace(/<Route path="editor" element={<EditorDashboard \/>} \/>\n/g, '');

fs.writeFileSync('src/App.tsx', code, 'utf8');
