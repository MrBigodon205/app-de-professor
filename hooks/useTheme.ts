import { useAuth } from '../contexts/AuthContext';
import { Subject } from '../types';

interface ThemeConfig {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    bgGradient: string;
    icon: string;
    description: string;
    illustrations: string[];
}

const THEME_MAP: Record<Subject, ThemeConfig> = {
    'Filosofia': {
        primaryColor: 'indigo-600',
        secondaryColor: 'indigo-700',
        accentColor: 'indigo-400',
        bgGradient: 'from-indigo-600 to-violet-700',
        icon: 'psychology',
        description: 'Amor pela sabedoria e busca pela verdade.',
        illustrations: ['menu_book', 'lightbulb', 'auto_stories', 'history_edu']
    },
    'Educação Física': {
        primaryColor: 'emerald-600',
        secondaryColor: 'emerald-700',
        accentColor: 'emerald-400',
        bgGradient: 'from-emerald-600 to-teal-700',
        icon: 'sports_soccer',
        description: 'Desenvolvimento físico e bem-estar através do esporte.',
        illustrations: ['sports_basketball', 'fitness_center', 'sports_volleyball', 'directions_run']
    },
    'Matemática': {
        primaryColor: 'blue-600',
        secondaryColor: 'blue-700',
        accentColor: 'blue-400',
        bgGradient: 'from-blue-600 to-indigo-700',
        icon: 'functions',
        description: 'O estudo das quantidades, estruturas e espaços.',
        illustrations: ['calculate', 'analytics', 'architecture', 'show_chart']
    },
    'Física': {
        primaryColor: 'slate-600',
        secondaryColor: 'slate-700',
        accentColor: 'slate-400',
        bgGradient: 'from-slate-600 to-slate-800',
        icon: 'rocket_launch',
        description: 'O estudo da matéria, energia e tempo.',
        illustrations: ['bolt', 'star', 'speed', 'settings_backup_restore']
    },
    'História': {
        primaryColor: 'amber-600',
        secondaryColor: 'amber-700',
        accentColor: 'amber-400',
        bgGradient: 'from-amber-600 to-orange-700',
        icon: 'fort',
        description: 'Explorando as raízes e eventos do passado.',
        illustrations: ['temple_hindu', 'public', 'history', 'castle']
    },
    'Geografia': {
        primaryColor: 'cyan-600',
        secondaryColor: 'cyan-700',
        accentColor: 'cyan-400',
        bgGradient: 'from-cyan-600 to-blue-700',
        icon: 'public',
        description: 'O estudo da Terra e sua relação com o homem.',
        illustrations: ['map', 'terrain', 'explore', 'layers']
    },
    'Artes': {
        primaryColor: 'pink-600',
        secondaryColor: 'pink-700',
        accentColor: 'pink-400',
        bgGradient: 'from-pink-600 to-rose-700',
        icon: 'palette',
        description: 'Expressão criativa através das artes visuais.',
        illustrations: ['brush', 'format_paint', 'imagesearch_roller', 'architecture']
    },
    'Projeto de Vida': {
        primaryColor: 'teal-600',
        secondaryColor: 'teal-700',
        accentColor: 'teal-400',
        bgGradient: 'from-teal-600 to-cyan-700',
        icon: 'flag',
        description: 'Planejando seu futuro e seus sonhos.',
        illustrations: ['stairs', 'emoji_objects', 'verified', 'rocket']
    },
    'Literatura': {
        primaryColor: 'rose-600',
        secondaryColor: 'rose-700',
        accentColor: 'rose-400',
        bgGradient: 'from-rose-600 to-red-700',
        icon: 'auto_stories',
        description: 'A arte da palavra e dos grandes clássicos.',
        illustrations: ['history_edu', 'menu_book', 'collections_bookmark', 'library_books']
    },
    'Português': {
        primaryColor: 'sky-600',
        secondaryColor: 'sky-700',
        accentColor: 'sky-400',
        bgGradient: 'from-sky-600 to-blue-700',
        icon: 'school',
        description: 'O domínio da nossa língua materna.',
        illustrations: ['abc', 'font_download', 'spellcheck', 'translate']
    },
    'Redação': {
        primaryColor: 'violet-600',
        secondaryColor: 'violet-700',
        accentColor: 'violet-400',
        bgGradient: 'from-violet-600 to-purple-700',
        icon: 'edit_note',
        description: 'Estruturação do pensamento e escrita.',
        illustrations: ['pen_size_2', 'article', 'description', 'rate_review']
    },
    'Química': {
        primaryColor: 'lime-600',
        secondaryColor: 'lime-700',
        accentColor: 'lime-400',
        bgGradient: 'from-lime-600 to-green-700',
        icon: 'science',
        description: 'A ciência das transformações da matéria.',
        illustrations: ['biotech', 'vaccines', 'medical_services', 'blur_on']
    },
    'Ciências': {
        primaryColor: 'green-600',
        secondaryColor: 'green-700',
        accentColor: 'green-400',
        bgGradient: 'from-green-600 to-emerald-700',
        icon: 'eco',
        description: 'Descobrindo o mundo natural e a vida.',
        illustrations: ['nature', 'microscope', 'dna', 'forest']
    },
    'Inglês': {
        primaryColor: 'indigo-500',
        secondaryColor: 'indigo-600',
        accentColor: 'indigo-300',
        bgGradient: 'from-indigo-500 to-blue-600',
        icon: 'translate',
        description: 'Communication and global connection through English.',
        illustrations: ['public', 'language', 'forum', 'chat']
    },
    'Ensino Religioso': {
        primaryColor: 'amber-500',
        secondaryColor: 'amber-600',
        accentColor: 'amber-300',
        bgGradient: 'from-amber-500 to-yellow-600',
        icon: 'church',
        description: 'Ética, valores e o fenômeno religioso.',
        illustrations: ['favorite', 'volunteer_activism', 'temple_hindu', 'self_improvement']
    }
};

export const useTheme = () => {
    const { currentUser, activeSubject } = useAuth();

    const subject = activeSubject || currentUser?.subject || 'Matemática';
    const config = THEME_MAP[subject as Subject] || THEME_MAP['Matemática'];

    return {
        subject,
        ...config
    };
};
