
import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface AnimatedInputProps extends HTMLMotionProps<"input"> {
    label?: string;
    error?: string;
    icon?: string;
}

export const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(({
    label,
    error,
    icon,
    className = '',
    ...props
}, ref) => {
    const id = React.useId();

    return (
        <div className="w-full relative group">
            {label && (
                <label
                    htmlFor={id}
                    className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1 group-focus-within:text-primary transition-colors"
                >
                    {label}
                </label>
            )}

            <div className="relative">
                {icon && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted group-focus-within:text-primary transition-colors">
                        {icon}
                    </span>
                )}

                <motion.input
                    id={id}
                    ref={ref}
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                    className={`
                        w-full bg-surface-section border-2 rounded-xl py-3
                        ${icon ? 'pl-10' : 'pl-4'} pr-4
                        text-text-primary placeholder:text-text-disabled outline-none transition-all
                        ${error
                            ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]'
                            : 'border-transparent focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:shadow-[0_0_0_4px_rgba(var(--primary-rgb),0.1)]'
                        }
                        ${className}
                    `}
                    {...props}
                />
            </div>

            {error && (
                <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs text-red-500 mt-1 ml-1 font-medium flex items-center gap-1"
                >
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {error}
                </motion.p>
            )}
        </div>
    );
});

AnimatedInput.displayName = 'AnimatedInput';
