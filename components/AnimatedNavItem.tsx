import React from 'react';
import { Link } from 'react-router-dom';
// import { motion } from 'framer-motion'; // Removed for lightness

interface AnimatedNavItemProps {
    path: string;
    label: string;
    icon: string;
    isActive: boolean;
    isCollapsed: boolean;
    onClick?: () => void;
    onMouseEnter?: () => void;
}

export const AnimatedNavItem: React.FC<AnimatedNavItemProps> = ({
    path,
    label,
    icon,
    isActive,
    isCollapsed,
    onClick,
    onMouseEnter
}) => {
    return (
        <Link
            to={path}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            className={`relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group z-10 ${isCollapsed ? 'justify-center px-2' : ''
                }`}
            title={isCollapsed ? label : ''}
        >
            {/* Magnetic Background Pill (CSS Only) */}
            <div
                className={`absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] dark:shadow-neon transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Hover Background (Subtle) for non-active items */}
            {!isActive && (
                <div className="absolute inset-0 bg-surface-subtle opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-200" />
            )}

            {/* Icon */}
            <span
                className={`material-symbols-outlined text-2xl relative z-10 transition-all duration-200 ${isActive
                    ? 'icon-filled text-primary dark:text-white scale-110'
                    : 'text-text-secondary group-hover:text-primary group-hover:scale-110'
                    }`}
            >
                {icon}
            </span>

            {/* Label */}
            {!isCollapsed && (
                <span className={`font-medium relative z-10 transition-colors duration-200 whitespace-nowrap ${isActive
                    ? 'text-slate-900 dark:text-white font-bold'
                    : 'text-text-secondary group-hover:text-text-primary'
                    }`}>
                    {label}
                </span>
            )}

            {/* Active Indicator Dot (Collapsed) */}
            {isCollapsed && isActive && (
                <div
                    className="absolute right-2 size-1.5 rounded-full bg-primary shadow-neon"
                />
            )}
        </Link>
    );
};
