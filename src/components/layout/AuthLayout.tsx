import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export function AuthLayout() {
  const location = useLocation();
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#E6F0FA] via-[#D1E0F0] to-[#B8CCE4]">
      <div className="w-full flex flex-col">
        <AnimatePresence mode="wait">
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
      </AnimatePresence>
      </div>
    </div>
  );
}
