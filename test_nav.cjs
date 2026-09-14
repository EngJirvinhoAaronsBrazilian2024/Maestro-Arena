const fs = require('fs');

function fixNavLink(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  if (!code.includes("useLocation")) {
    code = code.replace("import { NavLink } from 'react-router-dom';", "import { NavLink, useLocation } from 'react-router-dom';");
  }

  if (filePath.includes('Sidebar.tsx')) {
    code = code.replace("export function Sidebar() {", "export function Sidebar() {\n  const location = useLocation();");
    code = code.replace(
      "className={({ isActive }) =>",
      `className={() => {
              const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
              return`
    );
    // There are other NavLinks in Sidebar, like for editor and admin.
    // They are hardcoded: to="/editor", to="/admin". We need to handle them or just use regex.
  }

  if (filePath.includes('BottomNav.tsx')) {
    code = code.replace("export function BottomNav() {", "export function BottomNav() {\n  const location = useLocation();");
    code = code.replace(
      "className={({ isActive }) =>",
      `className={() => {
              const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
              return`
    );
  }

  fs.writeFileSync(filePath, code, 'utf8');
}

fixNavLink('src/components/layout/Sidebar.tsx');
fixNavLink('src/components/layout/BottomNav.tsx');
