import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClass } from '../contexts/ClassContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { Student } from '../types';
import { supabase } from '../lib/supabase';
import { TransferStudentModal } from '../components/TransferStudentModal';
import { BulkTransferModal } from '../components/BulkTransferModal';

interface StudentsListProps {
    mode?: 'manage' | 'report';
}

export const StudentsList: React.FC<StudentsListProps> = ({ mode = 'manage' }) => {
    const navigate = useNavigate();
    const { selectedSeriesId, selectedSection, activeSeries } = useClass();
    const { currentUser } = useAuth();
    const theme = useTheme();

    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [newStudentName, setNewStudentName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Bulk Import State
    const [isImporting, setIsImporting] = useState(false);
    const [importText, setImportText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Transfer State
    const [transferringStudent, setTransferringStudent] = useState<Student | null>(null);
    const [isBulkTransferring, setIsBulkTransferring] = useState(false);

    // Selection Logic

    const toggleSelectAll = () => {
        if (selectedIds.length === students.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(students.map(s => s.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Tem certeza que deseja remover ${selectedIds.length} alunos?`)) return;

        try {
            const { error } = await supabase
                .from('students')
                .delete()
                .in('id', selectedIds);

            if (error) throw error;

            setStudents(students.filter(s => !selectedIds.includes(s.id)));
            setSelectedIds([]);
        } catch (e) {
            console.error("Bulk delete error", e);
            alert("Erro ao remover alunos.");
        }
    };

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                // Heuristic to clean up content: remove empty lines, trim whitespace
                const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
                setImportText(lines.join('\n'));
            }
        };
        reader.readAsText(file);
        // Reset input to allow selecting same file again if needed
        e.target.value = '';
    };

    useEffect(() => {
        if (selectedSeriesId && selectedSection) {
            fetchStudents();
        } else {
            setStudents([]);
            setLoading(false);
        }
    }, [selectedSeriesId, selectedSection]);

    const fetchStudents = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('series_id', selectedSeriesId)
                .eq('section', selectedSection)
                .eq('user_id', currentUser.id);

            if (error) throw error;

            const formatted: Student[] = data.map(s => ({
                id: s.id.toString(),
                name: s.name,
                number: s.number,
                initials: s.initials || '',
                color: s.color || '',
                classId: s.series_id.toString(),
                section: s.section,
                userId: s.user_id,
                units: s.units || {}
            }));

            formatted.sort((a, b) => parseInt(a.number) - parseInt(b.number));
            setStudents(formatted);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (student: Student) => {
        setEditingId(student.id);
        setEditName(student.name);
    };

    const saveEdit = async () => {
        if (!editingId) return;
        try {
            const { error } = await supabase
                .from('students')
                .update({ name: editName })
                .eq('id', editingId);

            if (error) throw error;

            setStudents(students.map(s => s.id === editingId ? { ...s, name: editName } : s));
            setEditingId(null);
        } catch (error) {
            console.error('Error updating student:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este aluno?')) return;
        try {
            const { error } = await supabase
                .from('students')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setStudents(students.filter(s => s.id !== id));
        } catch (error) {
            console.error('Error deleting student:', error);
        }
    };

    const handleAddStudent = async () => {
        if (!newStudentName.trim() || !currentUser) return;
        if (!selectedSeriesId || !selectedSection) {
            alert("Selecione uma turma primeiro!");
            return;
        }

        const initials = newStudentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

        const maxNumber = students.length > 0
            ? Math.max(...students.map(s => parseInt(s.number || '0')))
            : 0;
        const newNumber = (maxNumber + 1).toString().padStart(2, '0');

        const newStudentData = {
            name: newStudentName,
            number: newNumber,
            series_id: selectedSeriesId,
            section: selectedSection,
            initials: initials,
            color: `from-${theme.primaryColor} to-${theme.secondaryColor}`,
            units: {},
            user_id: currentUser.id
        };

        try {
            const { data, error } = await supabase
                .from('students')
                .insert(newStudentData)
                .select()
                .single();

            if (error) throw error;

            const saved: Student = {
                id: data.id.toString(),
                name: data.name,
                number: data.number,
                initials: data.initials,
                color: data.color,
                classId: data.series_id.toString(),
                section: data.section,
                userId: data.user_id,
                units: data.units || {}
            };

            setStudents([...students, saved]);
            setNewStudentName('');
            setIsAdding(false);
        } catch (error) {
            console.error("Error adding student:", error);
        }
    };

    const handleBulkImport = async () => {
        if (!importText.trim() || !currentUser) return;
        if (!selectedSeriesId || !selectedSection) {
            alert("Selecione uma turma primeiro!");
            return;
        }

        setIsProcessing(true);

        const newNames = importText.split('\n')
            .map(n => n.trim())
            .filter(n => n.length > 0);

        try {
            // Use existing state students instead of re-fetching
            const currentStudents = [...students];

            const combinedMap = new Map();
            currentStudents.forEach(s => combinedMap.set(s.name.toLowerCase(), { name: s.name, id: s.id, existing: true, original: s }));

            newNames.forEach(name => {
                if (!combinedMap.has(name.toLowerCase())) {
                    combinedMap.set(name.toLowerCase(), { name: name, existing: false });
                }
            });

            const sortedList = Array.from(combinedMap.values()).sort((a, b) => a.name.localeCompare(b.name));

            const operations = sortedList.map((item, index) => {
                const newNumber = (index + 1).toString().padStart(2, '0');

                if (item.existing) {
                    if (item.original.number !== newNumber) {
                        return supabase
                            .from('students')
                            .update({ number: newNumber })
                            .eq('id', item.id);
                    }
                    return null;
                } else {
                    const initials = item.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                    return supabase
                        .from('students')
                        .insert({
                            name: item.name,
                            number: newNumber,
                            series_id: selectedSeriesId,
                            section: selectedSection,
                            initials: initials,
                            color: `from-${theme.primaryColor} to-${theme.secondaryColor}`,
                            units: {},
                            user_id: currentUser.id
                        });
                }
            }).filter(op => op !== null);

            await Promise.all(operations);
            await fetchStudents();
            setIsImporting(false);
            setImportText('');
            alert('Importação concluída com sucesso!');
        } catch (error) {
            console.error("Import error:", error);
            alert("Erro na importação.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (!selectedSeriesId || !selectedSection) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-500">
                <div className={`size-20 rounded-2xl bg-${theme.primaryColor}/10 flex items-center justify-center mb-6`}>
                    <span className={`material-symbols-outlined text-4xl text-${theme.primaryColor}`}>{theme.icon}</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Nenhuma Turma Selecionada</h3>
                <p className="text-slate-500 text-center max-w-sm mb-8">Selecione uma turma no menu superior para gerenciar os alunos.</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto flex flex-col gap-4 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32 lg:pb-12">
            <div className={`bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden group`}>
                <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-${theme.primaryColor}/5 to-transparent rounded-full -mr-32 -mt-32 blur-3xl group-hover:from-${theme.primaryColor}/10 transition-colors duration-700`}></div>

                <div className="flex items-center gap-6 relative z-10 w-full lg:w-auto">
                    <div className={`hidden sm:flex size-16 rounded-2xl bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white items-center justify-center shadow-lg shadow-${theme.primaryColor}/20`}>
                        <span className="material-symbols-outlined text-3xl">groups</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Gerenciar Turma</h1>
                        <p className="text-slate-500 font-medium">Lista de alunos organizada para <span className={`text-${theme.primaryColor} font-bold`}>{activeSeries?.name} • {selectedSection}</span></p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto relative z-10">
                    {mode === 'manage' ? (
                        <>
                            {selectedIds.length > 0 ? (
                                <div className="flex items-center gap-3 animate-in fade-in zoom-in">
                                    <button
                                        onClick={() => setIsBulkTransferring(true)}
                                        className="flex items-center gap-3 bg-amber-100 hover:bg-amber-200 text-amber-600 font-bold h-12 px-6 rounded-2xl transition-all active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-xl">move_up</span>
                                        Transferir ({selectedIds.length})
                                    </button>
                                    <button
                                        onClick={handleBulkDelete}
                                        className="flex items-center gap-3 bg-red-100 hover:bg-red-200 text-red-600 font-bold h-12 px-6 rounded-2xl transition-all active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-xl">delete</span>
                                        Remover
                                    </button>
                                </div>
                            ) : (
                                <button
                                    data-tour="students-import-btn"
                                    onClick={() => setIsImporting(true)}
                                    className="flex items-center gap-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold h-12 px-6 rounded-2xl transition-all active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-xl">playlist_add</span>
                                    Importar em Massa
                                </button>
                            )}
                            <button
                                data-tour="students-add-btn"
                                onClick={() => setIsAdding(!isAdding)}
                                className={`flex items-center gap-3 hover:opacity-90 text-white font-bold h-12 px-6 rounded-2xl shadow-lg shadow-${theme.primaryColor}/20 transition-all active:scale-95`}
                                style={{ backgroundColor: theme.primaryColorHex }}
                            >
                                <span className="material-symbols-outlined text-xl">add_circle</span>
                                Novo Aluno
                            </button>
                        </>
                    ) : (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 px-6 py-3 rounded-2xl font-bold border border-indigo-100 dark:border-indigo-800 flex items-center gap-2">
                            <span className="material-symbols-outlined">touch_app</span>
                            Selecione um aluno para visualizar o relatório
                        </div>
                    )}
                </div>
            </div>

            {/* Bulk Import Modal */}
            {
                isImporting && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`size-12 rounded-2xl bg-${theme.primaryColor}/10 text-${theme.primaryColor} flex items-center justify-center`}>
                                    <span className="material-symbols-outlined">publish</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Importação em Massa</h2>
                                    <p className="text-slate-500 text-sm font-medium">Cole a lista de nomes ou anexe um arquivo de texto.</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`flex-1 h-14 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-${theme.primaryColor} hover:bg-${theme.primaryColor}/5 text-slate-500 hover:text-${theme.primaryColor} transition-all flex items-center justify-center gap-3 font-bold group`}
                                    >
                                        <span className="material-symbols-outlined group-hover:bounce">attach_file</span>
                                        <span>Anexar Arquivo (TXT/CSV)</span>
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileImport}
                                        accept=".txt,.csv"
                                        className="hidden"
                                    />
                                </div>

                                <textarea
                                    value={importText}
                                    onChange={(e) => setImportText(e.target.value)}
                                    placeholder="Alice Silva&#10;Bernardo Souza&#10;Carlos Henrique..."
                                    className={`w-full h-80 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-black focus:ring-4 focus:ring-${theme.primaryColor}/10 focus:border-${theme.primaryColor} transition-all resize-none font-medium leading-relaxed custom-scrollbar`}
                                />
                                <div className="flex items-center justify-between mt-3 px-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <span className={`size-2 rounded-full bg-${theme.primaryColor}`}></span>
                                        {importText.split('\n').filter(n => n.trim().length > 0).length} nomes identificados
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400">Pressione Enter para cada novo nome</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsImporting(false)}
                                    className="flex-1 h-14 rounded-2xl font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all uppercase tracking-widest text-xs"
                                    disabled={isProcessing}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleBulkImport}
                                    className={`flex-[2] h-14 rounded-2xl bg-${theme.primaryColor} text-white font-black shadow-xl shadow-${theme.primaryColor}/20 hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest text-xs`}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Processando...
                                        </>
                                    ) : (
                                        <>
                                            Confirmar Importação
                                            <span className="material-symbols-outlined text-xl">arrow_forward</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                isAdding && (
                    <div className={`bg-${theme.primaryColor}/5 border-2 border-dashed border-${theme.primaryColor}/20 p-8 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-300`}>
                        <div className="flex items-center gap-3 mb-6">
                            <span className={`material-symbols-outlined text-${theme.primaryColor}`}>person_add</span>
                            <h4 className="font-black text-slate-700 dark:text-white uppercase tracking-widest text-sm">Adicionar Novo Aluno</h4>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="text"
                                value={newStudentName}
                                onChange={(e) => setNewStudentName(e.target.value)}
                                placeholder="Digite o nome completo do aluno..."
                                className={`flex-1 h-14 px-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 dark:bg-slate-900 focus:ring-4 focus:ring-${theme.primaryColor}/10 focus:border-${theme.primaryColor} transition-all font-bold`}
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAddStudent}
                                    className={`h-14 px-8 bg-${theme.primaryColor} text-white rounded-2xl font-black shadow-lg shadow-${theme.primaryColor}/20 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2`}
                                >
                                    <span className="material-symbols-outlined text-xl">save</span>
                                    Salvar
                                </button>
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="h-14 px-6 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-black border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <div className={`transition-all duration-300 ${loading ? 'opacity-50 grayscale pointer-events-none' : ''}`}>

                {mode === 'report' ? (
                    /* REPORT MODE: GRID LAYOUT */
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">

                        {/* Search Bar */}
                        <div className="relative w-full max-w-md mx-auto mb-2">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className={`material-symbols-outlined text-slate-400 ${searchQuery ? `text-${theme.primaryColor}` : ''}`}>search</span>
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar aluno por nome ou número..."
                                className="w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {students
                                .filter(s =>
                                    searchQuery === '' ||
                                    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    s.number.toString().includes(searchQuery)
                                )
                                .length === 0 ? (
                                <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800">
                                    <div className="size-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 mx-auto">
                                        <span className="material-symbols-outlined text-slate-300 text-4xl">group_off</span>
                                    </div>
                                    <h4 className="font-bold text-slate-400">Nenhum aluno encontrado</h4>
                                    <p className="text-sm text-slate-300">Verifique os filtros de turma.</p>
                                </div>
                            ) : (
                                students
                                    .filter(s =>
                                        searchQuery === '' ||
                                        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        s.number.toString().includes(searchQuery)
                                    )
                                    .map((student, index) => (
                                        <div
                                            key={student.id}
                                            onClick={() => navigate(`/reports/${student.id}`)}
                                            className="group bg-white dark:bg-slate-900 rounded-[24px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/20 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${student.color || `from-${theme.primaryColor} to-${theme.secondaryColor}`} opacity-10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500`}></div>

                                            <div className="flex items-start justify-between mb-4 relative z-10">
                                                <div className={`size-14 rounded-2xl bg-gradient-to-br ${student.color || `from-${theme.primaryColor} to-${theme.secondaryColor}`} flex items-center justify-center text-white text-lg font-black shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300`}>
                                                    {student.initials}
                                                </div>
                                                <span className="px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    #{student.number}
                                                </span>
                                            </div>

                                            <div className="relative z-10">
                                                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                                                    {student.name}
                                                </h3>
                                                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-6">
                                                    {activeSeries?.name} • {selectedSection}
                                                </p>

                                                <button className="w-full h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest group-hover:bg-indigo-600 group-hover:text-white transition-all flex items-center justify-center gap-2">
                                                    <span>Relatório</span>
                                                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                ) : (
                    /* MANAGE MODE: TABLE LAYOUT */
                    <div className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden`}>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-4 py-3 w-12">
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    className="size-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 checked:bg-primary checked:border-primary transition-all cursor-pointer accent-indigo-600"
                                                    checked={students.length > 0 && selectedIds.length === students.length}
                                                    onChange={toggleSelectAll}
                                                />
                                            </div>
                                        </th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest w-24">Nº</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Nome do Aluno</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {students.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="size-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                                                        <span className="material-symbols-outlined text-slate-300 text-4xl">group_off</span>
                                                    </div>
                                                    <h4 className="font-bold text-slate-400">A lista está vazia</h4>
                                                    <p className="text-sm text-slate-300">Comece adicionando seu primeiro aluno acima.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        students.map((student) => (
                                            <tr key={student.id} className={`group transition-all ${selectedIds.includes(student.id) ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}`}>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center justify-center">
                                                        <input
                                                            type="checkbox"
                                                            className="size-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 checked:bg-primary checked:border-primary transition-all cursor-pointer accent-indigo-600"
                                                            checked={selectedIds.includes(student.id)}
                                                            onChange={() => toggleSelect(student.id)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <span className="font-mono text-sm font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                                        {student.number}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4">
                                                    {editingId === student.id ? (
                                                        <div className="flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                                                            <input
                                                                type="text"
                                                                value={editName}
                                                                onChange={(e) => setEditName(e.target.value)}
                                                                className={`px-4 py-2 border-2 border-primary/30 rounded-xl text-sm w-full max-w-md font-bold dark:bg-slate-900 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all`}
                                                                autoFocus
                                                            />
                                                            <div className="flex gap-1">
                                                                <button onClick={saveEdit} className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-110 transition-transform"><span className="material-symbols-outlined">check</span></button>
                                                                <button onClick={() => setEditingId(null)} className="p-2 bg-slate-200 text-slate-600 rounded-xl hover:scale-110 transition-transform"><span className="material-symbols-outlined">close</span></button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-4">
                                                            <div className={`size-11 rounded-2xl bg-gradient-to-br ${student.color || `from-${theme.primaryColor} to-${theme.secondaryColor}`} flex items-center justify-center text-xs font-black text-white shadow-lg shadow-slate-200 dark:shadow-none`}>
                                                                {student.initials}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-slate-800 dark:text-white group-hover:text-primary transition-colors">{student.name}</span>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Frequência: 100% (Draft)</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                        <button
                                                            onClick={() => setTransferringStudent(student)}
                                                            className={`p-2.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-all`}
                                                            title="Transferir Aluno">
                                                            <span className="material-symbols-outlined text-[22px]">move_up</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(student)}
                                                            className={`p-2.5 text-slate-400 hover:text-${theme.primaryColor} hover:bg-${theme.primaryColor}/10 rounded-xl transition-all`}
                                                            title="Editar Aluno">
                                                            <span className="material-symbols-outlined text-[22px]">edit_note</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(student.id)}
                                                            className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                                                            title="Remover Aluno">
                                                            <span className="material-symbols-outlined text-[22px]">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {transferringStudent && (
                <TransferStudentModal
                    isOpen={!!transferringStudent}
                    onClose={() => setTransferringStudent(null)}
                    student={transferringStudent}
                    onSuccess={() => {
                        fetchStudents();
                        setTransferringStudent(null);
                    }}
                />
            )}

            <BulkTransferModal
                isOpen={isBulkTransferring}
                onClose={() => setIsBulkTransferring(false)}
                studentIds={selectedIds}
                onSuccess={() => {
                    fetchStudents();
                    setSelectedIds([]);
                    setIsBulkTransferring(false);
                }}
            />

            <div className={`flex items-center justify-center gap-4 py-4`}>
                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                <div className="px-6 py-2 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        Total de <span className={`text-${theme.primaryColor}`}>{students.length}</span> alunos matriculados
                    </span>
                </div>
                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
            </div>
        </div >
    );
};

