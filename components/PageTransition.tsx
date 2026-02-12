import React from 'react';
import { motion, Variants } from 'framer-motion';

interface PageTransitionProps {
    children: React.ReactNode;
    type?: string;
}

// Premium page transitions — smooth, cinematic feel without blocking navigation
const pageVariants: Record<string, Variants> = {
    dashboard: {
        initial: { opacity: 0, scale: 0.97, y: 12 },
        enter: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                duration: 0.35,
                ease: [0.22, 1, 0.36, 1],
                staggerChildren: 0.06,
            }
        },
        exit: {
            opacity: 0,
            scale: 0.98,
            transition: { duration: 0.12, ease: "easeIn" }
        }
    },
    slide: {
        initial: { opacity: 0, x: 24 },
        enter: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1],
                staggerChildren: 0.05,
            }
        },
        exit: {
            opacity: 0,
            x: -16,
            transition: { duration: 0.1, ease: "easeIn" }
        }
    },
    fade: {
        initial: { opacity: 0, y: 8 },
        enter: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.28,
                ease: [0.25, 0.1, 0.25, 1],
                staggerChildren: 0.04,
            }
        },
        exit: {
            opacity: 0,
            transition: { duration: 0.1, ease: "easeOut" }
        }
    },
};

// Map page types to animation styles
const typeMap: Record<string, string> = {
    dashboard: 'dashboard',
    attendance: 'slide',
    grades: 'slide',
    activities: 'slide',
    planning: 'slide',
    students: 'slide',
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
            layout="position"
            className="w-full h-full flex flex-col"
        >
            {children}
        </motion.div>
    );
};

export { PageTransition };
export default React.memo(PageTransition);
