import React from 'react';
import { motion } from 'framer-motion';

interface BackgroundPatternProps {
    theme: any;
    mouseX?: any;
    mouseY?: any;
    orientation?: { x: number; y: number };
}

export const BackgroundPattern: React.FC<BackgroundPatternProps> = React.memo(({
    theme,
    mouseX,
    mouseY,
    orientation = { x: 0, y: 0 }
}) => {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none">
            {/* Gradient Overlay for better immersion */}
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.bgGradient} opacity-[0.08] dark:opacity-[0.15] mix-blend-overlay`}></div>

            <motion.div
                className={`absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-${theme.primaryColor}/20 blur-[100px] animate-blob will-change-transform mix-blend-multiply dark:mix-blend-screen`}
                style={{ x: orientation.x, y: orientation.y }}
            ></motion.div>
            <motion.div
                className={`absolute -bottom-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-${theme.secondaryColor}/20 blur-[100px] animate-blob animation-delay-2000 will-change-transform mix-blend-multiply dark:mix-blend-screen`}
                style={{ x: orientation.x, y: orientation.y }}
            ></motion.div>

            {/* Extra accent blob for intensity */}
            <motion.div
                className={`absolute top-[40%] left-[40%] w-[40%] h-[40%] rounded-full bg-${theme.accentColor}/15 blur-[80px] animate-blob animation-delay-4000 will-change-transform mix-blend-multiply dark:mix-blend-screen`}
                style={{ x: orientation.x, y: orientation.y }}
            ></motion.div>

            {mouseX && mouseY && (
                <motion.div
                    className="absolute inset-0 opacity-[0.15] dark:opacity-[0.2] grid grid-cols-3 md:grid-cols-4 gap-16 p-8 transform -rotate-12 scale-150"
                    style={{ x: mouseX, y: mouseY }}
                >
                    {Array.from({ length: 16 }).map((_, i) => (
                        <div
                            key={i}
                            className={`flex items-center justify-center animate-float will-change-transform delay-${i % 8}`}
                        >
                            <span className={`material-symbols-outlined text-4xl md:text-5xl text-${theme.primaryColor} drop-shadow-lg`}>
                                {theme.illustrations[i % theme.illustrations.length]}
                            </span>
                        </div>
                    ))}
                </motion.div>
            )}
        </div>
    );
});

BackgroundPattern.displayName = 'BackgroundPattern';
