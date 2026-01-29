import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';

interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
    label?: string;
    className?: string;
    compact?: boolean;
    marks?: string[]; // Dates to show with a dot
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, label, className, compact, marks = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const theme = useTheme();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const handleDateSelect = (day: number, month: number, year: number) => {
        const date = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        onChange(date);
        setIsOpen(false);
    };

    const [viewDate, setViewDate] = useState(new Date(value ? value + 'T12:00:00' : new Date()));
    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();

    const changeMonth = (offset: number) => {
        setViewDate(new Date(year, month + offset, 1));
    };

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const isToday = (day: number) => {
        const today = new Date();
        return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
    };

    const isSelected = (day: number) => {
        if (!value) return false;
        const [vYear, vMonth, vDay] = value.split('-').map(Number);
        return vDay === day && vMonth === (month + 1) && vYear === year;
    };

    // Helper for marks
    const hasMark = (day: number) => {
        if (!marks.length) return false;
        const checkDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        return marks.includes(checkDate);
    };

    return (
        <div className={`relative ${className || ''}`} ref={containerRef}>
            {label && (
                <label className={`block font-black uppercase text-slate-400 tracking-widest ml-1 ${compact ? 'text-[9px] mb-1' : 'text-[10px] mb-2'}`}>
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl transition-all duration-200 outline-none ${compact ? 'p-2.5 h-10 sm:h-11' : 'p-3 h-14 sm:h-auto'} ${isOpen ? `ring-2 border-transparent bg-white dark:bg-black theme-ring-primary` : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
                <span className={`block truncate ${compact ? 'text-xs' : 'text-sm'} ${!value ? 'text-slate-400' : 'text-slate-900 dark:text-white font-bold'}`}>
                    {value ? formatDateDisplay(value) : (label || 'Selecionar data')}
                </span>
                <span
                    className={`material-symbols-outlined text-slate-400 transition-transform duration-200 ${compact ? 'text-lg' : 'text-xl'} ${isOpen ? 'rotate-180 theme-text-primary' : ''}`}
                >
                    calendar_month
                </span>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 animate-in fade-in duration-300"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 dark:border-slate-700 p-4 lg:p-8 landscape:p-2 z-50 w-[90%] max-w-[320px] lg:max-w-[500px] max-h-[90vh] landscape:max-h-[95vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 landscape:flex landscape:flex-row landscape:items-start landscape:gap-4 landscape:w-auto landscape:max-w-none">

                        {/* Decorative background glow */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 theme-bg-primary"></div>
                            <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-20 theme-bg-secondary"></div>
                        </div>

                        <div className="relative flex items-center justify-between mb-4 landscape:mb-0 landscape:flex-col landscape:gap-2 landscape:justify-center landscape:w-32 landscape:border-r landscape:border-slate-200/50 landscape:dark:border-slate-700/50 landscape:pr-2">
                            <button type="button" onClick={() => changeMonth(-1)} className="p-3 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-xl text-slate-500 transition-colors">
                                <span className="material-symbols-outlined text-lg lg:text-2xl">expand_less</span>
                            </button>
                            <span className="font-bold text-slate-800 dark:text-white capitalize text-sm lg:text-2xl text-center leading-tight">
                                {viewDate.toLocaleString('pt-BR', { month: 'long' })}<br />
                                <span className="text-xs lg:text-base text-slate-400 font-mono">{viewDate.getFullYear()}</span>
                            </span>
                            <button type="button" onClick={() => changeMonth(1)} className="p-3 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-xl text-slate-500 transition-colors">
                                <span className="material-symbols-outlined text-lg lg:text-2xl">expand_more</span>
                            </button>

                            {/* Mobile Close Button moved here for landscape side layout */}
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="hidden landscape:flex w-full mt-auto py-2 bg-slate-100/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors justify-center"
                            >
                                Fechar
                            </button>
                        </div>

                        <div className="relative landscape:flex-1">

                            <div className="grid grid-cols-7 gap-1 lg:gap-3 mb-2 text-center text-[10px] lg:text-sm font-black text-slate-400 py-1 uppercase tracking-widest">
                                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <div key={i}>{d}</div>)}
                            </div>

                            <div className="grid grid-cols-7 gap-1 lg:gap-3">
                                {days.map((day, i) => {
                                    if (!day) return <div key={`empty-${i}`} className="h-9 w-9 lg:h-14 lg:w-14" />; // Placeholder spacing
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => handleDateSelect(day, month, year)}
                                            className={`h-9 w-9 lg:h-14 lg:w-14 landscape:h-8 landscape:w-8 flex flex-col items-center justify-center rounded-full relative transition-all duration-200 mx-auto group ${isSelected(day) ? 'theme-bg-primary text-white theme-shadow-primary' :
                                                isToday(day) ? 'theme-bg-surface-subtle theme-text-primary' : ''
                                                }`}
                                        >
                                            <span
                                                className={`text-xs lg:text-sm leading-none z-10 ${isSelected(day) ? 'font-black scale-110' :
                                                    isToday(day) ? 'font-bold' :
                                                        hasMark(day) ? 'font-black text-emerald-500' :
                                                            'text-slate-600 dark:text-slate-300 group-hover:bg-slate-100 dark:group-hover:bg-slate-800'
                                                    }`}
                                            >
                                                {day}
                                            </span>
                                            {hasMark(day) && !isSelected(day) && (
                                                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500"></div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Mobile Close Button */}
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="w-full mt-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest lg:hidden landscape:hidden hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </>
            )
            }
        </div >
    );
};
