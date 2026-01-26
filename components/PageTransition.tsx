import React from 'react';
import { motion } from 'framer-motion';

type AnimationType = 'default' | 'dashboard' | 'planning' | 'activities' | 'grades' | 'attendance' | 'students';

interface PageTransitionProps {
    children: React.ReactNode;
    type?: AnimationType;
}

// PREMIUM "NATIVE-LIKE" ANIMATIONS
// Focus: Delight, Physics, and Fluidity.
// We relax the strict "performance only" constraints slightly to allow for blur and scale
// because modern PCs (which the user specified) can handle it easily.

const springConfig = { type: "spring", stiffness: 100, damping: 20, mass: 1 } as const;

const variants = {
    initial: {
        opacity: 0,
        y: 20,
        scale: 0.98,
        filter: "blur(8px)"
    },
    enter: {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        transition: {
            ...springConfig,
            staggerChildren: 0.1
        }
    },
    exit: {
        opacity: 0,
        y: -20,
        scale: 0.96,
        filter: "blur(8px)",
        transition: {
            duration: 0.2,
            ease: "easeInOut"
        } as const
    }
};

export const PageTransition: React.FC<PageTransitionProps> = ({ children, type = 'default' }) => {
    // We strictly use the generic premium variant for consistency across "tabs"
    // unless a specific override is desperately needed.
    // The "type" prop is kept for compatibility but mapped to the same premium feel.

    return (
        <motion.div
            variants={variants}
            initial="initial"
            animate="enter"
            exit="exit"
            className="w-full h-full flex flex-col"
            style={{ willChange: "transform, opacity, filter" }}
        >
            {children}
        </motion.div>
    );
};
