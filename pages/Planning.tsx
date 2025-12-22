import React, { useState, useEffect, useRef } from 'react';
import { useClass } from '../contexts/ClassContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { Plan, AttachmentFile } from '../types';
import { supabase } from '../lib/supabase';
import DOMPurify from 'dompurify';
import { RichTextEditor } from '../components/RichTextEditor';
import { DatePicker } from '../components/DatePicker';
export const Planning: React.FC = () => {
    const { activeSeries, selectedSeriesId, selectedSection, classes } = useClass();
    const { currentUser } = useAuth();
    const theme = useTheme();

    // UI State
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [formTitle, setFormTitle] = useState('');
    const [formStartDate, setFormStartDate] = useState('');
    const [formEndDate, setFormEndDate] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formFiles, setFormFiles] = useState<AttachmentFile[]>([]);
    const [formSeriesId, setFormSeriesId] = useState('');
    const [formSection, setFormSection] = useState(''); // Optional

    useEffect(() => {
        fetchPlans();
    }, [selectedSeriesId, currentUser]);

    useEffect(() => {
        if (selectedSeriesId) {
            setFormSeriesId(selectedSeriesId);
        }
    }, [selectedSeriesId]);

    const fetchPlans = async (silent = false) => {
        if (!currentUser) return;
        if (!silent) setLoading(true);
        try {
            let query = supabase.from('plans').select('*').eq('user_id', currentUser.id);

            if (selectedSeriesId) {
                query = query.eq('series_id', selectedSeriesId);
            }

            const { data, error } = await query;
            if (error) throw error;

            const formatted: Plan[] = (data || []).map(p => ({
                id: p.id.toString(),
                title: p.title,
                seriesId: p.series_id.toString(),
                section: p.section || '',
                startDate: p.start_date,
                endDate: p.end_date,
                description: p.description,
                files: p.files || [],
                userId: p.user_id
            }));

            formatted.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

            setPlans(formatted);
            if (formatted.length > 0 && !selectedPlanId) {
                // Determine if we should select the first plan or keep current selection
                // Logic mostly for initial load or series switch
                if (!selectedPlanId) setSelectedPlanId(formatted[0].id);
            } else if (formatted.length === 0) {
                setSelectedPlanId(null);
            }
        } catch (e) {
            console.error("Failed to load plans", e);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // --- REALTIME SUBSCRIPTION ---
    useEffect(() => {
        if (!currentUser || !selectedSeriesId) return;

        // Polling Fallback (Every 10s)
        const interval = setInterval(() => {
            fetchPlans(true);
        }, 10000);

        console.log("Setting up Realtime for Planning...");

        const channel = supabase.channel(`planning_sync_${selectedSeriesId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'plans'
                },
                (payload) => {
                    console.log("Realtime Plan Change Received!", payload);
                    fetchPlans(true);
                }
            )
            .subscribe();

        return () => {
            console.log("Cleaning up Planning Realtime...");
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, [selectedSeriesId, currentUser]);

    const handleNewPlan = () => {
        if (!selectedSeriesId) {
            alert("Por favor, selecione uma série no menu superior para criar um planejamento.");
            return;
        }
        setIsEditing(true);
        setSelectedPlanId(null);
        setFormTitle('');
        setFormStartDate(new Date().toLocaleDateString('sv-SE'));
        setFormEndDate(new Date().toLocaleDateString('sv-SE'));
        setFormDescription('');
        setFormFiles([]);
        setFormSeriesId(selectedSeriesId);
        setFormSection(selectedSection || '');
    };

    const handleSelectPlan = (plan: Plan) => {
        setIsEditing(false);
        setSelectedPlanId(plan.id);
        setFormTitle(plan.title);
        setFormStartDate(plan.startDate);
        setFormEndDate(plan.endDate);
        setFormDescription(plan.description);
        setFormFiles(plan.files);
        setFormSeriesId(plan.seriesId);
        setFormSection(plan.section || '');
    };

    const handleSave = async () => {
        if (!formTitle || !formStartDate || !formEndDate) {
            alert("Preencha o título e as datas de início e fim.");
            return;
        }

        if (!formSeriesId) {
            alert("A Série é obrigatória!");
            return;
        }

        setLoading(true);

        const planData = {
            title: formTitle,
            start_date: formStartDate,
            end_date: formEndDate,
            description: formDescription,
            series_id: formSeriesId,
            section: formSection || null,
            files: formFiles,
            user_id: currentUser?.id
        };

        try {
            if (selectedPlanId && isEditing && plans.some(p => p.id === selectedPlanId)) {
                // Update
                const { error } = await supabase
                    .from('plans')
                    .update(planData)
                    .eq('id', selectedPlanId);

                if (error) throw error;
                fetchPlans(true);
                alert("Plano atualizado!");
            } else {
                // Create
                const { error } = await supabase
                    .from('plans')
                    .insert(planData);

                if (error) throw error;
                fetchPlans(true);
                alert("Plano criado!");
            }
            setIsEditing(false);
        } catch (e: any) {
            console.error(e);
            alert("Erro ao salvar plano.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedPlanId) {
            console.warn('Nenhuma planejamento selecionado para excluir');
            return;
        }

        const confirmed = window.confirm("Tem certeza que deseja apagar este planejamento?");
        if (!confirmed) {
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase
                .from('plans')
                .delete()
                .eq('id', selectedPlanId);

            if (!error) {
                const updatedPlans = plans.filter(p => p.id !== selectedPlanId);
                setPlans(updatedPlans);
                setSelectedPlanId(null);
                setIsEditing(false);
                alert("Planejamento excluído com sucesso!");
            } else {
                console.error('Erro ao excluir:', error.message);
                throw error;
            }
        } catch (e) {
            console.error('Erro de conexão ao excluir:', e);
            alert("Erro ao tentar excluir. Por favor, tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

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
        e.target.value = '';
    };

    const handleRemoveFile = (id: string) => {
        setFormFiles(formFiles.filter(f => f.id !== id));
    };

    const handleDownload = (file: AttachmentFile) => {
        try {
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

    const currentPlan = plans.find(p => p.id === selectedPlanId);
    const displayedPlans = plans.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

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

            {/* Sidebar */}
            <div className={`w-full lg:w-80 flex flex-col gap-4 shrink-0 transition-all ${selectedPlanId || isEditing ? 'hidden lg:flex' : 'flex'}`}>
                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-slate-900 dark:text-white text-lg">Aulas</h2>
                        <button onClick={handleNewPlan} className={`bg-${theme.primaryColor} hover:bg-${theme.secondaryColor} text-white size-9 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-${theme.primaryColor}/20 hover:-translate-y-0.5 active:translate-y-0`} title="Nova Aula">
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

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 pb-24 lg:pb-0">
                    {displayedPlans.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                            Nenhuma aula encontrada.
                        </div>
                    ) : (
                        displayedPlans.map(plan => (
                            <button
                                key={plan.id}
                                onClick={() => handleSelectPlan(plan)}
                                className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 group relative overflow-hidden shadow-sm ${selectedPlanId === plan.id
                                    ? `bg-white dark:bg-surface-dark border-${theme.primaryColor} shadow-${theme.primaryColor}/10 ring-1 ring-${theme.primaryColor}`
                                    : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'}`}
                            >
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${selectedPlanId === plan.id ? `bg-${theme.primaryColor}` : 'bg-transparent group-hover:bg-slate-200'} transition-all`}></div>
                                <div className="pl-3">
                                    <h4 className={`font-bold text-base truncate pr-2 ${selectedPlanId === plan.id ? `text-${theme.primaryColor}` : 'text-slate-800 dark:text-slate-200'}`}>{plan.title}</h4>

                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center gap-1 text-xs text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                            <span className="material-symbols-outlined text-[14px]">event</span>
                                            {new Date(plan.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                                        </div>
                                        {plan.files && plan.files.length > 0 && (
                                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                                <span className="material-symbols-outlined text-[14px]">attachment</span>
                                                {plan.files.length}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined">chevron_right</span>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Mobile FAB */}
                <button
                    onClick={handleNewPlan}
                    className={`lg:hidden fixed bottom-24 right-6 size-14 rounded-2xl bg-${theme.primaryColor} text-white shadow-xl shadow-${theme.primaryColor}/30 flex items-center justify-center z-50 active:scale-90 transition-all`}
                >
                    <span className="material-symbols-outlined text-3xl">add</span>
                </button>
            </div>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col bg-white dark:bg-surface-dark rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden relative transition-all ${selectedPlanId || isEditing ? 'flex' : 'hidden lg:flex'}`}>
                {(!selectedPlanId && !isEditing) ? (
                    // --- HERO EMPTY STATE ---
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-300">
                        <div className={`size-32 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-8 shadow-sm border border-slate-100 dark:border-slate-700`}>
                            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600">edit_calendar</span>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Planejamento de Aulas</h2>
                        <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
                            Organize seus roteiros de aula, anexe materiais e mantenha o registro do conteúdo ministrado.
                        </p>
                        <button
                            onClick={handleNewPlan}
                            className={`group relative inline-flex items-center justify-center gap-3 bg-${theme.primaryColor} hover:bg-${theme.secondaryColor} text-white text-lg font-bold py-4 px-8 rounded-2xl shadow-xl shadow-${theme.primaryColor}/20 transition-all hover:-translate-y-1 active:translate-y-0 overflow-hidden`}
                        >
                            <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform duration-300">add</span>
                            Criar Nova Aula
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
                                        onClick={() => { setSelectedPlanId(null); setIsEditing(false); }}
                                        className="lg:hidden size-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 flex items-center justify-center"
                                    >
                                        <span className="material-symbols-outlined">arrow_back</span>
                                    </button>
                                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                        <div className={`size-10 rounded-xl bg-${theme.primaryColor}/10 text-${theme.primaryColor} flex items-center justify-center`}>
                                            <span className="material-symbols-outlined">{selectedPlanId ? 'edit_document' : 'post_add'}</span>
                                        </div>
                                        {selectedPlanId ? 'Editar Aula' : 'Nova Aula'}
                                    </h2>
                                </div>
                            </div>

                            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 ml-1">Tema da Aula</label>
                                    <input
                                        type="text"
                                        value={formTitle}
                                        onChange={e => setFormTitle(e.target.value)}
                                        placeholder="Ex: Introdução ao Tópico..."
                                        className={`w-full text-lg font-bold p-4 rounded-xl bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-black border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${theme.primaryColor}/50 transition-all outline-none`}
                                        autoFocus
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <DatePicker
                                            label="Data Início"
                                            value={formStartDate}
                                            onChange={setFormStartDate}
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <DatePicker
                                            label="Data Fim"
                                            value={formEndDate}
                                            onChange={setFormEndDate}
                                            className="w-full"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Série</label>
                                        <div className="font-bold text-lg text-slate-700 dark:text-slate-200 flex items-center gap-2 h-[54px] px-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <span className="material-symbols-outlined text-slate-400">school</span>
                                            {activeSeries?.name || formSeriesId}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Turma</label>
                                        <select
                                            value={formSection}
                                            onChange={e => setFormSection(e.target.value)}
                                            className={`w-full font-bold p-3 rounded-xl bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-black border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${theme.primaryColor}/50 h-[54px]`}
                                        >
                                            <option value="">Todas</option>
                                            {activeSeries?.sections.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 ml-1">Conteúdo e Metodologia</label>
                                    <RichTextEditor
                                        value={formDescription}
                                        onChange={setFormDescription}
                                        placeholder="Descreva o conteúdo, objetivos e metodologia..."
                                    />
                                </div>

                                {/* File Attachments (Mock) */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="text-xs font-black uppercase text-slate-400 ml-1 tracking-widest">Anexos</label>
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
                            {selectedPlanId && (
                                <button onClick={handleDelete} className="px-6 py-2.5 rounded-xl text-red-500 font-bold hover:bg-red-50 transition-colors">Excluir</button>
                            )}
                            <button onClick={handleSave} className={`px-8 py-2.5 rounded-xl bg-${theme.primaryColor} text-white font-bold shadow-lg shadow-${theme.primaryColor}/20 hover:shadow-xl hover:bg-${theme.secondaryColor} transition-all active:scale-95`}>
                                Salvar Planejamento
                            </button>
                        </div>
                    </div>
                ) : (
                    // --- VIEW MODE ---
                    <div className="flex-1 overflow-y-auto relative animate-in fade-in">
                        {currentPlan ? (
                            <>
                                {/* Large Header Image/Gradient */}
                                <div className={`h-48 bg-gradient-to-r ${theme.bgGradient} relative overflow-hidden`}>
                                    <div className="absolute inset-0 opacity-10 flex flex-wrap gap-8 justify-end p-8 rotate-12 scale-150 pointer-events-none">
                                        <span className="material-symbols-outlined text-[150px] text-white">{theme.icon}</span>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/50 to-transparent">
                                        <div className="flex gap-2 mb-2">
                                            <span className="px-2 py-1 rounded-md bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/20">
                                                {classes.find(c => c.id === currentPlan.seriesId)?.name}
                                            </span>
                                        </div>
                                        <h1 className="text-3xl md:text-4xl font-bold text-white shadow-sm">{currentPlan.title}</h1>
                                    </div>
                                    <div className="absolute top-6 left-6 lg:hidden">
                                        <button
                                            onClick={() => setSelectedPlanId(null)}
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
                                            title="Editar Planejamento"
                                        >
                                            <span className="material-symbols-outlined">edit</span>
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="p-2 bg-red-500/20 hover:bg-red-500/40 text-white rounded-xl backdrop-blur-md border border-white/20 transition-all shadow-lg"
                                            title="Excluir Planejamento"
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
                                                <div className="text-xs uppercase font-bold text-slate-400">Data</div>
                                                <div className="font-bold text-slate-700 dark:text-gray-200">
                                                    {new Date(currentPlan.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="prose dark:prose-invert max-w-none">
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                            <span className={`material-symbols-outlined text-${theme.primaryColor}`}>subject</span>
                                            Roteiro da Aula
                                        </h3>
                                        <div
                                            className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-300 custom-html-content"
                                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentPlan.description) }}
                                        />
                                    </div>
                                </div>

                                {/* Files */}
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                        <span className={`material-symbols-outlined text-${theme.primaryColor}`}>folder</span>
                                        Materiais Anexados
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {(currentPlan.files || []).map(file => (
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
                                        {(currentPlan.files || []).length === 0 && (
                                            <div className="col-span-full py-8 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-sm">
                                                Nenhum material anexado.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
};