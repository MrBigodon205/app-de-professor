import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface AnimatedNavItemProps {
    path: string;
    label: string;
    icon: string;
    isActive: boolean;
    isCollapsed: boolean;
    onClick?: () => void;
}

export const AnimatedNavItem: React.FC<AnimatedNavItemProps> = ({
    path,
    label,
    icon,
    isActive,
    isCollapsed,
    onClick
}) => {
    return (
        <Link
            to={path}
            onClick={onClick}
            className={`relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group z-10 ${isCollapsed ? 'justify-center px-2' : ''
                }`}
            title={isCollapsed ? label : ''}
        >
            {/* Magnetic Background Pill */}
            {isActive && (
                <motion.div
                    layoutId="activeNavTab"
                    className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] dark:shadow-neon"
                    initial={false}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 28
                    }}
                />
            )}

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
                <span
                    className={`text-sm tracking-wide block truncate relative z-10 ${isActive ? 'font-bold text-primary dark:text-white' : 'font-medium text-text-secondary group-hover:text-primary'
                        }`}
                >
                    {label}
                </span>
            )}

            {/* Active Indicator Dot (Floating) */}
            {isActive && !isCollapsed && (
                <motion.span
                    layoutId="activeNavDot"
                    className="absolute right-3 w-1.5 h-1.5 bg-primary rounded-full shadow-neon z-10"
                    transition={{ type: "spring", stiffness: 250, damping: 25 }}
                />
            )}
        </Link>
    );
};
