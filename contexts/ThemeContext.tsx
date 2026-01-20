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
        description: 'Gestão acadêmica e visão estratégica.',
        illustrations: ['school', 'domain', 'meeting_room', 'corporate_fare'],
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
        description: 'Investigação rigorosa sobre existência, conhecimento e ética.',
        illustrations: ['psychology', 'balance', 'forum', 'self_improvement', 'lightbulb'],
        softBg: 'bg-indigo-50 dark:bg-indigo-900/10'
    },
    'Educação Física': {
        baseColor: 'emerald',
        primaryColor: 'emerald-600',
        primaryColorHex: '#059669',
        secondaryColor: 'emerald-700',
        secondaryColorHex: '#047857',
        accentColor: 'emerald-400',
        bgGradient: 'from-emerald-600 to-teal-700',
        icon: 'sports_soccer',
        description: 'Cinesiologia, fisiologia do exercício e cultura corporal.',
        illustrations: ['monitor_heart', 'directions_run', 'fitness_center', 'sports_score', 'cardiology'],
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
        icon: 'functions',
        description: 'Análise lógica, estruturas algébricas e modelagem quantitativa.',
        illustrations: ['functions', 'data_object', 'timeline', 'architecture', 'view_in_ar'],
        softBg: 'bg-blue-50 dark:bg-blue-900/10'
    },
    'Física': {
        baseColor: 'slate',
        primaryColor: 'slate-600',
        primaryColorHex: '#475569',
        secondaryColor: 'slate-700',
        secondaryColorHex: '#334155',
        accentColor: 'slate-400',
        bgGradient: 'from-slate-600 to-slate-800',
        icon: 'rocket_launch',
        description: 'Mecânica, termodinâmica, eletromagnetismo e física moderna.',
        illustrations: ['electric_bolt', 'speed', 'lens', 'waves', 'settings_system_daydream'],
        softBg: 'bg-slate-100 dark:bg-slate-800/30'
    },
    'História': {
        baseColor: 'amber',
        primaryColor: 'amber-600',
        primaryColorHex: '#d97706',
        secondaryColor: 'amber-700',
        secondaryColorHex: '#b45309',
        accentColor: 'amber-400',
        bgGradient: 'from-amber-600 to-orange-700',
        icon: 'fort',
        description: 'Historiografia, análise documental e processos civilizatórios.',
        illustrations: ['history_edu', 'hourglass_top', 'account_balance', 'museum', 'temple_hindu'],
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
        description: 'Geopolítica, cartografia digital, climatologia e demografia.',
        illustrations: ['satellite_alt', 'landscape', 'map', 'public', 'wrong_location'],
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
        description: 'Estética, história da arte e poéticas contemporâneas.',
        illustrations: ['palette', 'brush', 'auto_awesome_mosaic', 'theater_comedy', 'contrast'],
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
        description: 'Competências socioemocionais e gestão de carreira.',
        illustrations: ['route', 'diversity_3', 'emoji_objects', 'verified', 'flag'],
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
        description: 'Teoria literária, estilos de época e hermenêutica.',
        illustrations: ['auto_stories', 'history_edu', 'style', 'local_library', 'format_quote'],
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
        icon: 'translate',
        description: 'Morfossintaxe, semântica e linguística textual.',
        illustrations: ['spellcheck', 'text_fields', 'record_voice_over', 'translate', 'article'],
        softBg: 'bg-sky-50 dark:bg-sky-900/10'
    },
    'Redação': {
        baseColor: 'violet',
        primaryColor: 'violet-600',
        primaryColorHex: '#7c3aed',
        secondaryColor: 'violet-700',
        secondaryColorHex: '#6d28d9',
        accentColor: 'violet-400',
        bgGradient: 'from-violet-600 to-purple-700',
        icon: 'edit_note',
        description: 'Argumentação lógica, coesão, coerência e estrutura.',
        illustrations: ['edit_document', 'post_add', 'fact_check', 'ink_pen', 'plagiarism'],
        softBg: 'bg-violet-50 dark:bg-violet-900/10'
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
        description: 'Estequiometria, termoquímica e ligações moleculares.',
        illustrations: ['science', 'bubble_chart', 'hexagon', 'science_off', 'vaccines'],
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
        icon: 'eco',
        description: 'Biologia celular, ecossistemas e método científico.',
        illustrations: ['biotech', 'nature_people', 'coronavirus', 'compost', 'water_drop'],
        softBg: 'bg-green-50 dark:bg-green-900/10'
    },
    'Inglês': {
        baseColor: 'indigo',
        primaryColor: 'indigo-500',
        primaryColorHex: '#6366f1',
        secondaryColor: 'indigo-600',
        secondaryColorHex: '#4f46e5',
        accentColor: 'indigo-300',
        bgGradient: 'from-indigo-500 to-blue-600',
        icon: 'language',
        description: 'Linguística aplicada, fonologia e proficiência global.',
        illustrations: ['language', 'interpreter_mode', 'headphones', 'chat', 'public'],
        softBg: 'bg-indigo-50 dark:bg-indigo-900/10'
    },
    'Ensino Religioso': {
        baseColor: 'amber',
        primaryColor: 'amber-500',
        primaryColorHex: '#f59e0b',
        secondaryColor: 'amber-600',
        secondaryColorHex: '#d97706',
        accentColor: 'amber-300',
        bgGradient: 'from-amber-500 to-yellow-600',
        icon: 'self_improvement',
        description: 'Fenômeno religioso, antropologia e ética aplicada.',
        illustrations: ['self_improvement', 'diversity_1', 'volunteer_activism', 'menu_book', 'handshake'],
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
    React.useEffect(() => {
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
        root.style.setProperty('--theme-primary', themeValue.primaryColorHex);
        root.style.setProperty('--theme-secondary', themeValue.secondaryColorHex);
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
