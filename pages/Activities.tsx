import React, { useState, useEffect } from 'react';
import { useClass } from '../contexts/ClassContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { Activity, AttachmentFile, Student } from '../types';
import { supabase } from '../lib/supabase';
import DOMPurify from 'dompurify';
import { DatePicker } from '../components/DatePicker';
import { RichTextEditor } from '../components/RichTextEditor';

// Fallback types if fetch fails
const DEFAULT_ACTIVITY_TYPES = ['Prova', 'Trabalho', 'Dever de Casa', 'Seminário', 'Pesquisa', 'Conteúdo', 'Outro'];

export const Activities: React.FC = () => {
    const { activeSeries, selectedSeriesId, selectedSection, classes } = useClass();
    const { currentUser } = useAuth();
    const theme = useTheme();

    // UI State
    const [activities, setActivities] = useState<Activity[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [activityTypes, setActivityTypes] = useState<string[]>(DEFAULT_ACTIVITY_TYPES);

    // Form State
    const [formTitle, setFormTitle] = useState('');
    const [formType, setFormType] = useState('Prova');
    const [formDate, setFormDate] = useState('');
    const [formStartDate, setFormStartDate] = useState('');
    const [formEndDate, setFormEndDate] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formFiles, setFormFiles] = useState<AttachmentFile[]>([]);
    const [formSeriesId, setFormSeriesId] = useState('');
    const [formSection, setFormSection] = useState('');

    useEffect(() => {
        fetchActivityTypes();
    }, []);

    useEffect(() => {
        fetchActivities();
    }, [selectedSeriesId]);

    const fetchActivityTypes = async () => {
        try {
            const { data, error } = await supabase
                .from('activity_types')
                .select('name')
                .order('name');

            if (error) throw error;
            if (data && data.length > 0) {
                setActivityTypes(data.map(t => t.name));
            }
        } catch (error) {
            console.error('Error fetching activity types:', error);
            // Keep defaults
        }
    };

    useEffect(() => {
        if (selectedSeriesId && selectedSection) {
            setFormSeriesId(selectedSeriesId);
            setFormSection(selectedSection);
            fetchStudents();
        }
    }, [selectedSeriesId, selectedSection]);

    const fetchStudents = async () => {
        if (!selectedSeriesId || !selectedSection || !currentUser) return;
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
        } catch (e) {
            console.error(e);
        }
    }

    const fetchActivities = async (silent = false) => {
        if (!currentUser) return;
        if (!silent) setLoading(true);
        try {
            let query = supabase.from('activities').select('*').eq('user_id', currentUser.id);

            if (selectedSeriesId) {
                query = query.eq('series_id', selectedSeriesId);
            }

            const { data, error } = await query;
            if (error) throw error;

            const formatted: Activity[] = (data || []).map(a => ({
                id: a.id.toString(),
                title: a.title,
                type: a.type,
                seriesId: a.series_id.toString(),
                section: a.section || '',
                date: a.date,
                startDate: a.start_date,
                endDate: a.end_date,
                description: a.description,
                files: a.files || [],
                completions: a.completions || [],
                userId: a.user_id
            }));

            formatted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setActivities(formatted);
            if (formatted.length > 0 && !selectedActivityId) {
                setSelectedActivityId(formatted[0].id);
            } else if (formatted.length === 0) {
                setSelectedActivityId(null);
            }
        } catch (e) {
            console.error("Failed to load activities", e);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // --- REALTIME SUBSCRIPTION ---
    useEffect(() => {
        if (!currentUser || !selectedSeriesId) return;

        // Polling Fallback (Every 10s)
        const interval = setInterval(() => {
            fetchActivities(true);
        }, 10000);

        console.log("Setting up Realtime for Activities...");

        const channel = supabase.channel(`activities_sync_${selectedSeriesId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'activities'
                },
                (payload) => {
                    console.log("Realtime Activity Change Received!", payload);
                    fetchActivities(true);
                }
            )
            .subscribe();

        return () => {
            console.log("Cleaning up Activity Realtime...");
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, [selectedSeriesId, currentUser]);

    const handleNewActivity = () => {
        if (!selectedSeriesId) {
            alert("Por favor, selecione uma série no menu superior para criar uma atividade.");
            return;
        }
        setIsEditing(true);
        setSelectedActivityId(null);
        setFormTitle('');
        setFormType('Prova');
        setFormDate(new Date().toLocaleDateString('sv-SE'));
        setFormStartDate(new Date().toLocaleDateString('sv-SE'));
        setFormEndDate(new Date().toLocaleDateString('sv-SE'));
        setFormDescription('');
        setFormFiles([]);
        setFormSeriesId(selectedSeriesId);
        setFormSection(selectedSection || '');
    };

    const handleSelectActivity = (act: Activity) => {
        setIsEditing(false);
        setSelectedActivityId(act.id);
        setFormTitle(act.title);
        setFormType(act.type);
        setFormDate(act.date);
        setFormStartDate(act.startDate || act.date);
        setFormEndDate(act.endDate || act.date);
        setFormDescription(act.description);
        setFormFiles(act.files);
        setFormSeriesId(act.seriesId);
        setFormSection(act.section || '');
    };

    const handleSave = async () => {
        if (!formTitle || !formDate || !formType) {
            alert("Preencha o título, tipo e data.");
            return;
        }

        if (!formSeriesId) {
            alert("A Série é obrigatória!");
            return;
        }

        setLoading(true);

        const activityData = {
            title: formTitle,
            type: formType,
            date: formDate,
            start_date: formType === 'Conteúdo' ? formStartDate : null,
            end_date: formType === 'Conteúdo' ? formEndDate : null,
            description: formDescription,
            series_id: formSeriesId,
            section: formSection || null,
            files: formFiles,
            user_id: currentUser?.id
        };

        try {
            let saved: Activity;
            if (selectedActivityId && isEditing && activities.some(a => a.id === selectedActivityId)) {
                // Update
                const { data, error } = await supabase
                    .from('activities')
                    .update(activityData)
                    .eq('id', selectedActivityId)
                    .select()
                    .single();

                if (error) throw error;
                saved = {
                    id: data.id.toString(),
                    title: data.title,
                    type: data.type,
                    seriesId: data.series_id.toString(),
                    section: data.section || '',
                    date: data.date,
                    startDate: data.start_date,
                    endDate: data.end_date,
                    description: data.description,
                    files: data.files || [],
                    completions: data.completions || [],
                    userId: data.user_id
                };
                setActivities(activities.map(a => a.id === saved.id ? saved : a));
                alert("Atividade atualizada!");
            } else {
                // Create
                const { data, error } = await supabase
                    .from('activities')
                    .insert({ ...activityData, completions: [] })
                    .select()
                    .single();

                if (error) throw error;
                saved = {
                    id: data.id.toString(),
                    title: data.title,
                    type: data.type,
                    seriesId: data.series_id.toString(),
                    section: data.section || '',
                    date: data.date,
                    startDate: data.start_date,
                    endDate: data.end_date,
                    description: data.description,
                    files: data.files || [],
                    completions: data.completions || [],
                    userId: data.user_id
                };
                setActivities([saved, ...activities]);
                setSelectedActivityId(saved.id);
                alert("Atividade criada!");
            }
            setIsEditing(false);
        } catch (e: any) {
            console.error(e);
            alert(`Erro ao salvar: ${e.message || 'Erro desconhecido'}`);
        } finally {
            setLoading(false);
        }
    };

    const toggleCompletion = async (studentId: string) => {
        if (!currentActivity) return;

        const completions = currentActivity.completions || [];
        const newCompletions = completions.includes(studentId)
            ? completions.filter(id => id !== studentId)
            : [...completions, studentId];

        try {
            const { data, error } = await supabase
                .from('activities')
                .update({ completions: newCompletions })
                .eq('id', currentActivity.id)
                .select()
                .single();

            if (error) throw error;

            const updated: Activity = {
                id: data.id.toString(),
                title: data.title,
                type: data.type,
                seriesId: data.series_id.toString(),
                section: data.section || '',
                date: data.date,
                startDate: data.start_date,
                endDate: data.end_date,
                description: data.description,
                files: data.files || [],
                completions: data.completions || [],
                userId: data.user_id
            };
            setActivities(activities.map(a => a.id === updated.id ? updated : a));
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async () => {
        if (!selectedActivityId) {
            console.warn('Nenhuma atividade selecionada para excluir');
            return;
        }

        const confirmed = window.confirm("Tem certeza que deseja apagar esta atividade?");
        if (!confirmed) {
            console.log('Exclusão cancelada pelo usuário');
            return;
        }

        console.log('Excluindo atividade:', selectedActivityId);
        setLoading(true);

        try {
            const { error } = await supabase
                .from('activities')
                .delete()
                .eq('id', selectedActivityId);

            if (!error) {
                const updatedActivities = activities.filter(a => a.id !== selectedActivityId);
                console.log('Atividade excluída. Total restante:', updatedActivities.length);
                setActivities(updatedActivities);
                setSelectedActivityId(null);
                setIsEditing(false);
                window.dispatchEvent(new CustomEvent('refresh-notifications'));
                alert("Atividade excluída com sucesso!");
            } else {
                console.error('Erro ao excluir:', error.message);
                alert(`Erro ao excluir a atividade: ${error.message}`);
                throw error;
            }
        } catch (e) {
            console.error('Erro de conexão ao excluir:', e);
            alert("Erro ao tentar excluir a atividade.");
        } finally {
            setLoading(false);
        }
    };

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            alert("O arquivo é muito grande! O limite é de 2MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                const newFile: AttachmentFile = {
                    id: crypto.randomUUID(),
                    name: file.name,
                    size: `${(file.size / 1024).toFixed(1)} KB`,
                    url: event.target.result as string // Base64 Data URL
                };
                setFormFiles([...formFiles, newFile]);
            }
        };
        reader.readAsDataURL(file);

        // Reset input
        e.target.value = '';
    };

    const handleRemoveFile = (id: string) => {
        setFormFiles(formFiles.filter(f => f.id !== id));
    };

    // Robust Download Logic (Blob-based)
    const handleDownload = (file: AttachmentFile) => {
        try {
            // Check if it's a data URL
            if (file.url.startsWith('data:')) {
                const parts = file.url.split(',');
                const mime = parts[0].match(/:(.*?);/)?.[1];
                const bstr = atob(parts[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                const blob = new Blob([u8arr], { type: mime });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                // Regular URL fallback
                const a = document.createElement('a');
                a.href = file.url;
                a.download = file.name;
                a.target = "_blank";
                a.click();
            }
        } catch (e) {
            console.error("Download failed:", e);
            alert("Erro ao baixar arquivo.");
        }
    };

    const currentActivity = activities.find(a => a.id === selectedActivityId);
    const displayedActivities = activities.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));

    const getIconForType = (type: string) => {
        switch (type) {
            case 'Prova': return 'assignment_late';
            case 'Trabalho': return 'group_work';
            case 'Dever de Casa': return 'home_work';
            case 'Seminário': return 'co_present';
            case 'Conteúdo': return 'auto_stories';
            default: return 'assignment';
        }
    }

    return (
        <div className="flex h-full gap-6 max-w-[1600px] mx-auto overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="*/*"
                onChange={handleFileChange}
            />

            {/* Sidebar with Card List Style */}
            <div className={`w-full lg:w-80 flex flex-col gap-4 shrink-0 transition-all ${selectedActivityId || isEditing ? 'hidden lg:flex' : 'flex'}`}>
                {/* Sidebar Header */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-slate-900 dark:text-white text-lg">Atividades</h2>
                        <button onClick={handleNewActivity} className={`bg-${theme.primaryColor} hover:bg-${theme.secondaryColor} text-white size-9 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-${theme.primaryColor}/20 hover:-translate-y-0.5 active:translate-y-0`} title="Nova Atividade">
                            <span className="material-symbols-outlined text-[20px]">add</span>
                        </button>
                    </div>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[20px]">search</span>
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${theme.primaryColor}/50 text-sm transition-all focus:bg-white dark:focus:bg-black`}
                        />
                    </div>
                </div>

                {/* List Items */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 pb-24 lg:pb-0">
                    {displayedActivities.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                            Nenhuma atividade encontrada.
                        </div>
                    ) : (
                        displayedActivities.map(act => (
                            <button
                                key={act.id}
                                onClick={() => handleSelectActivity(act)}
                                className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 group relative overflow-hidden shadow-sm ${selectedActivityId === act.id
                                    ? `bg-white dark:bg-surface-dark border-${theme.primaryColor} shadow-${theme.primaryColor}/10 ring-1 ring-${theme.primaryColor}`
                                    : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'}`}
                            >
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${selectedActivityId === act.id ? `bg-${theme.primaryColor}` : 'bg-transparent group-hover:bg-slate-200'} transition-all`}></div>
                                <div className="pl-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className={`font-bold text-base truncate pr-2 ${selectedActivityId === act.id ? `text-${theme.primaryColor}` : 'text-slate-800 dark:text-slate-200'}`}>{act.title}</h4>
                                        <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs font-medium">
                                        <span className={`px-2.5 py-1 rounded-md ${selectedActivityId === act.id ? `bg-${theme.primaryColor}/10 text-${theme.primaryColor}` : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                            {act.type}
                                        </span>
                                        <div className="flex items-center gap-1 text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                                            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold px-2 py-1 rounded-md">{new Date(act.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Mobile FAB */}
                <button
                    onClick={handleNewActivity}
                    className={`lg:hidden fixed bottom-24 right-6 size-14 rounded-2xl bg-${theme.primaryColor} text-white shadow-xl shadow-${theme.primaryColor}/30 flex items-center justify-center z-50 active:scale-90 transition-all`}
                >
                    <span className="material-symbols-outlined text-3xl">add</span>
                </button>
            </div>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col bg-white dark:bg-surface-dark rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden relative transition-all ${selectedActivityId || isEditing ? 'flex' : 'hidden lg:flex'}`}>
                {(!selectedActivityId && !isEditing) ? (
                    // --- HERO EMPTY STATE ---
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-300">
                        <div className={`size-32 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-8 shadow-sm border border-slate-100 dark:border-slate-700`}>
                            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600">assignment_add</span>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Gerenciar Atividades</h2>
                        <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
                            Crie e distribua provas, trabalhos e deveres de casa para sua turma de <span className={`text-${theme.primaryColor} font-bold`}>{theme.subject}</span> de forma organizada.
                        </p>
                        <button
                            onClick={handleNewActivity}
                            className={`group relative inline-flex items-center justify-center gap-3 bg-${theme.primaryColor} hover:bg-${theme.secondaryColor} text-white text-lg font-bold py-4 px-8 rounded-2xl shadow-xl shadow-${theme.primaryColor}/20 transition-all hover:-translate-y-1 active:translate-y-0 overflow-hidden`}
                        >
                            <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform duration-300">add</span>
                            Criar Nova Atividade
                            <div className="absolute inset-0 rounded-2xl ring-2 ring-white/20 group-hover:ring-white/40 transition-all"></div>
                        </button>
                    </div>
                ) : isEditing ? (
                    // --- EDIT / CREATE MODE ---
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="max-w-4xl mx-auto flex flex-col gap-8">
                            <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => { setSelectedActivityId(null); setIsEditing(false); }}
                                        className="lg:hidden size-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 flex items-center justify-center"
                                    >
                                        <span className="material-symbols-outlined">arrow_back</span>
                                    </button>
                                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                        <div className={`size-10 rounded-xl bg-${theme.primaryColor}/10 text-${theme.primaryColor} flex items-center justify-center`}>
                                            <span className="material-symbols-outlined">{selectedActivityId ? 'edit_document' : 'post_add'}</span>
                                        </div>
                                        {selectedActivityId ? 'Editar Atividade' : 'Nova Atividade'}
                                    </h2>
                                </div>
                            </div>

                            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 ml-1">Título da Atividade</label>
                                    <input
                                        type="text"
                                        value={formTitle}
                                        onChange={e => setFormTitle(e.target.value)}
                                        className={`w-full text-lg font-bold p-4 rounded-xl bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-black border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${theme.primaryColor}/50 transition-all outline-none`}
                                        placeholder="Ex: Exercícios de Fixação"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {formType === 'Conteúdo' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <DatePicker
                                                label="Início"
                                                value={formStartDate}
                                                onChange={setFormStartDate}
                                            />
                                            <DatePicker
                                                label="Fim"
                                                value={formEndDate}
                                                onChange={setFormEndDate}
                                            />
                                        </div>
                                    ) : (
                                        <DatePicker
                                            label="Data de Entrega"
                                            value={formDate}
                                            onChange={setFormDate}
                                        />
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 ml-1">Tipo de Atividade</label>
                                        <div className="relative">
                                            <select
                                                value={formType}
                                                onChange={e => setFormType(e.target.value as any)}
                                                className={`w-full font-bold p-3 rounded-xl bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-black border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${theme.primaryColor}/50 text-lg appearance-none outline-none`}
                                            >
                                                {activityTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                            <span className="material-symbols-outlined absolute right-3 top-3.5 pointer-events-none text-slate-500">expand_more</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-8">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Série (Obrigatória)</label>
                                        <div className="font-bold text-lg text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-slate-400">school</span>
                                            {activeSeries?.name || formSeriesId || 'Selecione no Menu'}
                                        </div>
                                    </div>
                                    <div className="w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Turma (Opcional)</label>
                                        <select
                                            value={formSection}
                                            onChange={e => setFormSection(e.target.value)}
                                            className={`block w-full md:w-48 text-sm font-bold rounded-xl border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-${theme.primaryColor} focus:border-${theme.primaryColor} p-2.5 transition-shadow`}
                                        >
                                            <option value="">Todas as Turmas</option>
                                            {activeSeries?.sections.map(s => <option key={s} value={s}>Turma {s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 ml-1">Descrição</label>
                                    <RichTextEditor
                                        value={formDescription}
                                        onChange={setFormDescription}
                                        placeholder="Descreva a atividade, critérios de avaliação e instruções..."
                                    />
                                </div>

                                {/* Files Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="text-xs font-black uppercase text-slate-400 ml-1 tracking-widest">Materiais de Apoio</label>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            type="button"
                                            className={`flex items-center gap-2 px-5 py-3 bg-${theme.primaryColor}/10 text-${theme.primaryColor} rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-${theme.primaryColor} hover:text-white transition-all active:scale-95 border border-${theme.primaryColor}/20 hover:border-transparent shadow-sm`}
                                        >
                                            <span className="material-symbols-outlined text-base">upload_file</span>
                                            Adicionar Arquivo
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {formFiles.map(file => (
                                            <div key={file.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 group">
                                                <div className={`size-10 rounded-lg bg-${theme.primaryColor}/10 text-${theme.primaryColor} flex items-center justify-center shrink-0`}>
                                                    <span className="material-symbols-outlined">description</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold truncate text-slate-700 dark:text-slate-200">{file.name}</div>
                                                    <div className="text-xs text-slate-400">{file.size}</div>
                                                </div>
                                                <button onClick={() => handleRemoveFile(file.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                                    <span className="material-symbols-outlined">close</span>
                                                </button>
                                            </div>
                                        ))}
                                        {formFiles.length === 0 && (
                                            <div className="col-span-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                                                <span className="material-symbols-outlined text-3xl">folder_open</span>
                                                <span className="text-sm">Nenhum arquivo anexado</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Footer Actions */}
                        <div className="sticky bottom-0 bg-white/80 dark:bg-surface-dark/90 backdrop-blur-sm p-4 -mx-8 -mb-8 mt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 z-10 animate-in slide-in-from-bottom-2">
                            <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
                            {selectedActivityId && (
                                <button onClick={handleDelete} className="px-6 py-2.5 rounded-xl text-red-500 font-bold hover:bg-red-50 transition-colors">Excluir</button>
                            )}
                            <button onClick={handleSave} className={`px-8 py-2.5 rounded-xl bg-${theme.primaryColor} text-white font-bold shadow-lg shadow-${theme.primaryColor}/20 hover:shadow-xl hover:bg-${theme.secondaryColor} transition-all active:scale-95`}>
                                Salvar Atividade
                            </button>
                        </div>
                    </div>
                ) : (
                    // --- VIEW MODE ---
                    currentActivity && (
                        <div className="flex-1 overflow-y-auto relative animate-in fade-in">
                            {/* Header Image/Gradient */}
                            <div className={`h-48 bg-gradient-to-r ${theme.bgGradient} relative overflow-hidden`}>
                                <div className="absolute inset-0 opacity-10 flex flex-wrap gap-8 justify-end p-8 rotate-12 scale-150 pointer-events-none">
                                    <span className="material-symbols-outlined text-[150px] text-white">{theme.icon}</span>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/50 to-transparent">
                                    <div className="flex gap-2 mb-2">
                                        <span className="px-2 py-1 rounded-md bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/20">
                                            {classes.find(c => c.id === currentActivity.seriesId)?.name}
                                        </span>
                                        {currentActivity.section && (
                                            <span className="px-2 py-1 rounded-md bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/20">
                                                Turma {currentActivity.section}
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-white shadow-sm">{currentActivity.title}</h1>
                                </div>
                                <div className="absolute top-6 left-6 lg:hidden">
                                    <button
                                        onClick={() => setSelectedActivityId(null)}
                                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md border border-white/20 transition-all shadow-lg"
                                        title="Voltar para Lista"
                                    >
                                        <span className="material-symbols-outlined">arrow_back</span>
                                    </button>
                                </div>
                                <div className="absolute top-6 right-6 flex gap-2">
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md border border-white/20 transition-all shadow-lg"
                                        title="Editar Atividade"
                                    >
                                        <span className="material-symbols-outlined">edit</span>
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="p-2 bg-red-500/20 hover:bg-red-500/40 text-white rounded-xl backdrop-blur-md border border-white/20 transition-all shadow-lg"
                                        title="Excluir Atividade"
                                    >
                                        <span className="material-symbols-outlined text-red-200">delete</span>
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 max-w-5xl mx-auto space-y-8">
                                {/* Info Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                        <div className="size-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                            <span className="material-symbols-outlined">event</span>
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase font-bold text-slate-400">
                                                {currentActivity.type === 'Conteúdo' ? 'Período' : 'Entrega'}
                                            </div>
                                            <div className="font-bold text-slate-700 dark:text-gray-200">
                                                {currentActivity.type === 'Conteúdo' ? (
                                                    `${new Date((currentActivity.startDate || currentActivity.date) + 'T12:00:00').toLocaleDateString('pt-BR')} - ${new Date((currentActivity.endDate || currentActivity.date) + 'T12:00:00').toLocaleDateString('pt-BR')}`
                                                ) : (
                                                    new Date(currentActivity.date + 'T12:00:00').toLocaleDateString('pt-BR')
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                        <div className="size-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <span className="material-symbols-outlined">category</span>
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase font-bold text-slate-400">Tipo</div>
                                            <div className="font-bold text-slate-700 dark:text-gray-200">
                                                {currentActivity.type}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="prose dark:prose-invert max-w-none">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                        <span className={`material-symbols-outlined text-${theme.primaryColor}`}>subject</span>
                                        Detalhes da Atividade
                                    </h3>
                                    <div
                                        className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-300 leading-relaxed custom-html-content"
                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentActivity.description) }}
                                    />
                                </div>

                                {/* Delivery List / Completion Tracking */}
                                {currentActivity.type !== 'Conteúdo' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`material-symbols-outlined text-${theme.primaryColor}`}>how_to_reg</span>
                                                Lista de Entrega / Realização
                                            </div>
                                            <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full uppercase">
                                                {currentActivity.completions?.length || 0} / {students.length} Realizaram
                                            </span>
                                        </h3>

                                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:gap-px bg-slate-100 dark:bg-slate-700">
                                                {students.map(s => {
                                                    const isDone = currentActivity.completions?.includes(s.id);
                                                    return (
                                                        <div
                                                            key={s.id}
                                                            className={`p-4 bg-white dark:bg-slate-800 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer`}
                                                            onClick={() => toggleCompletion(s.id)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs font-mono text-slate-400 w-5">{s.number}</span>
                                                                <span className={`text-sm font-bold ${isDone ? `text-${theme.primaryColor}` : 'text-slate-600 dark:text-slate-300'}`}>{s.name}</span>
                                                            </div>
                                                            <div className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all ${isDone ? `bg-${theme.primaryColor} border-${theme.primaryColor} text-white scale-110` : `border-slate-200 dark:border-slate-700 group-hover:border-${theme.primaryColor}/50`}`}>
                                                                {isDone && <span className="material-symbols-outlined text-[16px] font-bold">check</span>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {students.length === 0 && (
                                                <div className="p-8 text-center text-slate-400 italic">
                                                    Nenhum aluno encontrado para esta turma.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Files */}
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                        <span className={`material-symbols-outlined text-${theme.primaryColor}`}>folder</span>
                                        Materiais Anexados
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {(currentActivity.files || []).map(file => (
                                            <button
                                                key={file.id}
                                                onClick={() => handleDownload(file)}
                                                className={`group block w-full text-left bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-${theme.primaryColor}/50 hover:shadow-md transition-all`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`size-12 rounded-xl bg-${theme.primaryColor}/10 text-${theme.primaryColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                                        <span className="material-symbols-outlined text-2xl">description</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-slate-700 dark:text-slate-200 truncate mb-1">{file.name}</div>
                                                        <div className="text-xs text-slate-400">{file.size}</div>
                                                        <div className={`mt-2 text-xs font-bold text-${theme.primaryColor} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
                                                            Baixar Arquivo <span className="material-symbols-outlined text-[14px]">download</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                        {(currentActivity.files || []).length === 0 && (
                                            <div className="col-span-full py-8 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-sm">
                                                Nenhum material anexado.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};