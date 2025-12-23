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
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Window */}
            <div className={`
                relative w-full max-w-2xl bg-white dark:bg-slate-900 
                rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/50 
                border-t sm:border border-white/20 dark:border-slate-800 
                flex flex-col max-h-[90vh] sm:max-h-[85vh] 
                animate-in slide-in-from-bottom duration-300 sm:zoom-in-95
                overflow-hidden
            `}>

                {/* Header - Modern Gradient */}
                <div className={`relative overflow-hidden p-6 sm:p-8 shrink-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800`}>
                    {/* Decorative Elements */}
                    <div className={`absolute top-0 right-0 w-64 h-64 bg-${theme.primaryColor}/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`}></div>

                    <div className="relative z-10 flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-xl bg-${theme.primaryColor}/10 text-${theme.primaryColor}`}>
                                    <span className="material-symbols-outlined text-2xl">school</span>
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                                    Gerenciar Turmas
                                </h2>
                            </div>
                            <p className="text-sm text-slate-500 font-medium pl-1">
                                Adicione e organize suas séries e turmas.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center active:scale-95"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="p-4 sm:p-8 space-y-8">

                        {/* 1. Add New Series Input - Floating Style */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-2 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-2 sticky top-0 z-20 mx-1">
                            <input
                                value={newSeriesName}
                                onChange={(e) => setNewSeriesName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateSeries()}
                                placeholder="Criar nova série... (Ex: 3º Ano)"
                                className="flex-1 h-12 bg-transparent px-4 font-bold text-slate-700 dark:text-white placeholder:text-slate-400 placeholder:font-normal outline-none"
                            />
                            <button
                                onClick={handleCreateSeries}
                                disabled={!newSeriesName.trim()}
                                className={`h-10 px-6 rounded-xl bg-${theme.primaryColor} text-white font-bold shadow-lg shadow-${theme.primaryColor}/25 hover:shadow-${theme.primaryColor}/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none`}
                            >
                                <span className="hidden sm:inline">Adicionar</span>
                                <span className="sm:hidden material-symbols-outlined relative top-0.5">add</span>
                            </button>
                        </div>

                        {/* 2. List of Series */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                    Suas Séries
                                </label>
                                <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                    {classes.length}
                                </span>
                            </div>

                            {classes.length === 0 ? (
                                <div className="text-center py-12 px-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 opacity-60">
                                    <span className="material-symbols-outlined text-4xl mb-4 text-slate-300">library_add</span>
                                    <p className="text-slate-500 font-medium">Nenhuma série cadastrada ainda.</p>
                                    <p className="text-xs text-slate-400 mt-1">Use o campo acima para começar.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {classes.map(cls => (
                                        <div
                                            key={cls.id}
                                            className={`group relative bg-white dark:bg-slate-800 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${activeSeries?.id === cls.id
                                                ? `border-${theme.primaryColor} shadow-xl shadow-${theme.primaryColor}/10 ring-4 ring-${theme.primaryColor}/5`
                                                : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm'
                                                }`}
                                        >
                                            {/* Header of Card */}
                                            <div className="p-4 flex items-center gap-4">
                                                <button
                                                    onClick={() => selectSeries(cls.id)}
                                                    className="flex-1 flex items-center gap-4 text-left group/btn"
                                                >
                                                    <div className={`size-12 rounded-xl flex items-center justify-center transition-colors ${activeSeries?.id === cls.id ? `bg-${theme.primaryColor} text-white shadow-lg shadow-${theme.primaryColor}/30` : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                                                        <span className="material-symbols-outlined text-2xl">
                                                            {activeSeries?.id === cls.id ? 'folder_open' : 'folder'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className={`block font-bold text-lg leading-tight mb-1 ${activeSeries?.id === cls.id ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300 group-hover/btn:text-slate-800 dark:group-hover/btn:text-white'}`}>
                                                            {cls.name}
                                                        </span>
                                                        <span className="text-xs font-medium text-slate-400">
                                                            {cls.sections.length} {cls.sections.length === 1 ? 'Turma' : 'Turmas'}
                                                        </span>
                                                    </div>
                                                </button>

                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-0 focus-within:opacity-100">
                                                    <button
                                                        onClick={() => handleDeleteSeries(cls.id, cls.name)}
                                                        className="size-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors"
                                                        title="Excluir Série"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                    </button>
                                                </div>
                                                {/* Mobile visible delete just inside menu? No keep hover for desktop, persistent for mobile maybe? */}
                                                <button
                                                    onClick={() => handleDeleteSeries(cls.id, cls.name)}
                                                    className="md:hidden size-8 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-400 hover:text-red-500 flex items-center justify-center"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>

                                            {/* Expandable Section Area */}
                                            {activeSeries?.id === cls.id && (
                                                <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 fade-in">
                                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800/50">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">
                                                            Turmas desta Série
                                                        </label>

                                                        <div className="flex flex-wrap gap-2">
                                                            {cls.sections.map(sec => (
                                                                <div key={sec} className="relative group/pill">
                                                                    <button
                                                                        onClick={() => {
                                                                            selectSection(sec);
                                                                            // Optional: onClose(); if user wants instant select
                                                                        }}
                                                                        className={`relative h-10 min-w-[3.5rem] px-4 rounded-lg font-bold text-sm shadow-sm transition-all border-b-2 active:scale-95 ${selectedSection === sec
                                                                                ? `bg-white dark:bg-slate-800 text-${theme.primaryColor} border-${theme.primaryColor}`
                                                                                : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                                                            }`}
                                                                    >
                                                                        {sec}
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteSection(sec);
                                                                        }}
                                                                        className="absolute -top-2 -right-2 size-5 bg-white dark:bg-slate-700 text-red-500 rounded-full shadow-md border dark:border-slate-600 flex items-center justify-center opacity-100 md:opacity-0 group-hover/pill:opacity-100 transition-all hover:scale-110 z-10"
                                                                        title="Remover Turma"
                                                                    >
                                                                        <span className="material-symbols-outlined text-xs font-bold">close</span>
                                                                    </button>
                                                                </div>
                                                            ))}

                                                            {/* Add Section */}
                                                            <div className="h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center px-1 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                                                                <input
                                                                    className="w-16 h-full bg-transparent px-2 text-sm font-bold text-center uppercase outline-none placeholder:normal-case placeholder:font-normal"
                                                                    placeholder="Nova"
                                                                    maxLength={3}
                                                                    value={newSectionName}
                                                                    onChange={e => setNewSectionName(e.target.value)}
                                                                    onKeyDown={e => e.key === 'Enter' && handleCreateSection()}
                                                                />
                                                                <button
                                                                    onClick={handleCreateSection}
                                                                    disabled={!newSectionName.trim()}
                                                                    className={`size-8 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-${theme.primaryColor} hover:text-white text-slate-400 flex items-center justify-center transition-colors`}
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">add</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer - Only visible on Mobile if needed, usually empty or close button */}
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 sm:hidden">
                    <button
                        onClick={onClose}
                        className="w-full h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 active:scale-95 transition-all"
                    >
                        Concluído
                    </button>
                </div>
            </div>
        </div>
    );
};
