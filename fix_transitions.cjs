const fs = require('fs');

function injectTransitions(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  if (code.includes('AnimatePresence')) return;

  // Replace imports
  code = code.replace(
    "import { Outlet } from 'react-router-dom';",
    "import { Outlet, useLocation } from 'react-router-dom';\nimport { motion, AnimatePresence } from 'motion/react';"
  );
  
  // Handle Layout.tsx
  if (filePath.includes('Layout.tsx') && !filePath.includes('Auth') && !filePath.includes('Admin')) {
    code = code.replace("export function Layout() {", "export function Layout() {\n  const location = useLocation();");
    code = code.replace(
      "<Outlet />",
      `<AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>`
    );
    // add overflow-x-hidden to main to prevent horizontal scrollbar on transition
    code = code.replace("className=\"flex-1 w-full md:pl-64 pb-16 md:pb-0\"", "className=\"flex-1 w-full md:pl-64 pb-16 md:pb-0 overflow-x-hidden\"");
  }

  // Handle AuthLayout.tsx
  if (filePath.includes('AuthLayout.tsx')) {
    code = code.replace(
      "import { Navigate, Outlet } from 'react-router-dom';",
      "import { Navigate, Outlet, useLocation } from 'react-router-dom';\nimport { motion, AnimatePresence } from 'motion/react';"
    );
    code = code.replace("export function AuthLayout() {", "export function AuthLayout() {\n  const location = useLocation();");
    code = code.replace(
      "<Outlet />",
      `<AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>`
    );
  }

  // Handle AdminLayout.tsx
  if (filePath.includes('AdminLayout.tsx')) {
    code = code.replace(
      "import { Outlet, Link, useNavigate } from 'react-router-dom';",
      "import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';\nimport { motion, AnimatePresence } from 'motion/react';"
    );
    code = code.replace("export function AdminLayout() {", "export function AdminLayout() {\n  const location = useLocation();");
    code = code.replace(
      "<Outlet />",
      `<AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>`
    );
  }

  fs.writeFileSync(filePath, code, 'utf8');
}

injectTransitions('src/components/layout/Layout.tsx');
injectTransitions('src/components/layout/AuthLayout.tsx');
injectTransitions('src/components/layout/AdminLayout.tsx');
