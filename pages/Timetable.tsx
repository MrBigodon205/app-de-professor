import React, { useState, useEffect } from 'react';
import { useClass } from '../contexts/ClassContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { ScheduleItem, DayOfWeek, ClassConfig } from '../types';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to generate time slots (07:00 - 18:00)
// Standard 50min classes + breaks could be complex, let's allow custom slots or fixed standard ones
const TIME_SLOTS = [
    { start: '07:00', end: '07:50' },
    { start: '07:50', end: '08:40' },
    { start: '08:40', end: '09:30' },
    { start: '09:50', end: '10:40' }, // Post-break
    { start: '10:40', end: '11:30' },
    { start: '11:30', end: '12:20' },
    { start: '13:00', end: '13:50' },
    { start: '13:50', end: '14:40' },
    { start: '14:40', end: '15:30' },
    { start: '15:50', end: '16:40' }, // Post-break
    { start: '16:40', end: '17:30' },
];

const DAYS: { id: DayOfWeek, label: string }[] = [
    { id: 1, label: 'Segunda' },
    { id: 2, label: 'Terça' },
    { id: 3, label: 'Quarta' },
    { id: 4, label: 'Quinta' },
    { id: 5, label: 'Sexta' },
];

export const Timetable: React.FC = () => {
    const { classes } = useClass();
    const { currentUser } = useAuth();
    const theme = useTheme();
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState<{ day: DayOfWeek, startTime: string, endTime: string } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (currentUser) {
            fetchSchedule();
        }
    }, [currentUser]);

    const fetchSchedule = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            // [OFFLINE-READY] Eventually this will read from Dexie/WatermelonDB
            // For now, we try Supabase or fallback to mock if table doesn't exist
            const { data, error } = await supabase
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
                    subject: item.subject,
                    className: classes.find(c => c.id === item.class_id)?.name // Enrich display
                })));
            }
        } catch (error) {
            console.warn("Could not fetch schedule - table might not exist yet", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSlotClick = (day: DayOfWeek, start: string, end: string) => {
        setSelectedSlot({ day, startTime: start, endTime: end });
        setIsModalOpen(true);
    };

    const handleAssignClass = async (classId: string) => {
        if (!selectedSlot || !currentUser) return;

        const selectedClass = classes.find(c => c.id === classId);

        // Optimistic update
        const newItem: ScheduleItem = {
            id: Math.random().toString(), // Temp ID
            userId: currentUser.id,
            dayOfWeek: selectedSlot.day,
            startTime: selectedSlot.startTime,
            endTime: selectedSlot.endTime,
            classId,
            className: selectedClass?.name,
            subject: selectedClass?.subject || 'Geral'
        };

        // Remove existing item in this slot if any
        const filtered = schedule.filter(s =>
            !(s.dayOfWeek === selectedSlot.day && s.startTime === selectedSlot.startTime)
        );

        setSchedule([...filtered, newItem]);
        setIsModalOpen(false);

        // Persist
        try {
            const { error } = await supabase.from('schedules').upsert({
                user_id: currentUser.id,
                day_of_week: newItem.dayOfWeek,
                start_time: newItem.startTime,
                end_time: newItem.endTime,
                class_id: newItem.classId,
                subject: newItem.subject
            }, { onConflict: 'user_id, day_of_week, start_time' });

            if (error) throw error;
        } catch (e) {
            console.error("Failed to save schedule", e);
            // Revert or show error
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

    const getSlotItem = (day: DayOfWeek, start: string) => {
        return schedule.find(s => s.dayOfWeek === day && s.startTime === start);
    };

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
                </div>
            </div>

            {/* Timetable Grid */}
            <div className="overflow-x-auto pb-4 custom-scrollbar">
                <div className="min-w-[1000px] bg-white dark:bg-slate-900 rounded-[32px] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-6">

                    {/* Header Row */}
                    <div className="grid grid-cols-6 gap-4 mb-4">
                        <div className="flex items-center justify-center p-4">
                            <span className="text-slate-400 font-black uppercase text-xs tracking-widest">Horário</span>
                        </div>
                        {DAYS.map(day => (
                            <div key={day.id} className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                <span className={`text-${theme.primaryColor} font-black uppercase text-sm tracking-widest`}>{day.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Time Rows */}
                    <div className="space-y-3">
                        {TIME_SLOTS.map((slot, index) => (
                            <div key={index} className="grid grid-cols-6 gap-3 group">
                                {/* Time Column */}
                                <div className="flex items-center justify-center p-3 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/50">
                                    <div className="flex flex-col items-center">
                                        <span className="text-slate-700 dark:text-slate-300 font-bold text-sm font-mono">{slot.start}</span>
                                        <span className="text-slate-400 text-[10px] font-medium">{slot.end}</span>
                                    </div>
                                </div>

                                {/* Days Columns */}
                                {DAYS.map(day => {
                                    const item = getSlotItem(day.id, slot.start);
                                    const assignedClass = classes.find(c => c.id === item?.classId);

                                    return (
                                        <motion.button
                                            key={`${day.id}-${slot.start}`}
                                            whileHover={{ scale: 0.98 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleSlotClick(day.id, slot.start, slot.end)}
                                            className={`relative h-20 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 p-2
                                                ${item
                                                    ? `bg-${theme.primaryColor}/10 border-${theme.primaryColor}/20`
                                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-lg'
                                                }
                                            `}
                                        >
                                            {item ? (
                                                <>
                                                    <span className={`text-${theme.primaryColor} font-black text-lg`}>
                                                        {assignedClass?.name || 'Aula'}
                                                    </span>
                                                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                                                        {assignedClass?.sections[0]} • {item.subject.slice(0, 3)}
                                                    </span>
                                                    <div className={`absolute top-2 right-2 size-2 rounded-full bg-${theme.primaryColor} shadow-lg shadow-${theme.primaryColor}/50`}></div>
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
                                        {DAYS.find(d => d.id === selectedSlot?.day)?.label}, {selectedSlot?.startTime}
                                    </p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-md transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="p-6 max-h-[60vh] overflow-y-auto">
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

                                    {/* Class List */}
                                    {classes.map(cls => (
                                        <button
                                            key={cls.id}
                                            onClick={() => handleAssignClass(cls.id)}
                                            className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:shadow-lg transition-all group"
                                        >
                                            <div className={`size-12 rounded-xl bg-${theme.primaryColor}/10 text-${theme.primaryColor} flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform`}>
                                                {cls.name.charAt(0)}
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <span className="font-black text-slate-700 dark:text-white text-lg">{cls.name}</span>
                                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                                    {cls.sections.length} Turmas • {cls.subject || 'Geral'}
                                                </span>
                                            </div>
                                            <span className="material-symbols-outlined ml-auto text-slate-300 group-hover:text-slate-400">chevron_right</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
