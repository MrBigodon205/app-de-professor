import React, { useState, useEffect } from 'react';
import { useClass } from '../contexts/ClassContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { Student, Occurrence } from '../types';
import { supabase } from '../lib/supabase';
import { DatePicker } from '../components/DatePicker';

export const Observations: React.FC = () => {
    const { selectedSeriesId, selectedSection, activeSeries } = useClass();
    const { currentUser } = useAuth();
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState<'general' | 'occurrences'>('general');
    const [students, setStudents] = useState<Student[]>([]);
    const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [selectedUnit, setSelectedUnit] = useState<string>('1');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Form States
    const [occType, setOccType] = useState('Indisciplina');
    const [occDescription, setOccDescription] = useState('');
    const [occurrenceDate, setOccurrenceDate] = useState(new Date().toLocaleDateString('sv-SE'));
    const [editingOccId, setEditingOccId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (selectedSeriesId && selectedSection) {
            fetchData();
        } else {
            setStudents([]);
            setOccurrences([]);
            setLoading(false);
        }
    }, [selectedSeriesId, selectedSection]);

    useEffect(() => {
        // Obsolete effect removed (generalObsText is now derived from student state)
    }, [selectedStudentId, students]);

    const fetchData = async (silent = false) => {
        if (!currentUser) return;
        if (!silent) setLoading(true);
        try {
            const { data: studentsData, error: studentError } = await supabase
                .from('students')
                .select('*')
                .eq('series_id', selectedSeriesId)
                .eq('section', selectedSection)
                .eq('user_id', currentUser.id);

            if (studentError) throw studentError;

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
            formattedStudents.sort((a, b) => parseInt(a.number) - parseInt(b.number));
            setStudents(formattedStudents);

            if (formattedStudents.length > 0) {
                if (!selectedStudentId || !formattedStudents.some(s => s.id === selectedStudentId)) {
                    setSelectedStudentId(formattedStudents[0].id);
                }
            } else {
                setSelectedStudentId(null);
            }

            const { data: occData, error: occError } = await supabase
                .from('occurrences')
                .select('*')
                .eq('user_id', currentUser.id);

            if (!occError && occData) {
                const studentIds = new Set(formattedStudents.map(s => s.id));
                const formattedOcc: Occurrence[] = occData
                    .filter(o => studentIds.has(o.student_id.toString()))
                    .map(o => ({
                        id: o.id.toString(),
                        studentId: o.student_id.toString(),
                        type: o.type,
                        description: o.description,
                        date: o.date,
                        userId: o.user_id
                    }));
                setOccurrences(formattedOcc);
            }
        } catch (e) {
            console.error("Error fetching data:", e);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // --- REALTIME SUBSCRIPTION FOR OCCURRENCES ---
    useEffect(() => {
        if (!currentUser || !selectedSeriesId) return;

        // Polling Fallback (Every 10s)
        const interval = setInterval(() => {
            fetchData(true);
        }, 10000);

        console.log("Setting up Realtime for Occurrences...");

        const channel = supabase.channel(`occurrences_sync_${selectedSeriesId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'occurrences'
                },
                (payload) => {
                    console.log("Realtime Occurrence Change Received!", payload);
                    fetchData(true);
                }
            )
            .subscribe();

        return () => {
            console.log("Cleaning up Occurrence Realtime...");
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, [selectedSeriesId, currentUser]);

    const selectedStudent = students.find(s => s.id === selectedStudentId);

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.number.toString().includes(searchTerm)
    );

    const handleSaveOccurrence = async () => {
        if (!selectedStudentId || !occDescription || !currentUser) return;
        setSaving(true);

        const occurrenceData = {
            student_id: selectedStudentId,
            type: occType,
            description: occDescription,
            date: occurrenceDate,
            user_id: currentUser.id
        };

        try {
            if (editingOccId) {
                const { data, error } = await supabase
                    .from('occurrences')
                    .update(occurrenceData)
                    .eq('id', editingOccId)
                    .select()
                    .single();

                if (!error && data) {
                    const updated: Occurrence = {
                        id: data.id.toString(),
                        studentId: data.student_id.toString(),
                        type: data.type,
                        description: data.description,
                        date: data.date,
                        userId: data.user_id
                    };
                    setOccurrences(occurrences.map(o => o.id === editingOccId ? updated : o));
                    setEditingOccId(null);
                    setOccDescription('');
                }
            } else {
                const { data, error } = await supabase
                    .from('occurrences')
                    .insert(occurrenceData)
                    .select()
                    .single();

                if (!error && data) {
                    const savedOcc: Occurrence = {
                        id: data.id.toString(),
                        studentId: data.student_id.toString(),
                        type: data.type,
                        description: data.description,
                        date: data.date,
                        userId: data.user_id
                    };
                    setOccurrences([...occurrences, savedOcc]);
                    setOccDescription('');
                    setOccurrenceDate(new Date().toISOString().split('T')[0]);
                }
            }
        } catch (e) { console.error(e) }
        finally { setSaving(false); }
    }

    const handleEditOccurrence = (occ: Occurrence) => {
        setOccType(occ.type);
        setOccDescription(occ.description);
        setOccurrenceDate(occ.date);
        setEditingOccId(occ.id);
        setActiveTab('occurrences');
    };

    const handleDeleteOccurrence = async (id: string) => {
        if (!window.confirm("Deseja realmente excluir este registro?")) return;

        try {
            const { error } = await supabase
                .from('occurrences')
                .delete()
                .eq('id', id);

            if (!error) {
                setOccurrences(occurrences.filter(o => o.id !== id));
            }
        } catch (e) { console.error(e) }
    };

    const handleSaveGeneralObs = async (text: string) => {
        if (!selectedStudentId) return;
        setSaving(true);
        try {
            const student = students.find(s => s.id === selectedStudentId);
            if (!student) return;

            const newUnits = { ...student.units };
            if (!newUnits[selectedUnit]) newUnits[selectedUnit] = {};
            newUnits[selectedUnit].observation = text;

            const { error } = await supabase
                .from('students')
                .update({ units: newUnits })
                .eq('id', selectedStudentId);

            if (error) throw error;

            setStudents(students.map(s => s.id === selectedStudentId ? { ...s, units: newUnits } : s));
        } catch (e) { console.error(e) }
        finally { setSaving(false); }
    };

    const studentOccurrences = occurrences.filter(o => o.studentId === selectedStudentId);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 animate-pulse">
            <div className={`size-12 border-4 border-${theme.primaryColor}/20 border-t-${theme.primaryColor} rounded-full animate-spin mb-4 shadow-lg shadow-${theme.primaryColor}/20`}></div>
            <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Organizando Arquivo Escolar...</p>
        </div>
    );

    if (!selectedSeriesId) return (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-500">
            <div className={`size-20 rounded-2xl bg-${theme.primaryColor}/10 flex items-center justify-center mb-6`}>
                <span className={`material-symbols-outlined text-4xl text-${theme.primaryColor}`}>{theme.icon}</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Selecione uma Turma</h3>
            <p className="text-slate-500 text-center max-w-sm">Acesse o diário de observações escolhendo uma turma no menu superior.</p>
        </div>
    );

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100dvh-7rem)] lg:h-full gap-4 lg:gap-8 max-w-[1700px] mx-auto overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 px-2 lg:px-0">
            {/* Sidebar List */}
            <div className={`w-full lg:w-96 flex flex-col bg-white dark:bg-slate-900 rounded-[32px] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden shrink-0 ${selectedStudentId ? 'hidden lg:flex' : 'flex'}`}>
                <div className={`p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900`}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`size-10 rounded-xl bg-${theme.primaryColor}/10 text-${theme.primaryColor} flex items-center justify-center`}>
                            <span className="material-symbols-outlined">badge</span>
                        </div>
                        <h2 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm">
                            {activeSeries?.name} • {selectedSection}
                        </h2>
                    </div>
                    <div className="relative group">
                        <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-${theme.primaryColor} transition-colors`}>search</span>
                        <input
                            type="text"
                            placeholder="Buscar por nome ou número..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full h-12 pl-12 pr-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-${theme.primaryColor} focus:ring-4 focus:ring-${theme.primaryColor}/10 text-sm font-bold transition-all shadow-sm`}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                    {filteredStudents.map(student => (
                        <button
                            key={student.id}
                            onClick={() => setSelectedStudentId(student.id)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 relative group/item ${selectedStudentId === student.id
                                ? `bg-${theme.primaryColor}/5 border border-${theme.primaryColor}/10`
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                                }`}
                        >
                            {selectedStudentId === student.id && (
                                <div className={`absolute left-2 w-1 h-6 bg-${theme.primaryColor} rounded-full`}></div>
                            )}
                            <div className={`size-11 rounded-2xl bg-gradient-to-br ${student.color || `from-${theme.primaryColor} to-${theme.secondaryColor}`} flex items-center justify-center text-sm font-black text-white shrink-0 shadow-lg shadow-slate-200 dark:shadow-none transition-transform group-hover/item:scale-110`}>
                                {student.initials || student.name.substring(0, 2)}
                            </div>
                            <div className="flex flex-col items-start min-w-0 pr-4">
                                <span className={`text-sm font-black truncate w-full text-left transition-colors ${selectedStudentId === student.id ? `text-${theme.primaryColor}` : 'text-slate-700 dark:text-slate-200 group-hover/item:text-slate-950 dark:group-hover/item:text-white'}`}>{student.name}</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nº {student.number.padStart(2, '0')}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-[32px] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden relative group ${!selectedStudentId ? 'hidden lg:flex' : 'flex'}`}>
                {/* Mobile Back Button */}
                <button
                    onClick={() => setSelectedStudentId(null)}
                    className="lg:hidden absolute top-6 left-6 z-50 size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                {/* Header Background Accent */}
                <div className={`absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-${theme.primaryColor}/5 to-transparent rounded-full -mr-40 -mt-40 blur-3xl`}></div>

                {/* Header */}
                <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row justify-between items-center gap-6 sm:gap-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4 sm:gap-6 w-full lg:w-auto mt-8 lg:mt-0">
                        {selectedStudent && (
                            <>
                                <div className={`size-16 sm:size-20 rounded-[24px] sm:rounded-[28px] bg-gradient-to-br ${selectedStudent.color || `from-${theme.primaryColor} to-${theme.secondaryColor}`} flex items-center justify-center text-2xl sm:text-3xl font-black text-white shadow-2xl shadow-slate-200 dark:shadow-none ring-4 sm:ring-8 ring-slate-50 dark:ring-slate-950 shrink-0`}>
                                    {selectedStudent.initials}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2 truncate">{selectedStudent.name}</h1>
                                    <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-sm font-bold text-slate-400">
                                        <span className="bg-slate-100 dark:bg-slate-800 px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl font-mono text-slate-500">#{selectedStudent.number.padStart(2, '0')}</span>
                                        <span>•</span>
                                        <span className={`text-${theme.primaryColor} truncate`}>{activeSeries?.name} • Turma {selectedSection}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-950/50 rounded-2xl shadow-inner border border-slate-200 dark:border-slate-800 w-full lg:w-auto overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-[14px] text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'general' ? `bg-white dark:bg-slate-800 text-${theme.primaryColor} shadow-md` : 'text-slate-400'}`}
                        >
                            <span className="material-symbols-outlined text-lg">description</span>
                            Geral
                        </button>
                        <button
                            onClick={() => setActiveTab('occurrences')}
                            className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-[14px] text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'occurrences' ? `bg-white dark:bg-slate-800 text-${theme.primaryColor} shadow-md` : 'text-slate-400'}`}
                        >
                            <span className="material-symbols-outlined text-lg">history_edu</span>
                            Ocorrências
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {activeTab === 'general' ? (
                        <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className={`bg-gradient-to-r from-${theme.primaryColor}/5 to-transparent border-l-4 border-${theme.primaryColor} p-6 rounded-2xl flex flex-1 gap-4 text-slate-600 dark:text-slate-400`}>
                                    <span className={`material-symbols-outlined text-${theme.primaryColor} text-3xl`}>auto_awesome</span>
                                    <div className="flex flex-col gap-1">
                                        <h4 className="font-black uppercase tracking-widest text-[10px] text-slate-500">Dica Pedagógica</h4>
                                        <p className="text-sm font-medium leading-relaxed">Registro analítico da evolução psicossocial e acadêmica.</p>
                                    </div>
                                </div>
                                <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl shadow-inner border border-slate-200 dark:border-slate-800 shrink-0 w-full sm:w-auto">
                                    {['1', '2', '3'].map(u => (
                                        <button
                                            key={u}
                                            onClick={() => setSelectedUnit(u)}
                                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedUnit === u
                                                ? `bg-${theme.primaryColor} text-white shadow-lg`
                                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                        >
                                            {u}ª Unid
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <label className="flex items-center justify-between font-black text-slate-800 dark:text-white uppercase tracking-[0.2em] text-[10px] ml-1">
                                    <div className="flex items-center gap-3">
                                        <span className={`size-3 rounded-full bg-${theme.primaryColor}`}></span>
                                        Conteúdo do Diário de Bordo - {selectedUnit}ª Unidade
                                    </div>
                                    {saving ? (
                                        <span className={`text-${theme.primaryColor} animate-pulse tracking-widest flex items-center gap-1`}>
                                            <span className="material-symbols-outlined text-[14px]">sync</span> Salvando...
                                        </span>
                                    ) : (
                                        <span className="text-emerald-500 tracking-widest flex items-center gap-1 opacity-60 group-focus-within:opacity-100 transition-opacity">
                                            <span className="material-symbols-outlined text-[14px]">cloud_done</span> Salvo localmente
                                        </span>
                                    )}
                                </label>
                                <textarea
                                    value={selectedStudent?.units[selectedUnit]?.observation || ''}
                                    onChange={(e) => {
                                        const text = e.target.value;
                                        setStudents(students.map(s => {
                                            if (s.id === selectedStudentId) {
                                                const newUnits = { ...s.units };
                                                if (!newUnits[selectedUnit]) newUnits[selectedUnit] = {};
                                                newUnits[selectedUnit].observation = text;
                                                return { ...s, units: newUnits };
                                            }
                                            return s;
                                        }));
                                    }}
                                    onBlur={(e) => handleSaveGeneralObs(e.target.value)}
                                    className={`w-full h-[500px] p-8 rounded-[32px] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 resize-none shadow-sm focus:ring-8 focus:ring-${theme.primaryColor}/5 focus:border-${theme.primaryColor} text-base font-medium leading-relaxed transition-all placeholder:italic custom-scrollbar`}
                                    placeholder="Inicie aqui suas anotações sobre reuniões com responsáveis, dificuldades específicas observadas em sala ou avanços notáveis..."
                                ></textarea>
                            </div>

                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <p className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">info</span>
                                    Salvamento automático ao perder o foco.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Premium Form */}
                            <div className="bg-slate-50 dark:bg-slate-950/50 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 relative group/form">
                                {/* Decorative Background - Clipped for rounded corners */}
                                <div className="absolute inset-0 rounded-[30px] overflow-hidden pointer-events-none">
                                    <div className={`absolute top-0 left-0 w-2 h-full bg-${theme.primaryColor} opacity-20`}></div>
                                </div>

                                <h3 className="font-black text-lg text-slate-800 dark:text-white mb-8 flex items-center gap-4 relative z-10">
                                    <div className={`size-11 rounded-1.5xl bg-${theme.primaryColor}/10 text-${theme.primaryColor} flex items-center justify-center`}>
                                        <span className="material-symbols-outlined text-2xl">{editingOccId ? 'edit_note' : 'add_moderator'}</span>
                                    </div>
                                    {editingOccId ? 'Editar Registro' : 'Registrar Novo Ponto de Atenção'}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                    <div className="md:col-span-4">
                                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 ml-1">Categoria</label>
                                        <select
                                            value={occType}
                                            onChange={(e) => setOccType(e.target.value)}
                                            className={`w-full h-14 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-sm focus:border-${theme.primaryColor} focus:ring-4 focus:ring-${theme.primaryColor}/10 transition-all cursor-pointer`}
                                        >
                                            <option>Indisciplina</option>
                                            <option>Atraso</option>
                                            <option>Não Fez Tarefa</option>
                                            <option>Elogio</option>
                                            <option>Falta de Material</option>
                                            <option>Uso de Celular</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-4">
                                        <DatePicker
                                            label="Data"
                                            value={occurrenceDate}
                                            onChange={setOccurrenceDate}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="md:col-span-12">
                                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 ml-1">Descrição Detalhada</label>
                                        <input
                                            type="text"
                                            value={occDescription}
                                            onChange={(e) => setOccDescription(e.target.value)}
                                            placeholder="Descreva brevemente o ocorrido..."
                                            className={`w-full h-14 px-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium focus:border-${theme.primaryColor} focus:ring-4 focus:ring-${theme.primaryColor}/10 shadow-sm transition-all`}
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row justify-end mt-8 gap-4">
                                    {editingOccId && (
                                        <button
                                            onClick={() => {
                                                setEditingOccId(null);
                                                setOccDescription('');
                                                setOccurrenceDate(new Date().toISOString().split('T')[0]);
                                            }}
                                            className="h-14 px-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                    <button
                                        onClick={handleSaveOccurrence}
                                        disabled={saving || !occDescription}
                                        className={`${editingOccId ? 'bg-amber-500' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'} font-black h-14 px-8 rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] shadow-xl disabled:opacity-50`}
                                    >
                                        <span className="material-symbols-outlined text-lg">{editingOccId ? 'save' : 'add_circle'}</span>
                                        {editingOccId ? 'Salvar Edição' : 'Inserir no Histórico'}
                                    </button>
                                </div>
                            </div>

                            {/* Refined Timeline */}
                            <div className="flex flex-col gap-8">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="font-black text-xl text-slate-800 dark:text-white flex items-center gap-3">
                                        Linha do Tempo
                                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{studentOccurrences.length} Registros</span>
                                    </h3>
                                </div>

                                <div className="relative border-l-4 border-slate-100 dark:border-slate-800 ml-6 space-y-10 pb-12">
                                    {studentOccurrences.length === 0 && (
                                        <div className="pl-12 pt-10 text-center flex flex-col items-center gap-4">
                                            <div className="size-20 rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                                                <span className="material-symbols-outlined text-slate-300 text-4xl">inventory_2</span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-400 italic">Nenhum evento registrado ainda.</p>
                                        </div>
                                    )}
                                    {studentOccurrences.slice().reverse().map((occ, idx) => (
                                        <div key={occ.id} className="relative pl-12 group/occ animate-in slide-in-from-left duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                            <div className={`absolute -left-[14px] top-6 size-6 rounded-full border-4 border-white dark:border-slate-900 shadow-md transition-transform group-hover/occ:scale-125 z-10 ${occ.type === 'Elogio' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                            <div className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none hover:border-slate-200 dark:hover:border-slate-700 transition-all flex flex-col gap-3 group-hover/occ:translate-x-2">
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
                                                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic pr-4">"{occ.description}"</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};