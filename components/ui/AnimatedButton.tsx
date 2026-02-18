
import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
    isLoading?: boolean;
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(({
    children,
    className = '',
    variant = 'primary',
    isLoading,
    disabled,
    ...props
}, ref) => {

    // Base styles + Variant styles
    const baseStyles = "relative overflow-hidden transition-colors flex items-center justify-center gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-primary text-white hover:brightness-110 shadow-lg shadow-primary/30",
        secondary: "bg-surface-section text-text-primary border border-border-default hover:bg-surface-subtle",
        danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30",
        ghost: "bg-transparent text-text-muted hover:text-primary hover:bg-primary/5",
        icon: "p-2 rounded-full hover:bg-surface-subtle text-text-muted hover:text-primary"
    };

    const rounded = variant === 'icon' ? 'rounded-full' : 'rounded-xl';
    const padding = variant === 'icon' ? '' : 'px-4 py-2.5';

    return (
        <motion.button
            ref={ref}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`${baseStyles} ${variants[variant]} ${rounded} ${padding} ${className} will-change-transform`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-inherit">
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                </div>
            ) : null}
            <span className={isLoading ? "opacity-0" : "contents"}>
                {children as React.ReactNode}
            </span>
        </motion.button>
    );
});

AnimatedButton.displayName = 'AnimatedButton';
