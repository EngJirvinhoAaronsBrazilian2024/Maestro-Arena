import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export function Layout() {
  const location = useLocation();
  
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#E6F0FA] via-[#D1E0F0] to-[#B8CCE4]">
      <Header />
      <div className="flex flex-1 relative min-w-0">
        <Sidebar />
        <main className="flex-1 w-full md:pl-64 min-w-0 flex flex-col pb-3 sm:pb-4 md:pb-8">
          <div className="mx-auto w-full max-w-7xl px-1.5 sm:px-3 md:px-4 py-2 sm:py-3 min-w-0 flex-1 flex flex-col">
            {/* 
              Continuous rounded red container enclosing BOTH the content AND the bottom navigation tabs:
              - Encloses the light-blue content area AND bottom Pages/navigation tabs
              - Border thickness, color (#e11d48 / rose-600), rounded corners, and shadow preserved
              - Extends downward so the bottom red border is BELOW the navigation tabs
              - Navigation tabs visually sit inside the red bordered container
            */}
            <div className="border-[5px] sm:border-[6px] border-rose-600 rounded-3xl sm:rounded-[2rem] shadow-xl shadow-rose-600/20 bg-white/10 backdrop-blur-2xs min-w-0 flex-1 flex flex-col justify-between overflow-hidden">
              {/* Light-blue content area inside container */}
              <div className="p-1.5 sm:p-2.5 md:p-3.5 min-w-0 flex-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full min-w-0"
                  >
                    <Outlet />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom Navigation tabs INSIDE the red bordered container */}
              <BottomNav />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
