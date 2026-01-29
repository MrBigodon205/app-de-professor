import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { Subject } from '../types';

interface ThemeConfig {
    baseColor: string;
    primaryColor: string;
    primaryColorHex: string;
    secondaryColor: string;
    secondaryColorHex: string;
    accentColor: string;
    bgGradient: string;
    icon: string;
    description: string;
    illustrations: string[];
    softBg: string;
}

const THEME_MAP: Record<string, ThemeConfig> = {
    'Geral': {
        baseColor: 'slate',
        primaryColor: 'slate-600',
        primaryColorHex: '#475569',
        secondaryColor: 'slate-700',
        secondaryColorHex: '#334155',
        accentColor: 'slate-400',
        bgGradient: 'from-slate-600 to-slate-800',
        icon: 'school',
        description: 'Visão geral da escola.',
        illustrations: ['school', 'domain', 'location_city', 'apartment', 'meeting_room', 'group'],
        softBg: 'bg-slate-50 dark:bg-slate-900/10'
    },
    'Filosofia': {
        baseColor: 'indigo',
        primaryColor: 'indigo-600',
        primaryColorHex: '#4f46e5',
        secondaryColor: 'indigo-700',
        secondaryColorHex: '#4338ca',
        accentColor: 'indigo-400',
        bgGradient: 'from-indigo-600 to-violet-700',
        icon: 'psychology',
        description: 'Amor pela sabedoria e busca pela verdade.',
        illustrations: ['psychology', 'lightbulb', 'question_mark', 'self_improvement', 'balance', 'menu_book', 'manage_search'],
        softBg: 'bg-indigo-50 dark:bg-indigo-900/10'
    },
    'Sociologia': {
        baseColor: 'orange',
        primaryColor: 'orange-600',
        primaryColorHex: '#ea580c',
        secondaryColor: 'orange-700',
        secondaryColorHex: '#c2410c',
        accentColor: 'orange-400',
        bgGradient: 'from-orange-600 to-red-700',
        icon: 'groups',
        description: 'Estudo da sociedade e interações humanas.',
        illustrations: ['groups', 'public', 'diversity_3', 'handshake', 'forum', 'poll', 'connect_without_contact'],
        softBg: 'bg-orange-50 dark:bg-orange-900/10'
    },
    'Educação Física': {
        baseColor: 'emerald',
        primaryColor: 'emerald-600',
        primaryColorHex: '#059669',
        secondaryColor: 'emerald-700',
        secondaryColorHex: '#047857',
        accentColor: 'emerald-400',
        bgGradient: 'from-emerald-600 to-teal-700',
        icon: 'sports_soccer', // Bola confirmed
        description: 'Desenvolvimento físico e bem-estar através do esporte.',
        illustrations: ['sports_soccer', 'sports_basketball', 'fitness_center', 'pool', 'timer', 'heart_check', 'directions_run', 'trophy'],
        softBg: 'bg-emerald-50 dark:bg-emerald-900/10'
    },
    'Matemática': {
        baseColor: 'blue',
        primaryColor: 'blue-600',
        primaryColorHex: '#2563eb',
        secondaryColor: 'blue-700',
        secondaryColorHex: '#1d4ed8',
        accentColor: 'blue-400',
        bgGradient: 'from-blue-600 to-indigo-700',
        icon: 'square_foot', // Changed to Ruler/Triangle
        description: 'O estudo das quantidades, estruturas e espaços.',
        illustrations: ['square_foot', 'calculate', 'percent', 'data_object', '123', 'area_chart', 'timeline', 'function', 'pentagon'],
        softBg: 'bg-blue-50 dark:bg-blue-900/10'
    },
    'Física': {
        baseColor: 'violet',
        primaryColor: 'violet-600',
        primaryColorHex: '#7c3aed',
        secondaryColor: 'violet-700',
        secondaryColorHex: '#6d28d9',
        accentColor: 'violet-400',
        bgGradient: 'from-violet-600 to-purple-700',
        icon: 'rocket_launch',
        description: 'O estudo da matéria, energia e tempo.',
        illustrations: ['rocket_launch', 'electric_bolt', 'waves', 'lens', 'hub', 'satellite_alt', 'air', 'thermostat', 'speed'],
        softBg: 'bg-violet-50 dark:bg-violet-900/10'
    },
    'História': {
        baseColor: 'amber',
        primaryColor: 'amber-700',
        primaryColorHex: '#b45309',
        secondaryColor: 'amber-800',
        secondaryColorHex: '#92400e',
        accentColor: 'amber-500',
        bgGradient: 'from-amber-700 to-orange-800',
        icon: 'account_balance',
        description: 'Explorando as raízes e eventos do passado.',
        illustrations: ['account_balance', 'museum', 'hourglass_top', 'history_edu', 'flag', 'temple_buddhist', 'crown', 'gavel'],
        softBg: 'bg-amber-50 dark:bg-amber-900/10'
    },
    'Geografia': {
        baseColor: 'cyan',
        primaryColor: 'cyan-600',
        primaryColorHex: '#0891b2',
        secondaryColor: 'cyan-700',
        secondaryColorHex: '#0e7490',
        accentColor: 'cyan-400',
        bgGradient: 'from-cyan-600 to-blue-700',
        icon: 'public',
        description: 'O estudo da Terra e sua relação com o homem.',
        illustrations: ['public', 'landscape', 'volcano', 'travel_explore', 'south_america', 'near_me', 'pin_drop', 'satellite', 'map'],
        softBg: 'bg-cyan-50 dark:bg-cyan-900/10'
    },
    'Artes': {
        baseColor: 'pink',
        primaryColor: 'pink-600',
        primaryColorHex: '#db2777',
        secondaryColor: 'pink-700',
        secondaryColorHex: '#be185d',
        accentColor: 'pink-400',
        bgGradient: 'from-pink-600 to-rose-700',
        icon: 'palette',
        description: 'Expressão criativa através das artes visuais.',
        illustrations: ['palette', 'piano', 'imagesmode', 'brush', 'color_lens', 'photo_camera', 'movie', 'music_note', 'architecture'],
        softBg: 'bg-pink-50 dark:bg-pink-900/10'
    },
    'Projeto de Vida': {
        baseColor: 'teal',
        primaryColor: 'teal-600',
        primaryColorHex: '#0d9488',
        secondaryColor: 'teal-700',
        secondaryColorHex: '#0f766e',
        accentColor: 'teal-400',
        bgGradient: 'from-teal-600 to-cyan-700',
        icon: 'flag',
        description: 'Planejando seu futuro e seus sonhos.',
        illustrations: ['flag', 'stairs', 'emoji_objects', 'verified', 'rocket_launch', 'route', 'mountain_flag', 'target'],
        softBg: 'bg-teal-50 dark:bg-teal-900/10'
    },
    'Literatura': {
        baseColor: 'rose',
        primaryColor: 'rose-600',
        primaryColorHex: '#e11d48',
        secondaryColor: 'rose-700',
        secondaryColorHex: '#be123c',
        accentColor: 'rose-400',
        bgGradient: 'from-rose-600 to-red-700',
        icon: 'auto_stories',
        description: 'A arte da palavra e dos grandes clássicos.',
        illustrations: ['auto_stories', 'history_edu', 'menu_book', 'collections_bookmark', 'library_books', 'theater_comedy', 'format_quote'],
        softBg: 'bg-rose-50 dark:bg-rose-900/10'
    },
    'Português': {
        baseColor: 'sky',
        primaryColor: 'sky-600',
        primaryColorHex: '#0284c7',
        secondaryColor: 'sky-700',
        secondaryColorHex: '#0369a1',
        accentColor: 'sky-400',
        bgGradient: 'from-sky-600 to-blue-700',
        icon: 'library_books',
        description: 'O domínio da nossa língua materna.',
        illustrations: ['library_books', 'abc', 'font_download', 'spellcheck', 'translate', 'article', 'chat_bubble'],
        softBg: 'bg-sky-50 dark:bg-sky-900/10'
    },
    'Redação': {
        baseColor: 'fuchsia',
        primaryColor: 'fuchsia-600',
        primaryColorHex: '#c026d3',
        secondaryColor: 'fuchsia-700',
        secondaryColorHex: '#a21caf',
        accentColor: 'fuchsia-400',
        bgGradient: 'from-fuchsia-600 to-purple-700',
        icon: 'edit_note',
        description: 'Estruturação do pensamento e escrita.',
        illustrations: ['edit_note', 'pen_size_2', 'article', 'description', 'rate_review', 'edit_document', 'ink_pen'],
        softBg: 'bg-fuchsia-50 dark:bg-fuchsia-900/10'
    },
    'Química': {
        baseColor: 'lime',
        primaryColor: 'lime-600',
        primaryColorHex: '#65a30d',
        secondaryColor: 'lime-700',
        secondaryColorHex: '#4d7c0f',
        accentColor: 'lime-400',
        bgGradient: 'from-lime-600 to-green-700',
        icon: 'science',
        description: 'A ciência das transformações da matéria.',
        illustrations: ['science', 'biotech', 'vaccines', 'water_drop', 'bubble_chart', 'propane', 'recycling', 'experiment'],
        softBg: 'bg-lime-50 dark:bg-lime-900/10'
    },
    'Ciências': {
        baseColor: 'green',
        primaryColor: 'green-600',
        primaryColorHex: '#16a34a',
        secondaryColor: 'green-700',
        secondaryColorHex: '#15803d',
        accentColor: 'green-400',
        bgGradient: 'from-green-600 to-emerald-700',
        icon: 'forest',
        description: 'Descobrindo o mundo natural e a vida.',
        illustrations: ['forest', 'nature', 'microscope', 'dna', 'pets', 'skeleton', 'potted_plant', 'water_drop'],
        softBg: 'bg-green-50 dark:bg-green-900/10'
    },
    'Biologia': {
        baseColor: 'green',
        primaryColor: 'green-600',
        primaryColorHex: '#16a34a',
        secondaryColor: 'green-700',
        secondaryColorHex: '#15803d',
        accentColor: 'green-400',
        bgGradient: 'from-green-600 to-emerald-700',
        icon: 'biotech',
        description: 'Estudo da vida e dos organismos vivos.',
        illustrations: ['biotech', 'dna', 'microscope', 'pest_control', 'neurology', 'cardiology', 'skeleton', 'nutrition'],
        softBg: 'bg-green-50 dark:bg-green-900/10'
    },
    'Inglês': {
        baseColor: 'rose',
        primaryColor: 'rose-600',
        primaryColorHex: '#e11d48',
        secondaryColor: 'rose-700',
        secondaryColorHex: '#be123c',
        accentColor: 'rose-400',
        bgGradient: 'from-rose-600 to-red-700',
        icon: 'public',
        description: 'Communication and global connection through English.',
        illustrations: ['public', 'translate', 'forum', 'chat', 'headphones', 'subtitles', 'airplane_ticket', 'flag'],
        softBg: 'bg-rose-50 dark:bg-rose-900/10'
    },
    'Ensino Religioso': {
        baseColor: 'amber',
        primaryColor: 'amber-500',
        primaryColorHex: '#f59e0b',
        secondaryColor: 'amber-600',
        secondaryColorHex: '#d97706',
        accentColor: 'amber-300',
        bgGradient: 'from-amber-500 to-yellow-600',
        icon: 'volunteer_activism',
        description: 'Ética, valores e o fenômeno religioso.',
        illustrations: ['volunteer_activism', 'temple_hindu', 'self_improvement', 'church', 'mosque', 'synagogue', 'handshake'],
        softBg: 'bg-amber-50 dark:bg-amber-900/10'
    }
};

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
        setIsDarkMode(prev => !prev);
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
