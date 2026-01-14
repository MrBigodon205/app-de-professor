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

const iosSpring = { type: 'spring', stiffness: 260, damping: 20 }; // Very responsive, Apple-like
const smoothEase = [0.4, 0, 0.2, 1]; // Standard Material/iOS easing

const variants = {
    dashboard: {
        initial: { opacity: 0, scale: 0.98, y: 10 },
        animate: {
            opacity: 1, scale: 1, y: 0,
            transition: { duration: 0.5, ease: smoothEase, staggerChildren: 0.1 }
        },
        exit: {
            opacity: 0, scale: 0.98, y: -10,
            transition: { duration: 0.3, ease: 'easeIn' }
        }
    },
    planning: {
        initial: { opacity: 0, x: 20 },
        animate: {
            opacity: 1, x: 0,
            transition: iosSpring
        },
        exit: {
            opacity: 0, x: -20,
            transition: { duration: 0.2 }
        }
    },
    activities: {
        initial: { opacity: 0, scale: 0.95, y: 20 },
        animate: {
            opacity: 1, scale: 1, y: 0,
            transition: { type: 'spring', stiffness: 300, damping: 25 }
        },
        exit: {
            opacity: 0, scale: 1.05,
            transition: { duration: 0.3 }
        }
    },
    grades: {
        initial: { opacity: 0, rotateX: 15, y: 20 },
        animate: {
            opacity: 1, rotateX: 0, y: 0,
            transition: { duration: 0.6, ease: smoothEase }
        },
        exit: {
            opacity: 0, rotateX: -10,
            transition: { duration: 0.3 }
        }
    },
    attendance: {
        initial: { opacity: 0, x: -20 },
        animate: {
            opacity: 1, x: 0,
            transition: iosSpring
        },
        exit: {
            opacity: 0, x: 20,
            transition: { duration: 0.2 }
        }
    },
    students: {
        // Replaced expensive clipPath with optimized Scale/Blur (blur is still heavy but check usage)
        // Actually, let's stick to pure Scale/Opacity for "100% optimized" request
        initial: { opacity: 0, scale: 1.05 },
        animate: {
            opacity: 1, scale: 1,
            transition: { duration: 0.4, ease: smoothEase }
        },
        exit: {
            opacity: 0, scale: 0.95,
            transition: { duration: 0.3 }
        }
    },
    default: {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.4 } },
        exit: { opacity: 0, transition: { duration: 0.2 } }
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
                // Hardware acceleration hints
                willChange: 'transform, opacity',
                // Perspective for subtle 3D effects (only if needed by variants like 'grades')
                perspective: '1200px',
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
            }}
            className="h-full" // Ensure it takes height but doesn't block scroll
        >
            {children}
        </motion.div>
    );
};
