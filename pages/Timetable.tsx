import React, { useState, useEffect } from 'react';
import { useClass } from '../contexts/ClassContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { ScheduleItem, DayOfWeek, ClassConfig, SUBJECTS } from '../types';

import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to generate time slots (07:00 - 18:00)
const DEFAULT_TIME_SLOTS = [
    { start: '07:00', end: '07:50' },
    { start: '07:50', end: '08:40' },
    { start: '08:40', end: '09:30' },
    { start: '09:50', end: '10:40' },
    { start: '10:40', end: '11:30' },
    { start: '11:30', end: '12:20' },
];

const DEFAULT_DAYS: { id: DayOfWeek, label: string, enabled: boolean }[] = [
    { id: 1, label: 'Segunda', enabled: true },
    { id: 2, label: 'Terça', enabled: true },
    { id: 3, label: 'Quarta', enabled: true },
    { id: 4, label: 'Quinta', enabled: true },
    { id: 5, label: 'Sexta', enabled: true },
    { id: 6, label: 'Sábado', enabled: false },
    { id: 0, label: 'Domingo', enabled: false },
];

export const Timetable: React.FC = () => {
    const { classes } = useClass();
    const { currentUser, activeSubject } = useAuth();
    const theme = useTheme();
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState<{ day: DayOfWeek, startTime: string, endTime: string } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [overrideSubject, setOverrideSubject] = useState<string>('');

    // Prevent background scroll when modal is open
    useEffect(() => {
        if (isConfigModalOpen || isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isConfigModalOpen, isModalOpen]);

    // Configuration State
    const [config, setConfig] = useState<{
        days: typeof DEFAULT_DAYS,
        slots: typeof DEFAULT_TIME_SLOTS
    }>({
        days: DEFAULT_DAYS,
        slots: DEFAULT_TIME_SLOTS
    });

    // Load Config
    useEffect(() => {
        if (currentUser) {
            const savedConfig = localStorage.getItem(`timetable_config_${currentUser.id}`);
            if (savedConfig) {
                try {
                    setConfig(JSON.parse(savedConfig));
                } catch (e) {
                    console.error("Failed to parse timetable config", e);
                }
            }
            fetchSchedule();
        }
    }, [currentUser]);

    // Save Config
    const saveConfig = (newConfig: typeof config) => {
        setConfig(newConfig);
        if (currentUser) {
            localStorage.setItem(`timetable_config_${currentUser.id}`, JSON.stringify(newConfig));
        }
    };

    const fetchSchedule = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const { data } = await supabase
                .from('schedules')
                .select('*')
                .eq('user_id', currentUser.id);

            if (data) {
                setSchedule(data.map(item => ({
                    id: item.id,
                    userId: item.user_id,
                    dayOfWeek: item.day_of_week,
                    startTime: item.start_time,
                    endTime: item.end_time,
                    classId: item.class_id,
                    section: item.section,
                    subject: item.subject,
                    className: classes.find(c => c.id === item.class_id)?.name
                })));
            }
        } catch (error) {
            console.warn("Could not fetch schedule", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSlotClick = (day: DayOfWeek, start: string, end: string) => {
        setSelectedSlot({ day, startTime: start, endTime: end });
        setOverrideSubject(''); // Reset override to allow class default
        setIsModalOpen(true);
    };

    const handleAssignClass = async (classId: string, section: string) => {
        if (!selectedSlot || !currentUser) return;

        const selectedClass = classes.find(c => c.id === classId);

        const newItem: ScheduleItem = {
            id: Math.random().toString(),
            userId: currentUser.id,
            dayOfWeek: selectedSlot.day,
            startTime: selectedSlot.startTime,
            endTime: selectedSlot.endTime,
            classId,
            section,
            className: selectedClass?.name,
            // Priority: Manual -> Active Context -> Class Default -> Profile Default -> 'Geral'
            subject: overrideSubject || activeSubject || selectedClass?.subject || currentUser?.subject || 'Geral'
        };

        const filtered = schedule.filter(s =>
            !(s.dayOfWeek === selectedSlot.day && s.startTime === selectedSlot.startTime)
        );

        setSchedule([...filtered, newItem]);
        setIsModalOpen(false);

        try {
            const { error } = await supabase.from('schedules').upsert({
                user_id: currentUser.id,
                day_of_week: newItem.dayOfWeek,
                start_time: newItem.startTime,
                end_time: newItem.endTime,
                class_id: newItem.classId,
                section: newItem.section,
                subject: newItem.subject
            }, { onConflict: 'user_id, day_of_week, start_time' });

            if (error) throw error;
        } catch (e) {
            console.error("Failed to save schedule", e);
        }
    };

    const handleRemoveItem = async () => {
        if (!selectedSlot || !currentUser) return;

        setSchedule(prev => prev.filter(s =>
            !(s.dayOfWeek === selectedSlot.day && s.startTime === selectedSlot.startTime)
        ));
        setIsModalOpen(false);

        try {
            await supabase.from('schedules').delete().match({
                user_id: currentUser.id,
                day_of_week: selectedSlot.day,
                start_time: selectedSlot.startTime
            });
        } catch (e) {
            console.error("Failed to remove item", e);
        }
    };

    // --- COLOR HELPERS ---
    const getSubjectTheme = (subject: string): { bg: string, text: string, border: string, dot: string } => {
        // Map subjects to colors logic (consistent with ThemeContext)
        const normalize = (s: string) => s?.toLowerCase() || '';
        let color = 'indigo'; // Default

        if (['matemática', 'física', 'química'].some(k => normalize(subject).includes(k))) color = 'indigo';
        else if (['português', 'literatura', 'redação', 'inglês', 'espanhol'].some(k => normalize(subject).includes(k))) color = 'rose';
        else if (['história', 'geografia', 'filosofia', 'sociologia', 'ensino religioso'].some(k => normalize(subject).includes(k))) color = 'amber';
        else if (['biologia', 'ciências'].some(k => normalize(subject).includes(k))) color = 'emerald';
        else if (['artes', 'educação física', 'projeto de vida'].some(k => normalize(subject).includes(k))) color = 'violet';

        return {
            bg: `bg-${color}-500/10 dark:bg-${color}-500/20`,
            text: `text-${color}-600 dark:text-${color}-400`,
            border: `border-${color}-200 dark:border-${color}-500/30`,
            dot: `bg-${color}-500`
        };
    };

    const getSlotItem = (day: DayOfWeek, start: string) => {
        return schedule.find(s => s.dayOfWeek === day && s.startTime === start);
    };

    // --- CONFIG HANDLERS ---
    const toggleDay = (dayId: DayOfWeek) => {
        const newDays = config.days.map(d => d.id === dayId ? { ...d, enabled: !d.enabled } : d);
        saveConfig({ ...config, days: newDays });
    };

    const updateSlot = (index: number, field: 'start' | 'end', value: string) => {
        const newSlots = [...config.slots];
        newSlots[index] = { ...newSlots[index], [field]: value };
        saveConfig({ ...config, slots: newSlots });
    };

    const addSlot = () => {
        // Logic to add a slot after the last one
        const lastSlot = config.slots[config.slots.length - 1];
        let newStart = "12:00";
        let newEnd = "12:50";

        if (lastSlot) {
            // Simple heuristic: add 1 hour to last start
            const [h, m] = lastSlot.start.split(':').map(Number);
            const nextH = (h + 1) % 24;
            newStart = `${String(nextH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            const [eh, em] = lastSlot.end.split(':').map(Number);
            const nextEH = (eh + 1) % 24;
            newEnd = `${String(nextEH).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
        }

        saveConfig({ ...config, slots: [...config.slots, { start: newStart, end: newEnd }] });
    };

    const removeSlot = (index: number) => {
        const newSlots = config.slots.filter((_, i) => i !== index);
        saveConfig({ ...config, slots: newSlots });
    };

    const visibleDays = config.days.filter(d => d.enabled);

    return (
        <div className="max-w-[1400px] mx-auto flex flex-col gap-8 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <nav className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                    <span className={`hover:text-${theme.primaryColor} cursor-pointer`}>Acerta+</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                    <span className={`text-${theme.primaryColor}`}>Meu Horário</span>
                </nav>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Grade Horária</h1>
                        <p className="text-slate-400 font-medium">Configure sua rotina para ativar a **Sincronização Preditiva**.</p>
                    </div>
                    <button
                        onClick={() => setIsConfigModalOpen(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-${theme.primaryColor}/10 hover:text-${theme.primaryColor} transition-all`}
                    >
                        <span className="material-symbols-outlined">settings</span>
                        <span className="hidden sm:inline">Configurar</span>
                    </button>
                </div>
            </div>

            {/* Timetable Content - Responsive Split */}
            <div className="flex-1 min-h-0 relative">

                {/* A. MOBILE LIST VIEW (Visible < md) */}
                <div className="md:hidden flex flex-col gap-6">
                    {visibleDays.map(day => (
                        <div key={day.id} className="space-y-3">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white sticky top-0 bg-surface-page/95 backdrop-blur-sm py-2 z-10 flex items-center gap-2">
                                <span className={`size-2 rounded-full bg-${theme.primaryColor}`}></span>
                                {day.label}
                            </h3>
                            <div className="grid gap-3">
                                {config.slots.map((slot, index) => {
                                    const item = getSlotItem(day.id, slot.start);
                                    const assignedClass = classes.find(c => c.id === item?.classId);
                                    const styles = item ? getSubjectTheme(item.subject) : null;

                                    return (
                                        <div key={`${day.id}-${slot.start}`} className="flex gap-3 relative">
                                            {/* Time Column */}
                                            <div className="flex flex-col items-center justify-center w-16 shrink-0 pt-2">
                                                <span className="text-slate-900 dark:text-white font-black text-sm">{slot.start}</span>
                                                <span className="text-slate-400 text-[10px] font-bold">{slot.end}</span>
                                            </div>

                                            {/* Card */}
                                            <motion.button
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleSlotClick(day.id, slot.start, slot.end)}
                                                className={`flex-1 rounded-2xl border p-4 text-left transition-all relative overflow-hidden min-h-[80px] flex items-center
                                                    ${item
                                                        ? `${styles?.bg} ${styles?.border}`
                                                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                                                    }
                                                `}
                                            >
                                                {item ? (
                                                    <div className="flex flex-col gap-1 relative z-10 w-full">
                                                        <div className="flex justify-between items-start">
                                                            <span className={`${styles?.text} font-black text-lg leading-none`}>
                                                                {assignedClass?.name || 'Aula'}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/50 dark:bg-black/20 ${styles?.text}`}>
                                                                {item.section}
                                                            </span>
                                                        </div>
                                                        <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wide">
                                                            {item.subject}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-slate-300 dark:text-slate-700 font-bold text-sm uppercase tracking-wider w-full">
                                                        <span className="material-symbols-outlined text-xl">add_circle</span>
                                                        <span>Livre</span>
                                                    </div>
                                                )}

                                                {/* Decorative Dot/Line */}
                                                {item && <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${styles?.dot}`}></div>}
                                            </motion.button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* B. DESKTOP GRID VIEW (Hidden < md) */}
                <div className="hidden md:block overflow-x-auto pb-4 custom-scrollbar">
                    <div className="min-w-[800px] bg-white dark:bg-slate-900 rounded-[24px] shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-4">

                        {/* Header Row */}
                        <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: `80px repeat(${visibleDays.length}, 1fr)` }}>
                            <div className="flex items-center justify-center p-4">
                                <span className="text-slate-400 font-black uppercase text-xs tracking-widest">Horário</span>
                            </div>
                            {visibleDays.map(day => (
                                <div key={day.id} className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                    <span className={`text-${theme.primaryColor} font-black uppercase text-sm tracking-widest`}>{day.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Time Rows */}
                        <div className="space-y-3">
                            {config.slots.map((slot, index) => (
                                <div key={index} className="grid gap-3 group" style={{ gridTemplateColumns: `80px repeat(${visibleDays.length}, 1fr)` }}>
                                    {/* Time Column */}
                                    <div className="flex items-center justify-center p-3 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/50">
                                        <div className="flex flex-col items-center">
                                            <span className="text-slate-700 dark:text-slate-300 font-bold text-sm font-mono">{slot.start}</span>
                                            <span className="text-slate-400 text-[10px] font-medium">{slot.end}</span>
                                        </div>
                                    </div>

                                    {/* Days Columns */}
                                    {visibleDays.map(day => {
                                        const item = getSlotItem(day.id, slot.start);
                                        const assignedClass = classes.find(c => c.id === item?.classId);
                                        const styles = item ? getSubjectTheme(item.subject) : null;

                                        return (
                                            <motion.button
                                                key={`${day.id}-${slot.start}`}
                                                whileHover={{ scale: 0.98 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleSlotClick(day.id, slot.start, slot.end)}
                                                className={`relative h-16 rounded-xl border transition-all flex flex-col items-center justify-center gap-0.5 p-1
                                                    ${item
                                                        ? `${styles?.bg} ${styles?.border}`
                                                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md'
                                                    }
                                                `}
                                            >
                                                {item ? (
                                                    <>
                                                        <span className={`${styles?.text} font-black text-xs md:text-sm text-center leading-tight truncate w-full`}>
                                                            {assignedClass?.name || 'Aula'}
                                                        </span>
                                                        <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">
                                                            {item.section} • {item.subject.slice(0, 3)}
                                                        </span>
                                                        <div className={`absolute top-1 right-1 size-1.5 rounded-full ${styles?.dot}`}></div>
                                                    </>
                                                ) : (
                                                    <span className="material-symbols-outlined text-slate-200 dark:text-slate-800 group-hover:text-slate-300 transition-colors">add</span>
                                                )}
                                            </motion.button>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </div>

            {/* Selection Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden"
                        >
                            <div className={`h-32 bg-gradient-to-br ${theme.bgGradient} p-8 relative flex items-center justify-between`}>
                                <div className="text-white">
                                    <h3 className="text-2xl font-black">Selecionar Turma</h3>
                                    <p className="opacity-80 font-medium">
                                        {config.days.find(d => d.id === selectedSlot?.day)?.label}, {selectedSlot?.startTime} - {selectedSlot?.endTime}
                                    </p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-md transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>


                            <div className="p-6 max-h-[60vh] overflow-y-auto">
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Disciplina da Aula</label>
                                    <select
                                        value={overrideSubject}
                                        onChange={(e) => setOverrideSubject(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-700 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    >
                                        <option value="">Automático (Padrão)</option>
                                        {SUBJECTS.map(subject => (
                                            <option key={subject} value={subject}>{subject}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {/* Empty State option */}
                                    <button
                                        onClick={handleRemoveItem}
                                        className="flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-rose-200 hover:bg-rose-50 hover:border-rose-300 transition-all group"
                                    >
                                        <div className="size-10 rounded-xl bg-rose-100 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined">delete</span>
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="font-black text-rose-500">Remover Aula</span>
                                            <span className="text-xs text-rose-400 font-medium">Deixar horário livre</span>
                                        </div>
                                    </button>

                                    {/* Class List with Sections */}
                                    {classes.map(cls => (
                                        <div key={cls.id} className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-700 dark:text-white text-base">{cls.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                        {overrideSubject || activeSubject || cls.subject || currentUser?.subject || 'Geral'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {cls.sections.map(section => (
                                                    <button
                                                        key={`${cls.id}-${section}`}
                                                        onClick={() => handleAssignClass(cls.id, section)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                                                            bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-${theme.primaryColor} hover:text-${theme.primaryColor} hover:shadow-sm`}
                                                    >
                                                        Turma {section}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Config Modal */}
            <AnimatePresence>
                {isConfigModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto py-10">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-slate-400">tune</span>
                                    Configurar Grade
                                </h3>
                                <button onClick={() => setIsConfigModalOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
                                {/* Days Section */}
                                <div>
                                    <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Dias Visíveis</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {config.days.map(day => (
                                            <button
                                                key={day.id}
                                                onClick={() => toggleDay(day.id)}
                                                className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${day.enabled
                                                    ? `bg-${theme.primaryColor}/10 border-${theme.primaryColor} text-${theme.primaryColor}`
                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300'
                                                    }`}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Timer Slots Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">Horários de Aula</h4>
                                        <button
                                            onClick={addSlot}
                                            className={`text-xs font-bold text-${theme.primaryColor} flex items-center gap-1 hover:underline`}
                                        >
                                            <span className="material-symbols-outlined text-sm">add</span> Adicionar Aula
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {config.slots.map((slot, index) => (
                                            <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group">
                                                <span className="text-xs font-bold text-slate-400 w-6">{index + 1}º</span>
                                                <input
                                                    type="time"
                                                    value={slot.start}
                                                    onChange={(e) => updateSlot(index, 'start', e.target.value)}
                                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                />
                                                <span className="text-slate-300">-</span>
                                                <input
                                                    type="time"
                                                    value={slot.end}
                                                    onChange={(e) => updateSlot(index, 'end', e.target.value)}
                                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                />
                                                <button
                                                    onClick={() => removeSlot(index)}
                                                    className="ml-auto p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                <button
                                    onClick={() => setIsConfigModalOpen(false)}
                                    className="w-full py-4 rounded-2xl text-white font-bold transition-all hover:brightness-110 active:scale-[0.98] shadow-lg text-lg"
                                    style={{ backgroundColor: theme.primaryColorHex, boxShadow: `0 10px 15px -3px ${theme.primaryColorHex}40` }}
                                >
                                    Concluir e Salvar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
