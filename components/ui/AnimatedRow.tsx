
import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface AnimatedRowProps extends HTMLMotionProps<"tr"> {
    children: React.ReactNode;
}

import { VARIANTS } from '../../constants/motion';

export const AnimatedRow = React.forwardRef<HTMLTableRowElement, AnimatedRowProps>(({ children, className, variants = VARIANTS.fadeUp, ...props }, ref) => {
    return (
        <motion.tr
            ref={ref}
            variants={variants}
            className={`group hover:bg-surface-subtle transition-colors ${(className || '')}`}
            {...props}
        >
            {children}
        </motion.tr>
    );
});

AnimatedRow.displayName = 'AnimatedRow';
