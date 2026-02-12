import React from 'react';

interface BackgroundPatternProps {
    theme: any;
}

export const BackgroundPattern: React.FC<BackgroundPatternProps> = React.memo(({
    theme,
}) => {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none" aria-hidden="true">
            <div
                className={`absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-${theme.primaryColor}/8 blur-[60px] animate-blob will-change-transform`}
            />
            <div
                className={`absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-${theme.secondaryColor}/8 blur-[60px] animate-blob animation-delay-2000 will-change-transform`}
            />
        </div>
    );
});

BackgroundPattern.displayName = 'BackgroundPattern';
