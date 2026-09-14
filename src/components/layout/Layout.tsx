import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useNotificationSystem } from '../../hooks/useNotificationSystem';

export function Layout() {
  const location = useLocation();
  useNotificationSystem();
  
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#E6F0FA] via-[#D1E0F0] to-[#B8CCE4]">
      <Header />
      <div className="flex flex-1 relative">
        <Sidebar />
        <main className="flex-1 w-full md:pl-64 pb-16 md:pb-0 overflow-x-hidden">
          <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
