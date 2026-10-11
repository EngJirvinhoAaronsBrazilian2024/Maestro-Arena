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
    <div className="w-full h-screen h-[100dvh] min-h-[100dvh] max-h-[100dvh] flex flex-col bg-gradient-to-br from-[#E6F0FA] via-[#D1E0F0] to-[#B8CCE4] overflow-hidden rounded-[20px] sm:rounded-[24px] md:rounded-[28px] border-[3.5px] sm:border-[4px] border-rose-600 box-border isolate">
      {/* Top Header at the extreme top of the enclosing red boundary */}
      <div className="w-full shrink-0 z-40 bg-white/95 backdrop-blur-md rounded-t-[16px] sm:rounded-t-[20px]">
        <Header />
      </div>

      <div className="flex flex-1 min-h-0 relative min-w-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 w-full md:pl-64 min-w-0 flex flex-col h-full min-h-0 overflow-hidden">
          <div className="mx-auto w-full max-w-7xl h-full min-w-0 flex-1 flex flex-col justify-between overflow-hidden">
            {/* Content area */}
            <div className={cn(
              "min-w-0 flex-1 overscroll-contain",
              isLivescore ? "flex flex-col min-h-0 overflow-y-auto sm:overflow-hidden p-1 sm:p-1.5" : "overflow-y-auto p-1.5 sm:p-2.5 md:p-3"
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

            {/* Bottom Navigation tabs at the bottom where the page tabs are */}
            <div className="shrink-0 z-30 w-full rounded-b-[16px] sm:rounded-b-[20px] overflow-hidden">
              <BottomNav />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
