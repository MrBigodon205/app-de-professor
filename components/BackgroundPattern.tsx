import React, { useMemo } from 'react';
import { ShaderBackground } from './ShaderBackground';
import { motion } from 'framer-motion';

interface BackgroundPatternProps {
    theme: any;
    activeSubject?: string;
}

const getSubjectConfig = (subjectName: string) => {
    const s = subjectName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (s.includes('matematica') || s.includes('calculo') || s.includes('algebra') || s.includes('math')) {
        return {
            icon: 'calculate',
            particles: ['function', 'percent', 'show_chart', 'pentagon', 'hexagon', 'shape_line', '∑', '∫', 'π', '∞', '√', '≈', '≠', '∂', '∆'],
            colors: ['#60a5fa', '#67e8f9']
        };
    }
    if (s.includes('fisica') && !s.includes('educacao')) {
        return {
            icon: 'rocket_launch',
            particles: ['electric_bolt', 'light_mode', 'waves', 'speed', 'balance', 'lens', 'satellite_alt', 'hub', 'Ω', 'λ', 'α', 'β', 'γ', '⚛'],
            colors: ['#a78bfa', '#c084fc']
        };
    }
    if (s.includes('quimica')) {
        return {
            icon: 'science',
            particles: ['science', 'biotech', 'experiment', 'vapor_free', 'recycling', 'water_drop', 'propane', 'hub', '⌬', '⏣', '⚗', '🧪', 'bubble_chart', 'filter_drama'],
            colors: ['#a3e635', '#bef264']
        };
    }
    if (s.includes('biologia') || s.includes('ciencia')) {
        return {
            icon: 'biotech',
            particles: ['forest', 'pets', 'cruelty_free', 'nutrition', 'neurology', 'cardiology', 'skeleton', 'ecg_heart', 'pest_control', '🧬', 'microscope', 'coronavirus', 'spa', 'compost'],
            colors: ['#34d399', '#5eead4']
        };
    }
    if (s.includes('historia')) {
        return {
            icon: 'account_balance',
            particles: ['history_edu', 'museum', 'account_balance', 'temple_buddhist', 'castle', 'swords', 'crown', 'hourglass_top', 'gavel', 'flag', 'church', 'mosque', 'synagogue'],
            colors: ['#d97706', '#eab308']
        };
    }
    if (s.includes('geografia')) {
        return {
            icon: 'public',
            particles: ['public', 'travel_explore', 'landscape', 'volcano', 'tsunami', 'sunny', 'nightlight', 'south_america', 'pin_drop', 'navigation', 'map', 'explore', 'terrain', 'satellite'],
            colors: ['#06b6d4', '#67e8f9']
        };
    }
    if (s.includes('educacao fisica') || s.includes('esporte') || s.includes('ed. fisica') || s.includes('treino')) {
        return {
            icon: 'sports_soccer',
            particles: ['sports_martial_arts', 'sports_tennis', 'surfing', 'skateboarding', 'rowing', 'trophy', 'hiking', 'directions_bike', 'pool', 'sports_handball', 'fitness_center', 'sports_basketball', 'sports_baseball', 'sports_golf', 'sports_kabaddi'],
            colors: ['#34d399', '#10b981']
        };
    }
    if (s.includes('portugues') || s.includes('literatura') || s.includes('redacao') || s.includes('ingles') || s.includes('espanhol')) {
        return {
            icon: 'auto_stories',
            particles: ['auto_stories', 'menu_book', 'history_edu', 'format_quote', 'font_download', 'spellcheck', 'translate', 'text_fields', 'psychology', 'language', 'chat', '¶', 'mic_external_on', 'record_voice_over'],
            colors: ['#fbbf24', '#fdba74']
        };
    }
    if (s.includes('filosofia') || s.includes('sociologia') || s.includes('human') || s.includes('religioso')) {
        return {
            icon: 'psychology',
            particles: ['psychology', 'groups', 'forum', 'handshake', 'balance', 'self_improvement', 'lightbulb', 'volunteer_activism', 'star', 'emoji_events', 'stairs', 'diversity_3', 'connect_without_contact'],
            colors: ['#f472b6', '#fbcfe8']
        };
    }
    if (s.includes('arte')) {
        return {
            icon: 'palette',
            particles: ['palette', 'brush', 'piano', 'music_note', 'movie', 'straighten', 'colors', 'draw', 'photo_camera', 'architecture', 'mic', 'theater_comedy', 'contrast', 'looks'],
            colors: ['#f472b6', '#c084fc']
        };
    }

    return {
        icon: 'school',
        particles: ['school', 'auto_stories', 'edit', 'lightbulb', 'star', 'notifications', 'event', 'schedule'],
        colors: ['#9ca3af', '#cbd5e1']
    };
};

