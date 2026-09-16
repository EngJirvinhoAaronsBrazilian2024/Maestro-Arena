const fs = require('fs');
let appTsx = fs.readFileSync('src/App.tsx', 'utf8');

if (!appTsx.includes('NotificationProvider')) {
  appTsx = appTsx.replace(
    "import { AuthProvider, useAuth } from './context/AuthContext';",
    "import { AuthProvider, useAuth } from './context/AuthContext';\nimport { NotificationProvider } from './context/NotificationContext';\nimport { Toaster } from 'sonner';"
  );
  appTsx = appTsx.replace(
    "<AuthProvider>",
    "<AuthProvider>\n      <NotificationProvider>\n        <Toaster position=\"top-right\" richColors />"
  );
  appTsx = appTsx.replace(
    "</AuthProvider>",
    "      </NotificationProvider>\n      </AuthProvider>"
  );
  fs.writeFileSync('src/App.tsx', appTsx);
  console.log('App.tsx updated');
} else {
  console.log('App.tsx already has NotificationProvider');
}
