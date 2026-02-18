import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { VARIANTS } from '../constants/motion';

interface PageTransitionProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    type?: string;
}

/**
 * 🔄 PageTransition (Premium)
 * 
 * Uses framer-motion to create smooth, "app-like" transitions between routes.
 * Mode "wait" in App.tsx ensures the old page leaves before the new one enters.
 */
export const PageTransition = React.forwardRef<HTMLDivElement, PageTransitionProps>(({ children, type, className, ...props }, ref) => {
    const location = useLocation();

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // V2: Light Fade Up on Desktop, Pure Fade on Mobile for Max PPS
    const variants = isMobile ? VARIANTS.fade : VARIANTS.fadeUp;

    return (
        <motion.div
            ref={ref}
            className={`w-full h-full flex flex-col ${className || ''}`}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            {...props as any} // Cast to any to avoid motion prop conflicts with HTMLDivElement
        >
            {children}
        </motion.div>
    );
});

PageTransition.displayName = 'PageTransition';

export default PageTransition;
