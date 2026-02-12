import React, { useMemo } from 'react';

interface BackgroundPatternProps {
    theme: any;
    activeSubject?: string;
}

// Configuration for "Living Disciplines"
const getSubjectConfig = (subjectName: string) => {
    // Normalize: Remove accents/diacritics and lowercase
    const s = subjectName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Maths
    if (s.includes('matematica') || s.includes('calculo') || s.includes('algebra') || s.includes('math')) {
        return {
            icon: 'calculate',
            particles: ['+', '-', '×', '÷', '=', 'π', '∑', '∫'],
            gradient: 'from-blue-400 to-cyan-300'
        };
    }
    // PE (Moved UP to prioritize over Physics/Science if overlapping terms existed, though 'fisica' vs 'educacao fisica' is distinct enough if handled carefully)
    if (s.includes('educacao fisica') || s.includes('esporte') || s.includes('ed. fisica') || s.includes('treino') || s.includes('movimento') || s.includes('physical')) {
        return {
            icon: 'sports_soccer',
            particles: ['sports_soccer', 'sports_basketball', 'sports_volleyball', 'timer', 'fitness_center', 'directions_run', 'pool'],
            gradient: 'from-orange-500 to-red-400'
        };
    }

    // Science (Re-eval after PE to avoid "Fisica" conflict if any)
    if (s.includes('ciencia') || s.includes('biologia') || s.includes('fisica') || s.includes('quimica') || s.includes('science')) {
        return {
            icon: 'science',
            particles: ['O₂', 'H₂O', '⚛', '⚡', '🧪', '🧬', '🔭'],
            gradient: 'from-emerald-400 to-teal-300'
        };
    }

    // Languages/Lit
    if (s.includes('portugues') || s.includes('literatura') || s.includes('redacao') || s.includes('ingles') || s.includes('espanhol') || s.includes('linguag')) {
        return {
            icon: 'auto_stories',
            particles: ['Aa', '¶', '?', '!', '"', 'abc', '✎'],
            gradient: 'from-amber-400 to-orange-300'
        };
    }
    // History/Geo/Soc/Phil
    if (s.includes('historia') || s.includes('geografia') || s.includes('filosofia') || s.includes('sociologia') || s.includes('human')) {
        return {
            icon: 'public',
            particles: ['museum', 'globe', 'balance', 'theater_comedy', 'history_edu', 'lightbulb', 'N', 'S'],
            gradient: 'from-amber-600 to-yellow-500'
        };
    }
    // Arts
    if (s.includes('arte')) {
        return {
            icon: 'palette',
            particles: ['brush', 'palette', 'image', 'colors', 'music_note', 'piano', 'mic', '★'],
            gradient: 'from-pink-400 to-purple-400'
        };
    }
    // Tech
    if (s.includes('tecnologia') || s.includes('robotica') || s.includes('informatica') || s.includes('computacao')) {
        return {
            icon: 'memory',
            particles: ['memory', 'code', 'terminal', 'mouse', 'keyboard', 'wifi', 'cpu', 'smart_toy'],
            gradient: 'from-cyan-400 to-blue-500'
        };
    }

    // Default
    return {
        icon: 'school',
        particles: ['school', 'auto_stories', 'edit', 'lightbulb', 'star', 'notifications', 'event'],
        gradient: 'from-gray-400 to-slate-300'
    };
};

export const BackgroundPattern: React.FC<BackgroundPatternProps> = React.memo(({
    theme,
    activeSubject
}) => {

    const config = useMemo(() => getSubjectConfig(activeSubject || ''), [activeSubject]);

    // Generate a denser field of interaction
    const particles = useMemo(() => {
        const items = [];
        const count = 18; // More icons for a "wallpaper" feel

        for (let i = 0; i < count; i++) {
            // Cycle through available particles/icons
            const token = config.particles[i % config.particles.length];
            // Randomize positions with a grid-like distribution to avoid clustering
            // We use 'i' to deterministicly place them to avoid hydration mismatches if we were using random()
            // But for client-side only, simple math is fine.
            const top = (i * 19 + 7) % 95;
            const left = (i * 23 + 3) % 95;
            const delay = i * 0.8;
            const duration = 15 + (i % 5) * 2;
            const size = (i % 3 === 0) ? 'text-4xl' : (i % 2 === 0 ? 'text-3xl' : 'text-xl'); // Varied sizes
            const opacity = (i % 3 === 0) ? 'opacity-10' : 'opacity-5'; // Varied opacity

            items.push({ obj: token, top: `${top}%`, left: `${left}%`, delay: `${delay}s`, duration: `${duration}s`, size, opacity });
        }
        return items;
    }, [config]);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none bg-surface-page transition-colors duration-700" aria-hidden="true">
            {/* NOISE TEXTURE */}
            <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay z-[1] bg-noise"
            />

            {/* LIVING DISCIPLINES LAYER */}
            {activeSubject && (
                <div className="absolute inset-0 z-[2] overflow-hidden">

                    {/* FLOATING PARTICLES - background wallpaper style */}
                    {particles.map((p, idx) => (
                        <div
                            key={`${config.icon}-${idx}`}
                            className={`absolute font-black text-text-primary dark:text-white animate-float-random select-none flex items-center justify-center will-change-transform ${p.opacity}`}
                            // eslint-disable-next-line
                            style={{
                                top: p.top,
                                left: p.left,
                                animationDelay: p.delay,
                                animationDuration: p.duration,
                            }}
                        >
                            {/* Use material symbol if it looks like a word, otherwise text */}
                            {p.obj.length > 2 && !p.obj.includes(' ') ? (
                                <span className={`material-symbols-outlined ${p.size}`}>
                                    {p.obj}
                                </span>
                            ) : (
                                <span className={`${p.size} font-serif transform rotate-12`}>
                                    {p.obj}
                                </span>
                            )}
                        </div>
                    ))}

                    {/* GIANT HERO ICON - Kept but made much more subtle and blended */}
                    <div className="absolute -right-[10%] -bottom-[10%] opacity-[0.03] dark:opacity-[0.02] mix-blend-overlay">
                        <span
                            className={`material-symbols-outlined text-[80vh] font-thin rotate-[-15deg]`}
                        >
                            {config.icon}
                        </span>
                    </div>
                </div>
            )}


            {/* ETHEREAL MESH GRADIENT LAYERS */}
            <div
                className={`absolute -top-[10%] -right-[10%] w-[80vw] h-[80vw] md:w-[50vw] md:h-[50vw] rounded-full bg-${theme.primaryColor}/20 dark:bg-${theme.primaryColor}/10 blur-[80px] md:blur-[120px] animate-mesh-flow will-change-transform opacity-60 mix-blend-multiply dark:mix-blend-screen`}
            />
            <div
                className={`absolute -bottom-[10%] -left-[10%] w-[80vw] h-[80vw] md:w-[50vw] md:h-[50vw] rounded-full bg-${theme.secondaryColor}/20 dark:bg-${theme.secondaryColor}/10 blur-[80px] md:blur-[120px] animate-mesh-flow animation-delay-4000 will-change-transform opacity-60 mix-blend-multiply dark:mix-blend-screen`}
            />
            <div
                className={`absolute top-[40%] left-[40%] w-[60vw] h-[60vw] md:w-[40vw] md:h-[40vw] rounded-full bg-indigo-300/10 dark:bg-indigo-500/5 blur-[100px] animate-mesh-flow animation-delay-2000 will-change-transform opacity-40 mix-blend-multiply dark:mix-blend-screen`}
            />
        </div>
    );
});

BackgroundPattern.displayName = 'BackgroundPattern';
