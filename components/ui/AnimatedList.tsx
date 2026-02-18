
import React from 'react';
import { motion } from 'framer-motion';

import { VARIANTS } from '../../constants/motion';
import { useMobile } from '../../hooks/useMobile';

export const AnimatedList: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => {
    return (
        <motion.div
            variants={VARIANTS.staggerContainer}
            initial="initial"
            animate="animate"
            exit="exit"
            className={className}
        >
            {children}
        </motion.div>
    );
};

export const AnimatedItem: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => {
    const isMobile = useMobile();

    return (
        <motion.div
            variants={isMobile ? VARIANTS.fade : VARIANTS.fadeUp}
            className={`${className}`}
        >
            {children}
        </motion.div>
    );
};
