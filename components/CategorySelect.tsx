import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';

interface CategorySelectProps {
    value: string;
    onChange: (category: string) => void;
    label?: string;
    className?: string;
    compact?: boolean;
}

const CATEGORIES = [
    { id: 'Indisciplina', icon: 'gavel', color: 'rose' },
    { id: 'Atraso', icon: 'schedule', color: 'amber' },
    { id: 'Não Fez Tarefa', icon: 'assignment_late', color: 'rose' },
    { id: 'Elogio', icon: 'star', color: 'emerald' },
    { id: 'Falta de Material', icon: 'inventory_2', color: 'rose' },
    { id: 'Uso de Celular', icon: 'smartphone', color: 'rose' },
    { id: 'Alerta', icon: 'priority_high', color: 'rose' },
];

export const CategorySelect: React.FC<CategorySelectProps> = ({ value, onChange, label, className, compact }) => {
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
    }, [isOpen]);

    const selectedCategory = CATEGORIES.find(c => c.id === value) || CATEGORIES[0];

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
                className={`w-full flex items-center justify-between font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl transition-all duration-200 outline-none ${compact ? 'p-2.5 h-10 sm:h-11' : 'p-3 h-14 sm:h-auto'} ${isOpen ? `ring-2 ring-${theme.primaryColor}-500/50 border-transparent bg-white dark:bg-black` : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
                <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-lg text-${selectedCategory.color}-500`}>
                        {selectedCategory.icon}
                    </span>
                    <span className={`block truncate ${compact ? 'text-xs' : 'text-sm'} ${!value ? 'text-slate-400' : 'text-slate-900 dark:text-white font-bold'}`}>
                        {value || (label || 'Selecionar')}
                    </span>
                </div>
                <span className={`material-symbols-outlined text-slate-400 transition-transform duration-200 ${compact ? 'text-lg' : 'text-xl'} ${isOpen ? 'rotate-180 text-' + theme.primaryColor + '-500' : ''}`}>
                    expand_more
                </span>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-300"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 lg:p-6 z-50 w-[90%] max-w-[320px] lg:max-w-[400px] landscape:max-w-3xl landscape:w-[95%] animate-in fade-in zoom-in-95 duration-200 landscape:max-h-[90vh] landscape:overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <span className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-[10px] lg:text-xs">
                                Selecione uma Categoria
                            </span>
                            <button type="button" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-2 landscape:grid-cols-2 lg:landscape:grid-cols-3">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(cat.id);
                                        setIsOpen(false);
                                    }}
                                    className={`flex items-center gap-4 p-3 lg:p-4 landscape:p-2 rounded-xl transition-all duration-200 text-left
                                        ${value === cat.id
                                            ? `bg-${cat.color}-500/10 text-${cat.color}-600 dark:text-${cat.color}-400 ring-2 ring-${cat.color}-500/20`
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                                        }`}
                                >
                                    <div className={`size-10 lg:size-12 rounded-full flex items-center justify-center ${value === cat.id ? `bg-${cat.color}-500 text-white shadow-lg shadow-${cat.color}-500/30` : `bg-slate-100 dark:bg-slate-800 text-${cat.color}-500`}`}>
                                        <span className="material-symbols-outlined text-xl lg:text-2xl">{cat.icon}</span>
                                    </div>
                                    <span className={`font-bold text-sm lg:text-base ${value === cat.id ? 'translate-x-1' : ''} transition-transform`}>
                                        {cat.id}
                                    </span>
                                    {value === cat.id && (
                                        <span className="material-symbols-outlined ml-auto text-emerald-500">check_circle</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
