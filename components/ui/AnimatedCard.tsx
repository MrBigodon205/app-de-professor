
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
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={hoverEffect ? { y: -4 } : undefined} // Lift up on hover (safer than scale)
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`bg-white dark:bg-slate-800 rounded-3xl border border-border-default/50 shadow-sm transition-shadow hover:shadow-lg ${className}`}
            {...props}
        >
            {children}
        </motion.div>
    );
});

AnimatedCard.displayName = 'AnimatedCard';
