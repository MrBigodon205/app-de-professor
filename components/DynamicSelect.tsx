import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useTheme } from '../hooks/useTheme';

export interface SelectOption {
    value: string;
    label: string;
    icon?: string;
    color?: string;
}

interface DynamicSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    label?: string;
    placeholder?: string;
    className?: string;
    compact?: boolean;
}

export const DynamicSelect: React.FC<DynamicSelectProps> = ({
    value,
    onChange,
    options,
    label,
    placeholder = 'Selecione...',
    className,
    compact
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const theme = useTheme();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const isOutsideContainer = containerRef.current && !containerRef.current.contains(target);
            const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);

            // Close only if click is outside BOTH the trigger container AND the dropdown portal
            if (isOutsideContainer && isOutsideDropdown) {
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

    const selectedOption = options.find(o => o.value === value);

    const dropdownContent = (
        <>
            {/* Backdrop - Optional: Clicking here is handled by handleClickOutside if we treat it as 'outside'
                BUT since it's an overlay, we might want explicit click handling or just let mousedown handle it.
                If we keep the onClick here, it's redundant if the backdrop covers the screen and is 'outside' the refs.
                Actually, the backdrop IS the portal root's sibling mostly.
                Let's put the Ref on the Modal wrapper itself mainly.
            */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] animate-in fade-in duration-300"
            // No onClick needed if we rely on outside click, but explicit is safer for UX?
            // Actually if we click backdrop, it IS outside dropdownRef, so handleClickOutside will close it.
            />

            {/* Modal */}
            <div
                ref={dropdownRef}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 lg:p-6 z-[10000] w-[92%] max-w-[20rem] lg:max-w-[25rem] landscape:max-w-3xl landscape:w-[94%] animate-in fade-in zoom-in-95 duration-200 landscape:max-h-[85vh] landscape:overflow-y-auto custom-scrollbar"
            >
                <div className="flex items-center justify-between mb-4 px-1">
                    <span className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-[0.65rem] lg:text-[0.75rem]">
                        {label || placeholder}
                    </span>
                    <button type="button" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* List - Vertical but optimized for Landscape with Grid */}
                <div className="grid grid-cols-1 gap-2 landscape:grid-cols-2 lg:landscape:grid-cols-3 landscape:gap-1.5">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                            className={`flex items-center gap-4 p-3 lg:p-4 landscape:p-2.5 rounded-xl transition-all duration-200 text-left
                                ${value === opt.value
                                    ? `bg-${theme.primaryColor}/10 text-${theme.primaryColor} ring-2 ring-${theme.primaryColor}/20`
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}
                        >
                            {opt.icon && (
                                <div className={`size-10 lg:size-12 landscape:size-9 rounded-full flex items-center justify-center ${value === opt.value ? `bg-${theme.primaryColor} text-white shadow-lg shadow-${theme.primaryColor}/30` : `bg-slate-100 dark:bg-slate-800 text-slate-500`}`}>
                                    <span className="material-symbols-outlined text-xl lg:text-2xl landscape:text-lg">{opt.icon}</span>
                                </div>
                            )}
                            <span className={`font-bold text-sm lg:text-base landscape:text-sm ${value === opt.value ? 'translate-x-1' : ''} transition-transform flex-1`}>
                                {opt.label}
                            </span>
                            {value === opt.value && (
                                <span className={`material-symbols-outlined ml-auto text-${theme.primaryColor}`}>check_circle</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );

    return (
        <div className={`relative ${className || ''}`} ref={containerRef}>
            {label && (
                <label className={`block font-black uppercase text-slate-400 tracking-widest ml-1 ${compact ? 'text-[0.6rem] mb-1' : 'text-[0.65rem] mb-2'}`}>
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={`w-full flex items-center justify-between font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl transition-all duration-200 outline-none ${compact ? 'p-2.5 h-10 sm:h-11' : 'p-3 h-14 sm:h-auto'} ${isOpen ? `ring-2 ring-${theme.primaryColor}-500/50 border-transparent bg-white dark:bg-black` : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {selectedOption?.icon && (
                        <span className={`material-symbols-outlined text-lg text-${selectedOption.color || theme.primaryColor}-500`}>
                            {selectedOption.icon}
                        </span>
                    )}
                    <span className={`block truncate ${compact ? 'text-xs' : 'text-sm'} ${!value ? 'text-slate-400' : 'text-slate-900 dark:text-white font-bold'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <span className={`material-symbols-outlined text-slate-400 transition-transform duration-200 ${compact ? 'text-lg' : 'text-xl'} ${isOpen ? 'rotate-180 text-' + theme.primaryColor + '-500' : ''}`}>
                    expand_more
                </span>
            </button>

            {isOpen && ReactDOM.createPortal(dropdownContent, document.body)}
        </div>
    );
};
