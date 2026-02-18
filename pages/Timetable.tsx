import React, { useState, useEffect, useCallback } from 'react';
import { useThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import { supabase } from '../lib/supabase'; // Import Supabase Client
import { motion, AnimatePresence } from 'framer-motion';
import { THEME_MAP } from '../utils/themeMap'; // Import Global Theme Map

// --- Types & Constants & Mappers ---
interface TimeSlot {
    id: string;
    start: string;
    end: string;
}

interface TimetableItem {
    id?: string; // Database ID (optional for optimistic add)
    dayId: string;
    slotId: string;
    classId: string;
    subject: string;
    section: string;
    startTime: string; // Needed for DB
    endTime: string;   // Needed for DB
}

interface TimetableConfig {
    days: { id: string; label: string; enabled: boolean; dbValue: number }[]; // Added dbValue mapping
    slots: TimeSlot[];
}

const DEFAULT_CONFIG: TimetableConfig = {
    days: [
        { id: 'mon', label: 'Segunda', enabled: true, dbValue: 1 },
        { id: 'tue', label: 'Terça', enabled: true, dbValue: 2 },
        { id: 'wed', label: 'Quarta', enabled: true, dbValue: 3 },
        { id: 'thu', label: 'Quinta', enabled: true, dbValue: 4 },
        { id: 'fri', label: 'Sexta', enabled: true, dbValue: 5 },
        { id: 'sat', label: 'Sábado', enabled: false, dbValue: 6 },
        { id: 'sun', label: 'Domingo', enabled: false, dbValue: 0 },
    ],
    slots: [
        { id: 's1', start: '07:30', end: '08:20' },
        { id: 's2', start: '08:20', end: '09:10' },
        { id: 's3', start: '09:10', end: '10:00' },
        { id: 's4', start: '10:20', end: '11:10' },
        { id: 's5', start: '11:10', end: '12:00' },
    ]
};

const SUBJECTS = [
    'Matemática', 'Física', 'Química', 'Biologia', 'História', 'Geografia',
    'Português', 'Inglês', 'Artes', 'Filosofia', 'Sociologia', 'Ed. Física',
    'Educação Física', 'Ensino Religioso', 'Projeto de Vida', 'Redação', 'Literatura', 'Ciências'
];

// Map DB Day (0-6) to UI ID
const mapDbDayToId = (dbDay: number): string => {
    const map: Record<number, string> = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' };
    return map[dbDay] || 'mon';
};

// Map UI ID to DB Day
const mapIdToDbDay = (id: string): number => {
    const map: Record<string, number> = { 'sun': 0, 'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6 };
    return map[id] ?? 1;
};


// --- Helper Hook for Timetable Logic (Server-Side Sync) ---
const useTimetableConfig = () => {
    const { currentUser } = useAuth();

    // Config remains local for now (user preference on viewing slots)
    // Could eventually move to 'user_preferences' table
    const [config, setConfig] = useState<TimetableConfig>(DEFAULT_CONFIG);
    const [configLoaded, setConfigLoaded] = useState(false);

    const [visibleDays, setVisibleDays] = useState(config.days.filter(d => d.enabled));

    // Items are now managed via DB sync, initial state empty
    const [timetableItems, setTimetableItems] = useState<TimetableItem[]>([]);
    const [loadingSchedules, setLoadingSchedules] = useState(true);

    // Get real classes from context
    const { classes: realClasses, loading: loadingClasses } = useClass();

    // 1. Initial Load: Try Remote -> Fallback Local -> Fallback Default
    useEffect(() => {
        const loadRemoteConfig = async () => {
            if (!currentUser) return;
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('timetable_config')
                    .eq('id', currentUser.id)
                    .single();

                if (error) throw error;

                if (data?.timetable_config) {
                    console.log("Timetable: Loaded config from Cloud", data.timetable_config);
                    setConfig(data.timetable_config);
                } else {
                    const saved = localStorage.getItem('timetable_config_v3');
                    if (saved) {
                        console.log("Timetable: Loaded config from LocalStorage");
                        setConfig(JSON.parse(saved));
                    }
                }
            } catch (e) {
                console.error("Timetable: Failed to fetch remote config", e);
                const saved = localStorage.getItem('timetable_config_v3');
                if (saved) setConfig(JSON.parse(saved));
            } finally {
                setConfigLoaded(true);
            }
        };

        loadRemoteConfig();
    }, [currentUser]);

    // 2. Persist Changes: Sync to LocalStorage & Remote (Supabase)
    useEffect(() => {
        if (!configLoaded || !currentUser) return;

        const syncConfig = async () => {
            // Force Sort & Dedup Slots before saving
            // Normalize times to HH:mm to prevent '07:10:00' vs '07:10' dupes
            const uniqueSlotsMap = new Map<string, TimeSlot>();

            config.slots.forEach(slot => {
                const normalizedStart = slot.start.slice(0, 5); // Ensure HH:mm
                if (!uniqueSlotsMap.has(normalizedStart)) {
                    uniqueSlotsMap.set(normalizedStart, slot);
                }
            });

            const sortedSlots = Array.from(uniqueSlotsMap.values()).sort((a, b) => a.start.localeCompare(b.start));

            const newConfig = { ...config, slots: sortedSlots };

            // Only update state if needed to avoid loops
            if (JSON.stringify(config.slots) !== JSON.stringify(sortedSlots)) {
                setConfig(prev => ({ ...prev, slots: sortedSlots }));
            }

            localStorage.setItem('timetable_config_v3', JSON.stringify(newConfig));
            setVisibleDays(newConfig.days.filter(d => d.enabled));

            try {
                const { error } = await supabase
                    .from('profiles')
                    .update({ timetable_config: newConfig })
                    .eq('id', currentUser.id);

                if (error) throw error;
                console.log("Timetable: Config synced to Cloud");
            } catch (e) {
                console.error("Timetable: Failed to sync config to Cloud", e);
            }
        };

        const timer = setTimeout(syncConfig, 1000);
        return () => clearTimeout(timer);
    }, [config, currentUser, configLoaded]);


    // --- Database Sync Logic ---
    const fetchSchedules = useCallback(async () => {
        if (!currentUser) return;
        setLoadingSchedules(true);
        try {
            const { data, error } = await supabase
                .from('schedules')
                .select('*')
                .eq('user_id', currentUser.id);

            if (error) throw error;

            console.log("Fetched schedules from DB:", data);

            // AUTO-SLOT RECOVERY:
            // If we have items in DB that don't match our current config.slots, 
            // we should probably add those slots to the config automatically to prevent "sumindo"
            const dbSchedules = data || [];
            const missingSlots: TimeSlot[] = [];

            dbSchedules.forEach(dbItem => {
                const dbStart = dbItem.start_time.slice(0, 5); // Normalize DB time
                const hasMatch = config.slots.some(s => s.start.slice(0, 5) === dbStart);

                if (!hasMatch) {
                    // Check if we already added this missing slot in this loop
                    if (!missingSlots.some(s => s.start.slice(0, 5) === dbStart)) {
                        missingSlots.push({
                            id: `recovered-${Date.now()}-${dbStart.replace(':', '')}`,
                            start: dbStart, // Use normalized start
                            end: dbItem.end_time ? dbItem.end_time.slice(0, 5) : dbStart // Fallback and normalize
                        });
                    }
                }
            });

            if (missingSlots.length > 0) {
                console.log("Recovering missing slots from DB data:", missingSlots);
                setConfig(prev => {
                    // Dedup on merge just in case
                    const mergedMap = new Map();
                    [...prev.slots, ...missingSlots].forEach(s => mergedMap.set(s.start.slice(0, 5), s));
                    const mergedSorted = Array.from(mergedMap.values()).sort((a: any, b: any) => a.start.localeCompare(b.start));

                    return {
                        ...prev,
                        slots: mergedSorted
                    };
                });
                // The re-run of this effect because of config.slots change will handle the mapping
                return;
            }

            // Map DB items to UI Items
            const mappedItems: TimetableItem[] = dbSchedules.map(dbItem => {
                const slot = config.slots.find(s => s.start === dbItem.start_time);
                const slotId = slot ? slot.id : `adhoc-${dbItem.start_time}`;

                return {
                    id: dbItem.id,
                    dayId: mapDbDayToId(dbItem.day_of_week),
                    slotId: slotId,
                    classId: dbItem.class_id,
                    subject: dbItem.subject,
                    section: dbItem.section || '',
                    startTime: dbItem.start_time,
                    endTime: dbItem.end_time
                };
            });

            setTimetableItems(mappedItems);

        } catch (err) {
            console.error("Error fetching schedules:", err);
        } finally {
            setLoadingSchedules(false);
        }
    }, [currentUser, config.slots]); // Re-run if slots definition changes (to remap IDs)


    useEffect(() => {
        if (currentUser) {
            fetchSchedules();
        }
    }, [currentUser, fetchSchedules]);


    // --- Actions ---

    const toggleDay = (dayId: string) => {
        setConfig(prev => ({
            ...prev,
            days: prev.days.map(d => d.id === dayId ? { ...d, enabled: !d.enabled } : d)
        }));
    };

    const updateSlot = (index: number, field: 'start' | 'end', value: string) => {
        setConfig(prev => {
            const newSlots = [...prev.slots];
            newSlots[index] = { ...newSlots[index], [field]: value };
            return { ...prev, slots: newSlots };
        });
    };

    const addSlot = () => {
        const newId = `s${Date.now()}`;
        setConfig(prev => ({
            ...prev,
            slots: [...prev.slots, { id: newId, start: '00:00', end: '00:00' }]
        }));
    };

    const removeSlot = (index: number) => {
        // Logic constraint: If we remove a slot from config, we don't necessarily delete the DB records
        // They just become invisible. User must manually delete items if they want.
        setConfig(prev => ({
            ...prev,
            slots: prev.slots.filter((_, i) => i !== index)
        }));
    };

    // Item Management with DB Sync
    const getSlotItem = (dayId: string, slotId: string) => {
        // We match by slotId primarily
        // Double check against start time if needed
        return timetableItems.find(item => item.dayId === dayId && item.slotId === slotId);
    };

    const assignClassToSlot = async (dayId: string, slotId: string, classId: string, section: string, subject: string) => {
        if (!currentUser) return;

        const slot = config.slots.find(s => s.id === slotId);
        if (!slot) return;

        const fullSubject = subject || 'Geral';

        // Optimistic UI Update
        const newItem: TimetableItem = {
            dayId,
            slotId,
            classId,
            section,
            subject: fullSubject,
            startTime: slot.start,
            endTime: slot.end
        };

        setTimetableItems(prev => {
            // Remove any existing for this specific slot (prevent duplicates in UI)
            const others = prev.filter(item => !(item.dayId === dayId && item.slotId === slotId));
            return [...others, newItem];
        });

        const dbDay = mapIdToDbDay(dayId);

        try {
            // 1. DELETE EXISTING for this exact slot (User + Day + Start Time)
            // This ensures we never have duplicates for the same time slot
            const { error: deleteError } = await supabase
                .from('schedules')
                .delete()
                .match({
                    user_id: currentUser.id,
                    day_of_week: dbDay,
                    start_time: slot.start
                });

            if (deleteError) {
                console.error("Error deleting previous schedule:", deleteError);
                throw deleteError;
            }

            // 2. INSERT NEW
            const { data, error } = await supabase
                .from('schedules')
                .insert({
                    user_id: currentUser.id,
                    day_of_week: dbDay,
                    start_time: slot.start,
                    end_time: slot.end,
                    class_id: classId,
                    section: section,
                    subject: fullSubject,
                })
                .select()
                .single();

            if (error) throw error;

            // Update local item with real DB ID
            setTimetableItems(prev => prev.map(item =>
                (item.dayId === dayId && item.slotId === slotId) ? { ...item, id: data.id } : item
            ));

        } catch (err) {
            console.error("Failed to save schedule to DB:", err);
            // Rollback
            fetchSchedules();
            alert("Erro ao salvar no banco de dados.");
        }
    };

    const removeItemFromSlot = async (dayId: string, slotId: string) => {
        if (!currentUser) return;

        const itemToRemove = getSlotItem(dayId, slotId);
        if (!itemToRemove) return;

        // Optimistic
        setTimetableItems(prev => prev.filter(item => !(item.dayId === dayId && item.slotId === slotId)));

        try {
            // If we have ID, use it. If optimistic item w/o ID, trying to delete by query
            if (itemToRemove.id) {
                await supabase.from('schedules').delete().eq('id', itemToRemove.id);
            } else {
                const dbDay = mapIdToDbDay(dayId);
                await supabase.from('schedules').delete().match({
                    user_id: currentUser.id,
                    day_of_week: dbDay,
                    start_time: itemToRemove.startTime
                });
            }
        } catch (err) {
            console.error("Failed to delete from DB", err);
            fetchSchedules(); // Rollback
        }
    };


    return {
        config,
        setConfig,
        visibleDays,
        setVisibleDays,
        classes: realClasses, // Export real classes
        loading: loadingClasses || loadingSchedules,
        getSlotItem,
        assignClassToSlot,
        removeItemFromSlot,
        toggleDay,
        updateSlot,
        addSlot,
        removeSlot
    };
};



export const Timetable: React.FC = () => {
    const theme = useThemeContext();
    const { currentUser, activeSubject } = useAuth();
    const { config, visibleDays, classes, loading, getSlotItem, assignClassToSlot, removeItemFromSlot, toggleDay, updateSlot, addSlot, removeSlot } = useTimetableConfig();
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

    // Slot Selection State
    const [selectedSlot, setSelectedSlot] = useState<{ day: string, slotId: string, label: string } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Derived state for the active subject
    // We use the activeSubject from context, which is what the user has selected globally
    // Fallback subject if nothing is selected (shouldn't happen often if flow is correct)
    const currentSubject = activeSubject || currentUser?.subject || 'Geral';


    const handleSlotClick = (dayId: string, slotId: string, timeLabel: string) => {
        setSelectedSlot({ day: dayId, slotId, label: timeLabel });
        setIsModalOpen(true);
    };

    const handleAssignClass = (classId: string, section: string) => {
        if (selectedSlot) {
            // ALWAYS use the global currentSubject.
            // The user wants: "When I change the discipline, every time I place the schedule it should change alone"
            assignClassToSlot(selectedSlot.day, selectedSlot.slotId, classId, section, currentSubject);
            setIsModalOpen(false);
        }
    };

    const handleRemoveItem = () => {
        if (selectedSlot) {
            removeItemFromSlot(selectedSlot.day, selectedSlot.slotId);
            setIsModalOpen(false);
        }
    }

    // Theme Styles Helper (Refactored to use THEME_MAP)
    const getSubjectTheme = (subject: string) => {
        const themeConfig = THEME_MAP[subject];

        if (themeConfig) {
            // Mapping ThemeConfig properties to Tailwind classes format expected by UI
            // Using "softBg" for background base, and manual construction for text/border based on baseColor
            // Or ideally, update THEME_MAP to have 'lightBg', 'border' etc. but current structure is:
            // baseColor: 'emerald', softBg: 'bg-emerald-50 dark:...'

            const color = themeConfig.baseColor; // e.g., 'emerald'
            return {
                bg: `bg-${color}-100 dark:bg-${color}-900/40`,
                text: `text-${color}-700 dark:text-${color}-200`,
                border: `border-${color}-200 dark:border-${color}-800`
            };
        }

        // Fallback for unknown subjects
        const hash = subject.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const colors = [
            { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-200', border: 'border-blue-200 dark:border-blue-800' },
            { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-200', border: 'border-emerald-200 dark:border-emerald-800' },
            { bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-700 dark:text-violet-200', border: 'border-violet-200 dark:border-violet-800' },
            { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-200', border: 'border-amber-200 dark:border-amber-800' },
            { bg: 'bg-rose-100 dark:bg-rose-900/40', text: 'text-rose-700 dark:text-rose-200', border: 'border-rose-200 dark:border-rose-800' },
            { bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-700 dark:text-cyan-200', border: 'border-cyan-200 dark:border-cyan-800' },
        ];
        return colors[hash % colors.length];
    };


    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-full bg-white/40 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[24px] md:rounded-[32px] shadow-2xl overflow-hidden border border-white/40 dark:border-white/5 relative z-0"
            style={{ '--grid-cols': `50px repeat(${visibleDays.length}, 1fr)` } as React.CSSProperties}
        >
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end p-5 md:p-6 pb-3 bg-white/30 dark:bg-slate-900/40 backdrop-blur-xl relative z-10 border-b border-white/20 dark:border-white/5">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                        Grade Horária
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-xs">
                        {loading ? 'Sincronizando...' : `${visibleDays.length} dias • ${config.slots.length} aulas`}
                    </p>
                </div>

                <div className="flex gap-2 mt-3 md:mt-0">
                    <button
                        onClick={() => setIsConfigModalOpen(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold hover:bg-${theme.primaryColor}/10 hover:text-${theme.primaryColor} transition-all border border-slate-100 dark:border-slate-800 text-xs`}
                    >
                        <span className="material-symbols-outlined text-[18px]">tune</span>
                        <span className="hidden sm:inline">Configurar</span>
                    </button>
                </div>
            </div>

            {/* Timetable Content */}
            <div className="flex-1 min-h-0 relative">

                {/* A. MOBILE VIEW */}
                <div className="md:hidden flex flex-col pb-20 overflow-y-auto h-full">
                    {visibleDays.map(day => (
                        <div key={day.id} className="relative mb-2">
                            <div className="sticky top-0 z-20 py-2 px-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                <div className={`size-2 rounded-full bg-${theme.primaryColor} shadow-[0_0_6px_rgba(var(--${theme.primaryColor}-rgb),0.5)]`}></div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                                    {day.label}
                                </h3>
                            </div>

                            <div className="px-3 py-3 space-y-2">
                                {config.slots.map((slot) => {
                                    const item = getSlotItem(day.id, slot.id);
                                    const assignedClass = classes.find(c => c.id === item?.classId);
                                    const styles = item ? getSubjectTheme(item.subject) : null;
                                    const timeLabel = `${slot.start} - ${slot.end}`;

                                    return (
                                        <div key={`${day.id}-${slot.id}`}>
                                            <button
                                                onClick={() => handleSlotClick(day.id, slot.id, timeLabel)}
                                                className={`
                                                    w-full text-left transition-all duration-200 relative overflow-hidden group active:scale-[0.98]
                                                    ${item
                                                        ? `rounded-xl p-3 shadow-sm ${styles?.bg} ring-1 ring-inset ${styles?.border}`
                                                        : 'rounded-lg px-3 py-2 bg-slate-50/50 dark:bg-slate-800/30 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                                                    }
                                                `}
                                            >
                                                {item ? (
                                                    <div className="flex justify-between items-center gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1 opacity-80">
                                                                <span className={`text-[10px] font-black uppercase tracking-wider ${styles?.text}`}>
                                                                    {slot.start} - {slot.end}
                                                                </span>
                                                                <span className="size-0.5 rounded-full bg-current opacity-30"></span>
                                                                <span className={`text-[9px] font-bold uppercase tracking-wide truncate ${styles?.text}`}>
                                                                    {item.subject}
                                                                </span>
                                                            </div>
                                                            <h4 className={`text-sm font-black leading-tight truncate ${styles?.text}`}>
                                                                {assignedClass?.name || 'Aula'}
                                                            </h4>
                                                        </div>
                                                        <div className={`
                                                            px-2 py-1 rounded text-[10px] font-black uppercase tracking-wide
                                                            bg-white/50 dark:bg-black/20 backdrop-blur-md ${styles?.text} shrink-0
                                                        `}>
                                                            {item.section}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-between items-center text-slate-300 dark:text-slate-600 group-hover:text-slate-400 transition-colors">
                                                        <span className="text-[10px] font-bold font-mono tracking-tight opacity-70">{slot.start}</span>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <span className="text-[9px] font-black uppercase tracking-widest">Livre</span>
                                                            <span className="material-symbols-outlined text-xs">add</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* B. DESKTOP VIEW */}
                <div className="hidden md:block overflow-x-auto h-full pb-6 custom-scrollbar px-5">
                    <div className="h-full flex flex-col min-w-0 pb-16">
                        <div className="sticky top-0 z-30 mb-0 py-2 bg-white/90 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                            <div
                                className="timetable-grid-container gap-2 items-end"
                            >
                                <div className="text-right pr-2 pb-1">
                                    <span className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px] tracking-widest">Hora</span>
                                </div>
                                {visibleDays.map(day => (
                                    <div key={day.id} className="text-center pb-1 border-b-2 border-transparent">
                                        <span className={`text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-widest`}>{day.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/50">
                            {config.slots.map((slot) => (
                                <div
                                    key={slot.id}
                                    className="timetable-grid-container gap-2 group/row hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors py-1"
                                >
                                    <div className="flex flex-col items-end justify-center pr-2 py-1 opacity-60 group-hover/row:opacity-100 transition-opacity">
                                        <span className="text-slate-900 dark:text-white font-bold text-xs leading-none tabular-nums tracking-tight">{slot.start}</span>
                                        <span className="text-slate-400 text-[9px] font-medium mt-0.5 tabular-nums">{slot.end}</span>
                                    </div>

                                    {visibleDays.map(day => {
                                        const item = getSlotItem(day.id, slot.id);
                                        const assignedClass = classes.find(c => c.id === item?.classId);
                                        const styles = item ? getSubjectTheme(item.subject) : null;
                                        const timeLabel = `${slot.start} - ${slot.end}`;

                                        return (
                                            <div key={`${day.id}-${slot.id}`} className="relative h-24 p-0.5">
                                                <button
                                                    onClick={() => handleSlotClick(day.id, slot.id, timeLabel)}
                                                    className={`
                                                        w-full h-full rounded-xl text-left transition-all duration-200 group/card overflow-hidden border
                                                        ${item
                                                            ? `${styles?.bg} ${styles?.border} shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]`
                                                            : 'border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-800/30 hover:border-dashed hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800/50'
                                                        }
                                                    `}
                                                >
                                                    {item ? (
                                                        <div className="h-full p-2 flex flex-col justify-between">
                                                            <div className="flex justify-between items-start gap-1">
                                                                <span className={`${styles?.text} font-black text-xs leading-tight line-clamp-2`}>
                                                                    {assignedClass?.name || 'Aula'}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-end justify-between w-full mt-auto pt-1">
                                                                <span className={`text-[9px] font-bold uppercase tracking-wide opacity-80 truncate flex-1 min-w-0 ${styles?.text}`}>
                                                                    {item.subject}
                                                                </span>
                                                                <span className={`size-5 rounded flex items-center justify-center text-[9px] font-black uppercase bg-white/40 dark:bg-black/20 ${styles?.text} shrink-0 ml-1`}>
                                                                    {item.section.slice(0, 1)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="h-full w-full flex flex-col items-center justify-center gap-1 opacity-0 group-hover/card:opacity-100 transition-all duration-200">
                                                            <div className="size-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center">
                                                                <span className="material-symbols-outlined text-sm">add</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </button>
                                            </div>
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
                        >
                            <div className={`h-24 bg-gradient-to-br ${theme.bgGradient} p-6 relative flex items-center justify-between`}>
                                <div className="text-white relative z-10">
                                    <h3 className="text-xl font-black tracking-tight">Selecionar Turma</h3>
                                    <p className="opacity-90 font-medium text-xs mt-0.5">
                                        {config.days.find(d => d.id === selectedSlot?.day)?.label}, {selectedSlot?.label}
                                    </p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-full transition-colors relative z-10">
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,_white_1px,_transparent_0)] bg-[length:16px_16px] pointer-events-none"></div>
                            </div>


                            <div className="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {/* REMOVED DROPDOWN HERE - Automatic Logic now */}
                                <div className="mb-4 text-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Disciplina Ativa</span>
                                    <h4 className={`text-lg font-black text-${THEME_MAP[currentSubject]?.baseColor || 'slate'}-600 dark:text-white mt-0.5`}>
                                        {currentSubject}
                                    </h4>
                                </div>

                                <div className="grid grid-cols-1 gap-2.5">
                                    <button
                                        onClick={handleRemoveItem}
                                        className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-rose-200 dark:border-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-900/10 hover:border-rose-300 dark:hover:border-rose-800 transition-all group w-full"
                                    >
                                        <div className="size-8 rounded-lg bg-rose-100 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </div>
                                        <div className="flex flex-col items-start gap-0.5">
                                            <span className="font-black text-rose-500 text-xs">Remover Aula</span>
                                            <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wide">Deixar horário livre</span>
                                        </div>
                                    </button>

                                    {/* Real Classes List */}
                                    {loading ? (
                                        <div className="text-center py-4 text-slate-400 text-xs font-bold">Carregando turmas...</div>
                                    ) : classes.length === 0 ? (
                                        <div className="text-center py-4 text-slate-400 text-xs font-bold">Nenhuma turma encontrada.</div>
                                    ) : (
                                        classes.map(cls => (
                                            <div key={cls.id} className="flex flex-col gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-primary/20 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-700 dark:text-white text-sm leading-tight">{cls.name}</span>
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                                            {/* Display implied subject */}
                                                            {currentSubject}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {cls.sections.map(section => (
                                                        <button
                                                            key={`${cls.id}-${section}`}
                                                            onClick={() => handleAssignClass(cls.id, section)} // cls.id is string
                                                            className={`
                                                                px-2.5 py-1 rounded-md text-[10px] font-black border transition-all flex items-center gap-1
                                                                bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600
                                                                hover:border-${theme.primaryColor} hover:text-${theme.primaryColor} hover:shadow-md hover:-translate-y-0.5 active:translate-y-0
                                                            `}
                                                        >
                                                            <span>Turma {section}</span>
                                                            <span className="material-symbols-outlined text-[12px]">add</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Config Modal (Same as before) */}
            <AnimatePresence>
                {isConfigModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-[24px] shadow-2xl overflow-hidden flex flex-col my-auto"
                        >
                            <div className={`h-20 bg-gradient-to-br ${theme.bgGradient} relative shrink-0 overflow-hidden`}>
                                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_2px_2px,_white_1px,_transparent_0)] bg-[length:24px_24px] pointer-events-none"></div>
                                <div className="absolute top-0 right-0 p-3 opacity-10 rotate-12 transform translate-x-2 -translate-y-2">
                                    <span className="material-symbols-outlined text-[80px] text-white">{theme.icon}</span>
                                </div>
                                <div className="absolute inset-0 flex items-center px-6 md:px-8">
                                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined bg-white/20 p-1.5 rounded-lg text-lg">tune</span>
                                        Configurar Grade
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setIsConfigModalOpen(false)}
                                    className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined text-xl">close</span>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                                {/* Days Section */}
                                <div>
                                    <h4 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                                        Dias da Semana
                                    </h4>
                                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
                                        {config.days.map(day => (
                                            <button
                                                key={day.id}
                                                onClick={() => toggleDay(day.id)}
                                                className={`
                                                    relative overflow-hidden group py-2 px-1.5 rounded-lg text-[10px] font-bold border transition-all duration-200
                                                    ${day.enabled
                                                        ? `bg-${theme.primaryColor}/10 border-${theme.primaryColor} text-${theme.primaryColor} shadow-sm ring-1 ring-${theme.primaryColor}/50`
                                                        : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                                                    }
                                                `}
                                            >
                                                <span className="relative z-10">{day.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Timer Slots Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-3 sticky top-0 bg-white dark:bg-slate-900 z-10 py-1">
                                        <h4 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <span className="material-symbols-outlined text-sm">schedule</span>
                                            Horários ({config.slots.length})
                                        </h4>
                                        <button
                                            onClick={addSlot}
                                            className={`
                                                group flex items-center gap-1 pl-2.5 pr-3 py-1 rounded-full 
                                                bg-${theme.primaryColor}/10 text-${theme.primaryColor} 
                                                text-[10px] font-bold hover:bg-${theme.primaryColor} hover:text-white transition-all
                                            `}
                                        >
                                            <span className="material-symbols-outlined text-sm group-hover:rotate-90 transition-transform">add_circle</span>
                                            <span>Adicionar</span>
                                        </button>
                                    </div>

                                    <div className="space-y-1.5">
                                        {config.slots.map((slot, index) => {
                                            const [h1, m1] = slot.start.split(':').map(Number);
                                            const [h2, m2] = slot.end.split(':').map(Number);
                                            const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
                                            const duration = diff > 0 ? `${diff} min` : '--';

                                            return (
                                                <div
                                                    key={slot.id} // Use stable ID
                                                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors group"
                                                >
                                                    <div className="size-7 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-500 dark:text-slate-400 shrink-0">
                                                        {index + 1}º
                                                    </div>

                                                    <div className="flex items-center flex-1 gap-1.5">
                                                        <div className="relative group/input flex-1">
                                                            <input
                                                                type="time"
                                                                value={slot.start}
                                                                onChange={(e) => updateSlot(index, 'start', e.target.value)}
                                                                className="w-full bg-transparent border-b-2 border-slate-200 dark:border-slate-700 hover:border-primary/50 focus:border-primary px-1 py-0.5 text-center font-bold text-xs text-slate-700 dark:text-white transition-colors focus:outline-none cursor-pointer"
                                                                title="Horário de Início"
                                                                aria-label="Horário de Início"
                                                            />
                                                        </div>

                                                        <span className="text-slate-300 font-bold text-xs">-</span>

                                                        <div className="relative group/input flex-1">
                                                            <input
                                                                type="time"
                                                                value={slot.end}
                                                                onChange={(e) => updateSlot(index, 'end', e.target.value)}
                                                                className="w-full bg-transparent border-b-2 border-slate-200 dark:border-slate-700 hover:border-primary/50 focus:border-primary px-1 py-0.5 text-center font-bold text-xs text-slate-700 dark:text-white transition-colors focus:outline-none cursor-pointer"
                                                                title="Horário de Término"
                                                                aria-label="Horário de Término"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-500 min-w-[50px] text-center shrink-0">
                                                        {duration}
                                                    </div>

                                                    <button
                                                        onClick={() => removeSlot(index)}
                                                        className="size-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                        title="Remover horário"
                                                    >
                                                        <span className="material-symbols-outlined text-base">close</span>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 z-10">
                                <button
                                    onClick={() => setIsConfigModalOpen(false)}
                                    className={`w-full py-3 rounded-lg text-white font-black transition-all hover:brightness-110 active:scale-[0.98] shadow-lg text-sm bg-${theme.primaryColor}`}
                                >
                                    Salvar Alterações
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
