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
    onMouseEnter?: () => void;
    isSpecial?: boolean;
}

export const AnimatedNavItem = React.memo(({
    path,
    label,
    icon,
    isActive,
    isCollapsed,
    onClick,
    onMouseEnter,
    isSpecial = false
}: AnimatedNavItemProps) => {
    // DIAGNOSTIC LOG: Check if this item is re-rendering
    // console.log(`[Item] ${label} rendered. Active=${isActive}`);

    return (
        <Link
            to={path}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            className={`relative flex items-center gap-3 px-3 py-2.5 lg:px-4 lg:py-3.5 rounded-xl transition-all duration-300 group overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${isCollapsed ? 'justify-center px-0 w-11 h-11 lg:w-14 lg:h-14 mx-auto' : ''
                } ${isActive ? 'text-primary font-bold' : 'text-text-secondary hover:text-text-primary'}`}
            title={isCollapsed ? label : ''}
        >
            {/* Active Indicator with Layout Animation -Prevents Blink */}
            {isActive && (
                <motion.div
                    layoutId="active-nav-indicator"
                    className={`absolute inset-0 bg-primary/10 border-primary rounded-xl z-0 ${isCollapsed ? 'border-2' : 'border-r-[3px]'}`}
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
            )}

            {/* Hover Background */}
            {!isActive && (
                <div className="absolute inset-0 bg-surface-subtle opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl z-0" />
            )}

            {/* Icon */}
            <span className={`material-symbols-outlined text-[22px] relative z-10 transition-colors duration-200 ${isActive ? 'icon-filled text-primary' : 'text-text-muted group-hover:text-text-primary'
                } ${isSpecial ? 'rotate-180' : ''}`}>
                {icon}
            </span>

            {/* Label */}
            {!isCollapsed && (
                <span className={`text-sm truncate relative z-10 transition-colors duration-200 ${isActive ? 'text-primary font-bold' : 'text-text-secondary group-hover:text-text-primary font-medium'
                    }`}>
                    {label}
                </span>
            )}
        </Link>
    );
});

AnimatedNavItem.displayName = 'AnimatedNavItem';
