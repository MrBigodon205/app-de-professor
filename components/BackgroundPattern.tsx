import React from 'react';
import { motion } from 'framer-motion';

interface BackgroundPatternProps {
    theme: any;
    mouseX?: any;
    mouseY?: any;
    orientation?: { x: any; y: any };
}

export const BackgroundPattern: React.FC<BackgroundPatternProps> = React.memo(({
    theme,
    mouseX,
    mouseY,
    orientation = { x: 0, y: 0 }
}) => {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none">
            <motion.div
                className={`absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-${theme.primaryColor}/10 blur-3xl animate-blob will-change-transform`}
                style={{ x: orientation.x, y: orientation.y }}
            ></motion.div>
            <motion.div
                className={`absolute -bottom-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-${theme.secondaryColor}/10 blur-3xl animate-blob animation-delay-2000 will-change-transform`}
                style={{ x: orientation.x, y: orientation.y }}
            ></motion.div>
            {mouseX && mouseY && (
                <motion.div
                    className="absolute inset-0 opacity-[0.1] dark:opacity-[0.12] grid grid-cols-3 md:grid-cols-4 gap-16 p-8 transform -rotate-12 scale-150"
                    style={{ x: mouseX, y: mouseY }}
                >
                    {Array.from({ length: 16 }).map((_, i) => (
                        <div
                            key={i}
                            className={`flex items-center justify-center animate-float will-change-transform delay-${i % 8}`}
                        >
                            <span className={`material-symbols-outlined text-4xl md:text-5xl text-${theme.primaryColor}`}>
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
