import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';

interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
    label?: string;
    activeDates?: Set<string>; // Optional dots for dates with data
    className?: string; // Additional classes for the container
}

export const DatePicker: React.FC<DatePickerProps> = ({
    value,
    onChange,
    label = 'Data',
    activeDates = new Set(),
    className = ''
}) => {
    const theme = useTheme();
    const [showCalendar, setShowCalendar] = useState(false);
    const [viewDate, setViewDate] = useState(() => {
        // Initialize viewDate safely
        return value ? new Date(value + 'T12:00:00') : new Date();
    });
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

    // Sync viewDate when value changes externally
    useEffect(() => {
        if (value) {
            setViewDate(new Date(value + 'T12:00:00'));
        }
    }, [value]);

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
        if (!value) return false;
        const d = new Date(value + 'T12:00:00');
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

    // Format for display: "12 de Out" or "12/10/2023"
    const displayValue = value
        ? new Date(value + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Selecione...';

    return (
        <div className={`flex flex-col ${className}`}>
            {label && <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">{label}</label>}
            <div className="relative" ref={calendarRef}>
                <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-${theme.primaryColor}/50 outline-none`}
                    type="button"
                >
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                        <span className={`material-symbols-outlined text-${theme.primaryColor}`}>calendar_month</span>
                        <span className="font-semibold text-sm">{displayValue}</span>
                    </div>
                </button>

                {showCalendar && (
                    <div className="absolute top-full left-0 mt-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-[9999] w-[280px] animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500" type="button">
                                <span className="material-symbols-outlined text-sm">chevron_left</span>
                            </button>
                            <span className="font-bold text-slate-700 dark:text-slate-200 capitalize text-sm">
                                {viewDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                            </span>
                            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500" type="button">
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                                <div key={i} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {days.map((day, i) => {
                                if (!day) return <div key={`empty-${i}`} className="h-8" />;
                                return (
                                    <button
                                        key={day}
                                        onClick={() => {
                                            const newDateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                                            onChange(newDateStr);
                                            setShowCalendar(false);
                                        }}
                                        className={`h-8 w-8 rounded-lg flex flex-col items-center justify-center relative transition-all
                                            ${isSelected(day)
                                                ? `bg-${theme.primaryColor} text-white shadow-md shadow-${theme.primaryColor}/20 font-bold`
                                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}
                                            ${isToday(day) && !isSelected(day) ? `bg-${theme.primaryColor}/10 text-${theme.primaryColor} font-bold border border-${theme.primaryColor}/20` : ''}
                                        `}
                                        type="button"
                                    >
                                        <span className="text-xs leading-none z-10">{day}</span>
                                        {hasData(day) && !isSelected(day) && (
                                            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500"></span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
