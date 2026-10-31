import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export function AuthLayout() {
  const location = useLocation();
  return (
    <div className="w-full min-h-screen bg-[#EAF7ED] flex flex-col">
      <div className="w-full flex-1 flex flex-col">
        <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="w-full min-h-full flex flex-col"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      </div>
    </div>
  );
}
