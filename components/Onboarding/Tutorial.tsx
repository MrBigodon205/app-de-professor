import React, { useEffect, useState } from 'react';
import { useTutorial } from '../../contexts/TutorialContext';
import { TutorialDesktop } from './TutorialDesktop';
import { TutorialMobile } from './TutorialMobile';

export const Tutorial: React.FC = () => {
    const { completed, stopTutorial } = useTutorial();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkDevice = () => {
            // Forcing Desktop Tutorial logic for everyone for this "Comprehensive" request, 
            // because Mobile Joyride works fine and is better than the static one for "teaching everything".
            // However, let's keep the check if we want to fallback.
            // Actually, the user wants "show all interface", implying interaction. 
            // The previous MobileTutorial was just a slideshow. 
            // Let's use TutorialDesktop (responsive) for both, or at least test it.
            // But for safety, I'll stick to logic:
            setIsMobile(window.innerWidth < 1024);
        };
        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    // We can use the same component for both if styled properly, 
    // or keep the Mobile one if it's preferred. 
    // Given the request "navigate showing all interface", the specific targeting of elements is better.
    // So let's try to use TutorialDesktop for BOTH (it is responsive).

    return <TutorialDesktop onComplete={stopTutorial} />;
};
