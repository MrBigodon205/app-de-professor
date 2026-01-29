import React from 'react';
import { useClass } from '../contexts/ClassContext';
import { useTheme } from '../hooks/useTheme';

interface MobileClassSelectorProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MobileClassSelector: React.FC<MobileClassSelectorProps> = ({ isOpen, onClose }) => {
    const [newSeriesName, setNewSeriesName] = React.useState('');
    const { classes, activeSeries, selectedSection, selectSeries, selectSection, addClass, removeClass } = useClass();
    const theme = useTheme();

    const handleAdd = async () => {
        if (!newSeriesName.trim()) return;
        try {
            await addClass(newSeriesName);
            setNewSeriesName('');
        } catch (error: any) {
            alert('Erro ao adicionar série: ' + error.message);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm("Excluir esta série?")) {
            try {
                await removeClass(id);
            } catch (error: any) {
                alert('Erro ao excluir: ' + error.message);
            }
        }
    };

    // Handle scroll lock
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setNewSeriesName('');
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
                onClick={onClose}
            ></div>

            {/* Modal/Drawer Content */}
            <div className={`
                relative w-[85%] max-w-[280px] bg-white dark:bg-slate-900/95 
                rounded-2xl shadow-2xl border border-slate-100 dark:border-white/5 
                flex flex-col max-h-[85vh] 
                animate-in zoom-in-95 duration-300
                overflow-hidden
            `}>
                <div className="p-4 border-b border-slate-50 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-transparent">
                    <h2 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-tight">
                        <span className={`material-symbols-outlined text-lg text-${theme.primaryColor}`}>school</span>
                        Turmas
                    </h2>
                    <button onClick={onClose} className="size-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-base">close</span>
                    </button>
                </div>

                <div className="p-4 overflow-y-auto custom-scrollbar space-y-5 flex-1">
                    {/* Add New Series */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block px-0.5">Nova Série</label>
                        <div className="flex gap-1.5">
                            <input
                                value={newSeriesName}
                                onChange={(e) => setNewSeriesName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                placeholder="Série..."
                                className="flex-1 h-9 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-3 font-bold text-xs focus:border-primary transition-all outline-none"
                            />
                            <button
                                onClick={handleAdd}
                                disabled={!newSeriesName.trim()}
                                className={`size-9 rounded-lg bg-${theme.primaryColor} text-white flex items-center justify-center shadow-md shadow-${theme.primaryColor}/20 disabled:opacity-30 transition-all active:scale-95`}
                            >
                                <span className="material-symbols-outlined text-lg">add</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block px-0.5">Séries</label>
                        <div className="grid grid-cols-1 gap-1.5">
                            {classes.map(cls => (
                                <div key={cls.id} className="group relative">
                                    <button
                                        onClick={() => selectSeries(cls.id)}
                                        className={`w-full p-2.5 rounded-xl border transition-all flex items-center justify-between group ${activeSeries?.id === cls.id
                                            ? `bg-${theme.primaryColor}/10 border-${theme.primaryColor}/30`
                                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className={`size-2 rounded-full shrink-0 ${activeSeries?.id === cls.id ? `bg-${theme.primaryColor}` : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                                            <span className={`font-black text-xs truncate ${activeSeries?.id === cls.id ? `text-${theme.primaryColor}` : 'text-slate-700 dark:text-slate-300'}`}>
                                                {cls.name}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(e, cls.id)}
                                            className="size-6 rounded-md flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {activeSeries && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 border-t border-slate-100 dark:border-white/5 pt-4 space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block px-0.5">Turmas: {activeSeries.name}</label>
                            <div className="grid grid-cols-2 gap-2">
                                {activeSeries.sections.map(section => (
                                    <button
                                        key={section}
                                        onClick={() => {
                                            selectSection(section);
                                            onClose();
                                        }}
                                        className={`py-2 px-3 rounded-xl border font-black text-xs transition-all ${selectedSection === section
                                            ? `bg-${theme.primaryColor} text-white border-${theme.primaryColor} shadow-md shadow-${theme.primaryColor}/20`
                                            : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-white/5 hover:bg-slate-100'
                                            }`}
                                    >
                                        {section}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 dark:bg-white/5 shrink-0">
                    <button onClick={onClose} className="w-full h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] tracking-widest uppercase transition-all active:scale-95 shadow-lg">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};
