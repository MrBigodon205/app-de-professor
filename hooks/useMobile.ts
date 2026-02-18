import { useState, useEffect } from 'react';

export const useMobile = (breakpoint = 768) => {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < breakpoint;
        }
        return false;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleResize = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        // Add event listener
        window.addEventListener('resize', handleResize);

        // Initial check in case window resized before effect
        handleResize();

        // Cleanup
        return () => window.removeEventListener('resize', handleResize);
    }, [breakpoint]);

    return isMobile;
};
