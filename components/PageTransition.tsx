import React from 'react';
import { motion } from 'framer-motion';

type AnimationType = 'default' | 'dashboard' | 'planning' | 'activities' | 'grades' | 'attendance' | 'students';

interface PageTransitionProps {
    children: React.ReactNode;
    type?: AnimationType;
}

// "Heavy", Beautiful, and Sophisticated Animations
// Prioritizing visual "wow" factor over raw DOM performance.
// Using custom bezier curves for that "Apple/iOS" premium friction feel.

const iosEase = [0.25, 0.1, 0.25, 1]; // Smooth iOS-like easing
const heavyBounce = { type: 'spring', stiffness: 200, damping: 20 }; // Snappy but bouncy

const variants = {
    dashboard: {
        initial: { opacity: 0, y: 40, scale: 0.95, filter: 'blur(10px)' },
        animate: {
            opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
            transition: { duration: 0.8, ease: iosEase, staggerChildren: 0.1 }
        },
        exit: {
            opacity: 0, y: -40, scale: 1.05, filter: 'blur(10px)',
            transition: { duration: 0.5, ease: 'easeInOut' }
        }
    },
    planning: {
        initial: { opacity: 0, x: '100vw', skewX: 5 },
        animate: {
            opacity: 1, x: 0, skewX: 0,
            transition: { duration: 0.7, type: 'spring', stiffness: 80, damping: 15, mass: 1.2 }
        },
        exit: {
            opacity: 0, x: '-50vw', skewX: -5,
            transition: { duration: 0.5, ease: 'easeInOut' }
        }
    },
    activities: {
        // A sleek 3D "Card Deck" shuffle effect
        initial: { opacity: 0, scale: 0.8, rotate: -5, y: 100 },
        animate: {
            opacity: 1, scale: 1, rotate: 0, y: 0,
            transition: { duration: 0.6, type: 'spring', stiffness: 150, damping: 15 }
        },
        exit: {
            opacity: 0, scale: 1.1, rotate: 5,
            transition: { duration: 0.4 }
        }
    },
    grades: {
        // Dramatic 3D Flip (Perspective needed on container)
        initial: { opacity: 0, rotateX: 90, y: 50, transformPerspective: 1000 },
        animate: {
            opacity: 1, rotateX: 0, y: 0,
            transition: { duration: 0.8, type: "spring", bounce: 0.3 }
        },
        exit: {
            opacity: 0, rotateX: -45, scale: 0.9,
            transition: { duration: 0.5 }
        }
    },
    attendance: {
        // Horizontal Slide with a "Stretch" effect
        initial: { opacity: 0, x: -100, scaleX: 1.2 },
        animate: {
            opacity: 1, x: 0, scaleX: 1,
            transition: { duration: 0.6, ease: iosEase }
        },
        exit: {
            opacity: 0, x: 100, scaleX: 0.9,
            transition: { duration: 0.4, ease: 'easeIn' }
        }
    },
    students: {
        // Iris / Circular Reveal - Heavy but beautiful
        initial: { opacity: 0, clipPath: 'circle(0% at 50% 50%)', scale: 1.1 },
        animate: {
            opacity: 1, clipPath: 'circle(150% at 50% 50%)', scale: 1,
            transition: { duration: 0.7, ease: [0.19, 1, 0.22, 1] }
        },
        exit: {
            opacity: 0, clipPath: 'circle(0% at 50% 50%)', scale: 1.1,
            transition: { duration: 0.5, ease: 'easeInOut' }
        }
    },
    default: {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
        exit: { opacity: 0, scale: 1.05, transition: { duration: 0.3 } }
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
                height: '100%',
                perspective: '1200px', // Enhances 3D effects
                transformStyle: 'preserve-3d', // Essential for 3D children
                backfaceVisibility: 'hidden',
                overflow: 'hidden' // Keeps clean edges during wild transforms
            }}
        >
            {children}
        </motion.div>
    );
};
