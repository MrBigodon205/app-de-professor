import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { VARIANTS } from '../constants/motion';
import { useClass } from '../contexts/ClassContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { Student, Occurrence } from '../types';
import { supabase } from '../lib/supabase';
import { DatePicker } from '../components/DatePicker';
import { CategorySelect } from '../components/CategorySelect';
import { useToast } from '../components/Toast';

const getOccurrenceIcon = (type: string) => {
    switch (type) {
        case 'Elogio': return 'star';
        case 'Indisciplina': return 'gavel';
        case 'Atraso': return 'schedule';
        case 'Não Fez Tarefa': return 'assignment_late';
        case 'Falta de Material': return 'inventory_2';
        case 'Uso de Celular': return 'smartphone';
        case 'Alerta': return 'priority_high';
        default: return 'warning';
    }
};

// --- MEMOIZED COMPONENTS ---

const ObservationStudentItem = React.memo(({ student, isSelected, onClick, theme }: { student: Student, isSelected: boolean, onClick: (id: string) => void, theme: any }) => {
    return (
        <motion.button
            onClick={() => onClick(student.id)}
            variants={VARIANTS.fadeUp}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 relative text-left ${isSelected
                ? `bg-${theme.primaryColor}/10 border border-${theme.primaryColor}/20`
                : 'hover:bg-surface-subtle border border-transparent hover:border-border-default'
                }`}
        >
            <div className={`student-avatar student-avatar-sm shrink-0 bg-gradient-to-br ${student.color || `from-indigo-600 to-indigo-800`}`}>
                {student.initials || student.name.substring(0, 2)}
            </div>
            <div className="flex flex-col min-w-0 pr-4">
                <span className={`text-sm font-bold truncate transition-colors ${isSelected ? 'theme-text-primary' : 'text-text-secondary'}`}>{student.name}</span>
                <span className="text-[10px] text-text-muted font-medium">Nº {student.number.padStart(2, '0')}</span>
            </div>
        </motion.button>
    );
});

const ObservationOccurrenceCard = React.memo(({ occ, isSelected, onToggle, onEdit, onDelete }: {
    occ: Occurrence,
    isSelected: boolean,
    onToggle: (id: string) => void,
    onEdit: (occ: Occurrence) => void,
    onDelete: (id: string) => void
}) => {
    return (
        <motion.div
            variants={VARIANTS.fadeUp}
            onClick={() => onToggle(occ.id)}
            className={`bg-surface-card p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all flex flex-col gap-3 cursor-pointer group/card ${isSelected ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-border-default hover:border-border-hover'}`}
        >
            <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-4 min-w-0">
                    <div className={`size-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 ${occ.type === 'Elogio' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-500/20' : 'bg-gradient-to-br from-rose-500 to-rose-700 shadow-rose-500/20'}`}>
                        <span className="material-symbols-outlined text-lg">{isSelected ? 'check_circle' : getOccurrenceIcon(occ.type)}</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-black text-text-primary truncate">{occ.student_name}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${occ.type === 'Elogio' ? 'text-emerald-500' : 'text-rose-500'}`}>{occ.type}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest bg-surface-subtle px-2 py-0.5 rounded-lg border border-border-default">{new Date(occ.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    <div className="flex items-center gap-1 mt-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(occ);
                            }}
                            className="p-1.5 hover:bg-amber-500/10 hover:text-amber-600 rounded-lg transition-all"
                        >
                            <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(occ.id);
                            }}
                            className="p-1.5 hover:bg-rose-500/10 hover:text-rose-600 rounded-lg transition-all"
                        >
                            <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </div>
                </div>
            </div>
            <p className="text-sm text-text-secondary font-medium leading-relaxed italic pr-4">"{occ.description}"</p>
        </motion.div>
    );
});

