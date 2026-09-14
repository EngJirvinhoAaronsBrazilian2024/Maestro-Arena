const fs = require('fs');

let code = fs.readFileSync('src/components/layout/AdminLayout.tsx', 'utf8');
code = code.replace(
  "import { Outlet, NavLink, useNavigate } from 'react-router-dom';",
  "import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';\nimport { motion, AnimatePresence } from 'motion/react';"
);

fs.writeFileSync('src/components/layout/AdminLayout.tsx', code, 'utf8');