export const BackgroundPattern: React.FC<BackgroundPatternProps> = React.memo(({
    theme,
    activeSubject
}) => {
    const config = useMemo(() => getSubjectConfig(activeSubject || ''), [activeSubject]);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    const particles = useMemo(() => {
        const items = [];
        const count = isMobile ? 4 : 10; // Extra Performance: Even fewer particles

        for (let i = 0; i < count; i++) {
            const token = config.particles[i % config.particles.length];
            const depth = (i % 3) + 1;
            const top = (i * 19 + 7) % 95;
            const left = (i * 23 + 3) % 95;
            const duration = 20 + (4 - depth) * 5;
            const scale = 0.5 + (depth * 0.3);
            const floatY = (i % 2 === 0 ? -1 : 1) * (15 + (depth * 10));
            const floatX = (i % 3 === 0 ? 1 : -1) * (10 + (depth * 5));
            const opacity = isMobile ? 0.1 : (depth === 1 ? 0.1 : (depth === 2 ? 0.15 : 0.25));

            items.push({
                obj: token,
                top: `${top}%`,
                left: `${left}%`,
                delay: i * 0.5,
                duration,
                scale,
                floatY,
                floatX,
                opacity
            });
        }
        return items;
    }, [config, isMobile]);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none" aria-hidden="true">
            {!isMobile && (
                <ShaderBackground
                    subjectColor1={theme?.primaryColorHex || config.colors[0]}
                    subjectColor2={theme?.secondaryColorHex || config.colors[1]}
                />
            )}

            {isMobile && (
                <div className="absolute inset-0 bg-gradient-to-br from-surface-page via-surface-page/90 to-surface-subtle" />
            )}

            {activeSubject && !isMobile && (
                <div className="absolute inset-0 z-[2] overflow-hidden">
                    {particles.map((p, idx) => (
                        <motion.div
                            key={`${config.icon}-${idx}`}
                            className="absolute font-black theme-text-primary dark:text-white flex items-center justify-center will-change-transform"
                            initial={{ top: p.top, left: p.left, y: 0, x: 0, rotate: 0, scale: p.scale, opacity: 0 }}
                            animate={{
                                y: [0, p.floatY, 0],
                                x: [0, p.floatX, 0],
                                rotate: [0, 5, -5, 0],
                                scale: [p.scale, p.scale * 1.05, p.scale],
                                opacity: [p.opacity, p.opacity * 1.5, p.opacity],
                            }}
                            transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
                        >
                            {p.obj.length > 2 && !p.obj.includes(' ') ? (
                                <span className="material-symbols-outlined text-4xl">{p.obj}</span>
                            ) : (
                                <span className="text-4xl font-serif">{p.obj}</span>
                            )}
                        </motion.div>
                    ))}

                    <div className="absolute -right-[5%] -bottom-[5%] opacity-[0.02] mix-blend-overlay">
                        <span className="material-symbols-outlined text-[70vh] font-thin rotate-[-10deg]">
                            {config.icon}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
});

BackgroundPattern.displayName = 'BackgroundPattern';
