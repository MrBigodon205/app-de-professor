import React from 'react';
import { motion } from 'framer-motion';

type AnimationType = 'default' | 'dashboard' | 'planning' | 'activities' | 'grades' | 'attendance' | 'students';

interface PageTransitionProps {
    children: React.ReactNode;
    type?: AnimationType;
}

// OPTIMIZED ANIMATIONS
// Focus: 60FPS Fluidity, Hardware Acceleration, No Layout Thrashing
// Technique: Use only opacity and transform (translate, scale, rotate)

// ULTRA-OPTIMIZED ANIMATIONS (60FPS Target)
// Strategy: Minimize "paint" time. Quick exits (0.1s) to clear DOM fast. Snappy enters (0.2s).
const fastSpring = { type: 'spring', stiffness: 400, damping: 30 };
const quickEase = [0.25, 0.1, 0.25, 1];

const variants = {
    dashboard: {
        initial: { opacity: 0, scale: 0.99 },
        animate: {
            opacity: 1, scale: 1,
            transition: { duration: 0.25, ease: quickEase }
        },
        exit: {
            opacity: 0, scale: 0.99,
            transition: { duration: 0.1, ease: 'linear' }
        }
    },
    planning: {
        initial: { opacity: 0, x: 10 },
        animate: {
            opacity: 1, x: 0,
            transition: fastSpring
        },
        exit: {
            opacity: 0, x: -10,
            transition: { duration: 0.1 }
        }
    },
    activities: {
        initial: { opacity: 0, y: 10 },
        animate: {
            opacity: 1, y: 0,
            transition: fastSpring
        },
        exit: {
            opacity: 0, y: -10,
            transition: { duration: 0.1 }
        }
    },
    grades: {
        initial: { opacity: 0, x: 10 },
        animate: {
            opacity: 1, x: 0,
            transition: { duration: 0.25, ease: quickEase }
        },
        exit: {
            opacity: 0, x: -10,
            transition: { duration: 0.1 }
        }
    },
    attendance: {
        initial: { opacity: 0, x: -10 },
        animate: {
            opacity: 1, x: 0,
            transition: fastSpring
        },
        exit: {
            opacity: 0, x: 10,
            transition: { duration: 0.1 }
        }
    },
    students: {
        initial: { opacity: 0, scale: 1.02 },
        animate: {
            opacity: 1, scale: 1,
            transition: { duration: 0.2, ease: quickEase }
        },
        exit: {
            opacity: 0, scale: 0.98,
            transition: { duration: 0.1 }
        }
    },
    default: {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, transition: { duration: 0.1 } }
    }
};

export const PageTransition: React.FC<PageTransitionProps> = ({ children, type = 'default' }) => {
    const anim = variants[type] || variants.default;

    return (
        <motion.div
            initial={anim.initial}
            animate={anim.animate}
            exit={anim.exit}
            style={{
                width: '100%',
                willChange: 'opacity, transform',
                // Removed complex 3D transforms for performance
            }}
            className="h-full"
        >
            {children}
        </motion.div>
    );
};
