import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';

interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
    label?: string;
    className?: string;
    compact?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, label, className, compact }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const theme = useTheme();
    const primaryColor = theme.primaryColor;

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

    const [viewDate, setViewDate] = useState(new Date(value || new Date()));
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
                className={`w-full flex items-center justify-between font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl transition-all duration-200 outline-none ${compact ? 'p-2.5 h-10 sm:h-11' : 'p-3 h-14 sm:h-auto'} ${isOpen ? `ring-2 ring-${primaryColor}-500/50 border-transparent bg-white dark:bg-black` : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
                <span className={`block truncate ${compact ? 'text-xs' : 'text-sm'} ${!value ? 'text-slate-400' : 'text-slate-900 dark:text-white font-bold'}`}>
                    {value ? formatDateDisplay(value) : (label || 'Selecionar data')}
                </span>
                <span className={`material-symbols-outlined text-slate-400 transition-transform duration-200 ${compact ? 'text-lg' : 'text-xl'} ${isOpen ? 'rotate-180 text-' + primaryColor + '-500' : ''}`}>
                    calendar_month
                </span>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-300"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 sm:p-3 z-50 w-[85%] max-w-[280px] max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">

                        <div className="flex items-center justify-between mb-2">
                            <button type="button" onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                                <span className="material-symbols-outlined text-sm">chevron_left</span>
                            </button>
                            <span className="font-bold text-slate-700 dark:text-slate-200 capitalize text-xs">
                                {viewDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                            </span>
                            <button type="button" onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[9px] font-black text-slate-400 py-1 uppercase tracking-widest">
                            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <div key={i}>{d}</div>)}
                        </div>

                        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                            {days.map((day, i) => {
                                if (!day) return <div key={`empty-${i}`} className="h-7 sm:h-6" />;
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => handleDateSelect(day, month, year)}
                                        className={`h-7 sm:h-6 w-full rounded-lg flex flex-col items-center justify-center relative transition-all duration-200
                                            ${isSelected(day)
                                                ? `bg-${primaryColor}-500 text-white shadow-lg shadow-${primaryColor}-500/30 font-bold scale-110 z-10`
                                                : `text-slate-600 dark:text-slate-300 hover:bg-${primaryColor}-500/10 hover:text-${primaryColor}-500`}
                                            ${isToday(day) && !isSelected(day) ? `bg-${primaryColor}-500/5 text-${primaryColor}-500 font-bold border border-${primaryColor}-500/20` : ''}
                                        `}
                                    >
                                        <span className="text-[10px] sm:text-[9px] leading-none z-10">{day}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Mobile Close Button */}
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="w-full mt-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg font-bold text-[10px] sm:hidden hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
