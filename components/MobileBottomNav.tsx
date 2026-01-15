import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

interface MobileBottomNavProps {
    onMoreClick: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onMoreClick }) => {
    const theme = useTheme();

    const navItems = [
        { icon: 'dashboard', label: 'Início', path: '/' },
        { icon: 'menu_book', label: 'Aulas', path: '/planning' },
        { icon: 'assignment', label: 'Ativ.', path: '/activities' },
        { icon: 'school', label: 'Notas', path: '/grades' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 h-[72px] bg-white dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-50 pb-safe md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] landscape:hidden">
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `
                        flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-all
                        ${isActive
                            ? `text-${theme.primaryColor}`
                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'}
                    `}
                >
                    {({ isActive }) => (
                        <>
                            <div className={`
                                flex items-center justify-center rounded-xl transition-all duration-300
                                ${isActive ? 'bg-primary/10 px-4 py-1.5' : 'bg-transparent'}
                            `}>
                                <span className={`material-symbols-outlined text-[26px] ${isActive ? 'icon-filled' : ''}`}>
                                    {item.icon}
                                </span>
                            </div>
                            <span className={`text-[10px] font-medium leading-none ${isActive ? 'font-bold' : ''}`}>
                                {item.label}
                            </span>
                        </>
                    )}
                </NavLink>
            ))}

            {/* More Button */}
            <button
                onClick={onMoreClick}
                className="flex flex-col items-center justify-center w-full h-full gap-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 active:scale-95 transition-all"
            >
                <span className="material-symbols-outlined text-[26px]">menu</span>
                <span className="text-[10px] font-medium leading-none">Menu</span>
            </button>
        </div>
    );
};