export const Observations: React.FC = () => {
    const { selectedSeriesId, selectedSection, activeSeries } = useClass();
    const { currentUser, activeSubject } = useAuth();
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const { success, error: showError } = useToast();

    // Mount Ref for preventing state updates on unmounted component
    const mountedRef = React.useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);


    const [activeTab, setActiveTab] = useState<'occurrences' | 'history'>('occurrences');
    const [students, setStudents] = useState<Student[]>([]);
    const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string>(location.state?.studentId || '');
    const [selectedUnit, setSelectedUnit] = useState<string>('1');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Form States
    const [type, setType] = useState<Occurrence['type']>('Alerta');
    const [description, setDescription] = useState('');
    const [occurrenceDate, setOccurrenceDate] = useState(new Date().toLocaleDateString('sv-SE'));
    const [editingOccId, setEditingOccId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [selectedOccIds, setSelectedOccIds] = useState<Set<string>>(new Set());

    const handleSelectStudent = (id: string) => {
        setSelectedStudentId(id);
        if (window.innerWidth < 1280) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const fetchData = useCallback(async (silent = false) => {
        if (!currentUser) return;
        if (!silent) setLoading(true);
        try {
            let studentsData: any[] = [];
            let occurrencesData: any[] = [];

            // 1. Fetch Students
            const { data: sData, error: sError } = await supabase
                .from('students')
                .select('*')
                .eq('series_id', selectedSeriesId)
                .eq('section', selectedSection)
                .eq('user_id', currentUser.id);

            if (sError) throw sError;
            if (sError) throw sError;
            if (!mountedRef.current) return;
            studentsData = sData || [];

            // 2. Fetch Occurrences
            const { data: occData, error: occError } = await supabase
                .from('occurrences')
                .select(`*, student:students(name)`)
                .eq('user_id', currentUser.id)
                .eq('subject', activeSubject)
                .order('date', { ascending: false });

            if (occError) throw occError;
            if (occError) throw occError;
            if (!mountedRef.current) return;
            occurrencesData = occData || [];


            const formattedStudents: Student[] = studentsData.map(s => ({
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
            formattedStudents.sort((a, b) => a.name.localeCompare(b.name));
            setStudents(formattedStudents);

            // Preserve current selection — do NOT reset selectedStudentId here

            const formattedOcc: Occurrence[] = occurrencesData
                .map(o => ({
                    id: o.id.toString(),
                    studentId: o.studentId || o.student_id.toString(),
                    type: o.type,
                    description: o.description,
                    date: o.date,
                    unit: o.unit,
                    userId: o.user_id,
                    student_name: o.student_name || (o.student as any)?.name || 'Estudante'
                }));

            // Sort
            formattedOcc.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            if (mountedRef.current) {
                setOccurrences(formattedOcc);
            }

        } catch (e) {
            console.error("Error fetching data:", e);
        } finally {
            if (!silent && mountedRef.current) setLoading(false);
        }
    }, [currentUser, selectedSeriesId, selectedSection, activeSubject]);

    useEffect(() => {
        if (selectedSeriesId && selectedSection) {
            fetchData();
        } else {
            setStudents([]);
            setOccurrences([]);
            setLoading(false);
        }
    }, [selectedSeriesId, selectedSection, activeSubject, fetchData]);

    useEffect(() => {
        // Obsolete effect removed (generalObsText is now derived from student state)
    }, [selectedStudentId, students]);

    // --- REALTIME SUBSCRIPTION FOR OCCURRENCES ---
    useEffect(() => {
        if (!currentUser || !selectedSeriesId) return;

        // Polling Fallback (Every 60s)
        const interval = setInterval(() => {
            fetchData(true);
        }, 60000);

        // Realtime setup

        const channel = supabase.channel(`occurrences_sync_${selectedSeriesId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'occurrences'
                },
                (payload) => {
                    fetchData(true);
                }
            )
            .subscribe();

        return () => {
            // Realtime cleanup
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, [selectedSeriesId, selectedSection, currentUser, activeSubject, fetchData]);

    const selectedStudent = students.find(s => s.id === selectedStudentId);

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.number.toString().includes(searchTerm)
    );

    const handleSaveOccurrence = async () => {
        if (!selectedStudentId || !description || !currentUser) return;
        setSaving(true);

        try {
            const payload: any = {
                student_id: selectedStudentId,
                date: occurrenceDate,
                type,
                description,
                unit: selectedUnit,
                user_id: currentUser.id,
                subject: activeSubject
            };

            if (editingOccId) {
                payload.id = editingOccId;
            }

            const { error } = await supabase.from('occurrences').upsert(payload);
            if (error) throw error;

            await fetchData(true);

            setDescription('');
            setType('Alerta');
            setSelectedUnit('1');
            setOccurrenceDate(new Date().toLocaleDateString('sv-SE'));
            setEditingOccId(null);

        } catch (e: any) {
            console.error("Save Error", e);
            showError("Erro ao salvar: " + e.message);
        } finally {
            setSaving(false);
        }
    }

    const handleEditOccurrence = (occ: Occurrence) => {
        setType(occ.type);
        setDescription(occ.description);
        setOccurrenceDate(occ.date);
        setSelectedUnit(occ.unit || '1');
        setEditingOccId(occ.id);
        // Removed setActiveTab to allow inline editing in current context
    };

    const renderInlineEdit = (occ: Occurrence) => (
        <motion.div variants={VARIANTS.fadeUp} key={occ.id} className="bg-surface-card shadow-xl rounded-[24px] p-6 border-2 border-amber-500/50">
            <div className="flex items-center gap-3 mb-4 text-amber-600 font-bold uppercase text-xs tracking-widest">
                <span className="material-symbols-outlined font-black">edit_note</span>
                Editando Ocorrência
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <CategorySelect
                    label="Categoria"
                    value={type}
                    onChange={(val) => setType(val as Occurrence['type'])}
                    compact
                />
                <DatePicker
                    label="Data"
                    value={occurrenceDate}
                    onChange={setOccurrenceDate}
                    className="w-full"
                    compact
                />
            </div>

            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição..."
                className="w-full h-24 p-4 rounded-xl border border-border-default bg-surface-subtle text-sm mb-4 focus:ring-2 focus:ring-amber-500/20 outline-none resize-none"
                autoFocus
            />

            <div className="flex gap-2">
                <button
                    onClick={handleSaveOccurrence}
                    disabled={saving}
                    className="flex-1 h-10 bg-amber-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors"
                >
                    {saving ? <span className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-base">save</span>}
                    Salvar
                </button>
                <button
                    onClick={() => {
                        setEditingOccId(null);
                        setDescription('');
                    }}
                    className="flex-1 h-10 bg-surface-subtle text-text-muted rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-surface-hover transition-colors"
                >
                    Cancelar
                </button>
            </div>
        </motion.div>
    );

    const handleDeleteOccurrence = async (id: string) => {
        if (!window.confirm("Deseja realmente excluir este registro?")) return;

        try {
            const { error } = await supabase.from('occurrences').delete().eq('id', id);
            if (error) throw error;

            fetchData(true);
            const newSelected = new Set(selectedOccIds);
            newSelected.delete(id);
            setSelectedOccIds(newSelected);

        } catch (e: any) {
            console.error("Delete Error", e);
            showError("Erro ao excluir registro.");
        }
    };

    const handleBulkDelete = async () => {
        if (selectedOccIds.size === 0) return;
        if (!window.confirm(`Deseja realmente excluir ${selectedOccIds.size} registros selecionados?`)) return; // TODO: Replace with ConfirmDialog

        setSaving(true);
        try {
            const idsToDelete = Array.from(selectedOccIds);
            const { error } = await supabase.from('occurrences').delete().in('id', idsToDelete);
            if (error) throw error;

            await fetchData(true);
            setSelectedOccIds(new Set());

        } catch (e: any) {
            console.error("Bulk Delete Error", e);
            showError("Erro ao excluir registros.");
        } finally {
            setSaving(false);
        }
    };

    const toggleOccurrenceSelection = (id: string) => {
        const newSelected = new Set(selectedOccIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedOccIds(newSelected);
    };

    const toggleSelectAll = (list: Occurrence[]) => {
        if (selectedOccIds.size === list.length && list.length > 0) {
            setSelectedOccIds(new Set());
        } else {
            setSelectedOccIds(new Set(list.map(o => o.id)));
        }
    };


    const studentOccurrences = occurrences.filter(o => o.studentId === selectedStudentId);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20">
            <div className={`size-12 border-4 border-${theme.primaryColor}/20 border-t-${theme.primaryColor} rounded-full animate-spin mb-4 shadow-lg shadow-${theme.primaryColor}/20`}></div>
            <p className="font-black text-text-muted uppercase tracking-widest text-sm">Organizando Arquivo Escolar...</p>
        </div>
    );

    if (!selectedSeriesId) return (
        <div className="flex flex-col items-center justify-center p-12 bg-surface-card rounded-3xl border-2 border-dashed border-border-default">
            <div className={`size-20 rounded-2xl bg-${theme.primaryColor}/10 flex items-center justify-center mb-6`}>
                <span className={`material-symbols-outlined text-4xl text-${theme.primaryColor}`}>{theme.icon}</span>
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-2">Selecione uma Turma</h3>
            <p className="text-text-muted text-center max-w-sm">Acesse o diário de observações escolhendo uma turma no menu superior.</p>
        </div>
    );

    return (
        <div className="flex flex-col xl:flex-row gap-4 xl:gap-8 h-auto xl:h-[calc(100vh-6rem)] overflow-visible xl:overflow-hidden pb-6 xl:pb-8">
            {/* Sidebar List */}
            <div className={`w-full xl:w-96 flex flex-col bg-surface-card p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-border-default h-full shrink-0 ${selectedStudentId ? 'hidden xl:flex' : 'flex'}`}>
                <h3 className="flex font-bold text-text-primary mb-4 items-center gap-2">
                    <span className="material-symbols-outlined text-primary font-black">groups</span>
                    Turma {activeSeries?.name}
                </h3>

                <div className="relative mb-4 group/search">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within/search:text-primary transition-colors">search</span>
                    <input
                        type="text"
                        placeholder="Buscar aluno..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-subtle border border-border-default focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                    />
                </div>

                <motion.div
                    variants={VARIANTS.staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-1"
                    data-tour="obs-student-list"
                >
                    {filteredStudents.map(student => (
                        <ObservationStudentItem
                            key={student.id}
                            student={student}
                            isSelected={selectedStudentId === student.id}
                            onClick={handleSelectStudent}
                            theme={theme}
                        />
                    ))}
                </motion.div>
            </div>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col bg-surface-card rounded-[32px] landscape:rounded-none border border-border-default landscape:border-0 shadow-xl shadow-slate-200/50 dark:shadow-none xl:overflow-hidden relative group ${!selectedStudentId ? 'hidden xl:flex' : 'flex'}`}>
                {!selectedStudentId ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-[500px] xl:h-auto">
                        <div className={`size-24 rounded-full bg-${theme.primaryColor}/10 flex items-center justify-center mb-6`}>
                            <span className={`material-symbols-outlined text-5xl text-${theme.primaryColor}`}>person_search</span>
                        </div>
                        <h3 className="text-2xl font-black text-text-primary mb-2">Selecione um Aluno</h3>
                        <p className="text-text-muted max-w-sm font-medium">Escolha um aluno na lista lateral para visualizar ou registrar ocorrências.</p>
                    </div>
                ) : (
                    <>

                        {/* Back Button - Mobile Only - Follows StudentProfile Pattern */}
                        <div className="xl:hidden w-full flex justify-start p-4 bg-surface-card border-b border-border-default z-50">
                            <button
                                onClick={() => setSelectedStudentId('')}
                                className="group flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-surface-subtle border-2 border-theme-primary/20 text-theme-primary hover:bg-theme-primary hover:text-white transition-all shadow-lg active:scale-95"
                            >
                                <span className="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform font-black">arrow_back</span>
                                <span className="text-sm font-black uppercase tracking-widest">Voltar para Lista</span>
                            </button>
                        </div>
                        {/* Header Background Accent */}
                        <div className="absolute top-0 right-0 w-80 h-80 rounded-full -mr-40 -mt-40 blur-3xl theme-radial-primary opacity-20 pointer-events-none"></div>

                        <div className="p-4 sm:p-6 sm:py-6 landscape:p-2 border-b border-border-default flex flex-col xl:flex-row justify-between items-center gap-4 xl:gap-6 bg-surface-card/80 backdrop-blur-md z-10 shrink-0">
                            <div className="flex items-center gap-4 sm:gap-8 xl:flex-1 mt-8 xl:mt-0 landscape:mt-0 min-w-0">
                                {selectedStudent && (
                                    <>
                                        <div className={`student-avatar student-avatar-lg shrink-0 bg-gradient-to-br ${selectedStudent.color || `from-indigo-600 to-indigo-800`}`}>
                                            {selectedStudent.initials}
                                        </div>
                                        <div className="flex-1 min-w-0 max-w-[min(70vw,400px)] sm:max-w-none lg:max-w-[200px] xl:max-w-none">
                                            <h1 className="text-xl sm:text-3xl landscape:text-base font-black text-text-primary tracking-tight leading-none mb-1 sm:mb-2 landscape:mb-0 truncate pr-2">{selectedStudent.name}</h1>
                                            <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-sm font-bold text-text-muted landscape:hidden truncate">
                                                <span className="bg-surface-subtle px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl font-mono text-text-secondary shrink-0">#{selectedStudent.number.padStart(2, '0')}</span>
                                                <span className="shrink-0">•</span>
                                                <span className="truncate theme-text-primary font-black uppercase tracking-widest text-[8px] sm:text-[11px]">{activeSeries?.name} • Turma {selectedSection}</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Tabs */}
                            <div className="flex p-1.5 bg-surface-subtle rounded-2xl shadow-inner border-2 border-border-subtle w-full xl:w-auto overflow-x-auto scrollbar-none shrink-0 min-w-fit" data-tour="obs-tabs">
                                <button
                                    onClick={() => setActiveTab('occurrences')}
                                    className={`flex-1 xl:flex-none px-4 lg:px-6 xl:px-10 py-2.5 sm:py-4 landscape:py-1.5 rounded-xl sm:rounded-[18px] text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 xl:gap-3 whitespace-nowrap z-20 ${activeTab === 'occurrences' ? `bg-surface-card text-${theme.primaryColor} shadow-xl border-b-2 border-${theme.primaryColor}` : 'text-text-muted hover:text-text-primary hover:bg-surface-card/30'}`}
                                >
                                    <span className="material-symbols-outlined text-lg sm:text-xl font-black">history_edu</span>
                                    Ocorrências
                                </button>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`flex-1 xl:flex-none px-4 lg:px-6 xl:px-10 py-2.5 sm:py-4 landscape:py-1.5 rounded-xl sm:rounded-[18px] text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 xl:gap-3 whitespace-nowrap z-20 ${activeTab === 'history' ? `bg-surface-card text-${theme.primaryColor} shadow-xl border-b-2 border-${theme.primaryColor}` : 'text-text-muted hover:text-text-primary hover:bg-surface-card/30'}`}
                                >
                                    <span className="material-symbols-outlined text-lg sm:text-xl font-black">history</span>
                                    Histórico
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 h-auto lg:h-full lg:overflow-y-auto p-4 sm:p-8 custom-scrollbar">
                            {activeTab === 'history' ? (
                                <motion.div
                                    variants={VARIANTS.staggerContainer}
                                    initial="initial"
                                    animate="animate"
                                    className="max-w-4xl mx-auto flex flex-col gap-8"
                                >
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="font-black text-xl text-text-primary flex items-center gap-3">
                                            Histórico de Ocorrências
                                            <span className="text-[10px] font-black text-text-muted bg-surface-subtle px-3 py-1 rounded-full">{studentOccurrences.length} Registros</span>
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            {selectedOccIds.size > 0 && studentOccurrences.some(o => selectedOccIds.has(o.id)) && (
                                                <button
                                                    onClick={handleBulkDelete}
                                                    className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all flex items-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                    Excluir {studentOccurrences.filter(o => selectedOccIds.has(o.id)).length}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => toggleSelectAll(studentOccurrences)}
                                                className="px-4 py-2 bg-surface-subtle text-text-muted rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-hover active:scale-95 transition-all"
                                            >
                                                {studentOccurrences.length > 0 && studentOccurrences.every(o => selectedOccIds.has(o.id)) ? 'Desmarcar' : 'Selecionar Tudo'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {studentOccurrences.length === 0 ? (
                                            <div className="p-20 text-center flex flex-col items-center gap-4 bg-surface-subtle rounded-[32px] border-2 border-dashed border-border-default">
                                                <div className="size-20 rounded-full bg-surface-card flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-text-disabled text-4xl">inventory_2</span>
                                                </div>
                                                <p className="text-sm font-bold text-text-disabled italic">Nenhum registro encontrado para este aluno.</p>
                                            </div>
                                        ) : (
                                            studentOccurrences.map((occ, idx) => (
                                                editingOccId === occ.id ? renderInlineEdit(occ) : (
                                                    <ObservationOccurrenceCard
                                                        key={occ.id}
                                                        occ={occ}
                                                        isSelected={selectedOccIds.has(occ.id)}
                                                        onToggle={toggleOccurrenceSelection}
                                                        onEdit={handleEditOccurrence}
                                                        onDelete={handleDeleteOccurrence}
                                                    />
                                                )
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="max-w-4xl mx-auto flex flex-col gap-10 animate-in fade-in duration-500">
                                    {/* Premium Form */}
                                    {/* Premium Form - Only visible when NOT editing inside a card */}
                                    {!editingOccId && (
                                        <div className="bg-surface-subtle rounded-[32px] border-2 border-dashed border-border-default p-4 sm:p-8 landscape:p-4 relative group/form" data-tour="obs-form">
                                            <div className="absolute inset-0 rounded-[30px] overflow-hidden pointer-events-none">
                                                <div className={`absolute top-0 left-0 w-2 h-full bg-${theme.primaryColor} opacity-20`}></div>
                                            </div>

                                            <h3 className="font-black text-base sm:text-lg text-text-primary mb-4 sm:mb-8 landscape:mb-4 flex items-center gap-3 sm:gap-4 relative z-10">
                                                <div className={`hidden sm:flex size-11 rounded-1.5xl bg-${theme.primaryColor}/10 text-${theme.primaryColor} items-center justify-center landscape:hidden`}>
                                                    <span className="material-symbols-outlined text-2xl">add_moderator</span>
                                                </div>
                                                Registrar Novo Ponto de Atenção
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 landscape:gap-2">
                                                <div className="md:col-span-4 landscape:flex-1">
                                                    <CategorySelect
                                                        label="Categoria"
                                                        value={type}
                                                        onChange={(val) => setType(val as Occurrence['type'])}
                                                        compact
                                                    />
                                                </div>
                                                <div className="md:col-span-4">
                                                    <DatePicker
                                                        label="Data"
                                                        value={occurrenceDate}
                                                        onChange={setOccurrenceDate}
                                                        className="w-full"
                                                        compact
                                                    />
                                                </div>
                                                <div className="md:col-span-4 landscape:flex-1">
                                                    <label className="block text-[9px] sm:text-[10px] font-black uppercase text-text-muted tracking-widest mb-1.5 sm:mb-3 landscape:mb-1 ml-1">Unidade</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {['1', '2', '3'].map((u) => (
                                                            <button
                                                                key={u}
                                                                onClick={() => setSelectedUnit(u)}
                                                                className={`h-11 sm:h-14 landscape:h-10 rounded-2xl border-2 font-black text-sm transition-all ${selectedUnit === u
                                                                    ? 'text-white shadow-lg theme-bg-primary theme-border-soft'
                                                                    : 'border-border-default text-text-muted hover:border-border-hover'
                                                                    }`}
                                                            >
                                                                {u}U
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="md:col-span-12">
                                                    <label className="block text-[9px] sm:text-[10px] font-black uppercase text-text-muted tracking-widest mb-1.5 sm:mb-3 landscape:mb-1 ml-1">Relato Detalhado</label>
                                                    <textarea
                                                        value={description}
                                                        onChange={(e) => setDescription(e.target.value)}
                                                        placeholder="Descreva o ocorrido com detalhes pedágogicos..."
                                                        className={`w-full h-24 sm:h-32 landscape:h-20 p-4 sm:p-6 rounded-2xl sm:rounded-[28px] border-2 border-border-default bg-surface-card focus:border-${theme.primaryColor} focus:ring-4 focus:ring-${theme.primaryColor}/10 text-xs sm:text-sm font-medium transition-all resize-none custom-scrollbar`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-4 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 relative z-10">
                                                <button
                                                    onClick={handleSaveOccurrence}
                                                    disabled={saving || !description}
                                                    className={`flex-1 h-12 sm:h-16 landscape:h-10 rounded-xl sm:rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary/20 ${saving || !description ? 'bg-surface-subtle text-text-muted cursor-not-allowed' : 'text-white active:scale-95 theme-bg-primary'}`}
                                                >
                                                    {saving ? (
                                                        <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                    ) : (
                                                        <span className="material-symbols-outlined text-lg sm:text-xl">add_circle</span>
                                                    )}
                                                    Confirmar Registro
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Recent List */}
                                    <div className="space-y-4">
                                        <h4 className="font-black text-[10px] sm:text-xs text-text-muted uppercase tracking-[0.3em] ml-2 flex items-center gap-3">
                                            <span className="w-8 h-[2px] rounded-full theme-bg-surface-subtle"></span>
                                            Registros Recentes da Disciplina
                                        </h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            {studentOccurrences.length === 0 ? (
                                                <div className="p-12 text-center rounded-[32px] bg-surface-subtle border-2 border-dashed border-border-default">
                                                    <p className="text-[10px] font-black text-text-disabled uppercase tracking-widest">Nenhum registro para este aluno</p>
                                                </div>
                                            ) : (
                                                studentOccurrences.map((occ) => (
                                                    editingOccId === occ.id ? renderInlineEdit(occ) : (
                                                        <motion.div
                                                            key={occ.id}
                                                            variants={VARIANTS.fadeUp}
                                                            className="group/occ relative"
                                                        >
                                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 opacity-0 group-hover/occ:opacity-100 transition-all">
                                                                <div className="size-2 rounded-full theme-bg-primary"></div>
                                                            </div>
                                                            <div className={`bg-surface-card p-6 rounded-3xl border shadow-xl shadow-slate-200/40 dark:shadow-none hover:border-border-default transition-all flex flex-col gap-3 group-hover/occ:translate-x-2 ${selectedOccIds.has(occ.id) ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-border-subtle'}`}>
                                                                <div className="flex justify-between items-center">
                                                                    <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border-2 ${occ.type === 'Elogio' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10' : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10'}`}>
                                                                        {occ.type}
                                                                    </span>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="flex items-center gap-2 text-slate-400">
                                                                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                                                                            <span className="text-[10px] font-black font-mono tracking-tighter">{new Date(occ.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1 opacity-0 group-hover/occ:opacity-100 transition-opacity">
                                                                            <button
                                                                                onClick={() => handleEditOccurrence(occ)}
                                                                                className="p-2 hover:bg-amber-500/10 hover:text-amber-600 rounded-lg transition-all"
                                                                            >
                                                                                <span className="material-symbols-outlined text-lg">edit</span>
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteOccurrence(occ.id)}
                                                                                className="p-2 hover:bg-rose-500/10 hover:text-rose-600 rounded-lg transition-all"
                                                                            >
                                                                                <span className="material-symbols-outlined text-lg">delete</span>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <p className="text-sm text-text-secondary font-medium leading-relaxed italic pr-4 landscape:line-clamp-2">"{occ.description}"</p>
                                                            </div>
                                                        </motion.div>
                                                    )
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};