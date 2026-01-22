import React, { useState } from 'react';
import { useClass } from '../contexts/ClassContext';
import { useTheme } from '../hooks/useTheme';

interface ClassManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ClassManager: React.FC<ClassManagerProps> = ({ isOpen, onClose }) => {
    const {
        classes,
        activeSeries,
        selectedSection,
        selectSeries,
        selectSection,
        addClass,
        removeClass,
        addSection,
        removeSection
    } = useClass();

    const theme = useTheme();

    const [newSeriesName, setNewSeriesName] = useState('');
    const [newSectionName, setNewSectionName] = useState('');

    // Reset state and handle scroll lock
    React.useEffect(() => {
        if (!isOpen) {
            setNewSeriesName('');
            setNewSectionName('');
            document.body.style.overflow = 'unset';
        } else {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleCreateSeries = async () => {
        if (!newSeriesName.trim()) return;
        try {
            await addClass(newSeriesName);
            setNewSeriesName('');
            // alert('Série criada com sucesso!'); // Removed for smoother UX, maybe add toast later
        } catch (error: any) {
            alert('Erro ao criar série: ' + error.message);
        }
    };

    const handleDeleteSeries = async (id: string, name: string) => {
        if (window.confirm(`Tem certeza que deseja excluir a série "${name}" e todos os seus alunos?`)) {
            try {
                await removeClass(id);
            } catch (error: any) {
                alert('Erro ao excluir série: ' + error.message);
            }
        }
    };

    const handleCreateSection = async () => {
        if (!activeSeries || !newSectionName.trim()) return;
        try {
            await addSection(activeSeries.id, newSectionName.toUpperCase());
            setNewSectionName('');
        } catch (error: any) {
            alert('Erro ao criar turma: ' + error.message);
        }
    };

    const handleDeleteSection = async (section: string) => {
        if (!activeSeries) return;
        if (window.confirm(`Excluir turma "${section}"?`)) {
            try {
                await removeSection(activeSeries.id, section);
            } catch (error: any) {
                alert('Erro ao excluir turma: ' + error.message);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop with Blur */}
            <div
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-500"
                onClick={onClose}
            ></div>

            {/* Modal Window - Glassmorphism style */}
            <div className={`
                relative w-full max-w-2xl bg-white/90 dark:bg-slate-900/95 
                rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] 
                border-t sm:border border-white/50 dark:border-white/10 
                flex flex-col max-h-[90vh] sm:max-h-[85vh] landscape:max-h-[96dvh]
                animate-in slide-in-from-bottom duration-500 sm:zoom-in-95
                overflow-hidden backdrop-blur-xl
            `}>

                {/* Header */}
                <div className="relative p-5 sm:p-6 shrink-0 border-b border-slate-100 dark:border-white/5">
                    {/* Abstract design elements */}
                    <div className={`absolute top-0 right-0 w-64 h-64 bg-[var(--theme-primary)]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2`}></div>

                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`size-10 rounded-xl bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white flex items-center justify-center shadow-lg shadow-[var(--theme-primary)]/20`}>
                                <span className="material-symbols-outlined text-xl">school</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                                    Turmas
                                </h2>
                                <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest opacity-70">
                                    Gestão de Séries
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="size-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center justify-center active:scale-90"
                        >
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-8 pt-4 bg-transparent">
                    <div className="space-y-6">

                        {/* Series Creation Area */}
                        <div className="relative group">
                            <div className={`absolute -inset-1 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] rounded-2xl blur opacity-5 group-focus-within:opacity-20 transition duration-500`}></div>
                            <div className="relative bg-slate-50 dark:bg-slate-950 rounded-xl p-1.5 pr-2 border border-slate-200 dark:border-white/10 flex items-center gap-2">
                                <input
                                    value={newSeriesName}
                                    onChange={(e) => setNewSeriesName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSeries()}
                                    placeholder="Nova série..."
                                    className="flex-1 h-10 bg-transparent px-3 font-bold text-sm text-slate-800 dark:text-white placeholder:text-slate-400 placeholder:font-bold outline-none"
                                />
                                <button
                                    onClick={handleCreateSeries}
                                    disabled={!newSeriesName.trim()}
                                    className={`h-9 px-4 rounded-lg bg-[var(--theme-primary)] text-white font-black text-[10px] shadow-lg shadow-[var(--theme-primary)]/30 hover:shadow-[var(--theme-primary)]/50 transition-all disabled:opacity-30 disabled:grayscale disabled:scale-100 disabled:shadow-none flex items-center gap-1.5`}
                                >
                                    <span className="material-symbols-outlined text-base">add</span>
                                    <span>ADICIONAR</span>
                                </button>
                            </div>
                        </div>

                        {/* Series List */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <span className={`size-1 rounded-full bg-[var(--theme-primary)]`}></span>
                                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                    Séries e Turmas
                                </label>
                            </div>

                            {classes.length === 0 ? (
                                <div className="text-center py-10 px-4 rounded-3xl bg-slate-50/50 dark:bg-white/[0.02] border-2 border-dashed border-slate-200 dark:border-white/10">
                                    <div className="size-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <span className="material-symbols-outlined text-3xl text-slate-400">auto_stories</span>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 font-black text-base">Sua lista está vazia</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {classes.map(cls => (
                                        <div
                                            key={cls.id}
                                            className={`group relative rounded-2xl transition-all duration-300 overflow-hidden ${activeSeries?.id === cls.id
                                                ? `bg-white dark:bg-slate-800 shadow-xl shadow-black/10 ring-1 ring-slate-100 dark:ring-white/10`
                                                : 'bg-slate-50/50 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.06] border border-transparent hover:border-slate-100 dark:hover:border-white/5'
                                                }`}
                                        >
                                            <div className="p-4 flex flex-col gap-4">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => selectSeries(cls.id)}
                                                        className="flex-1 flex items-center gap-3 text-left group/btn"
                                                    >
                                                        <div className={`size-12 rounded-xl flex items-center justify-center transition-all duration-300 ${activeSeries?.id === cls.id ? `bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white shadow-md shadow-[var(--theme-primary)]/20` : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500'}`}>
                                                            <span className="material-symbols-outlined text-2xl">
                                                                {activeSeries?.id === cls.id ? 'folder_managed' : 'folder'}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col leading-tight">
                                                            <span className={`text-lg font-black tracking-tight ${activeSeries?.id === cls.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                                {cls.name}
                                                            </span>
                                                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{cls.sections.length} turmas</span>
                                                        </div>
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeleteSeries(cls.id, cls.name)}
                                                        className="size-9 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all flex items-center justify-center opacity-100"
                                                        title="Excluir"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                    </button>
                                                </div>

                                                {/* Sections Pills Area */}
                                                {activeSeries?.id === cls.id && (
                                                    <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-4 space-y-3 animate-in zoom-in-95 duration-500">
                                                        <div className="flex flex-wrap gap-2.5">
                                                            {cls.sections.map(sec => (
                                                                <div key={sec} className="relative group/pill">
                                                                    <button
                                                                        onClick={() => selectSection(sec)}
                                                                        className={`relative h-11 min-w-[3.5rem] px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center active:scale-90 ${selectedSection === sec
                                                                            ? `bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white shadow-md shadow-[var(--theme-primary)]/30 ring-1 ring-[var(--theme-primary)]`
                                                                            : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-white/5'
                                                                            }`}
                                                                    >
                                                                        {sec}
                                                                        {selectedSection === sec && (
                                                                            <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-[var(--theme-primary)]`}></span>
                                                                        )}
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteSection(sec);
                                                                        }}
                                                                        className="absolute -top-1.5 -right-1.5 size-5 bg-white dark:bg-slate-700 text-red-500 rounded-full shadow-md border dark:border-white/5 flex items-center justify-center opacity-0 group-hover/pill:opacity-100 transition-all active:scale-95 z-10"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[12px] font-black">close</span>
                                                                    </button>
                                                                </div>
                                                            ))}

                                                            {/* Add Section Button - PREMIUM NOVA PILL (DASHED) */}
                                                            <button
                                                                onClick={async () => {
                                                                    if (activeSeries) {
                                                                        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                                                                        const existingLetters = activeSeries.sections
                                                                            .filter(sec => sec.length === 1)
                                                                            .map(sec => sec.toUpperCase());

                                                                        let nextLetter = 'A';
                                                                        if (existingLetters.length > 0) {
                                                                            const sorted = [...new Set(existingLetters)].sort();
                                                                            const lastLetter = sorted[sorted.length - 1];
                                                                            const lastIndex = alphabet.indexOf(lastLetter as string);
                                                                            if (lastIndex !== -1 && lastIndex < alphabet.length - 1) {
                                                                                nextLetter = alphabet[lastIndex + 1];
                                                                            }
                                                                        }
                                                                        await addSection(activeSeries.id, nextLetter);
                                                                    }
                                                                }}
                                                                className={`h-11 px-6 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/5 bg-transparent text-slate-400 hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)] flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 group/nova`}
                                                                title="Nova Turma"
                                                            >
                                                                <span className="material-symbols-outlined text-base">add</span>
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Nova</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer with elegant close */}
                <div className="p-5 pt-0 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs tracking-[0.2em] shadow-xl hover:scale-[0.98] active:scale-95 transition-all duration-300"
                    >
                        FECHAR
                    </button>
                </div>
            </div>
        </div>
    );
};
