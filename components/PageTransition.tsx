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
                duration: 0.28,
                ease: [0.25, 0.1, 0.25, 1], // Cubic bezier for premium feel
                staggerChildren: 0.04,
            }
        },
        exit: {
            opacity: 0,
            scale: 0.99,
            transition: { duration: 0.1 }
        }
    },
    // Standard subtle fade for most pages
    slide: {
        initial: { opacity: 0 },
        enter: {
            opacity: 1,
            transition: {
                duration: 0.25,
                ease: "easeOut",
                staggerChildren: 0.03,
            }
        },
        exit: {
            opacity: 0,
            transition: { duration: 0.08 }
        }
    },
    fade: {
        initial: { opacity: 0 },
        enter: {
            opacity: 1,
            transition: {
                duration: 0.22,
                ease: "easeOut",
                staggerChildren: 0.03,
            }
        },
        exit: {
            opacity: 0,
            transition: { duration: 0.08 }
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
