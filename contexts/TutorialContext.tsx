import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface TutorialContextType {
    isActive: boolean;
    startTutorial: () => void;
    stopTutorial: () => void;
    currentStepIndex: number;
    setStepIndex: (index: number) => void;
    completed: boolean;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isActive, setIsActive] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const { currentUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Key for localStorage
    const TUTORIAL_KEY = 'prof_acerta_tutorial_completed_v2';

    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        if (currentUser) {
            const isDone = localStorage.getItem(`${TUTORIAL_KEY}_${currentUser.id}`);
            if (isDone) setCompleted(true);
            else {
                // Auto start logic can go here if desired, 
                // but typically we let the component handle the "Welcome" modal first.
            }
        }
    }, [currentUser]);

    const startTutorial = () => {
        setIsActive(true);
        setCurrentStepIndex(0);
        // Ensure we are at home/dashboard when starting
        if (location.pathname !== '/dashboard') {
            navigate('/dashboard');
        }
    };

    const stopTutorial = () => {
        setIsActive(false);
        if (currentUser) {
            localStorage.setItem(`${TUTORIAL_KEY}_${currentUser.id}`, 'true');
            setCompleted(true);
        }
    };

    return (
        <TutorialContext.Provider value={{
            isActive,
            startTutorial,
            stopTutorial,
            currentStepIndex,
            setStepIndex: setCurrentStepIndex,
            completed
        }}>
            {children}
        </TutorialContext.Provider>
    );
};

export const useTutorial = () => {
    const context = useContext(TutorialContext);
    if (context === undefined) {
        throw new Error('useTutorial must be used within a TutorialProvider');
    }
    return context;
};
