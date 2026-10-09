import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { cn } from '../../lib/utils';

export function Layout() {
  const location = useLocation();
  const isLivescore = location.pathname === '/livescore';
  
  return (
    <div className="flex h-screen h-[100dvh] min-h-[100dvh] max-h-[100dvh] flex-col bg-gradient-to-br from-[#E6F0FA] via-[#D1E0F0] to-[#B8CCE4] overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0 relative min-w-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 w-full md:pl-64 min-w-0 flex flex-col h-full min-h-0 overflow-hidden p-1.5 sm:p-2.5 md:p-3">
          <div className="mx-auto w-full max-w-7xl h-full min-w-0 flex-1 flex flex-col overflow-hidden">
            {/* 
              Single continuous rounded red container enclosing BOTH the content AND the bottom navigation tabs:
              - Fixed in place on the viewport
              - Content area scrolls smoothly inside (overflow-y-auto)
              - Navigation tabs are FIXED at the bottom of the container, always visible and accessible
              - The red border wraps all sides, extending below the tabs
            */}
            <div className="border-[5px] sm:border-[6px] border-rose-600 rounded-3xl sm:rounded-[2rem] shadow-xl shadow-rose-600/20 bg-white/10 backdrop-blur-2xs min-w-0 flex-1 flex flex-col justify-between overflow-hidden h-full min-h-0">
              {/* Content area inside container */}
              <div className={cn(
                "min-w-0 flex-1 overscroll-contain",
                isLivescore ? "flex flex-col min-h-0 overflow-y-auto sm:overflow-hidden p-1 sm:p-1.5" : "overflow-y-auto p-1.5 sm:p-2.5 md:p-3.5"
              )}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      "w-full min-w-0",
                      isLivescore && "h-full flex-1 flex flex-col min-h-0"
                    )}
                  >
                    <Outlet />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom Navigation tabs FIXED in place at bottom, INSIDE the red bordered container */}
              <div className="shrink-0 z-30 w-full">
                <BottomNav />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
