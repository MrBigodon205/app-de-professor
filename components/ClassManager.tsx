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
        renameClass,
        removeClass,
        addSection,
        removeSection,
        reorderClasses,
        virtualGroups,
        createVirtualGroup,
        renameVirtualGroup,
        deleteVirtualGroup,
        addSeriesToGroup,
        removeSeriesFromGroup
    } = useClass();

    const theme = useTheme();

    const [newSeriesName, setNewSeriesName] = useState('');
    const [newSectionName, setNewSectionName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [draggedItem, setDraggedItem] = useState<string | null>(null);
    const [dragOverItem, setDragOverItem] = useState<string | null>(null);
    const [dragAction, setDragAction] = useState<'before' | 'after' | 'group' | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    // Reset state and handle scroll lock
    React.useEffect(() => {
        if (!isOpen) {
            setNewSeriesName('');
            setNewSectionName('');
            setEditingId(null);
            setEditingName('');
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

    const handleRenameSeries = async (id: string) => {
        if (!editingName.trim()) { setEditingId(null); return; }
        try {
            await renameClass(id, editingName);
            setEditingId(null);
            setEditingName('');
        } catch (error: any) {
            alert('Erro ao renomear série: ' + error.message);
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

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedItem(id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
    };

    const handleDragOver = (e: React.DragEvent, id: string, isGroupTarget: boolean = false) => {
        e.preventDefault();
        e.stopPropagation();
        if (id === draggedItem) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const h = rect.height;

        if (isGroupTarget) {
            setDragAction('group');
        } else {
            if (y < h * 0.25) setDragAction('before');
            else if (y > h * 0.75) setDragAction('after');
            else setDragAction('group');
        }
        setDragOverItem(id);
    };

    const handleDragEnter = (e: React.DragEvent, id: string) => {
        e.preventDefault();
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverItem(null);
        setDragAction(null);
    };

    const handleDrop = (e: React.DragEvent, targetId: string, isGroupTarget: boolean = false) => {
        e.preventDefault();
        if (!draggedItem || draggedItem === targetId) {
            handleDragEnd();
            return;
        }

        const currentOrder = classes.map(c => c.id);
        const draggedIdx = currentOrder.indexOf(draggedItem);
        const targetIdx = currentOrder.indexOf(targetId);

        if (isGroupTarget) {
            const group = virtualGroups.find(g => g.id === targetId);
            if (group && !group.classIds.includes(draggedItem)) {
                addSeriesToGroup(group.id, draggedItem);
            }
        } else if (dragAction === 'group' && targetIdx !== -1 && draggedIdx !== -1) {
            const targetName = classes.find(c => c.id === targetId)?.name || 'Turma';
            createVirtualGroup(`Grupo: ${targetName}`, [targetId, draggedItem]);
        } else if (draggedIdx !== -1 && targetIdx !== -1) {
            currentOrder.splice(draggedIdx, 1);
            const insertIdx = dragAction === 'before' ? currentOrder.indexOf(targetId) : currentOrder.indexOf(targetId) + 1;
            currentOrder.splice(insertIdx, 0, draggedItem);
            reorderClasses(currentOrder);
        }

        handleDragEnd();
    };

    const renderList: Array<{ type: 'group' | 'class', id: string, data: any, classes?: any[] }> = [];
    const renderedGroups = new Set<string>();

    classes.forEach(cls => {
        const group = virtualGroups.find(g => g.classIds.includes(cls.id));
        if (group) {
            if (!renderedGroups.has(group.id)) {
                renderedGroups.add(group.id);
                renderList.push({
                    type: 'group',
                    id: group.id,
                    data: group,
                    classes: classes.filter(c => group.classIds.includes(c.id))
                });
            }
        } else {
            renderList.push({ type: 'class', id: cls.id, data: cls });
        }
    });

    const renderSeriesCard = (cls: any, isInsideGroup: boolean = false, groupId?: string) => {
        return (
            <div
                key={cls.id}
                draggable
                onDragStart={(e) => handleDragStart(e, cls.id)}
                onDragOver={(e) => handleDragOver(e, cls.id)}
                onDragEnter={(e) => handleDragEnter(e, cls.id)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, cls.id)}
                className={`group relative rounded-2xl transition-all duration-300 overflow-hidden ${activeSeries?.id === cls.id
                    ? `bg-white dark:bg-slate-800 shadow-xl shadow-black/10 ring-1 ring-slate-100 dark:ring-white/10`
                    : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-white/5'
                    } ${draggedItem === cls.id ? 'opacity-50 scale-95' : 'opacity-100'} ${dragOverItem === cls.id ? (dragAction === 'before' ? 'border-t-4 border-t-[var(--theme-primary)]' : dragAction === 'after' ? 'border-b-4 border-b-[var(--theme-primary)]' : 'ring-2 ring-[var(--theme-primary)] bg-[var(--theme-primary)]/5') : ''}`}
            >
                <div className="p-4 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        {editingId === cls.id ? (
                            <div className="flex-1 flex gap-2 items-center bg-white dark:bg-slate-900 px-3 py-2 rounded-xl ring-2 ring-[var(--theme-primary)] shadow-lg" onClick={e => e.stopPropagation()}>
                                <input
                                    autoFocus
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRenameSeries(cls.id);
                                        if (e.key === 'Escape') { setEditingId(null); setEditingName(''); }
                                    }}
                                    aria-label="Renomear série"
                                    placeholder="Novo nome"
                                    className="flex-1 text-sm font-bold text-slate-900 dark:text-white bg-transparent outline-none w-full"
                                />
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleRenameSeries(cls.id); }}
                                    className="size-8 min-w-[32px] rounded-lg bg-green-50 text-green-600 dark:bg-green-500/20 dark:text-green-400 flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-500/30 transition-colors"
                                    title="Confirmar"
                                >
                                    <span className="material-symbols-outlined text-[18px] font-black">check</span>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingId(null); setEditingName(''); }}
                                    className="size-8 min-w-[32px] rounded-lg bg-red-50 text-red-500 dark:bg-red-500/20 dark:text-red-400 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-500/30 transition-colors"
                                    title="Cancelar"
                                >
                                    <span className="material-symbols-outlined text-[18px] font-black">close</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="cursor-grab hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg transition-colors active:cursor-grabbing flex items-center justify-center -ml-2" title="Segure para arrastar e reorganizar">
                                    <span className="material-symbols-outlined">drag_indicator</span>
                                </div>
                                <button
                                    onClick={() => selectSeries(cls.id)}
                                    className="flex-1 flex items-center gap-3 text-left group/btn"
                                >
                                    <div className={`size-12 rounded-xl flex items-center justify-center transition-all duration-300 ${activeSeries?.id === cls.id ? `bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white shadow-md shadow-[var(--theme-primary)]/20` : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500'}`}>
                                        <span className="material-symbols-outlined text-2xl">
                                            {activeSeries?.id === cls.id ? 'folder_managed' : 'folder'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col leading-tight flex-1 min-w-0">
                                        <span className={`text-lg font-black tracking-tight truncate ${activeSeries?.id === cls.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                            {cls.name}
                                        </span>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{cls.sections.length} turmas</span>
                                    </div>
                                </button>

                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditingId(cls.id); setEditingName(cls.name); }}
                                        className="size-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all flex items-center justify-center"
                                        title="Renomear"
                                    >
                                        <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            if (isInsideGroup && groupId) removeSeriesFromGroup(groupId, cls.id);
                                            else handleDeleteSeries(cls.id, cls.name);
                                        }}
                                        className="size-9 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all flex items-center justify-center opacity-100"
                                        title={isInsideGroup ? "Remover do Grupo" : "Excluir"}
                                    >
                                        <span className="material-symbols-outlined text-lg">{isInsideGroup ? 'logout' : 'delete'}</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Sections Pills Area */}
                    {activeSeries?.id === cls.id && (
                        <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-4 space-y-3 animate-in zoom-in-95 duration-500">
                            <div className="flex flex-wrap gap-2.5">
                                {cls.sections.map((sec: string) => (
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

                                {/* Add Section Button */}
                                <button
                                    onClick={async () => {
                                        if (activeSeries) {
                                            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                                            const existingLetters = activeSeries.sections
                                                .filter((sec: string) => sec.length === 1)
                                                .map((sec: string) => sec.toUpperCase());

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
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto overflow-x-hidden custom-scrollbar py-6 md:py-12 lg:py-20 scroll-smooth">
            {/* Backdrop with Blur */}
            <div
                className="fixed inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-500"
                onClick={onClose}
            ></div>

            {/* Modal Window - Glassmorphism style */}
            <div className={`
                relative w-full max-w-2xl bg-white dark:bg-slate-900 
                rounded-2xl sm:rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] 
                border-t sm:border border-white/50 dark:border-white/10 
                flex flex-col
                animate-in slide-in-from-bottom duration-500 sm:zoom-in-95
                mb-auto mt-4 md:mt-0
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
                <div className="p-4 sm:p-6 pt-2 bg-transparent">
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
                                    {renderList.map(item => {
                                        if (item.type === 'group') {
                                            const group = item.data;
                                            const isExpanded = expandedGroups.has(group.id);
                                            const groupClasses = item.classes || [];

                                            return (
                                                <div
                                                    key={group.id}
                                                    onDragOver={(e) => handleDragOver(e, group.id, true)}
                                                    onDragEnter={(e) => handleDragEnter(e, group.id)}
                                                    onDrop={(e) => handleDrop(e, group.id, true)}
                                                    className={`rounded-2xl border-2 transition-all duration-300 ${dragOverItem === group.id ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/5' : 'border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]'}`}
                                                >
                                                    {/* Group Header */}
                                                    <div className="p-3 flex items-center justify-between group">
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setExpandedGroups(prev => {
                                                                        const next = new Set(prev);
                                                                        if (next.has(group.id)) next.delete(group.id);
                                                                        else next.add(group.id);
                                                                        return next;
                                                                    });
                                                                }}
                                                                className="size-10 rounded-xl bg-slate-200/50 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                                            >
                                                                <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                                                    keyboard_arrow_down
                                                                </span>
                                                            </button>

                                                            {editingId === group.id ? (
                                                                <div className="flex-1 flex gap-2 items-center bg-white dark:bg-slate-900 px-2 py-1.5 rounded-xl ring-1 ring-[var(--theme-primary)] shadow-sm">
                                                                    <input
                                                                        autoFocus
                                                                        value={editingName}
                                                                        onChange={(e) => setEditingName(e.target.value)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                renameVirtualGroup(group.id, editingName);
                                                                                setEditingId(null);
                                                                            }
                                                                            if (e.key === 'Escape') { setEditingId(null); setEditingName(''); }
                                                                        }}
                                                                        placeholder="Nome da Pasta..."
                                                                        className="flex-1 text-sm font-bold text-slate-900 dark:text-white bg-transparent outline-none w-full"
                                                                    />
                                                                    <button onClick={() => { renameVirtualGroup(group.id, editingName); setEditingId(null); }} className="size-6 rounded bg-green-50 text-green-600 dark:bg-green-500/20 flex items-center justify-center"><span className="material-symbols-outlined text-[14px] font-black">check</span></button>
                                                                    <button onClick={() => { setEditingId(null); setEditingName(''); }} className="size-6 rounded bg-red-50 text-red-500 dark:bg-red-500/20 flex items-center justify-center"><span className="material-symbols-outlined text-[14px] font-black">close</span></button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer" onClick={() => { setEditingId(group.id); setEditingName(group.name); }}>
                                                                    <span className="material-symbols-outlined text-[var(--theme-primary)] text-xl">folder_zip</span>
                                                                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{group.name}</span>
                                                                    <span className="text-[10px] font-bold bg-slate-200 dark:bg-white/10 px-2 py-0.5 rounded-full text-slate-500">{groupClasses.length}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex gap-1 transition-opacity ml-2">
                                                            <button onClick={() => { setEditingId(group.id); setEditingName(group.name); }} className="size-8 rounded-lg bg-blue-50/50 dark:bg-blue-500/10 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-500/20 flex items-center justify-center" title="Renomear Pasta">
                                                                <span className="material-symbols-outlined text-sm">edit</span>
                                                            </button>
                                                            <button onClick={() => {
                                                                if (window.confirm('Desagrupar turmas desta pasta?')) deleteVirtualGroup(group.id);
                                                            }} className="size-8 rounded-lg bg-orange-50/50 dark:bg-orange-500/10 text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-500/20 flex items-center justify-center" title="Desfazer Grupo">
                                                                <span className="material-symbols-outlined text-sm">folder_off</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Group Content (Expands) */}
                                                    {isExpanded && (
                                                        <div className="p-3 pt-0 grid gap-2 border-t border-slate-200/50 dark:border-white/5 mt-2 pt-3">
                                                            {groupClasses.map((cls: any) => renderSeriesCard(cls, true, group.id))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }

                                        // Standalone class
                                        return renderSeriesCard(item.data);
                                    })}
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
