import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

export interface ThemeConfig {
    baseColor: string;
    primaryColor: string;
    primaryColorHex: string;
    secondaryColor: string;
    secondaryColorHex: string;
    accentColor: string;
    bgGradient: [string, string, string]; // Array for LinearGradient
    icon: string;
    illustrations: string[];
}

const THEME_MAP: Record<string, ThemeConfig> = {
    'Geral': {
        baseColor: 'slate',
        primaryColor: 'slate-600',
        primaryColorHex: '#475569',
        secondaryColor: 'slate-700',
        secondaryColorHex: '#334155',
        accentColor: '#94a3b8',
        bgGradient: ['#475569', '#334155', '#1e293b'],
        icon: 'GraduationCap',
        illustrations: ['GraduationCap', 'BookOpen', 'Users', 'ClipboardList', 'Calendar'],
    },
    'Filosofia': {
        baseColor: 'indigo',
        primaryColor: 'indigo-600',
        primaryColorHex: '#4f46e5',
        secondaryColor: 'indigo-700',
        secondaryColorHex: '#4338ca',
        accentColor: '#818cf8',
        bgGradient: ['#4f46e5', '#4338ca', '#312e81'],
        icon: 'Brain',
        illustrations: ['Brain', 'Lightbulb', 'HelpCircle', 'Scroll', 'Library'],
    },
    'Sociologia': {
        baseColor: 'orange',
        primaryColor: 'orange-600',
        primaryColorHex: '#ea580c',
        secondaryColor: 'orange-700',
        secondaryColorHex: '#c2410c',
        accentColor: '#fb923c',
        bgGradient: ['#ea580c', '#c2410c', '#7c2d12'],
        icon: 'Users',
        illustrations: ['Users', 'Globe', 'Handshake', 'MessageCircle', 'Shield'],
    },
    'Educação Física': {
        baseColor: 'emerald',
        primaryColor: 'emerald-600',
        primaryColorHex: '#059669',
        secondaryColor: 'emerald-700',
        secondaryColorHex: '#047857',
        accentColor: '#34d399',
        bgGradient: ['#059669', '#047857', '#064e3b'],
        icon: 'Activity',
        illustrations: ['Activity', 'Trophy', 'Timer', 'Heart', 'Dribbble'],
    },
    'Matemática': {
        baseColor: 'blue',
        primaryColor: 'blue-600',
        primaryColorHex: '#2563eb',
        secondaryColor: 'blue-700',
        secondaryColorHex: '#1d4ed8',
        accentColor: '#60a5fa',
        bgGradient: ['#2563eb', '#1d4ed8', '#1e3a8a'],
        icon: 'Calculator',
        illustrations: ['Calculator', 'Divide', 'Percent', 'Hash', 'PieChart'],
    },
    'Física': {
        baseColor: 'violet',
        primaryColor: 'violet-600',
        primaryColorHex: '#7c3aed',
        secondaryColor: 'violet-700',
        secondaryColorHex: '#6d28d9',
        accentColor: '#a78bfa',
        bgGradient: ['#7c3aed', '#6d28d9', '#4c1d95'],
        icon: 'Rocket',
        illustrations: ['Rocket', 'Zap', 'Waves', 'Atom', 'Gauge'],
    },
    'História': {
        baseColor: 'amber',
        primaryColor: 'amber-700',
        primaryColorHex: '#b45309',
        secondaryColor: 'amber-800',
        secondaryColorHex: '#92400e',
        accentColor: '#fbbf24',
        bgGradient: ['#b45309', '#92400e', '#78350f'],
        icon: 'Landmark',
        illustrations: ['Landmark', 'Hourglass', 'Scroll', 'Flag', 'Crown'],
    },
    'Geografia': {
        baseColor: 'cyan',
        primaryColor: 'cyan-600',
        primaryColorHex: '#0891b2',
        secondaryColor: 'cyan-700',
        secondaryColorHex: '#0e7490',
        accentColor: '#22d3ee',
        bgGradient: ['#0891b2', '#0e7490', '#164e63'],
        icon: 'Globe',
        illustrations: ['Globe', 'Compass', 'Map', 'Mountain', 'CloudRain'],
    },
    'Artes': {
        baseColor: 'pink',
        primaryColor: 'pink-600',
        primaryColorHex: '#db2777',
        secondaryColor: 'pink-700',
        secondaryColorHex: '#be185d',
        accentColor: '#f472b6',
        bgGradient: ['#db2777', '#be185d', '#831843'],
        icon: 'Palette',
        illustrations: ['Palette', 'Brush', 'Camera', 'Music', 'Image'],
    },
    'Projeto de Vida': {
        baseColor: 'teal',
        primaryColor: 'teal-600',
        primaryColorHex: '#0d9488',
        secondaryColor: 'teal-700',
        secondaryColorHex: '#0f766e',
        accentColor: '#2dd4bf',
        bgGradient: ['#0d9488', '#0f766e', '#134e4a'],
        icon: 'Flag',
        illustrations: ['Flag', 'Target', 'TrendingUp', 'Compass', 'Rocket'],
    },
    'Português': {
        baseColor: 'sky',
        primaryColor: 'sky-600',
        primaryColorHex: '#0284c7',
        secondaryColor: 'sky-700',
        secondaryColorHex: '#0369a1',
        accentColor: '#38bdf8',
        bgGradient: ['#0284c7', '#0369a1', '#0c4a6e'],
        icon: 'BookOpen',
        illustrations: ['BookOpen', 'Languages', 'Type', 'AlignLeft', 'MessageSquare'],
    },
    'Redação': {
        baseColor: 'fuchsia',
        primaryColor: 'fuchsia-600',
        primaryColorHex: '#c026d3',
        secondaryColor: 'fuchsia-700',
        secondaryColorHex: '#a21caf',
        accentColor: '#e879f9',
        bgGradient: ['#c026d3', '#a21caf', '#701a75'],
        icon: 'Edit3',
        illustrations: ['Edit3', 'FileText', 'PenTool', 'CheckCircle', 'Feather'],
    },
    'Química': {
        baseColor: 'lime',
        primaryColor: 'lime-600',
        primaryColorHex: '#65a30d',
        secondaryColor: 'lime-700',
        secondaryColorHex: '#4d7c0f',
        accentColor: '#a3e635',
        bgGradient: ['#65a30d', '#4d7c0f', '#365314'],
        icon: 'FlaskConical',
        illustrations: ['FlaskConical', 'Beaker', 'Droplet', 'Zap', 'ShieldCheck'],
    },
    'Biologia': {
        baseColor: 'green',
        primaryColor: 'green-600',
        primaryColorHex: '#16a34a',
        secondaryColor: 'green-700',
        secondaryColorHex: '#15803d',
        accentColor: '#4ade80',
        bgGradient: ['#16a34a', '#15803d', '#14532d'],
        icon: 'Microscope',
        illustrations: ['Microscope', 'Dna', 'Leaf', 'Bug', 'Stethoscope'],
    },
    'Inglês': {
        baseColor: 'rose',
        primaryColor: 'rose-600',
        primaryColorHex: '#e11d48',
        secondaryColor: 'rose-700',
        secondaryColorHex: '#be123c',
        accentColor: '#fb7185',
        bgGradient: ['#e11d48', '#be123c', '#881337'],
        icon: 'Languages',
        illustrations: ['Languages', 'Globe', 'Headphones', 'MessageCircle', 'Flag'],
    },
};

interface ThemeContextType {
    theme: ThemeConfig & { subject: string };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { activeSubject, currentUser } = useAuth();

    const themeValue = useMemo(() => {
        const subject = activeSubject || currentUser?.subject || 'Geral';
        const config = THEME_MAP[subject] || THEME_MAP['Geral'];
        return {
            subject,
            ...config,
        };
    }, [activeSubject, currentUser?.subject]);

    const contextValue = useMemo(() => ({ theme: themeValue }), [themeValue]);

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
