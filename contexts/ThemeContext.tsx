import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { Subject } from '../types';

interface ThemeConfig {
    baseColor: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    bgGradient: string;
    icon: string;
    description: string;
    illustrations: string[];
    softBg: string;
}

const THEME_MAP: Record<string, ThemeConfig> = {
    'Geral': {
        baseColor: 'blue',
        primaryColor: 'blue-600',
        secondaryColor: 'blue-700',
        accentColor: 'blue-400',
        bgGradient: 'from-blue-600 to-indigo-700',
        icon: 'school',
        description: 'Visão geral da escola.',
        illustrations: ['school', 'domain', 'location_city', 'apartment'],
        softBg: 'bg-blue-50 dark:bg-blue-900/10'
    },
    'Filosofia': {
        baseColor: 'indigo',
        primaryColor: 'indigo-600',
        secondaryColor: 'indigo-700',
        accentColor: 'indigo-400',
        bgGradient: 'from-indigo-600 to-violet-700',
        icon: 'psychology',
        description: 'Amor pela sabedoria e busca pela verdade.',
        illustrations: ['menu_book', 'lightbulb', 'auto_stories', 'history_edu'],
        softBg: 'bg-indigo-50 dark:bg-indigo-900/10'
    },
    'Educação Física': {
        baseColor: 'emerald',
        primaryColor: 'emerald-600',
        secondaryColor: 'emerald-700',
        accentColor: 'emerald-400',
        bgGradient: 'from-emerald-600 to-teal-700',
        icon: 'sports_soccer',
        description: 'Desenvolvimento físico e bem-estar através do esporte.',
        illustrations: ['sports_basketball', 'fitness_center', 'sports_volleyball', 'directions_run'],
        softBg: 'bg-emerald-50 dark:bg-emerald-900/10'
    },
    'Matemática': {
        baseColor: 'blue',
        primaryColor: 'blue-600',
        secondaryColor: 'blue-700',
        accentColor: 'blue-400',
        bgGradient: 'from-blue-600 to-indigo-700',
        icon: 'functions',
        description: 'O estudo das quantidades, estruturas e espaços.',
        illustrations: ['calculate', 'analytics', 'architecture', 'show_chart'],
        softBg: 'bg-blue-50 dark:bg-blue-900/10'
    },
    'Física': {
        baseColor: 'slate',
        primaryColor: 'slate-600',
        secondaryColor: 'slate-700',
        accentColor: 'slate-400',
        bgGradient: 'from-slate-600 to-slate-800',
        icon: 'rocket_launch',
        description: 'O estudo da matéria, energia e tempo.',
        illustrations: ['bolt', 'star', 'speed', 'settings_backup_restore'],
        softBg: 'bg-slate-100 dark:bg-slate-800/30'
    },
    'História': {
        baseColor: 'amber',
        primaryColor: 'amber-600',
        secondaryColor: 'amber-700',
        accentColor: 'amber-400',
        bgGradient: 'from-amber-600 to-orange-700',
        icon: 'fort',
        description: 'Explorando as raízes e eventos do passado.',
        illustrations: ['temple_hindu', 'public', 'history', 'castle'],
        softBg: 'bg-amber-50 dark:bg-amber-900/10'
    },
    'Geografia': {
        baseColor: 'cyan',
        primaryColor: 'cyan-600',
        secondaryColor: 'cyan-700',
        accentColor: 'cyan-400',
        bgGradient: 'from-cyan-600 to-blue-700',
        icon: 'public',
        description: 'O estudo da Terra e sua relação com o homem.',
        illustrations: ['map', 'terrain', 'explore', 'layers'],
        softBg: 'bg-cyan-50 dark:bg-cyan-900/10'
    },
    'Artes': {
        baseColor: 'pink',
        primaryColor: 'pink-600',
        secondaryColor: 'pink-700',
        accentColor: 'pink-400',
        bgGradient: 'from-pink-600 to-rose-700',
        icon: 'palette',
        description: 'Expressão criativa através das artes visuais.',
        illustrations: ['brush', 'format_paint', 'imagesearch_roller', 'architecture'],
        softBg: 'bg-pink-50 dark:bg-pink-900/10'
    },
    'Projeto de Vida': {
        baseColor: 'teal',
        primaryColor: 'teal-600',
        secondaryColor: 'teal-700',
        accentColor: 'teal-400',
        bgGradient: 'from-teal-600 to-cyan-700',
        icon: 'flag',
        description: 'Planejando seu futuro e seus sonhos.',
        illustrations: ['stairs', 'emoji_objects', 'verified', 'rocket'],
        softBg: 'bg-teal-50 dark:bg-teal-900/10'
    },
    'Literatura': {
        baseColor: 'rose',
        primaryColor: 'rose-600',
        secondaryColor: 'rose-700',
        accentColor: 'rose-400',
        bgGradient: 'from-rose-600 to-red-700',
        icon: 'auto_stories',
        description: 'A arte da palavra e dos grandes clássicos.',
        illustrations: ['history_edu', 'menu_book', 'collections_bookmark', 'library_books'],
        softBg: 'bg-rose-50 dark:bg-rose-900/10'
    },
    'Português': {
        baseColor: 'sky',
        primaryColor: 'sky-600',
        secondaryColor: 'sky-700',
        accentColor: 'sky-400',
        bgGradient: 'from-sky-600 to-blue-700',
        icon: 'school',
        description: 'O domínio da nossa língua materna.',
        illustrations: ['abc', 'font_download', 'spellcheck', 'translate'],
        softBg: 'bg-sky-50 dark:bg-sky-900/10'
    },
    'Redação': {
        baseColor: 'violet',
        primaryColor: 'violet-600',
        secondaryColor: 'violet-700',
        accentColor: 'violet-400',
        bgGradient: 'from-violet-600 to-purple-700',
        icon: 'edit_note',
        description: 'Estruturação do pensamento e escrita.',
        illustrations: ['pen_size_2', 'article', 'description', 'rate_review'],
        softBg: 'bg-violet-50 dark:bg-violet-900/10'
    },
    'Química': {
        baseColor: 'lime',
        primaryColor: 'lime-600',
        secondaryColor: 'lime-700',
        accentColor: 'lime-400',
        bgGradient: 'from-lime-600 to-green-700',
        icon: 'science',
        description: 'A ciência das transformações da matéria.',
        illustrations: ['biotech', 'vaccines', 'medical_services', 'blur_on'],
        softBg: 'bg-lime-50 dark:bg-lime-900/10'
    },
    'Ciências': {
        baseColor: 'green',
        primaryColor: 'green-600',
        secondaryColor: 'green-700',
        accentColor: 'green-400',
        bgGradient: 'from-green-600 to-emerald-700',
        icon: 'eco',
        description: 'Descobrindo o world natural e a vida.',
        illustrations: ['nature', 'microscope', 'dna', 'forest'],
        softBg: 'bg-green-50 dark:bg-green-900/10'
    },
    'Inglês': {
        baseColor: 'indigo',
        primaryColor: 'indigo-500',
        secondaryColor: 'indigo-600',
        accentColor: 'indigo-300',
        bgGradient: 'from-indigo-500 to-blue-600',
        icon: 'translate',
        description: 'Communication and global connection through English.',
        illustrations: ['public', 'language', 'forum', 'chat'],
        softBg: 'bg-indigo-50 dark:bg-indigo-900/10'
    },
    'Ensino Religioso': {
        baseColor: 'amber',
        primaryColor: 'amber-500',
        secondaryColor: 'amber-600',
        accentColor: 'amber-300',
        bgGradient: 'from-amber-500 to-yellow-600',
        icon: 'church',
        description: 'Ética, valores e o fenômeno religioso.',
        illustrations: ['favorite', 'volunteer_activism', 'temple_hindu', 'self_improvement'],
        softBg: 'bg-amber-50 dark:bg-amber-900/10'
    }
};

interface ThemeContextType {
    theme: ThemeConfig & { subject: string };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser, activeSubject } = useAuth();

    const themeValue = useMemo(() => {
        const subject = activeSubject || currentUser?.subject || 'Geral';
        const config = THEME_MAP[subject] || THEME_MAP['Geral'];
        return {
            subject,
            ...config
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
