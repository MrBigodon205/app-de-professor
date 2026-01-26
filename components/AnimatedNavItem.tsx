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
            className={`relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group z-10 ${isCollapsed ? 'justify-center px-2' : ''
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
                        stiffness: 400,
                        damping: 30
                    }}
                />
            )}

            {/* Hover Background (Subtle) for non-active items */}
            {!isActive && (
                <div className="absolute inset-0 bg-surface-subtle opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-200" />
            )}

            {/* Icon with Micro-interaction */}
            <motion.span
                className={`material-symbols-outlined text-2xl relative z-10 transition-colors duration-300 ${isActive ? 'icon-filled text-primary dark:text-white' : 'text-text-secondary group-hover:text-primary'
                    }`}
                animate={{
                    scale: isActive ? 1.1 : 1,
                    rotate: isActive ? 0 : 0
                }}
                whileHover={{
                    scale: 1.2,
                    rotate: [0, -10, 10, 0], // Wiggle effect
                    transition: { duration: 0.4 }
                }}
            >
                {icon}
            </motion.span>

            {/* Label */}
            {!isCollapsed && (
                <div className="relative z-10 overflow-hidden">
                    <motion.span
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className={`text-sm tracking-wide block truncate ${isActive ? 'font-bold text-primary dark:text-white' : 'font-medium text-text-secondary group-hover:text-primary'
                            }`}
                    >
                        {label}
                    </motion.span>
                </div>
            )}

            {/* Active Indicator Dot (Floating) */}
            {isActive && !isCollapsed && (
                <motion.span
                    layoutId="activeNavDot"
                    className="absolute right-3 w-1.5 h-1.5 bg-primary rounded-full shadow-neon z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
            )}
        </Link>
    );
};
