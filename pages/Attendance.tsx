import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 lg:p-8 landscape:p-2 z-50 w-[90%] max-w-[320px] lg:max-w-[500px] max-h-[90vh] landscape:max-h-[95vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 landscape:flex landscape:flex-row landscape:items-start landscape:gap-4 landscape:w-auto landscape:max-w-none">
                <div className="flex items-center justify-between mb-4 landscape:mb-0 landscape:flex-col landscape:gap-2 landscape:justify-center landscape:w-32 landscape:border-r landscape:border-slate-100 landscape:dark:border-slate-800 landscape:pr-2">
                    <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                        <span className="material-symbols-outlined text-lg lg:text-2xl">expand_less</span>
                    </button>
                    <span className="font-bold text-slate-700 dark:text-slate-200 capitalize text-sm lg:text-2xl text-center leading-tight">
                        {viewDate.toLocaleString('pt-BR', { month: 'long' })}<br />
                        <span className="text-xs lg:text-base text-slate-400">{viewDate.getFullYear()}</span>
                    </span>
                    <button onClick={() => changeMonth(1)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                        <span className="material-symbols-outlined text-lg lg:text-2xl">expand_more</span>
                    </button>

                    {/* Mobile Close Button moved here for landscape side layout */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="hidden landscape:flex w-full mt-auto py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors justify-center"
                    >
                        Fechar
                    </button>
                </div>

                <div className="landscape:flex-1">

                    <div className="grid grid-cols-7 gap-1 lg:gap-3 mb-2">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(day => (
                            <div key={day} className="text-center text-[10px] lg:text-sm font-bold text-slate-400 py-1 uppercase tracking-widest">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 lg:gap-3">
                        {days.map((day, i) => {
                            if (!day) return <div key={`empty-${i}`} className="h-9 w-9 lg:h-14 lg:w-14" />;
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
                                    className={`h-9 w-9 lg:h-14 lg:w-14 landscape:size-7 flex items-center justify-center rounded-full text-xs lg:text-sm font-medium transition-all ${isSelected(day as number)
                                        ? `bg-${theme.primaryColor} text-white shadow-lg shadow-${theme.primaryColor}/30 scale-110`
                                        : isToday(day as number)
                                            ? `bg-${theme.primaryColor}/10 text-${theme.primaryColor} font-bold`
                                            : hasData(day as number)
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <span className="z-10">{day}</span>
                                    {day && hasData(day) && !isSelected(day) && (
                                        <span className={`absolute bottom-0.5 w-1 h-1 rounded-full bg-emerald-500`}></span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="w-full mt-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg font-bold text-[10px] sm:hidden hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    Fechar
                </button>
            </div>
        </>

    );
};

export const Attendance: React.FC = () => {
    const { selectedSeriesId, selectedSection, activeSeries } = useClass();
    const { currentUser, activeSubject } = useAuth();
    const theme = useTheme();
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedUnit, setSelectedUnit] = useState<string>('1');
    const [viewMode, setViewMode] = useState<'daily' | 'history'>('daily');
    const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
    // State to hold ALL record dates for the calendar indicators
    const [activeDates, setActiveDates] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    useEffect(() => {
        if (selectedSeriesId && selectedSection) {
            fetchData();
        } else {
            setStudents([]);
            setAttendanceMap({});
            setLoading(false);
        }
    }, [selectedDate, selectedSeriesId, selectedSection, activeSubject, selectedUnit]);

    const fetchData = async (silent = false) => {
        if (!currentUser || !selectedSeriesId || !selectedSection) return;
        if (!silent) setLoading(true);
        try {
            // Fetch students for the current class/section
            const { data: studentsData, error: studentsError } = await supabase
                .from('students')
                .select('*')
                .eq('series_id', selectedSeriesId)
                .eq('section', selectedSection)
                .eq('user_id', currentUser.id);

            if (studentsError) throw studentsError;

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
            formattedStudents.sort((a, b) => parseInt(a.number) - parseInt(b.number));

            // Fetch attendance records for TODAY ONLY to show in table
            const { data: todaysRecords, error: attendanceError } = await supabase
                .from('attendance')
                .select('*')
                .eq('date', selectedDate)
                .eq('subject', activeSubject)
                .eq('unit', selectedUnit)
                .eq('user_id', currentUser.id)
                .in('student_id', formattedStudents.map(s => s.id));

            if (attendanceError) throw attendanceError;

            const newMap: any = {};
            formattedStudents.forEach(s => {
                const record = todaysRecords.find(r => r.student_id.toString() === s.id);
                newMap[s.id] = record ? record.status : '';
            });

            setStudents(formattedStudents);
            setAttendanceMap(newMap);

            // Fetch active dates for calendar asynchronously (non-blocking for UI table)
            fetchActiveDates(formattedStudents.map(s => s.id));

        } catch (e) {
            console.error("Fetch data failed", e);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // --- REALTIME SUBSCRIPTION ---
    useEffect(() => {
        if (!currentUser || !selectedSeriesId || !selectedSection) return;

        // Polling Fallback (Every 10s)
        const interval = setInterval(() => {
            if (!isSaving) fetchData(true);
        }, 10000);

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
            clearInterval(interval);
        };
    }, [selectedDate, selectedSeriesId, selectedSection, currentUser, activeSubject, selectedUnit]);
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
        if (!currentUser) return;
        setIsSaving(true);
        try {
            if (status === '') {
                // Delete if empty
                const { error } = await supabase
                    .from('attendance')
                    .delete()
                    .eq('student_id', studentId)
                    .eq('date', selectedDate)
                    .eq('subject', activeSubject)
                    .eq('unit', selectedUnit)
                    .eq('user_id', currentUser.id);

                if (error) throw error;
            } else {
                // Upsert if present
                const { error } = await supabase
                    .from('attendance')
                    .upsert({
                        student_id: studentId,
                        date: selectedDate,
                        status: status,
                        series_id: selectedSeriesId,
                        section: selectedSection,
                        user_id: currentUser.id,
                        subject: activeSubject,
                        unit: selectedUnit
                    }, { onConflict: 'student_id, date, user_id, subject, unit' });

                if (error) throw error;
                setActiveDates(prev => new Set(prev).add(selectedDate));
            }
        } catch (e) {
            console.error(`Failed to update ${studentId}`, e);
        } finally {
            setIsSaving(false);
        }
    };

    const markAll = async (status: string) => {
        if (!currentUser) return;
        setIsSaving(true);
        const newMap = { ...attendanceMap };
        students.forEach(s => newMap[s.id] = status);
        setAttendanceMap(newMap);
        if (status !== '') setActiveDates(prev => new Set(prev).add(selectedDate));

        try {
            const promises = students.map(async (s) => {
                if (status === '') {
                    return supabase.from('attendance')
                        .delete()
                        .eq('student_id', s.id)
                        .eq('date', selectedDate)
                        .eq('subject', activeSubject)
                        .eq('unit', selectedUnit)
                        .eq('user_id', currentUser.id);
                } else {
                    return supabase.from('attendance')
                        .upsert({
                            student_id: s.id,
                            date: selectedDate,
                            status: status,
                            series_id: selectedSeriesId,
                            section: selectedSection,
                            user_id: currentUser.id,
                            subject: activeSubject,
                            unit: selectedUnit
                        }, { onConflict: 'student_id, date, user_id, subject, unit' });
                }
            });

            await Promise.all(promises);
        } catch (e) {
            console.error("Bulk update failed", e);
        } finally {
            setTimeout(() => setIsSaving(false), 500); // Small delay to allow realtime catchup logic if needed
        }
    };

    const handleStatusChange = async (studentId: string, status: string) => {
        const currentStatus = attendanceMap[studentId];
        const newStatus = currentStatus === status ? '' : status;

        setAttendanceMap(prev => ({ ...prev, [studentId]: newStatus }));
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
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Nenhuma Série Selecionada</h3>
                <p className="text-slate-500 text-center max-w-sm mb-8">Escolha uma série no menu superior para registrar as presenças de seus alunos.</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto flex flex-col gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32 lg:pb-12">
            {/* Header Control */}
            <div className={`bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-8 relative z-30 group landscape:p-2`}>
                <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-${theme.primaryColor}/5 to-transparent rounded-full -mr-32 -mt-32 blur-3xl group-hover:from-${theme.primaryColor}/10 transition-colors duration-700`}></div>

                <div className="flex items-center gap-4 sm:gap-6 relative z-10 w-full lg:w-auto">
                    <div className={`hidden sm:flex size-14 rounded-2xl bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white items-center justify-center shadow-lg shadow-${theme.primaryColor}/20`}>
                        <span className="material-symbols-outlined text-2xl">check_circle</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">Presenças</h1>
                        <p className="text-slate-400 dark:text-slate-500 font-medium text-xs md:text-base">Frequência para <span className={`text-${theme.primaryColor} font-bold`}>{activeSeries?.name} • {selectedSection}</span></p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto relative z-10">
                    <div className="relative" ref={calendarRef}>
                        <button
                            data-tour="attendance-date"
                            onClick={() => setShowCalendar(!showCalendar)}
                            className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-${theme.primaryColor} hover:bg-white dark:hover:bg-slate-800 transition-all group/cal shadow-sm`}
                        >
                            <span className={`material-symbols-outlined text-${theme.primaryColor} group-hover/cal:scale-110 transition-transform text-xl sm:text-2xl`}>calendar_month</span>
                            <div className="flex flex-col items-start leading-none gap-0.5 sm:gap-1">
                                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Data</span>
                                <span className="font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                            <span className={`material-symbols-outlined text-slate-400 transition-transform text-lg sm:text-xl ${showCalendar ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>

                        {showCalendar && (
                            <MiniCalendar
                                currentDate={selectedDate}
                                onSelectDate={setSelectedDate}
                                activeDates={activeDates}
                                onClose={() => setShowCalendar(false)}
                                theme={theme}
                            />
                        )}
                    </div>

                    <button
                        onClick={generatePDF}
                        className={`h-11 w-11 flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:border-${theme.primaryColor} hover:text-${theme.primaryColor} text-slate-600 dark:text-slate-400 rounded-2xl transition-all shadow-sm active:scale-95`}
                        title="Exportar Relatório PDF"
                    >
                        <span className="material-symbols-outlined">description</span>
                    </button>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

                    <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700">
                        {['1', '2', '3'].map((unit) => (
                            <button
                                key={unit}
                                onClick={() => setSelectedUnit(unit)}
                                className={`h-9 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedUnit === unit
                                    ? `bg-white dark:bg-slate-700 text-${theme.primaryColor} shadow-sm ring-1 ring-slate-200 dark:ring-slate-600`
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                            >
                                {unit}ª Unid
                            </button>
                        ))}
                    </div>

                    <div className={`flex items-center gap-2 px-4 h-11 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20 font-bold text-sm ml-2`}>
                        <span className="material-symbols-outlined text-lg animate-pulse">cloud_done</span>
                        Auto-salve
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 p-1" data-tour="attendance-quick-actions">
                <button onClick={() => markAll('P')} className="flex-1 min-w-[90px] sm:min-w-[140px] flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 bg-emerald-500 text-white rounded-xl sm:rounded-2xl text-[9px] sm:text-xs font-bold hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                    <span className="material-symbols-outlined text-sm sm:text-lg">done_all</span>
                    <span className="whitespace-nowrap">Presença Geral</span>
                </button>
                <button onClick={() => markAll('F')} className="flex-1 min-w-[90px] sm:min-w-[140px] flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 rounded-xl sm:rounded-2xl text-[9px] sm:text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all border border-rose-100 dark:border-rose-900/20">
                    <span className="material-symbols-outlined text-sm sm:text-lg">close</span>
                    Faltas
                </button>
                <button onClick={() => markAll('S')} className="flex-1 min-w-[90px] sm:min-w-[140px] flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl sm:rounded-2xl text-[9px] sm:text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                    <span className="material-symbols-outlined text-sm sm:text-lg">event_busy</span>
                    Sem Aula
                </button>
                <button onClick={() => markAll('')} className="flex-1 min-w-[90px] sm:min-w-[140px] flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-xl sm:rounded-2xl text-[9px] sm:text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800">
                    <span className="material-symbols-outlined text-sm sm:text-lg">history</span>
                    Reiniciar
                </button>
            </div>

            {/* Students Table */}
            <div className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden transition-all duration-300 ${loading ? 'opacity-70 pointer-events-none' : ''}`}>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-3 sm:px-8 py-4 sm:py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest w-12 sm:w-24 text-center sm:text-left">Nº</th>
                                <th className="px-3 sm:px-8 py-4 sm:py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-left">Aluno</th>
                                <th className="px-3 sm:px-8 py-4 sm:py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Registro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
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
                                            <div className="size-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                                                <span className="material-symbols-outlined text-slate-300 text-4xl">group_off</span>
                                            </div>
                                            <h4 className="font-bold text-slate-400">Nenhum aluno encontrado</h4>
                                            <p className="text-sm text-slate-300">Certifique-se de que há alunos cadastrados nesta turma.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
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
            <div className={`size-12 landscape:size-9 rounded-2xl flex items-center justify-center transition-all duration-300 relative ${active
                ? `bg-${c}-500 text-white shadow-lg shadow-${c}-500/30 scale-110 ring-4 ring-${c}-500/10`
                : `bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:bg-${c}-50 dark:hover:bg-${c}-900/20 hover:text-${c}-500 border border-transparent`
                }`}>
                <span className={`material-symbols-outlined ${active ? 'icon-filled' : ''} text-2xl landscape:text-xl`}>{icon}</span>
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-tighter transition-colors ${active ? `text-${c}-500` : 'text-transparent group-hover/btn:text-slate-400'}`}>
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

const AttendanceRow = React.memo(({ student: s, status, onStatusChange, theme }: AttendanceRowProps) => {
    return (
        <tr className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
            <td className="px-3 sm:px-8 py-3 sm:py-4 landscape:py-1.5 landscape:px-2 text-center sm:text-left">
                <span className="font-mono text-xs sm:text-sm font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 sm:px-2 py-1 rounded-lg">
                    {s.number.padStart(2, '0')}
                </span>
            </td>
            <td className="px-3 sm:px-8 py-3 sm:py-4 landscape:py-1.5 landscape:px-2">
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="h-6 sm:h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-2 landscape:hidden"></div>
                    <div className={`size-8 sm:size-10 landscape:size-8 rounded-xl bg-gradient-to-br from-${theme.primaryColor}/10 to-${theme.secondaryColor}/10 flex items-center justify-center text-${theme.primaryColor} font-bold text-xs sm:text-sm border border-${theme.primaryColor}/10 shrink-0`}>
                        {s.name.substring(0, 1)}
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
        </tr>
    );
});