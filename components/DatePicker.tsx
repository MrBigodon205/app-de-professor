interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
    label?: string;
    theme?: any;
    className?: string; // Added prop
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, label, theme, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    // ... (rest of code)

    // Use passed theme or fallback
    const primaryColor = theme?.primaryColor || 'indigo';

    return (
        <div className={`relative ${className || ''}`} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-left transition-all duration-200 ${isOpen ? `ring-2 ring-${primaryColor}-500 border-transparent` : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
            >
                <span className={`block truncate ${!value ? 'text-slate-400' : 'text-slate-900 dark:text-white font-medium'}`}>
                    {value ? formatDateDisplay(value) : (label || 'Selecionar data')}
                </span>
                <span className={`material-symbols-outlined text-slate-400 text-xl transition-transform duration-200 ${isOpen ? 'rotate-180 text-' + primaryColor + '-500' : ''}`}>
                    calendar_month
                </span>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 w-[300px] sm:w-full min-w-[300px] animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-4">
                        <button type="button" onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </button>
                        <span className="font-bold text-slate-700 dark:text-slate-200 capitalize">
                            {viewDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                        </span>
                        <button type="button" onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                            <div key={i} className="text-center text-[10px] font-black text-slate-400 py-1 uppercase tracking-widest">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, i) => {
                            if (!day) return <div key={`empty-${i}`} className="h-9" />;
                            const selected = isSelected(day);
                            const today = isToday(day);

                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => handleSelect(day)}
                                    className={`
                                        h-9 w-full rounded-lg text-sm font-medium transition-all duration-200 relative group
                                        ${selected
                                            ? `bg-${primaryColor}-500 text-white shadow-md transform scale-105`
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }
                                        ${today && !selected ? `ring-1 ring-${primaryColor}-500 text-${primaryColor}-600 dark:text-${primaryColor}-400 font-bold bg-${primaryColor}-50 dark:bg-${primaryColor}-900/20` : ''}
                                    `}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
