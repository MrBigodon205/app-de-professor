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

    // Reset state when opening/closing
    React.useEffect(() => {
        if (!isOpen) {
            setNewSeriesName('');
            setNewSectionName('');
        }
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
                flex flex-col max-h-[90vh] sm:max-h-[85vh] 
                animate-in slide-in-from-bottom duration-500 sm:zoom-in-95
                overflow-hidden backdrop-blur-xl
            `}>

                {/* Header */}
                <div className="relative p-7 sm:p-10 shrink-0 border-b border-slate-100 dark:border-white/5">
                    {/* Abstract design elements */}
                    <div className={`absolute top-0 right-0 w-80 h-80 bg-${theme.primaryColor}/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2`}></div>

                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className={`size-14 rounded-2xl bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white flex items-center justify-center shadow-xl shadow-${theme.primaryColor}/20`}>
                                <span className="material-symbols-outlined text-3xl">school</span>
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">
                                    Turmas
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest opacity-70">
                                    Gestão de Séries
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="size-12 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center justify-center active:scale-90"
                        >
                            <span className="material-symbols-outlined text-2xl">close</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10 pt-4 bg-transparent">
                    <div className="space-y-10">

                        {/* Series Creation Area */}
                        <div className="relative group">
                            <div className={`absolute -inset-1 bg-gradient-to-r from-${theme.primaryColor} to-${theme.secondaryColor} rounded-[2rem] blur opacity-10 group-focus-within:opacity-30 transition duration-500`}></div>
                            <div className="relative bg-slate-50 dark:bg-slate-950 rounded-[1.8rem] p-2 pr-3 border border-slate-200 dark:border-white/10 flex items-center gap-2">
                                <input
                                    value={newSeriesName}
                                    onChange={(e) => setNewSeriesName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSeries()}
                                    placeholder="Nome da nova série..."
                                    className="flex-1 h-12 bg-transparent px-5 font-black text-lg text-slate-800 dark:text-white placeholder:text-slate-400 placeholder:font-bold outline-none"
                                />
                                <button
                                    onClick={handleCreateSeries}
                                    disabled={!newSeriesName.trim()}
                                    className={`h-11 px-6 rounded-2xl bg-${theme.primaryColor} text-white font-black text-sm shadow-xl shadow-${theme.primaryColor}/30 hover:shadow-${theme.primaryColor}/50 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale disabled:scale-100 disabled:shadow-none flex items-center gap-2`}
                                >
                                    <span className="material-symbols-outlined text-lg">add</span>
                                    <span className="hidden sm:inline">ADICIONAR</span>
                                </button>
                            </div>
                        </div>

                        {/* Series List */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 px-2">
                                <span className={`size-1.5 rounded-full bg-${theme.primaryColor} shadow-[0_0_8px] shadow-${theme.primaryColor}`}></span>
                                <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                                    Suas Séries e Turmas
                                </label>
                            </div>

                            {classes.length === 0 ? (
                                <div className="text-center py-16 px-6 rounded-[2.5rem] bg-slate-50/50 dark:bg-white/[0.02] border-2 border-dashed border-slate-200 dark:border-white/10">
                                    <div className="size-20 bg-slate-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <span className="material-symbols-outlined text-4xl text-slate-400">auto_stories</span>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 font-black text-lg">Sua lista está vazia</p>
                                    <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">Crie sua primeira série acima para organizar seus alunos.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-5">
                                    {classes.map(cls => (
                                        <div
                                            key={cls.id}
                                            className={`group relative rounded-[2rem] transition-all duration-500 overflow-hidden ${activeSeries?.id === cls.id
                                                ? `bg-white dark:bg-slate-800 shadow-2xl shadow-black/20 ring-1 ring-white/20`
                                                : 'bg-slate-50/50 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.06] border border-transparent hover:border-slate-200 dark:hover:border-white/10'
                                                }`}
                                        >
                                            <div className="p-5 sm:p-6 flex flex-col gap-6">
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => selectSeries(cls.id)}
                                                        className="flex-1 flex items-center gap-5 text-left group/btn"
                                                    >
                                                        <div className={`size-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${activeSeries?.id === cls.id ? `bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white shadow-lg shadow-${theme.primaryColor}/30 scale-110` : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover/btn:scale-105 shadow-sm'}`}>
                                                            <span className="material-symbols-outlined text-2xl font-black">
                                                                {activeSeries?.id === cls.id ? 'folder_managed' : 'folder'}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className={`text-xl font-black tracking-tight transition-colors ${activeSeries?.id === cls.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover/btn:text-slate-900 dark:group-hover/btn:text-white'}`}>
                                                                {cls.name}
                                                            </span>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{cls.sections.length} turmas</span>
                                                                {activeSeries?.id === cls.id && <span className={`size-1 rounded-full bg-${theme.primaryColor}`}></span>}
                                                            </div>
                                                        </div>
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeleteSeries(cls.id, cls.name)}
                                                        className="size-11 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all hover:scale-110 active:scale-90 flex items-center justify-center"
                                                        title="Excluir"
                                                    >
                                                        <span className="material-symbols-outlined text-xl">delete</span>
                                                    </button>
                                                </div>

                                                {/* Sections Pills Area */}
                                                {activeSeries?.id === cls.id && (
                                                    <div className="bg-slate-100/50 dark:bg-slate-950/50 rounded-[1.5rem] p-5 space-y-4 animate-in zoom-in-95 duration-500">
                                                        <div className="flex flex-wrap gap-3">
                                                            {cls.sections.map(sec => (
                                                                <div key={sec} className="relative group/pill">
                                                                    <button
                                                                        onClick={() => selectSection(sec)}
                                                                        className={`relative h-12 min-w-[4rem] px-5 rounded-full font-black text-base transition-all duration-500 flex items-center justify-center active:scale-90 ${selectedSection === sec
                                                                            ? `bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white shadow-[0_0_20px] shadow-${theme.primaryColor}/40 ring-2 ring-${theme.primaryColor}`
                                                                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5 hover:border-slate-400 dark:hover:border-white/20'
                                                                            }`}
                                                                    >
                                                                        {sec}
                                                                        {selectedSection === sec && (
                                                                            <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-${theme.primaryColor} animate-pulse`}></span>
                                                                        )}
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteSection(sec);
                                                                        }}
                                                                        className="absolute -top-1 -right-1 size-6 bg-white dark:bg-slate-700 text-red-500 rounded-full shadow-lg border dark:border-white/10 flex items-center justify-center opacity-0 group-hover/pill:opacity-100 transition-all hover:scale-110 z-10"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[14px] font-black">close</span>
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
                                                                className={`h-12 px-6 rounded-full border-2 border-dashed border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-400 hover:border-${theme.primaryColor} hover:text-white hover:bg-${theme.primaryColor} flex items-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95 group/nova shadow-sm hover:shadow-lg hover:shadow-${theme.primaryColor}/20`}
                                                                title="Adicionar Turma (Automático)"
                                                            >
                                                                <span className="material-symbols-outlined text-lg font-black">add</span>
                                                                <span className="text-xs font-black uppercase tracking-widest">Nova</span>
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
                <div className="p-6 pt-0 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full h-14 rounded-[1.8rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm tracking-[0.2em] shadow-2xl hover:scale-[0.98] active:scale-95 transition-all duration-300"
                    >
                        FECHAR
                    </button>
                </div>
            </div>
        </div>
    );
};
