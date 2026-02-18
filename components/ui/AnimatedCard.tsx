
import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface AnimatedCardProps extends HTMLMotionProps<"div"> {
    hoverEffect?: boolean;
}

export const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(({
    children,
    className = '',
    hoverEffect = true,
    ...props
}, ref) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: isMobile ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={!isMobile && hoverEffect ? { y: -4 } : undefined} // No hover transform on mobile
            transition={{ duration: isMobile ? 0.25 : 0.4, ease: "easeOut" }}
            className={`bg-white dark:bg-slate-800 rounded-3xl border border-border-default/50 shadow-sm transition-shadow hover:shadow-lg ${className}`}
            {...props}
        >
            {children}
        </motion.div>
    );
});

AnimatedCard.displayName = 'AnimatedCard';
