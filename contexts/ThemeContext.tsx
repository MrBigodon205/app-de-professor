import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { Subject } from '../types';

import { THEME_MAP, ThemeConfig } from '../utils/themeMap';

// Enhanced Theme Context with Dark Mode Support
interface ThemeContextType {
    theme: ThemeConfig & {
        subject: string;
        isDarkMode: boolean;
        toggleTheme: () => void; // New toggle function
    };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser, activeSubject } = useAuth();

    // --- DARK MODE LOGIC ---
    // Initialize from localStorage or default to FALSE (Light Mode) as requested
    const [isDarkMode, setIsDarkMode] = React.useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme_mode');
            return saved === 'dark';
        }
        return false;
    });

    // Sync with HTML class and localStorage
    React.useLayoutEffect(() => {
        const root = window.document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
            localStorage.setItem('theme_mode', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme_mode', 'light');
        }
    }, [isDarkMode]);

    const toggleTheme = React.useCallback(() => {
        // STRONG TRANSITION KILLER
        // We use a class on the body to strictly kill all transitions
        document.body.classList.add('disable-transitions');

        setIsDarkMode(prev => !prev);

        // Use double requestAnimationFrame to ensure the DOM has updated
        // and painted the new theme colors BEFORE we re-enable transitions.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                document.body.classList.remove('disable-transitions');
            });
        });
    }, []);

    const themeValue = useMemo(() => {
        const subject = activeSubject || currentUser?.subject || 'Matemática';
        const config = THEME_MAP[subject] || THEME_MAP['Matemática'];
        return {
            subject,
            ...config,
            isDarkMode, // Export state
            toggleTheme // Export toggler
        };
    }, [activeSubject, currentUser?.subject, isDarkMode, toggleTheme]);

    const contextValue = useMemo(() => ({ theme: themeValue }), [themeValue]);

    // Dynamic CSS Variable Injection
    React.useEffect(() => {
        const root = document.documentElement;

        // Helper to convert Hex to RGB for Tailwind opacity support
        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : null;
        };

        const primaryRgb = hexToRgb(themeValue.primaryColorHex);
        const secondaryRgb = hexToRgb(themeValue.secondaryColorHex);

        if (primaryRgb) root.style.setProperty('--primary', primaryRgb);
        if (secondaryRgb) root.style.setProperty('--secondary', secondaryRgb);

        root.style.setProperty('--theme-primary', themeValue.primaryColorHex);
        root.style.setProperty('--theme-secondary', themeValue.secondaryColorHex);
        root.style.setProperty('--theme-primary-alpha', `${themeValue.primaryColorHex}40`);
        // Add a subtle tint for backgrounds
        root.style.setProperty('--theme-surface', `${themeValue.primaryColorHex}10`);
    }, [themeValue]);

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useThemeContext = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useThemeContext must be used within a ThemeProvider');
    }
    return context.theme;
};
