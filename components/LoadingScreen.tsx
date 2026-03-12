import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoIconSrc from '../public/logo.png';

interface LoadingScreenProps {
  loading: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ loading }) => {
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.8, ease: "easeInOut", delay: 0.4 } 
          }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f172a] overflow-hidden"
        >
          {/* Expansion Flare - Animated on Exit */}
          <motion.div
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
            initial={{ scale: 0, opacity: 0 }}
            exit={{ 
              scale: 30, 
              opacity: 1,
              transition: { duration: 1.2, ease: [0.7, 0, 0.3, 1] } 
            }}
          >
            <div className="w-24 h-24 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
          </motion.div>

          <motion.div
            className="relative flex flex-col items-center z-10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ 
              scale: 5, 
              opacity: 0,
              transition: { duration: 1, ease: [0.4, 0, 0.2, 1] }
            }}
          >
            {/* Logo Container */}
            <div className="w-28 h-28 p-4 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl flex items-center justify-center relative overflow-hidden group">
              {/* Internal Glow Pulse */}
              <motion.div 
                animate={{ 
                  opacity: [0.1, 0.3, 0.1],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-primary/20 blur-xl"
              />
              <img src={logoIconSrc} alt="Logo" className="w-full h-full object-contain relative z-10 drop-shadow-lg" />
            </div>

            {/* Title & Pulse */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex flex-col items-center gap-4"
            >
              <div className="flex flex-col items-center">
                <span className="text-text-primary text-xl font-black tracking-tight leading-none mb-1">
                  Prof. Acerta+
                </span>
                <span className="text-primary font-black tracking-[0.4em] text-[10px] uppercase opacity-60">
                  Carregando
                </span>
              </div>

              {/* Loader Line */}
              <div className="w-32 h-1 bg-primary/10 rounded-full overflow-hidden relative">
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-primary rounded-full"
                  animate={{ 
                    x: ["-100%", "200%"] 
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1.5, 
                    ease: "easeInOut" 
                  }}
                  style={{ width: "40%" }}
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Background Decorative Blur */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary/5 blur-[140px] rounded-full translate-x-1/3 translate-y-1/3" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
