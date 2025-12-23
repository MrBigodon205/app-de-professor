import React from 'react';
import { useClass } from '../contexts/ClassContext';
import { useTheme } from '../hooks/useTheme';

interface MobileClassSelectorProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MobileClassSelector: React.FC<MobileClassSelectorProps> = ({ isOpen, onClose }) => {
    const [newSeriesName, setNewSeriesName] = React.useState('');
    const { classes, activeSeries, selectedSection, selectClass, selectSection, addSeries, deleteSeries } = useClass();
    const theme = useTheme();

    const handleAdd = async () => {
        if (!newSeriesName.trim()) return;
        try {
            await addSeries(newSeriesName);
            setNewSeriesName('');
            alert('Série adicionada com sucesso!');
        } catch (error: any) {
            alert('Erro ao adicionar série: ' + error.message);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm("Tem certeza que deseja excluir esta série e todos os dados associados?")) {
            try {
                await deleteSeries(id);
                // alert('Série excluída com sucesso!'); // Feedback might be too annoying for delete if it disappears instantly
            } catch (error: any) {
                alert('Erro ao excluir série: ' + error.message);
            }
        }
    };

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
                        Gerenciar Turmas
                    </h2>
                    <button onClick={onClose} className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
                    {/* Add New Series */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Nova Série</label>
                        <div className="flex gap-2">
                            <input
                                value={newSeriesName}
                                onChange={(e) => setNewSeriesName(e.target.value)}
                                placeholder="Nome da Série (ex: 3º Ano B)"
                                className="flex-1 h-12 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 font-bold text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                            <button
                                onClick={handleAdd}
                                disabled={!newSeriesName.trim()}
                                className={`size-12 rounded-xl bg-${theme.primaryColor} text-white flex items-center justify-center shadow-lg shadow-${theme.primaryColor}/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95`}
                            >
                                <span className="material-symbols-outlined">add</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Séries Disponíveis</label>
                        <div className="grid grid-cols-1 gap-3">
                            {classes.map(cls => (
                                <div
                                    key={cls.id}
                                    className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between group ${activeSeries?.id === cls.id
                                        ? `bg-${theme.primaryColor}/5 border-${theme.primaryColor} shadow-sm ring-1 ring-${theme.primaryColor}`
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                        }`}
                                >
                                    <button
                                        onClick={() => selectClass(cls.id)}
                                        className="flex-1 text-left flex items-center gap-3"
                                    >
                                        <div className={`size-3 rounded-full ${activeSeries?.id === cls.id ? `bg-${theme.primaryColor}` : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                        <span className={`font-bold ${activeSeries?.id === cls.id ? `text-${theme.primaryColor}` : 'text-slate-700 dark:text-slate-200'}`}>
                                            {cls.name}
                                        </span>
                                    </button>

                                    <button
                                        onClick={(e) => handleDelete(e, cls.id)}
                                        className="size-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {activeSeries && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 border-t border-slate-100 dark:border-slate-800 pt-6">
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

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl sm:rounded-b-2xl shrink-0">
                    <button onClick={onClose} className="w-full py-3.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};
