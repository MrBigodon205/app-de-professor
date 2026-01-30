import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';
import { useClass } from '../contexts/ClassContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { Student, AttendanceRecord } from '../types';
import { supabase } from '../lib/supabase';

// Utility to convert tailwind color names or hex to RGB for jsPDF
const getThemeRGB = (colorClass: string): [number, number, number] => {
    // Basic mapping for common tailwind colors used in themes
    const map: Record<string, [number, number, number]> = {
        'indigo-600': [79, 70, 229],
        'blue-600': [37, 99, 235],
        'emerald-600': [5, 150, 105],
        'rose-600': [225, 29, 72],
        'amber-600': [217, 119, 6],
        'violet-600': [124, 58, 237],
        'cyan-600': [8, 145, 178],
        'pink-600': [219, 39, 119],
        'orange-600': [234, 88, 12],
        'sky-600': [2, 132, 199],
        'lime-600': [101, 163, 13],
        'slate-600': [71, 85, 105],
        'green-600': [22, 163, 74],
        'teal-600': [13, 148, 136],
    };
    return map[colorClass] || [79, 70, 229]; // Default to indigo
};

// Mini Calendar Component
const MiniCalendar: React.FC<{
    currentDate: string;
    onSelectDate: (date: string) => void;
    activeDates: Set<string>;
    onClose: () => void;
    theme: any;
}> = ({ currentDate, onSelectDate, activeDates, onClose, theme }) => {
    const [viewDate, setViewDate] = useState(new Date(currentDate + 'T12:00:00'));

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const changeMonth = (delta: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setViewDate(newDate);
    };

    const isSelected = (day: number) => {
        const d = new Date(currentDate + 'T12:00:00');
        return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    };

    const isToday = (day: number) => {
        const d = new Date();
        return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    };

    const hasData = (day: number) => {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        return activeDates.has(dateStr);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-0"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-950 w-full max-w-[340px] rounded-[32px] shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800 p-6"
            >

                <div className="relative flex items-center justify-between mb-6">
                    <button onClick={() => changeMonth(-1)} className="size-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-slate-500 transition-colors">
                        <span className="material-symbols-outlined text-xl">chevron_left</span>
                    </button>
                    <div className="text-center">
                        <span className="block font-black text-slate-900 dark:text-white capitalize text-lg leading-tight">
                            {viewDate.toLocaleString('pt-BR', { month: 'long' })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{viewDate.getFullYear()}</span>
                    </div>
                    <button onClick={() => changeMonth(1)} className="size-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-slate-500 transition-colors">
                        <span className="material-symbols-outlined text-xl">chevron_right</span>
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {days.map((day, i) => {
                        if (!day) return <div key={`empty-${i}`} className="size-10" />;
                        return (
                            <button
                                key={day || `empty-${i}`}
                                onClick={() => {
                                    if (day) {
                                        const newDateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                                        onSelectDate(newDateStr);
                                        onClose();
                                    }
                                }}
                                className={`h-9 w-9 lg:h-14 lg:w-14 landscape:size-7 flex items-center justify-center rounded-full text-xs lg:text-sm transition-all relative group
                                    ${isSelected(day as number)
                                        ? 'text-white theme-shadow-primary scale-110 font-black z-10 theme-bg-primary'
                                        : isToday(day as number)
                                            ? 'font-bold theme-bg-surface-subtle theme-text-primary'
                                            : hasData(day as number)
                                                ? 'text-emerald-500 dark:text-emerald-400 font-black drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                                                : 'text-text-secondary hover:bg-surface-hover'
                                    }`}
                            >
                                <span className="z-10">{day}</span>
                                {hasData(day as number) && !isSelected(day as number) && (
                                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500"></div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
};

export const Attendance: React.FC = () => {
    const { selectedSeriesId, selectedSection, activeSeries } = useClass();
    const { currentUser, activeSubject } = useAuth();
    const theme = useTheme();

    // Mount Ref
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const [students, setStudents] = useState<Student[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('sv-SE'));
    const [selectedUnit, setSelectedUnit] = useState<string>('1');
    const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
    const [maxPeriods, setMaxPeriods] = useState<number>(1); // Dynamic Lesson Count
    const [viewMode, setViewMode] = useState<'daily' | 'history'>('daily');
    const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
    // State to hold ALL record dates for the calendar indicators
    const [activeDates, setActiveDates] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // CACHE: Store attendance for all periods locally [Period -> [StudentId -> Status]]
    const attendanceCache = useRef<Record<number, Record<string, string>>>({});

    const [loading, setLoading] = useState(true);
    const [showCalendar, setShowCalendar] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);

    // Close calendar when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setShowCalendar(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // MAIN FETCH EFFECT (Triggers on Context Change, NOT Period Change)
    useEffect(() => {
        if (selectedSeriesId && selectedSection) {
            // Reset cache on context switch
            attendanceCache.current = {};
            fetchData();
        } else {
            setStudents([]);
            setAttendanceMap({});
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate, selectedSeriesId, selectedSection, activeSubject, selectedUnit]);
    // ^ Removed selectedPeriod from dependency to prevent re-fetch!

    // PERIOD SWITCH EFFECT (Local Cache Only)
    useEffect(() => {
        if (!mountedRef.current) return;
        // Load from cache instantly
        const cachedMap = attendanceCache.current[selectedPeriod] || {};
        setAttendanceMap(cachedMap);
    }, [selectedPeriod]);

    // --- DYNAMIC PERIODS LOGIC ---
    useEffect(() => {
        const checkSchedule = async () => {
            if (!currentUser || !selectedSeriesId || !selectedSection) return;

            try {
                const dateObj = new Date(selectedDate + 'T12:00:00');
                const dayOfWeek = dateObj.getDay(); // 0-6

                const { count, error } = await supabase
                    .from('schedules')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', currentUser.id)
                    .eq('class_id', selectedSeriesId)
                    .eq('day_of_week', dayOfWeek);

                if (!error) {
                    // If count is 0 (no classes scheduled), technically implies "extra class" or just 1 default slot. 
                    // Let's stick to minimum 1.
                    // If count is > 1 (e.g. 2 lessons), permit 2 periods.
                    const newMax = (count && count > 1) ? count : 1;
                    setMaxPeriods(newMax);

                    // Reset if current selection is out of bounds
                    if (selectedPeriod > newMax) setSelectedPeriod(1);
                }
            } catch (e) {
                console.error("Error checking schedule periods", e);
            }
        };

        checkSchedule();
    }, [selectedDate, selectedSeriesId, selectedSection, currentUser]);

    const fetchData = async (silent = false) => {
        if (!currentUser || !selectedSeriesId || !selectedSection) return;
        if (!silent && mountedRef.current) setLoading(true);

        try {
            // 1. Fetch Students (Online Only)
            const { data: studentsData, error: studentsError } = await supabase
                .from('students')
                .select('*')
                .eq('series_id', selectedSeriesId)
                .eq('section', selectedSection)
                .eq('user_id', currentUser.id);

            if (studentsError) throw studentsError;

            if (!mountedRef.current) return;

            const formattedStudents: Student[] = studentsData.map(s => ({
                id: s.id.toString(),
                name: s.name,
                number: s.number,
                initials: s.initials || '',
                color: s.color || '',
                classId: s.series_id.toString(),
                section: s.section,
                userId: s.user_id,
                units: s.units || {}
            }));

            // SORT AND SET STUDENTS IMMEDIATELY
            formattedStudents.sort((a, b) => a.name.localeCompare(b.name));
            if (mountedRef.current) {
                setStudents(formattedStudents);
                // Reset map initially while we try to fetch attendance
                setAttendanceMap({});
            }

            // Fetch Attendance (Isolated to prevent crash)
            try {
                // FETCH ALL PERIODS at once (removed .eq('period', selectedPeriod))
                let query = supabase
                    .from('attendance')
                    .select('*')
                    .eq('date', selectedDate)
                    .eq('subject', activeSubject)
                    .eq('unit', selectedUnit)
                    .eq('user_id', currentUser.id)
                    .in('student_id', formattedStudents.map(s => s.id));

                const { data: todaysRecords, error: attendanceError } = await query;
                if (attendanceError) throw attendanceError;

                // Process records into Cache
                const newCache: Record<number, Record<string, string>> = {};

                // Initialize cache buckets (optional, but good for safety)
                for (let i = 1; i <= 5; i++) newCache[i] = {};

                (todaysRecords || []).forEach(record => {
                    const p = record.period ? parseInt(record.period) : 1; // Default to 1 if null
                    const sid = record.student_id.toString();
                    if (!newCache[p]) newCache[p] = {};
                    newCache[p][sid] = record.status;
                });

                if (mountedRef.current) {
                    attendanceCache.current = newCache;
                    // Set map for CURRENT period
                    setAttendanceMap(newCache[selectedPeriod] || {});
                    fetchActiveDates(formattedStudents.map(s => s.id));
                }
            } catch (attError) {
                console.warn("Attendance fetch failed (possibly missing column?)", attError);
                // Students remain visible, map just stays empty
            }

        } catch (e) {
            console.error("Fetch data failed", e);
        } finally {
            if (!silent && mountedRef.current) setLoading(false);
        }
    };

    // --- REALTIME SUBSCRIPTION ---
    useEffect(() => {
        if (!currentUser || !selectedSeriesId || !selectedSection) return;

        // Polling Removed: Rely on Realtime to prevent overwriting local state during edits
        // If connection drops, user can refresh manually.
        // const interval = setInterval(() => { ... }, 10000);

        // Realtime setup

        const channel = supabase.channel(`attendance_sync_${selectedSeriesId}_${selectedSection}_${selectedUnit}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'attendance',
                    filter: `date=eq.${selectedDate}` // Only listen for changes on CURRENT date to avoid noise
                },
                (payload) => {
                    // Realtime Change Received!
                    // Filter by user_id to ensure we only get our own updates (or shared if intended)
                    // The 'filter' in subscription handles date.
                    // We should verify userID if multiple teachers share db but row level security usually handles this.
                    // Re-fetch data to sync
                    fetchData(true);
                }
            )
            .subscribe();

        return () => {
            // Realtime cleanup
            supabase.removeChannel(channel);
            // clearInterval(interval);
        };
    }, [selectedDate, selectedSeriesId, selectedSection, currentUser, activeSubject, selectedUnit, selectedPeriod]);
    // -----------------------------

    const fetchActiveDates = async (studentIds: string[]) => {
        if (!currentUser || studentIds.length === 0) return;
        try {
            const year = new Date(selectedDate).getFullYear();
            // Fetch dates that have AT LEAST ONE record for these students
            const { data, error } = await supabase
                .from('attendance')
                .select('date')
                .eq('user_id', currentUser.id)
                .eq('subject', activeSubject)
                .eq('unit', selectedUnit)
                // We keep active dates "generic" for the day, regardless of period?
                // Or do we only show dot if there is data for ANY period on that day?
                // Current query checks simply "records on this day".
                // Since we don't query 'period', if there is ANY record on that day (Period 1 OR 2), it returns.
                // This is correct: The "Day" has data.
                .eq('series_id', selectedSeriesId)
                .eq('section', selectedSection)
                .gte('date', `${year}-01-01`)
                .lte('date', `${year}-12-31`)
                .in('student_id', studentIds);

            if (error) throw error;
            const dates = new Set<string>(data.map(r => r.date));
            setActiveDates(dates);
        } catch (e) {
            console.error("Fetch active dates failed", e);
        }
    };

    const updateRecord = async (studentId: string, status: string) => {
        if (!currentUser || !selectedSeriesId || !selectedSection) return;
        setIsSaving(true);
        try {
            const cleanPayload = {
                student_id: parseInt(studentId),
                date: selectedDate,
                status: status,
                series_id: parseInt(selectedSeriesId),
                section: selectedSection,
                user_id: currentUser.id,
                subject: activeSubject,
                unit: selectedUnit,
                period: selectedPeriod // Add Period
            };

            if (status === '') {
                // Delete specific period record
                await supabase
                    .from('attendance')
                    .delete()
                    .match({
                        student_id: cleanPayload.student_id,
                        date: selectedDate,
                        subject: activeSubject,
                        unit: selectedUnit,
                        period: selectedPeriod
                    });
            } else {
                await supabase
                    .from('attendance')
                    .upsert(cleanPayload); // upsert needs constraint on (student_id, date, subject, unit, period)
            }

            // UI Update (Dates)
            if (status !== '') setActiveDates(prev => new Set(prev).add(selectedDate));
        } catch (e) {
            console.error(`Failed to update ${studentId}`, e);
        } finally {
            setIsSaving(false);
        }
    };

    const markAll = async (status: string) => {
        if (!currentUser || !selectedSeriesId || !selectedSection) return;
        setIsSaving(true);

        // Update Local & Cache
        const newMap = { ...attendanceMap };
        students.forEach(s => newMap[s.id] = status);
        setAttendanceMap(newMap);

        // Sync Cache
        if (!attendanceCache.current[selectedPeriod]) attendanceCache.current[selectedPeriod] = {};
        students.forEach(s => attendanceCache.current[selectedPeriod][s.id] = status);

        if (status !== '') setActiveDates(prev => new Set(prev).add(selectedDate));

        try {
            const records = students.map(s => ({
                student_id: parseInt(s.id),
                date: selectedDate,
                status: status,
                series_id: parseInt(selectedSeriesId),
                section: selectedSection,
                user_id: currentUser.id,
                subject: activeSubject,
                unit: selectedUnit,
                period: selectedPeriod
            }));

            if (status === '') {
                await supabase
                    .from('attendance')
                    .delete()
                    .match({
                        user_id: currentUser.id,
                        date: selectedDate,
                        subject: activeSubject,
                        unit: selectedUnit,
                        series_id: parseInt(selectedSeriesId),
                        section: selectedSection,
                        period: selectedPeriod
                    });
            } else {
                await supabase.from('attendance').upsert(records);
            }
        } catch (e) {
            console.error("Bulk update failed", e);
        } finally {
            setTimeout(() => setIsSaving(false), 500);
        }
    };

    const handleStatusChange = async (studentId: string, status: string) => {
        const currentStatus = attendanceMap[studentId];
        const newStatus = currentStatus === status ? '' : status;

        // Update Map
        setAttendanceMap(prev => ({ ...prev, [studentId]: newStatus }));

        // Update Cache Instantly
        if (!attendanceCache.current[selectedPeriod]) attendanceCache.current[selectedPeriod] = {};
        attendanceCache.current[selectedPeriod][studentId] = newStatus;

        await updateRecord(studentId, newStatus);
    };

    const generatePDF = async () => {
        if (!currentUser) return;
        const doc = new jsPDF({ orientation: 'landscape' });
        const primaryRGB = getThemeRGB(theme.primaryColor);

        // --- HELPER: Draw Premium Header ---
        const drawHeader = () => {
            // Background
            doc.setFillColor(...primaryRGB);
            doc.rect(0, 0, 297, 40, 'F');

            // Decorative Circles
            doc.setFillColor(255, 255, 255);
            doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
            doc.circle(280, 10, 40, 'F');
            doc.circle(20, 50, 30, 'F');
            doc.setGState(new (doc as any).GState({ opacity: 1 }));

            // Brand
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('PROF. ACERTA+', 14, 25);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Sistema de Gestão Escolar Inteligente', 14, 32);

            // Report Title Badge
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(220, 10, 63, 20, 3, 3, 'F');
            doc.setTextColor(...primaryRGB);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('REGISTRO DE FREQUÊNCIA', 251.5, 17, { align: 'center' });

            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text(`${activeSeries?.name} - ${selectedSection} • Unidade ${selectedUnit}`, 251.5, 22, { align: 'center' });
            doc.text(new Date().toLocaleDateString('pt-BR'), 251.5, 26, { align: 'center' });
        };

        drawHeader();

        // --- 2. DATA PREPARATION ---
        setLoading(true);
        try {
            const targetYear = new Date(selectedDate).getFullYear();

            // Fetch Full Year Records
            const { data: allRecords, error } = await supabase
                .from('attendance')
                .select('*')
                .eq('user_id', currentUser.id)
                .eq('subject', activeSubject)
                .eq('unit', selectedUnit)
                // PDF: Include ALL periods? Or filter by current period?
                // Logic: "Two lessons same day" -> If I export, do I want Lesson 1 and Lesson 2 separated or merged?
                // Standard practice: Show "Day P1" and "Day P2" columns? Or just merge presence?
                // For simplicity first: Filter by selectedPeriod to generate report FOR THAT PERIOD context.
                // Or, if user wants daily aggregate...
                // Based on "mark two presences separately", user likely treats them as distinct events.
                // Let's filter PDF by selectedPeriod too, so you generate "Frequency of Lesson 1".
                .eq('period', selectedPeriod)
                .in('student_id', students.map(s => s.id));

            if (error) throw error;

            const yearRecords = (allRecords || []).filter((r: any) => {
                const rDate = new Date(r.date + 'T12:00:00');
                return rDate.getFullYear() === targetYear;
            });

            // Merge local pending changes
            Object.keys(attendanceMap).forEach(sid => {
                const pendingStatus = attendanceMap[sid];
                const existingIndex = yearRecords.findIndex((r: any) => r.student_id.toString() === sid && r.date === selectedDate);
                if (existingIndex >= 0) {
                    yearRecords[existingIndex].status = pendingStatus;
                } else if (pendingStatus) {
                    yearRecords.push({
                        student_id: Number(sid),
                        date: selectedDate,
                        status: pendingStatus
                    });
                }
            });

            // Calculate Dates and Sort
            const activeDatesSet = new Set<string>();
            yearRecords.forEach((r: any) => activeDatesSet.add(r.date));
            const sortedDateStrings = Array.from(activeDatesSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

            // --- 3. TABLE GENERATION ---
            const head = [['Nº', 'ALUNO', ...sortedDateStrings.map(ds => {
                const d = new Date(ds + 'T12:00:00');
                return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            }), 'FREQ %']];

            const body = students.map(s => {
                let presenceCount = 0;
                let validDays = 0;
                const row: any[] = [s.number, s.name];

                sortedDateStrings.forEach(ds => {
                    const record = yearRecords.find((r: any) => r.student_id.toString() === s.id && r.date === ds);
                    const status = record ? record.status : '-';
                    // Store bare status char for parsing later
                    row.push(status);

                    if (status === 'P') { presenceCount++; validDays++; }
                    else if (status === 'F' || status === 'J') { validDays++; }
                });

                // Calculate % but return formatted string
                const percentage = validDays > 0 ? (presenceCount / validDays) * 100 : 100;
                row.push(percentage); // Keep as number for bar drawing
                return row;
            });

            autoTable(doc, {
                head: head,
                body: body,
                startY: 45,
                theme: 'grid',
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                    valign: 'middle',
                    halign: 'center',
                    lineColor: [241, 245, 249],
                    lineWidth: 0.1,
                    textColor: [71, 85, 105]
                },
                headStyles: {
                    fillColor: [248, 250, 252],
                    textColor: [71, 85, 105],
                    fontStyle: 'bold',
                    lineWidth: 0,
                },
                alternateRowStyles: {
                    fillColor: [255, 255, 255]
                },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 10 },
                    1: { halign: 'left', cellWidth: 50, fontStyle: 'bold' },
                    [head[0].length - 1]: { cellWidth: 25 }
                },
                didParseCell: (data) => {
                    // Hide text for status columns (we will draw dots)
                    if (data.section === 'body' && data.column.index > 1 && data.column.index < head[0].length - 1) {
                        // data.cell.text = []; // Clear text to only show dot? 
                        // Check if we want to show text AND dot or just dot. 
                        // "Status Columns: Instead of 'P'/'F', draw Colored Dots" according to plan.
                        data.cell.styles.textColor = [255, 255, 255]; // Verify invisible text approach
                    }
                    if (data.section === 'body' && data.column.index === head[0].length - 1) {
                        data.cell.styles.textColor = [255, 255, 255]; // Hide percentage number, redraw manually
                    }
                },
                didDrawCell: (data) => {
                    if (data.section === 'body' && data.column.index > 1 && data.column.index < head[0].length - 1) {
                        const val = data.cell.raw as string;
                        const x = data.cell.x + data.cell.width / 2;
                        const y = data.cell.y + data.cell.height / 2;

                        if (val === 'P') {
                            doc.setFillColor(34, 197, 94); // Green-500
                            doc.circle(x, y, 1.5, 'F');
                        } else if (val === 'F') {
                            doc.setFillColor(239, 68, 68); // Red-500
                            doc.circle(x, y, 1.5, 'F');
                        } else if (val === 'J') {
                            doc.setFillColor(245, 158, 11); // Amber-500
                            doc.circle(x, y, 1.5, 'F');
                        } else if (val === 'S') {
                            doc.setFillColor(148, 163, 184); // Slate-400
                            doc.circle(x, y, 1, 'F');
                        } else {
                            doc.setFillColor(226, 232, 240); // Slate-200 (Empty)
                            doc.circle(x, y, 0.5, 'F');
                        }
                    }

                    // Progress Bar for Percentage
                    if (data.section === 'body' && data.column.index === head[0].length - 1) {
                        const val = data.cell.raw as number; // It's a number now
                        const x = data.cell.x + 2;
                        const y = data.cell.y + (data.cell.height / 2) - 1.5;
                        const w = data.cell.width - 4;

                        // Track
                        doc.setFillColor(226, 232, 240);
                        doc.roundedRect(x, y, w, 3, 1, 1, 'F');

                        // Bar
                        const barW = (val / 100) * w;
                        if (val >= 70) doc.setFillColor(34, 197, 94);
                        else if (val >= 50) doc.setFillColor(234, 179, 8);
                        else doc.setFillColor(239, 68, 68);

                        doc.roundedRect(x, y, barW, 3, 1, 1, 'F');

                        // Text Label next to it? or centered?
                        // Let's draw text manually centered
                        doc.setTextColor(71, 85, 105);
                        doc.setFontSize(6);
                        doc.text(`${val.toFixed(0)}%`, x + w + 1, y + 2.5, { align: 'left' });
                    }
                }
            });

            // --- 4. FOOTER ---
            const pageCount = (doc as any).internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.text(`Página ${i} de ${pageCount} • Gerado por Prof. Acerta+`, 148.5, 200, { align: 'center' });
            }

            doc.save(`Frequencia_${activeSeries?.name}_${selectedSection}_Unidade${selectedUnit}_${targetYear}.pdf`);

        } catch (e) {
            console.error("PDF Error", e);
            alert("Erro ao gerar PDF.");
        } finally {
            setLoading(false);
        }
    };

    if (!selectedSeriesId) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-500">
                <div className={`size-20 rounded-2xl bg-${theme.primaryColor}/10 flex items-center justify-center mb-6`}>
                    <span className={`material-symbols-outlined text-4xl text-${theme.primaryColor}`}>{theme.icon}</span>
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-2">Nenhuma Série Selecionada</h3>
                <p className="text-text-muted text-center max-w-sm mb-8">Escolha uma série no menu superior para registrar as presenças de seus alunos.</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto flex flex-col gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6 lg:pb-12">
            {/* Header Control */}
            <div className={`bg-surface-card p-4 sm:p-8 rounded-3xl shadow-card border border-border-default flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-8 relative z-30 group landscape:p-2`}>
                <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-${theme.primaryColor}/5 to-transparent rounded-full -mr-32 -mt-32 blur-3xl group-hover:from-${theme.primaryColor}/10 transition-colors duration-700`}></div>

                <div className="flex items-center gap-4 sm:gap-6 relative z-10 w-full lg:w-auto">
                    <div className={`hidden sm:flex size-14 rounded-2xl bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white items-center justify-center shadow-lg shadow-${theme.primaryColor}/20`}>
                        <span className="material-symbols-outlined text-2xl">check_circle</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-3xl font-black text-text-primary tracking-tight leading-none mb-1">Presenças</h1>
                        <p className="text-text-muted font-medium text-xs md:text-base">Frequência para <span className={`text-${theme.primaryColor} font-bold`}>{activeSeries?.name} • {selectedSection}</span></p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto relative z-10">
                    <div className="relative" ref={calendarRef}>
                        <button
                            data-tour="attendance-date"
                            onClick={() => setShowCalendar(!showCalendar)}
                            className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-2.5 sm:py-3 bg-surface-subtle border border-border-subtle rounded-2xl hover:border-${theme.primaryColor} hover:bg-surface-card transition-all group/cal shadow-sm`}
                        >
                            <span className={`material-symbols-outlined text-${theme.primaryColor} group-hover/cal:scale-110 transition-transform text-xl sm:text-2xl`}>calendar_month</span>
                            <div className="flex flex-col items-start leading-none gap-0.5 sm:gap-1">
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest leading-none">Data</span>
                                <span className="font-bold text-xs sm:text-sm text-text-primary">
                                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                            <span className={`material-symbols-outlined text-slate-400 transition-transform text-lg sm:text-xl ${showCalendar ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>


                        <AnimatePresence>
                            {showCalendar && (
                                <MiniCalendar
                                    currentDate={selectedDate}
                                    onSelectDate={setSelectedDate}
                                    activeDates={activeDates}
                                    onClose={() => setShowCalendar(false)}
                                    theme={theme}
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={generatePDF}
                        className={`h-11 w-11 flex items-center justify-center border border-border-default hover:border-${theme.primaryColor} hover:text-${theme.primaryColor} text-text-muted rounded-2xl transition-all shadow-sm active:scale-95`}
                        title="Exportar Relatório PDF"
                    >
                        <span className="material-symbols-outlined">description</span>
                    </button>

                    <div className="h-8 w-px bg-border-default mx-1 hidden sm:block"></div>

                    <div className="flex items-center bg-surface-subtle rounded-xl p-1 border border-border-default overflow-x-auto max-w-full">
                        {['1', '2', '3'].map((unit) => (
                            <button
                                key={unit}
                                onClick={() => setSelectedUnit(unit)}
                                className={`h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedUnit === unit
                                    ? `bg-surface-card text-${theme.primaryColor} shadow-sm ring-1 ring-border-subtle`
                                    : 'text-text-muted hover:text-text-primary'
                                    }`}
                            >
                                {unit}ª Unid
                            </button>
                        ))}
                    </div>

                    {/* Divider - Only if multiple periods */}
                    {maxPeriods > 1 && <div className="h-8 w-px bg-border-default mx-1 hidden sm:block"></div>}

                    {/* Period Selector - Only if multiple periods */}
                    {maxPeriods > 1 && (
                        <div className="flex items-center bg-surface-subtle rounded-xl p-1 border border-border-default overflow-x-auto max-w-full">
                            {Array.from({ length: maxPeriods }).map((_, i) => {
                                const period = i + 1;
                                return (
                                    <button
                                        key={period}
                                        onClick={() => setSelectedPeriod(period)}
                                        className={`h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1 ${selectedPeriod === period
                                            ? `bg-surface-card text-${theme.secondaryColor} shadow-sm ring-1 ring-border-subtle`
                                            : 'text-text-muted hover:text-text-primary'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[10px]">schedule</span>
                                        {period}ª Aula
                                    </button>
                                );
                            })}
                        </div>
                    )}

                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 p-1" data-tour="attendance-quick-actions">
                <button onClick={() => markAll('P')} className="flex-1 min-w-[70px] sm:min-w-[140px] flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-2 sm:py-3 bg-emerald-500 text-white rounded-xl sm:rounded-2xl text-[9px] sm:text-xs font-bold hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                    <span className="material-symbols-outlined text-base sm:text-lg">done_all</span>
                    <span className="whitespace-nowrap">Geral</span>
                </button>
                <button onClick={() => markAll('F')} className="flex-1 min-w-[70px] sm:min-w-[140px] flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-2 sm:py-3 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 rounded-xl sm:rounded-2xl text-[9px] sm:text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all border border-rose-100 dark:border-rose-900/20">
                    <span className="material-symbols-outlined text-base sm:text-lg">close</span>
                    Faltas
                </button>
                <button onClick={() => markAll('S')} className="flex-1 min-w-[70px] sm:min-w-[140px] flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-2 sm:py-3 bg-surface-subtle text-text-secondary rounded-xl sm:rounded-2xl text-[9px] sm:text-xs font-bold hover:bg-surface-hover transition-all">
                    <span className="material-symbols-outlined text-base sm:text-lg">event_busy</span>
                    S/A
                </button>
                <button onClick={() => markAll('')} className="flex-1 min-w-[70px] sm:min-w-[140px] flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-2 sm:py-3 bg-surface-card text-text-muted rounded-xl sm:rounded-2xl text-[9px] sm:text-xs font-bold hover:bg-surface-subtle transition-all border border-border-default">
                    <span className="material-symbols-outlined text-base sm:text-lg">history</span>
                    Reiniciar
                </button>
            </div>

            {/* Students Table */}
            {/* Students Table (Desktop/Tablet) */}
            <div className={`hidden md:block bg-surface-card border border-border-default rounded-3xl shadow-card overflow-hidden transition-all duration-300 ${loading ? 'opacity-70 pointer-events-none' : ''}`}>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-subtle/50 border-b border-border-subtle">
                                <th className="px-3 sm:px-8 py-4 sm:py-5 text-[10px] font-black uppercase text-text-muted tracking-widest w-12 sm:w-24 text-center sm:text-left">Nº</th>
                                <th className="px-3 sm:px-8 py-4 sm:py-5 text-[10px] font-black uppercase text-text-muted tracking-widest text-left">Aluno</th>
                                <th className="px-3 sm:px-8 py-4 sm:py-5 text-[10px] font-black uppercase text-text-muted tracking-widest text-center">Registro</th>
                            </tr>
                        </thead>
                        <motion.tbody
                            variants={{
                                hidden: { opacity: 0 },
                                visible: {
                                    opacity: 1,
                                    transition: { staggerChildren: 0.05 }
                                }
                            }}
                            initial="hidden"
                            animate="visible"
                            className="divide-y divide-border-subtle"
                        >
                            {students.length > 0 ? (
                                students.map((s) => (
                                    <AttendanceRow
                                        key={s.id}
                                        student={s}
                                        status={attendanceMap[s.id]}
                                        onStatusChange={handleStatusChange}
                                        theme={theme}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="size-20 rounded-full bg-surface-subtle flex items-center justify-center mb-4">
                                                <span className="material-symbols-outlined text-text-disabled text-4xl">group_off</span>
                                            </div>
                                            <h4 className="font-bold text-text-muted">Nenhum aluno encontrado</h4>
                                            <p className="text-sm text-text-disabled">Certifique-se de que há alunos cadastrados nesta turma.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </motion.tbody>
                    </table>
                </div>
            </div>

            {/* Students List (Mobile Cards) */}
            <div className={`md:hidden space-y-3 pb-20 ${loading ? 'opacity-70 pointer-events-none' : ''}`}>
                {students.length > 0 ? (
                    students.map((s) => (
                        <MobileAttendanceCard
                            key={s.id}
                            student={s}
                            status={attendanceMap[s.id]}
                            onStatusChange={handleStatusChange}
                            theme={theme}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="size-16 rounded-full bg-surface-subtle flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-text-disabled text-3xl">group_off</span>
                        </div>
                        <h4 className="font-bold text-text-muted">Nenhum aluno</h4>
                    </div>
                )}
            </div>
        </div>
    );
};



// Helper Component for Attendance Buttons
const AttendanceButton: React.FC<{
    active: boolean;
    onClick: () => void;
    icon: string;
    label: string;
    color: string;
}> = ({ active, onClick, icon, label, color }) => {
    const colorMap: Record<string, string> = {
        emerald: 'emerald',
        rose: 'rose',
        amber: 'amber',
        slate: 'slate'
    };

    const c = colorMap[color] || 'indigo';

    return (
        <button
            onClick={onClick}
            title={label}
            className={`flex flex-col items-center gap-1 group/btn transition-all duration-300`}
        >
            <div className={`size-10 landscape:size-8 rounded-xl flex items-center justify-center transition-all duration-300 relative ${active
                ? `bg-${c}-500 text-white shadow-md shadow-${c}-500/30 scale-105 ring-2 ring-${c}-500/10`
                : `bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:bg-${c}-50 dark:hover:bg-${c}-900/20 hover:text-${c}-500 border border-transparent`
                }`}>
                <span className={`material-symbols-outlined ${active ? 'icon-filled' : ''} text-xl landscape:text-lg`}>{icon}</span>
            </div>
            <span className={`text-[8px] font-bold uppercase tracking-tighter transition-colors ${active ? `text-${c}-500` : 'text-transparent group-hover/btn:text-slate-400'}`}>
                {label}
            </span>
        </button>
    );
};

interface AttendanceRowProps {
    student: Student;
    status: string;
    onStatusChange: (studentId: string, status: string) => void;
    theme: any;
}

// Mobile Card Component
const MobileAttendanceCard = React.memo(({ student: s, status, onStatusChange, theme }: AttendanceRowProps) => {
    return (
        <div className="bg-surface-card border border-border-default rounded-xl p-3 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-3 mb-3">
                <div className={`student-avatar size-8 text-xs bg-gradient-to-br ${s.color || `from-indigo-600 to-indigo-800`}`}>
                    {s.initials || s.name.substring(0, 2)}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs text-text-primary truncate">{s.name}</span>
                    <span className="text-[9px] uppercase font-bold text-text-muted">Nº {s.number} • ID: {s.id.substring(0, 6)}</span>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
                <AttendanceButton
                    active={status === 'P'}
                    onClick={() => onStatusChange(s.id, 'P')}
                    icon="check_circle"
                    label="Pres"
                    color="emerald"
                />
                <AttendanceButton
                    active={status === 'F'}
                    onClick={() => onStatusChange(s.id, 'F')}
                    icon="cancel"
                    label="Falta"
                    color="rose"
                />
                <AttendanceButton
                    active={status === 'J'}
                    onClick={() => onStatusChange(s.id, 'J')}
                    icon="assignment_late"
                    label="Just"
                    color="amber"
                />
                <AttendanceButton
                    active={status === 'S'}
                    onClick={() => onStatusChange(s.id, 'S')}
                    icon="event_busy"
                    label="S/A"
                    color="slate"
                />
            </div>
        </div>
    );
});

const AttendanceRow = React.memo(({ student: s, status, onStatusChange, theme }: AttendanceRowProps) => {
    return (
        <motion.tr
            variants={{
                hidden: { opacity: 0, y: 10, filter: "blur(5px)" },
                visible: {
                    opacity: 1, y: 0, filter: "blur(0px)",
                    transition: { type: 'spring', stiffness: 120, damping: 14 }
                }
            }}
            layoutId={`row-${s.id}`}
            className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all"
        >
            <td className="px-3 sm:px-8 py-3 sm:py-4 landscape:py-1.5 landscape:px-2 text-center sm:text-left">
                <span className="font-mono text-xs sm:text-sm font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 sm:px-2 py-1 rounded-lg inline-block min-w-[2.2rem] text-center">
                    {s.number.padStart(2, '0')}
                </span>
            </td>
            <td className="px-3 sm:px-8 py-3 sm:py-4 landscape:py-1.5 landscape:px-2">
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="h-6 sm:h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-2 landscape:hidden"></div>
                    <div className={`student-avatar student-avatar-sm bg-gradient-to-br ${s.color || `from-indigo-600 to-indigo-800`}`}>
                        {s.initials || s.name.substring(0, 2)}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white group-hover:text-primary transition-colors truncate max-w-[120px] sm:max-w-xs">{s.name}</span>
                        <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 uppercase tracking-tighter">ID: {s.id.substring(0, 6)}</span>
                    </div>
                </div>
            </td>
            <td className="px-3 sm:px-8 py-3 sm:py-4 landscape:py-1.5 landscape:px-2">
                <div className="flex justify-center gap-3 landscape:gap-1.5">
                    <AttendanceButton
                        active={status === 'P'}
                        onClick={() => onStatusChange(s.id, 'P')}
                        icon="check_circle"
                        label="Presente"
                        color="emerald"
                    />
                    <AttendanceButton
                        active={status === 'F'}
                        onClick={() => onStatusChange(s.id, 'F')}
                        icon="cancel"
                        label="Falta"
                        color="rose"
                    />
                    <AttendanceButton
                        active={status === 'J'}
                        onClick={() => onStatusChange(s.id, 'J')}
                        icon="assignment_late"
                        label="Justificada"
                        color="amber"
                    />
                    <AttendanceButton
                        active={status === 'S'}
                        onClick={() => onStatusChange(s.id, 'S')}
                        icon="event_busy"
                        label="Sem Aula"
                        color="slate"
                    />
                </div>
            </td>
        </motion.tr>
    );
});