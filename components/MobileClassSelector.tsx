import React from 'react';
import { useClass } from '../contexts/ClassContext';
import { useTheme } from '../hooks/useTheme';

interface MobileClassSelectorProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MobileClassSelector: React.FC<MobileClassSelectorProps> = ({ isOpen, onClose }) => {
    const { classes, activeSeries, selectedSection, selectClass, selectSection } = useClass();
    const theme = useTheme();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity animate-in fade-in"
                onClick={onClose}
            ></div>

            {/* Modal/Drawer Content */}
            <div className="w-full sm:w-[500px] bg-white dark:bg-surface-dark sm:rounded-2xl rounded-t-3xl shadow-2xl pointer-events-auto transform transition-transform animate-in slide-in-from-bottom-full duration-300 max-h-[85vh] flex flex-col">
                {/* Handle for resizing (visual only) */}
                <div className="w-full flex justify-center pt-3 pb-2 sm:hidden">
                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                </div>

                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className={`material-symbols-outlined text-${theme.primaryColor}`}>school</span>
                        Selecionar Turma
                    </h2>
                    <button onClick={onClose} className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Séries Disponíveis</label>
                        <div className="grid grid-cols-1 gap-3">
                            {classes.map(cls => (
                                <button
                                    key={cls.id}
                                    onClick={() => {
                                        selectClass(cls.id);
                                    }}
                                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${activeSeries?.id === cls.id
                                            ? `bg-${theme.primaryColor}/5 border-${theme.primaryColor} shadow-sm ring-1 ring-${theme.primaryColor}`
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                        }`}
                                >
                                    <span className={`font-bold ${activeSeries?.id === cls.id ? `text-${theme.primaryColor}` : 'text-slate-700 dark:text-slate-200'}`}>
                                        {cls.name}
                                    </span>
                                    {activeSeries?.id === cls.id && (
                                        <span className={`material-symbols-outlined text-${theme.primaryColor}`}>check_circle</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {activeSeries && (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Turmas da Série {activeSeries.name}</label>
                            <div className="flex flex-wrap gap-3">
                                {activeSeries.sections.map(section => (
                                    <button
                                        key={section}
                                        onClick={() => {
                                            selectSection(section);
                                            onClose();
                                        }}
                                        className={`flex-1 min-w-[80px] py-3 px-4 rounded-xl border font-bold text-lg transition-all ${selectedSection === section
                                                ? `bg-${theme.primaryColor} text-white border-${theme.primaryColor} shadow-lg shadow-${theme.primaryColor}/30`
                                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <div className="text-[10px] opacity-70 font-normal uppercase">Turma</div>
                                        {section}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl sm:rounded-b-2xl">
                    <button onClick={onClose} className="w-full py-3.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};
