import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface DashboardHelpBannerProps {
  isDarkMode: boolean;
}

export const DashboardHelpBanner: React.FC<DashboardHelpBannerProps> = ({ isDarkMode }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-600 p-[1px] shadow-lg shadow-indigo-500/20 group">
      <div className={`relative bg-gradient-to-br transition-all duration-700 p-4 md:p-8 lg:p-12 flex flex-col items-center md:items-start text-center md:text-left gap-6 md:gap-10 ${isDarkMode ? 'from-slate-800/80 to-slate-900/90' : 'from-indigo-600 to-indigo-800'}`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2 bg-[radial-gradient(circle,rgba(99,102,241,0.2)_0%,transparent_70%)]"></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
            <span className="material-symbols-outlined text-3xl">rocket_launch</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary mb-1">Domine o Prof. Acerta+</h3>
            <p className="text-text-secondary text-sm max-w-lg leading-relaxed">
              Descubra como lançar notas, controlar frequência e gerar relatórios em segundos.
              <span className="hidden sm:inline"> Confira nosso guia passo-a-passo.</span>
            </p>
          </div>
        </div>
        <div className="flex w-full sm:w-auto gap-3 relative z-10">
          <Link to="/instructions" className="flex-1 sm:flex-none px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg">menu_book</span>
            Ver Manual
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
