import React from 'react';
import { motion, Variants } from 'framer-motion';

interface PageTransitionProps {
    children: React.ReactNode;
    type?: string;
}

// Premium page transitions — subtle, professional, no "cheap" slide-ups
const pageVariants: Record<string, Variants> = {
    dashboard: {
        initial: { opacity: 0, scale: 0.99 },
        enter: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.35,
                ease: [0.25, 0.1, 0.25, 1],
                staggerChildren: 0.05,
            }
        },
        exit: {
            opacity: 0,
            scale: 0.99, // Maintain slight scale down for depth
            transition: {
                duration: 0.25,
                ease: "easeInOut"
            }
        }
    },
    // Standard subtle fade for most pages
    slide: {
        initial: { opacity: 0, y: 10 }, // Subtle entry from bottom
        enter: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
                ease: "easeOut",
                staggerChildren: 0.05,
            }
        },
        exit: {
            opacity: 0,
            y: -5, // Subtle float up on exit, not abrupt
            transition: {
                duration: 0.2,
                ease: "easeIn"
            }
        }
    },
    fade: {
        initial: { opacity: 0 },
        enter: {
            opacity: 1,
            transition: {
                duration: 0.3,
                ease: "easeOut",
                staggerChildren: 0.05,
            }
        },
        exit: {
            opacity: 0,
            transition: {
                duration: 0.2,
                ease: "easeInOut"
            }
        }
    },
};

// Map page types to animation styles
const typeMap: Record<string, string> = {
    dashboard: 'dashboard',
    attendance: 'slide', // Using 'slide' key but it's now a clean fade
    grades: 'slide',
    activities: 'slide',
    planning: 'slide',
    students: 'slide',
    timetable: 'fade',
    default: 'fade',
};

const PageTransition: React.FC<PageTransitionProps> = ({ children, type = 'default' }) => {
    const animKey = typeMap[type] || 'fade';
    const variants = pageVariants[animKey];

    return (
        <motion.div
            variants={variants}
            initial="initial"
            animate="enter"
            exit="exit"
            className="w-full h-full flex flex-col will-change-[opacity,transform]"
        >
            {children}
        </motion.div>
    );
};

export { PageTransition };
export default React.memo(PageTransition);
