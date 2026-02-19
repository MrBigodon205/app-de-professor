import React, { useMemo, useEffect, useRef } from 'react';
import { ShaderBackground } from './ShaderBackground'; // Re-import
import { motion } from 'framer-motion';

interface BackgroundPatternProps {
    theme: any;
    activeSubject?: string;
}
// Configuration for "Living Disciplines"
// Configuration for "Living Disciplines"
const getSubjectConfig = (subjectName: string) => {
    // Normalize: Remove accents/diacritics and lowercase
    const s = subjectName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Maths
    if (s.includes('matematica') || s.includes('calculo') || s.includes('algebra') || s.includes('math')) {
        return {
            icon: 'calculate',
            particles: ['function', 'percent', 'show_chart', 'pentagon', 'hexagon', 'shape_line', '∑', '∫', 'π', '∞', '√', '≈', '≠', '∂', '∆'],
            colors: ['#60a5fa', '#67e8f9']
        };
    }
    // Physics
    if (s.includes('fisica') && !s.includes('educacao')) { // Avoid PE conflict
        return {
            icon: 'rocket_launch',
            particles: ['electric_bolt', 'light_mode', 'waves', 'speed', 'balance', 'lens', 'satellite_alt', 'hub', 'Ω', 'λ', 'α', 'β', 'γ', '⚛'],
            colors: ['#a78bfa', '#c084fc']
        };
    }
    // Chemistry
    if (s.includes('quimica')) {
        return {
            icon: 'science',
            particles: ['science', 'biotech', 'experiment', 'vapor_free', 'recycling', 'water_drop', 'propane', 'hub', '⌬', '⏣', '⚗', '🧪', 'bubble_chart', 'filter_drama'],
            colors: ['#a3e635', '#bef264']
        };
    }
    // Biology
    if (s.includes('biologia') || s.includes('ciencia')) {
        return {
            icon: 'biotech',
            particles: ['forest', 'pets', 'cruelty_free', 'nutrition', 'neurology', 'cardiology', 'skeleton', 'ecg_heart', 'pest_control', '🧬', 'microscope', 'coronavirus', 'spa', 'compost'],
            colors: ['#34d399', '#5eead4']
        };
    }
    // History
    if (s.includes('historia')) {
        return {
            icon: 'account_balance',
            particles: ['history_edu', 'museum', 'account_balance', 'temple_buddhist', 'castle', 'swords', 'crown', 'hourglass_top', 'gavel', 'flag', 'church', 'mosque', 'synagogue'],
            colors: ['#d97706', '#eab308']
        };
    }
    // Geography
    if (s.includes('geografia')) {
        return {
            icon: 'public',
            particles: ['public', 'travel_explore', 'landscape', 'volcano', 'tsunami', 'sunny', 'nightlight', 'south_america', 'pin_drop', 'navigation', 'map', 'explore', 'terrain', 'satellite'],
            colors: ['#06b6d4', '#67e8f9']
        };
    }
    // PE
    if (s.includes('educacao fisica') || s.includes('esporte') || s.includes('ed. fisica') || s.includes('treino') || s.includes('movimento') || s.includes('physical')) {
        return {
            icon: 'sports_soccer',
            // PRIORITIZE NEW ICONS AT THE START (Since we only show 8)
            particles: ['sports_martial_arts', 'sports_tennis', 'surfing', 'skateboarding', 'rowing', 'trophy', 'hiking', 'directions_bike', 'pool', 'sports_handball', 'fitness_center', 'sports_basketball', 'sports_baseball', 'sports_golf', 'sports_kabaddi'],
            colors: ['#34d399', '#10b981'] // Green Theme Match
        };
    }
    // Languages/Lit (Port, Lit, Redacao, English, Spanish)
    if (s.includes('portugues') || s.includes('literatura') || s.includes('redacao') || s.includes('ingles') || s.includes('espanhol') || s.includes('linguag')) {
        return {
            icon: 'auto_stories',
            particles: ['auto_stories', 'menu_book', 'history_edu', 'format_quote', 'font_download', 'spellcheck', 'translate', 'text_fields', 'psychology', 'language', 'chat', '¶', 'mic_external_on', 'record_voice_over'],
            colors: ['#fbbf24', '#fdba74']
        };
    }
    // Humanities (Phil, Soc, Rel, Project Life)
    if (s.includes('filosofia') || s.includes('sociologia') || s.includes('human') || s.includes('religioso') || s.includes('projeto')) {
        return {
            icon: 'psychology',
            particles: ['psychology', 'groups', 'forum', 'handshake', 'balance', 'self_improvement', 'lightbulb', 'volunteer_activism', 'star', 'emoji_events', 'stairs', 'diversity_3', 'connect_without_contact'],
            colors: ['#f472b6', '#fbcfe8']
        };
    }
    // Arts
    if (s.includes('arte')) {
        return {
            icon: 'palette',
            particles: ['palette', 'brush', 'piano', 'music_note', 'movie', 'straighten', 'colors', 'draw', 'photo_camera', 'architecture', 'mic', 'theater_comedy', 'contrast', 'looks'],
            colors: ['#f472b6', '#c084fc']
        };
    }
    // Tech
    if (s.includes('tecnologia') || s.includes('robotica') || s.includes('informatica') || s.includes('computacao')) {
        return {
            icon: 'memory',
            particles: ['terminal', 'memory', 'cpu', 'keyboard', 'mouse', 'wifi', 'smart_toy', 'code', 'data_object', 'developer_mode', 'devices', 'router', 'dns', 'settings_ethernet'],
            colors: ['#22d3ee', '#3b82f6']
        };
    }

    // Default
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

    // Generate a denser field of interaction
    const particles = useMemo(() => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const items = [];
        const count = isMobile ? 6 : 15; // Performance: Lower count on mobile

        for (let i = 0; i < count; i++) {
            const token = config.particles[i % config.particles.length];

            // 3D DEPTH SIMULATION (1 = Far, 2 = Mid, 3 = Close)
            const depth = (i % 3) + 1;

            // Position Grid with randomness
            const top = (i * 19 + 7) % 95;
            const left = (i * 23 + 3) % 95;

            // Physics based on Depth
            const duration = isMobile ? (20 + (4 - depth) * 5) : (15 + (4 - depth) * 5);
            const scale = 0.5 + (depth * 0.3);

            // Random floating range
            const floatY = ((i % 2 === 0 ? -1 : 1) * (20 + (depth * 20)));
            const floatX = ((i % 3 === 0 ? 1 : -1) * (10 + (depth * 15)));

            // PERFORMANCE: NO BLUR ON MOBILE (CRITICAL)
            const blur = isMobile ? '0px' : (depth === 1 ? '2px' : (depth === 2 ? '1px' : '0px'));
            const opacity = depth === 1 ? 0.15 : (depth === 2 ? 0.25 : 0.4);

            items.push({
                obj: token,
                top: `${top}%`,
                left: `${left}%`,
                delay: i * (isMobile ? 0.8 : 0.5),
                duration,
                scale,
                floatY: isMobile ? floatY * 0.5 : floatY, // Smaller movements on mobile
                floatX: isMobile ? floatX * 0.5 : floatX,
                blur,
                baseOpacity: isMobile ? opacity * 0.8 : opacity,
                showOnMobile: true
            });
        }
        return items;
    }, [config]);

    // OPTIMIZATION: Global Performance (Disable Shader/Particles everywhere)
    // const isMobile = typeof window !== 'undefined' && window.innerWidth < 768; 
    const isMobile = true; // Force "Mobile" (Lite) mode on all devices

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none transition-colors duration-700" aria-hidden="true">
            {/* WEBGL SHADER BACKGROUND (Disabled Globally for Performance) */}
            {!isMobile ? (
                <ShaderBackground
                    subjectColor1={theme?.primaryColorHex || config.colors[0]}
                    subjectColor2={theme?.secondaryColorHex || config.colors[1]}
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-surface-page via-surface-page/90 to-surface-subtle" />
            )}

            {/* COLOR FOG - Extra vibrancy behind the icons (Disable animation globally) */}
            <div className={`absolute inset-0 opacity-25 dark:opacity-60 pointer-events-none ${isMobile ? 'hidden' : ''}`}>
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 50, 0],
                        y: [0, 30, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[20%] -left-[20%] w-[80%] h-[80%] rounded-full"
                    style={{ background: `radial-gradient(circle, ${theme?.primaryColorHex || config.colors[0]} 0%, transparent 70%)`, filter: 'blur(80px)' }}
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        x: [0, -40, 0],
                        y: [0, -50, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[20%] -right-[20%] w-[80%] h-[80%] rounded-full"
                    style={{ background: `radial-gradient(circle, ${theme?.secondaryColorHex || config.colors[1]} 0%, transparent 70%)`, filter: 'blur(80px)' }}
                />
            </div>

            {/* LIVING DISCIPLINES LAYER (Framer Motion) - Disabled Globally */}
            {activeSubject && !isMobile && (
                <div className="absolute inset-0 z-[2] overflow-hidden perspective-1000">
                    {particles.map((p, idx) => (
                        <motion.div
                            key={`${config.icon}-${idx}`}
                            className={`absolute font-black theme-text-primary dark:text-white flex items-center justify-center drop-shadow-md will-change-transform`}
                            style={{
                                filter: p.blur === '0px' ? 'none' : `blur(${p.blur})`, // Avoid filter if 0px
                            }}
                            initial={{
                                top: p.top,
                                left: p.left,
                                y: 0,
                                x: 0,
                                rotate: 0,
                                scale: p.scale,
                                opacity: 0
                            }}
                            animate={{
                                y: [0, p.floatY, 0], // Larger, depth-based movement
                                x: [0, p.floatX, 0], // Horizontal drift
                                rotate: [0, 10, -10, 0], // Gentle rotation
                                scale: [p.scale, p.scale * 1.1, p.scale], // Breathing scale
                                opacity: [p.baseOpacity, p.baseOpacity * 1.5, p.baseOpacity], // Breathing visibility
                            }}
                            transition={{
                                duration: p.duration,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: p.delay,
                            }}
                        >
                            {/* Use material symbol if it looks like a word, otherwise text */}
                            {p.obj.length > 2 && !p.obj.includes(' ') ? (
                                <span className={`material-symbols-outlined text-5xl`}>
                                    {p.obj}
                                </span>
                            ) : (
                                <span className={`text-5xl font-serif`}>
                                    {p.obj}
                                </span>
                            )}
                        </motion.div>
                    ))}

                    {/* GIANT HERO ICON - Subtle (Keep on PC) */}
                    <div className="absolute -right-[10%] -bottom-[10%] opacity-[0.03] dark:opacity-[0.02] mix-blend-overlay">
                        <span
                            className={`material-symbols-outlined text-[80vh] font-thin rotate-[-15deg]`}
                        >
                            {config.icon}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
});

BackgroundPattern.displayName = 'BackgroundPattern';
