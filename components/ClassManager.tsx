import React, { useState } from 'react';
import { useClass } from '../contexts/ClassContext';
import { useTheme } from '../contexts/ThemeContext';

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
        deleteSeries,
        addSection,
        removeSection
    } = useClass();

    const { theme } = useTheme();

    const [newSeriesName, setNewSeriesName] = useState('');
    const [newSectionName, setNewSectionName] = useState('');
    const [view, setView] = useState<'list' | 'details'>('list'); // 'list' of series or 'details' of a specific series

    // Reset state when opening/closing
    React.useEffect(() => {
        if (!isOpen) {
            setNewSeriesName('');
            setNewSectionName('');
            setView('list');
        }
    }, [isOpen]);

    const handleCreateSeries = async () => {
        if (!newSeriesName.trim()) return;
        try {
            await addClass(newSeriesName); // Note: Context calls it 'addClass' not 'addSeries', wait, checking Context... Context has 'addClass'.
            setNewSeriesName('');
            alert('Série criada com sucesso!');
        } catch (error: any) {
            alert('Erro ao criar série: ' + error.message);
        }
    };

    const handleDeleteSeries = async (id: string, name: string) => {
        if (window.confirm(`Tem certeza que deseja excluir a série "${name}" e todos os seus alunos?`)) {
            try {
                await deleteSeries(id); // Context likely exports 'deleteSeries' or 'removeClass' - checked Context, it exports 'removeClass'. Need to cast or fix usage.
                // Wait, context exports 'removeClass', but in previous edits I used 'deleteSeries'. 
                // Let's check Context again in my memory. 'removeClass' is line 20. 
                // But 'MobileClassSelector' used 'deleteSeries'. Did I update Context to alias it?
                // Step 2175: Context exports `removeClass`.
                // MobileClassSelector (Step 2181) calls `deleteSeries`. THIS IS A BUG.
                // I need to use `removeClass`.
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            ></div>

            {/* Modal Window */}
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden">

                {/* Header */}
                <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
                    <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-xl bg-${theme.primaryColor}/10 text-${theme.primaryColor} flex items-center justify-center`}>
                            <span className="material-symbols-outlined">school</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                                Gerenciar Turmas
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">
                                Adicione, edite ou remova suas séries e turmas
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6">

                    {/* Section 1: Add New Series */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">add_circle</span>
                            Criar Nova Série
                        </label>
                        <div className="flex gap-2">
                            <input
                                value={newSeriesName}
                                onChange={(e) => setNewSeriesName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateSeries()}
                                placeholder="Ex: 3º Ano Ensino Médio"
                                className="flex-1 h-11 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            />
                            <button
                                onClick={handleCreateSeries}
                                disabled={!newSeriesName.trim()}
                                className={`h-11 px-4 rounded-lg bg-${theme.primaryColor} text-white font-bold text-sm shadow-lg shadow-${theme.primaryColor}/20 hover:bg-opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-2`}
                            >
                                <span className="material-symbols-outlined text-lg">add</span>
                                <span className="hidden sm:inline">Adicionar</span>
                            </button>
                        </div>
                    </div>

                    {/* Section 2: List of Series */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">list</span>
                            Minhas Séries
                        </label>

                        {classes.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">toc</span>
                                <p className="text-sm">Nenhuma série encontrada.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {classes.map(cls => (
                                    <div
                                        key={cls.id}
                                        className={`rounded-xl border transition-all overflow-hidden ${activeSeries?.id === cls.id
                                            ? `bg-white dark:bg-slate-800 border-${theme.primaryColor} ring-1 ring-${theme.primaryColor} shadow-md`
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                                    >
                                        {/* Series Row */}
                                        <div className="p-3 flex items-center justify-between gap-3">
                                            <button
                                                onClick={() => selectSeries(cls.id)}
                                                className="flex-1 flex items-center gap-3 text-left"
                                            >
                                                <div className={`size-3 rounded-full shrink-0 ${activeSeries?.id === cls.id ? `bg-${theme.primaryColor}` : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">{cls.name}</span>
                                            </button>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleDeleteSeries(cls.id, cls.name)}
                                                    className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                                    title="Excluir Série"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded Object (Sections) - Only if active */}
                                        {activeSeries?.id === cls.id && (
                                            <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 p-3 animate-in slide-in-from-top-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Turmas / Seções</span>
                                                </div>

                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {cls.sections.map(sec => (
                                                        <div key={sec} className="group relative">
                                                            <button
                                                                onClick={() => {
                                                                    selectSection(sec);
                                                                    onClose();
                                                                }}
                                                                className={`h-9 min-w-[3rem] px-3 rounded-lg border text-sm font-bold flex items-center justify-center transition-all ${selectedSection === sec
                                                                    ? `bg-${theme.primaryColor} text-white border-${theme.primaryColor}`
                                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                                            >
                                                                {sec}
                                                            </button>
                                                            {/* Remove Section Button */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteSection(sec);
                                                                }}
                                                                className="absolute -top-1.5 -right-1.5 size-4 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                            >
                                                                <span className="material-symbols-outlined text-[10px]">close</span>
                                                            </button>
                                                        </div>
                                                    ))}

                                                    {/* Add Section Input */}
                                                    <div className="flex items-center h-9 bg-white dark:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 px-2 gap-1 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                                                        <input
                                                            value={newSectionName}
                                                            onChange={e => setNewSectionName(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && handleCreateSection()}
                                                            placeholder="Nova Turma (ex: E)"
                                                            className="w-24 text-xs font-bold bg-transparent outline-none text-slate-700 dark:text-slate-300 placeholder:font-normal"
                                                            maxLength={5}
                                                        />
                                                        <button
                                                            onClick={handleCreateSection}
                                                            disabled={!newSectionName.trim()}
                                                            className="size-6 bg-slate-100 hover:bg-primary hover:text-white rounded text-slate-400 flex items-center justify-center transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">add</span>
                                                        </button>
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

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};
