import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TutorialDesktop } from './TutorialDesktop';
import { TutorialMobile } from './TutorialMobile';

const TUTORIAL_KEY = 'tutorial_completed_v5_responsive'; // Updated key

export const Tutorial: React.FC = () => {
    const { currentUser } = useAuth();
    const [shouldShow, setShouldShow] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Check initialization only once
    const initialized = useRef(false);

    useEffect(() => {
        const checkDevice = () => {
            setIsMobile(window.innerWidth < 1024); // lg breakpoint
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    useEffect(() => {
        if (!currentUser || initialized.current) return;

        const key = `${TUTORIAL_KEY}_${currentUser.id}`;
        const completed = localStorage.getItem(key);

        initialized.current = true;

        // Auto-start if not completed
        // For testing, user can manually wipe key or we just show it if !completed
        if (!completed) {
            // Small delay to ensure UI is ready
            setTimeout(() => setShouldShow(true), 1000);
        }
    }, [currentUser]);

    const handleComplete = () => {
        setShouldShow(false);
        if (currentUser) {
            localStorage.setItem(`${TUTORIAL_KEY}_${currentUser.id}`, 'true');
        }
    };

    if (!shouldShow) return null;

    return isMobile
        ? <TutorialMobile onComplete={handleComplete} />
        : <TutorialDesktop onComplete={handleComplete} />;
};
