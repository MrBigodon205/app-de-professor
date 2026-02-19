import { Transition, Variants } from "framer-motion";

/**
 * ⚡ MOTION SYSTEM V2: PERFORMANCE FIRST
 * 
 * "Fluid, Light, Subtle".
 * Removed heavy springs. Using standard CSS-like eases for maximum frame rate.
 */

// Ease Standard: Natural deceleration
// [0.25, 0.1, 0.25, 1.0] -> https://cubic-bezier.com/#.25,.1,.25,1
const EASE_STANDARD: [number, number, number, number] = [0.25, 0.1, 0.25, 1.0];

// Duration: Fast but perceptible
const DURATION_FAST = 0.2;
const DURATION_NORMAL = 0.3;

export const VARIANTS: Record<string, Variants> = {
    // 1. FADE (Most performant)
    fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: DURATION_FAST, ease: "linear" } },
        exit: { opacity: 0, transition: { duration: 0 } } // INSTANT EXIT
    },
    // 2. FADE UP (Subtle movement)
    fadeUp: {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0, transition: { duration: DURATION_NORMAL, ease: EASE_STANDARD } },
        exit: { opacity: 0, transition: { duration: 0 } } // INSTANT EXIT
    },
    // 3. SCALE (Cards/Modals) - Very subtle
    scale: {
        initial: { opacity: 0, scale: 0.98 },
        animate: { opacity: 1, scale: 1, transition: { duration: DURATION_NORMAL, ease: EASE_STANDARD } },
        exit: { opacity: 0, scale: 0.98, transition: { duration: DURATION_FAST, ease: "easeIn" } }
    },
    // 4. STAGGER (Fast)
    staggerContainer: {
        initial: {},
        animate: {
            transition: {
                staggerChildren: 0.05, // Smooth stagger
                delayChildren: 0.05
            }
        },
        exit: {}
    }
};

export const PAGE_TRANSITION: Transition = {
    duration: DURATION_NORMAL,
    ease: EASE_STANDARD
};
