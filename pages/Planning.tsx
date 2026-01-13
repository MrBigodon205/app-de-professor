import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
    const fileInputRef = useRef<HTMLInputElement>(null);

    // UI State
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<'geral' | 'conteudo' | 'bncc' | 'recursos'>('geral');
    const [viewMode, setViewMode] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formTitle, setFormTitle] = useState('');
    const [formStartDate, setFormStartDate] = useState('');
    const [formEndDate, setFormEndDate] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formFiles, setFormFiles] = useState<AttachmentFile[]>([]);
    const [formSeriesId, setFormSeriesId] = useState('');
    const [formSection, setFormSection] = useState('');

    // New Fields
    const [formObjectives, setFormObjectives] = useState('');
    const [formBncc, setFormBncc] = useState('');
    const [formMethodology, setFormMethodology] = useState('');
    const [formResources, setFormResources] = useState('');
    const [formAssessment, setFormAssessment] = useState('');
    const [formDuration, setFormDuration] = useState('');
    const [formThemeArea, setFormThemeArea] = useState('');
    const [formCoordinator, setFormCoordinator] = useState('');
    const [formActivityType, setFormActivityType] = useState('');
    const [formSubject, setFormSubject] = useState('');
    const [filterSection, setFilterSection] = useState('');

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
                userId: p.user_id,
                objectives: p.objectives || '',
                bncc_codes: p.bncc_codes || '',
                methodology: p.methodology || '',
                resources: p.resources || '',
                assessment: p.assessment || '',
                duration: p.duration || '',
                theme_area: p.theme_area || '',
                coordinator_name: p.coordinator_name || '',
                activity_type: p.activity_type || '',
                subject: p.subject || ''
            }));

            formatted.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

            setPlans(formatted);
            setPlans(formatted);
            if (formatted.length > 0 && !selectedPlanId && window.innerWidth >= 1024) {
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
        const interval = setInterval(() => { fetchPlans(true); }, 10000);
        const channel = supabase.channel(`planning_sync_${selectedSeriesId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, () => { fetchPlans(true); })
            .subscribe();
        return () => { supabase.removeChannel(channel); clearInterval(interval); };
    }, [selectedSeriesId, currentUser]);

    const resetForm = () => {
        setIsEditing(false);
        setSelectedPlanId(null);
        setShowForm(false);
        setViewMode(false);
        setActiveTab('geral');

        // Reset Form
        setFormTitle('');
        setFormStartDate(new Date().toLocaleDateString('sv-SE'));
        setFormEndDate(new Date().toLocaleDateString('sv-SE'));
        setFormDescription('');
        setFormFiles([]);
        setFormSeriesId(selectedSeriesId);
        setFormSection(selectedSection || '');
        setFormObjectives('');
        setFormBncc('');
        setFormMethodology('');
        setFormResources('');
        setFormAssessment('');
        setFormDuration('');
        setFormThemeArea('');
        setFormCoordinator('');
        setFormActivityType('');
        setFormSubject(currentUser?.subject || '');
    };

    const handleNewPlan = () => {
        if (!selectedSeriesId) {
            alert("Por favor, selecione uma série no menu superior para criar um planejamento.");
            return;
        }

        resetForm();
        setSelectedPlanId(null); // Explicitly clear ID
        setShowForm(true);
        setIsEditing(false); // New plans start in "create" mode, not "edit" of existing
    };

    const handleEdit = (plan: Plan) => {
        setIsEditing(true);
        setSelectedPlanId(plan.id);
        setShowForm(true);
        setViewMode(false);

        setFormTitle(plan.title);
        setFormStartDate(plan.startDate);
        setFormEndDate(plan.endDate);
        setFormDescription(plan.description);
        setFormFiles(plan.files);
        setFormSeriesId(plan.seriesId);
        setFormSection(plan.section || '');
        setFormObjectives(plan.objectives || '');
        setFormBncc(plan.bncc_codes || '');
        setFormMethodology(plan.methodology || '');
        setFormResources(plan.resources || '');
        setFormAssessment(plan.assessment || '');
        setFormDuration(plan.duration || '');
        setFormThemeArea(plan.theme_area || '');
        setFormCoordinator(plan.coordinator_name || '');
        setFormActivityType(plan.activity_type || '');
        setFormSubject(plan.subject || currentUser?.subject || '');
    };

    const handleView = (plan: Plan) => {
        handleEdit(plan);
        setViewMode(true);
        setShowForm(false);
        setIsEditing(false); // Ensure we are not in editing mode so sidebar logic works
    };

    const handleSelectPlan = (plan: Plan) => {
        handleView(plan);
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
            user_id: currentUser?.id,
            objectives: formObjectives,
            bncc_codes: formBncc,
            methodology: formMethodology,
            resources: formResources,
            assessment: formAssessment,
            duration: formDuration,
            theme_area: formThemeArea,
            coordinator_name: formCoordinator,
            activity_type: formActivityType,
            subject: formSubject
        };

        try {
            if (selectedPlanId && isEditing && plans.some(p => p.id === selectedPlanId)) {
                // Update
                const { error } = await supabase.from('plans').update(planData).eq('id', selectedPlanId);
                if (error) throw error;
                await fetchPlans(true);
                setShowForm(false); // Close form
                setViewMode(true); // Open view
                setIsEditing(false);
            } else {
                // Create
                const { data, error } = await supabase.from('plans').insert(planData).select().single();
                if (error) throw error;
                await fetchPlans(true);
                if (data) {
                    setSelectedPlanId(data.id.toString());
                    setShowForm(false); // Close form
                    setViewMode(true); // Open view
                    setIsEditing(false);
                }
            }
        } catch (e: any) {
            console.error(e);
            alert("Erro ao salvar plano. Verifique se os novos campos do banco foram criados.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedPlanId) return;
        if (!window.confirm("Tem certeza que deseja apagar este planejamento?")) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('plans').delete().eq('id', selectedPlanId);
            if (!error) {
                setPlans(plans.filter(p => p.id !== selectedPlanId));
                setSelectedPlanId(null);
                setIsEditing(false);
                setShowForm(false);
                setViewMode(false);
                alert("Planejamento excluído com sucesso!");
            } else throw error;
        } catch (e) {
            console.error(e);
            alert("Erro ao excluir.");
        } finally {
            setLoading(false);
        }
    };



    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { alert("Limite 2MB"); return; }
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (ev.target?.result) {
                setFormFiles([...formFiles, { id: crypto.randomUUID(), name: file.name, size: `${(file.size / 1024).toFixed(1)} KB`, url: ev.target.result as string }]);
            }
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleDownload = (file: AttachmentFile) => {
        if (file.url.startsWith('data:')) {
            const parts = file.url.split(',');
            const mime = parts[0].match(/:(.*?);/)?.[1];
            const bstr = atob(parts[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) { u8arr[n] = bstr.charCodeAt(n); }
            const blob = new Blob([u8arr], { type: mime });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            const a = document.createElement('a');
            a.href = file.url;
            a.download = file.name;
            a.target = "_blank";
            a.click();
        }
    };

    const handleExportWord = () => {
        if (!currentPlan) return;

        const logoUrl = "https://i.imgur.com/7pZ0s1x.png"; // Placeholder or use text if image not available. 
        // Since I cannot upload images to the user's public web, I will use a text structure or base64 if available. 
        // User asked for "Exactly equal", I will try to replicate the CENSC logo with text/css if I can't embed the image easily.
        // Actually, HTML export to Word supports base64 images often, but sometimes it blocks. Text is safer.
        // I'll stick to the text-based logo I saw earlier but styled better, or check if there is a logo URL I missed.
        // For now, I will use a simplified HTML structure that matches the image grid.

        const htmlContent = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                    <meta charset="utf-8">
                    <title>${currentPlan.title}</title>
                    <!--[if gte mso 9]>
                    <xml>
                    <w:WordDocument>
                    <w:View>Print</w:View>
                    <w:Zoom>100</w:Zoom>
                    <w:DoNotOptimizeForBrowser/>
                    </w:WordDocument>
                    </xml>
                    <![endif]-->
                    <style>
                        @page {
                            size: 29.7cm 21cm;
                            margin: 1cm;
                            mso-page-orientation: landscape;
                        }
                        @page Section1 {
                            size: 29.7cm 21cm;
                            margin: 1cm;
                            mso-page-orientation: landscape;
                        }
                        div.Section1 { page: Section1; }
                        body { font-family: 'Arial', sans-serif; font-size: 12pt; color: #000; }
                        .page-container { width: 100%; }
                        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                        td, th { border: 1px solid black; padding: 4px; vertical-align: top; word-wrap: break-word; word-break: break-all; font-size: 11pt; }
                        th { background-color: #d9d9d9; text-align: center; font-weight: bold; font-size: 10pt; vertical-align: middle; }
                        .header-table td { border: none; padding: 2px; }
                        .header-label { font-size: 10pt; font-weight: bold; color: #64748b; text-transform: uppercase; }
                        .header-value { font-size: 11pt; font-weight: bold; color: #334155; border-bottom: 1px solid #000; display: inline-block; width: 100%; min-height: 18px; }
                        .logo-text { color: #0ea5e9; font-weight: 900; font-size: 28pt; font-family: 'Arial Black', sans-serif; letter-spacing: -2px; }
                        .logo-sub { font-size: 9pt; color: #0ea5e9; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2; }
                        .obs-box { border: 1px solid black; padding: 5px; height: 100px; }
                        .obs-line { border-bottom: 1px solid black; height: 25px; margin-bottom: 5px; }
                        ul { margin: 0; padding-left: 15px; }
                        li { margin-bottom: 2px; }
                    </style>
                </head>
                <body>
                    <div class="Section1">
                        <!-- HEADER MATCHING IMAGE -->
                        <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 20px;">
                            <tr>
                                <td style="width: 65%; vertical-align: top; border: none; padding: 0;">
                                    <table style="width: 100%; border-collapse: collapse; border: none;">
                                        <tr>
                                            <td style="width: 100px; padding: 2px 0;"><span style="font-size: 10pt; font-weight: bold;">Turma:</span></td>
                                            <td style="border-bottom: 1px solid black; padding: 2px 5px;"><span style="font-size: 11pt; font-weight: bold;">
                                                ${(currentPlan.section && currentPlan.section !== 'Todas' && currentPlan.section !== 'Todas as Turmas' && currentPlan.section !== 'Única')
                ? (activeSeries?.name + ' - ' + currentPlan.section)
                : (activeSeries?.name + ' - ' + (activeSeries?.sections?.join(', ') || 'Todas as Turmas'))}
                                            </span></td>
                                        </tr>
                                        <tr>
                                            <td style="width: 100px; padding: 2px 0;"><span style="font-size: 10pt; font-weight: bold;">Professor:</span></td>
                                            <td style="border-bottom: 1px solid black; padding: 2px 5px;"><span style="font-size: 11pt; font-weight: bold;">${currentUser?.name?.toUpperCase() || ''}</span></td>
                                        </tr>
                                        <tr>
                                            <td style="width: 100px; padding: 2px 0;"><span style="font-size: 10pt; font-weight: bold;">Componente:</span></td>
                                            <td style="border-bottom: 1px solid black; padding: 2px 5px;"><span style="font-size: 11pt; font-weight: bold; color: #0369a1;">${currentPlan.subject || ''}</span></td>
                                        </tr>
                                        <tr>
                                            <td style="width: 100px; padding: 2px 0;"><span style="font-size: 10pt; font-weight: bold;">Período:</span></td>
                                            <td style="border-bottom: 1px solid black; padding: 2px 5px;"><span style="font-size: 11pt; font-weight: bold;">
                                                ${new Date(currentPlan.startDate + 'T12:00:00').toLocaleDateString('pt-BR')} até ${new Date(currentPlan.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                                            </span></td>
                                        </tr>
                                        <tr>
                                            <td style="width: 100px; padding: 2px 0;"><span style="font-size: 10pt; font-weight: bold;">Coordenação:</span></td>
                                            <td style="border-bottom: 1px solid black; padding: 2px 5px;"><span style="font-size: 11pt; font-weight: bold;">${currentPlan.coordinator_name || 'MOISÉS FERREIRA'}</span></td>
                                        </tr>
                                    </table>
                                </td>
                                <td style="width: 2%; border-left: 1.5pt solid #d1d5db; padding: 0;"></td>
                                <td style="width: 33%; vertical-align: middle; border: none; text-align: right; padding: 0;">
                                    <div style="text-align: right;">
                                        <div style="color: #0ea5e9; font-size: 36pt; font-weight: 900; font-family: 'Arial Black', sans-serif; letter-spacing: -2px; line-height: 1;">CENSC</div>
                                        <div style="color: #0ea5e9; font-size: 9pt; font-weight: bold; text-transform: uppercase; margin-top: 5px; line-height: 1.2;">
                                            CENTRO EDUCACIONAL<br>NOSSA SRA DO CENÁCULO
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </table>
                        <div style="border-bottom: 1.5pt solid black; margin-bottom: 20px; width: 100%;"></div>

                        <!-- CONTENT TABLE MATCHING PDF -->
                        <div style="border: 1px solid #000;">
                            <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                                <thead>
                                    <tr style="background-color: #d9d9d9;">
                                        <th style="width: 17%; border: 1px solid #000; padding: 8px; font-size: 9pt; font-weight: bold; text-align: center; vertical-align: middle;">HABILIDADE(s)<br>CONTEMPLADA(s)</th>
                                        <th style="width: 16%; border: 1px solid #000; padding: 8px; font-size: 9pt; font-weight: bold; text-align: center; vertical-align: middle;">OBJETO DE<br>CONHECIMENTO</th>
                                        <th style="width: 16%; border: 1px solid #000; padding: 8px; font-size: 9pt; font-weight: bold; text-align: center; vertical-align: middle;">RECURSOS<br>UTILIZADOS</th>
                                        <th style="width: 31%; border: 1px solid #000; padding: 8px; font-size: 9pt; font-weight: bold; text-align: center; vertical-align: middle;">DESENVOLVIMENTO</th>
                                        <th style="width: 10%; border: 1px solid #000; padding: 8px; font-size: 9pt; font-weight: bold; text-align: center; vertical-align: middle;">DURAÇÃO</th>
                                        <th style="width: 10%; border: 1px solid #000; padding: 8px; font-size: 9pt; font-weight: bold; text-align: center; vertical-align: middle;">TIPO DE<br>ATIVIDADE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="width: 17%; border: 1px solid #000; padding: 8px; font-size: 10pt; vertical-align: top;">
                                            <ul style="margin: 0; padding-left: 15px;">
                                                ${(currentPlan.bncc_codes?.split('\n').filter(Boolean).map(c => `<li>${c}</li>`).join('') || '')}
                                                ${currentPlan.objectives ? `<li>${currentPlan.objectives.replace(/<[^>]+>/g, ' ')}</li>` : ''}
                                            </ul>
                                        </td>
                                        <td style="width: 16%; border: 1px solid #000; padding: 8px; font-size: 10pt; vertical-align: top; font-weight: bold;">
                                            <ul style="margin: 0; padding-left: 15px;"><li>${currentPlan.title}</li></ul>
                                        </td>
                                        <td style="width: 16%; border: 1px solid #000; padding: 8px; font-size: 10pt; vertical-align: top;">
                                            <ul style="margin: 0; padding-left: 15px;"><li>${currentPlan.resources || ''}</li></ul>
                                        </td>
                                        <td style="width: 31%; border: 1px solid #000; padding: 8px; font-size: 10pt; vertical-align: top;">
                                            <ul style="margin: 0; padding-left: 15px;">
                                                ${currentPlan.methodology ? `<li>${currentPlan.methodology}</li>` : ''}
                                                ${currentPlan.description ? `<li>${DOMPurify.sanitize(currentPlan.description).replace(/<[^>]+>/g, ' ')}</li>` : ''}
                                            </ul>
                                        </td>
                                        <td style="width: 10%; border: 1px solid #000; padding: 8px; font-size: 10pt; vertical-align: top; text-align: center;">
                                            <ul style="margin: 0; padding-left: 15px;"><li>${currentPlan.duration || ''}</li></ul>
                                        </td>
                                        <td style="width: 10%; border: 1px solid #000; padding: 8px; font-size: 10pt; vertical-align: top; text-align: center;">
                                            <ul style="margin: 0; padding-left: 15px;"><li>${currentPlan.activity_type || ''}</li></ul>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- FOOTER / OBSERVAÇÕES MATCHING IMAGE -->
                        <div style="margin-top: 30px;">
                            <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; border: none; margin-bottom: 5px;">OBSERVAÇÕES:</div>
                            <div style="border: 1px solid black; padding: 10px;">
                                <div style="border-bottom: 1px solid black; height: 30px; margin-bottom: 5px;"></div>
                                <div style="border-bottom: 1px solid black; height: 30px; margin-bottom: 5px;"></div>
                                <div style="height: 30px;"></div>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

        const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Planejamento-${currentPlan.title}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const currentPlan = plans.find(p => p.id === selectedPlanId);
    const displayedPlans = plans.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filterSection
            ? (p.section === filterSection || p.section === 'Todas' || p.section === 'Todas as Turmas' || p.section === 'Única')
            : true)
    );

    return (
        <main className="flex h-full gap-6 max-w-[1600px] mx-auto overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} title="Adicionar anexo" aria-label="Adicionar anexo" />

            {/* AI MODAL */}


            {/* Sidebar */}
            <div className={`w-full lg:w-80 flex flex-col gap-4 shrink-0 transition-all ${selectedPlanId || isEditing ? 'hidden lg:flex' : 'flex'}`}>
                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                            <button className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all bg-white dark:bg-slate-700 text-${theme.primaryColor} shadow-sm`}>
                                Aulas
                            </button>
                            <Link to="/activities" className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all">
                                Atividades
                            </Link>
                        </div>
                        <button onClick={handleNewPlan} className={`bg-${theme.primaryColor} hover:bg-${theme.secondaryColor} text-white size-9 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-${theme.primaryColor}/20 hover:-translate-y-0.5 active:translate-y-0`} title="Nova Aula">
                            <span className="material-symbols-outlined text-[20px]">add</span>
                        </button>
                    </div>
                    <div className="relative">
                        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${theme.primaryColor}/50 text-sm transition-all focus:bg-white dark:focus:bg-black`} />
                    </div>
                    {/* Section Filter */}
                    {activeSeries && activeSeries.sections?.length > 0 && (
                        <div className="px-1">
                            <select aria-label="Filtrar por turma" title="Filtrar por turma"
                                value={filterSection}
                                onChange={e => setFilterSection(e.target.value)}
                                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none"
                            >
                                <option value="">Todas as Turmas</option>
                                {activeSeries.sections.map(section => (
                                    <option key={section} value={section}>Turma {section}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 pb-24 lg:pb-0 min-h-[400px]">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="w-full h-24 rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 p-4 animate-pulse">
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
                                <div className="flex gap-2">
                                    <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                    <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                </div>
                            </div>
                        ))
                    ) : displayedPlans.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 min-h-[200px] flex items-center justify-center">Nenhuma aula encontrada.</div>
                    ) : (
                        displayedPlans.map(plan => (
                            <button key={plan.id} onClick={() => handleSelectPlan(plan)} className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 group relative overflow-hidden shadow-sm ${selectedPlanId === plan.id ? `bg-white dark:bg-surface-dark border-${theme.primaryColor} shadow-${theme.primaryColor}/10 ring-1 ring-${theme.primaryColor}` : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${selectedPlanId === plan.id ? `bg-${theme.primaryColor}` : 'bg-transparent group-hover:bg-slate-200'} transition-all`}></div>
                                <div className="pl-3">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`font-bold text-base truncate pr-2 ${selectedPlanId === plan.id ? `text-${theme.primaryColor}` : 'text-slate-800 dark:text-slate-200'}`}>{plan.title}</h4>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm('Tem certeza que deseja excluir este planejamento?')) {
                                                    // Assuming handleDeletePlan exists or implementing inline
                                                    const deletePlan = async () => {
                                                        const { error } = await supabase.from('plans').delete().eq('id', plan.id);
                                                        if (error) {
                                                            alert('Erro ao excluir');
                                                        } else {
                                                            setPlans(prev => prev.filter(p => p.id !== plan.id));
                                                            if (selectedPlanId === plan.id) {
                                                                setSelectedPlanId(null);
                                                                setShowForm(false);
                                                                setViewMode(false);
                                                            }
                                                        }
                                                    };
                                                    deletePlan();
                                                }
                                            }}
                                            className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                                            title="Excluir Planejamento"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="text-xs text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">event</span> {new Date(plan.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                                        </span>
                                        {plan.theme_area && plan.theme_area !== 'Geral' && (
                                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700">
                                                {plan.theme_area}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col bg-white dark:bg-surface-dark rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden relative transition-all ${showForm || viewMode ? 'flex' : 'hidden lg:flex'}`}>
                {(!showForm && !viewMode) ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-300">
                        <div className={`size-32 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-8 shadow-sm border border-slate-100 dark:border-slate-700`}>
                            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600">edit_calendar</span>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Planejamento de Aulas</h2>
                        <p className="text-slate-500 max-w-md mb-8 leading-relaxed">Organize seus roteiros, alinhe com a BNCC e anexe materiais.</p>
                        <button onClick={handleNewPlan} className={`group relative inline-flex items-center justify-center gap-3 bg-${theme.primaryColor} hover:bg-${theme.secondaryColor} text-white text-lg font-bold py-4 px-8 rounded-2xl shadow-xl shadow-${theme.primaryColor}/20 transition-all hover:-translate-y-1 active:translate-y-0 overflow-hidden`}>
                            <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform duration-300">add</span> Criar Nova Aula
                        </button>
                    </div>
                ) : showForm ? (
                    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                        {/* EDITOR HEADER */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-surface-dark z-10">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                <button onClick={() => { setIsEditing(false); setShowForm(false); setSelectedPlanId(null); }} className="lg:hidden p-2 -ml-2 text-slate-400"><span className="material-symbols-outlined">arrow_back</span></button>
                                {selectedPlanId ? 'Editar Aula' : 'Nova Aula'}
                            </h2>
                        </div>

                        {/* TABS */}
                        <div className="px-6 pt-6 pb-2">
                            <div className="flex p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-x-auto hide-scrollbar">
                                {[
                                    { id: 'geral', label: 'Informações Gerais', icon: 'info' },
                                    { id: 'conteudo', label: 'Conteúdo & Objetivos', icon: 'menu_book' },
                                    { id: 'bncc', label: 'BNCC & Metodologia', icon: 'school' },
                                    { id: 'recursos', label: 'Recursos & Avaliação', icon: 'build' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                            ? `bg-white dark:bg-surface-light text-${theme.primaryColor} shadow-md shadow-slate-200/50 dark:shadow-black/50 ring-1 ring-black/5 dark:ring-white/10`
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined filled text-[20px]">{tab.icon}</span>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* EDITOR CONTENT */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-24">
                            <div className="max-w-4xl mx-auto space-y-6">
                                {activeTab === 'geral' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                                        <div className={`${theme.softBg} p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6`}>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                <span className="material-symbols-outlined text-indigo-500">info</span>
                                                Dados Principais
                                            </h3>

                                            <div>
                                                <label className="label">Tema da Aula *</label>
                                                <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Ex: Introdução à Fotossíntese..." className={`w-full text-lg font-bold p-4 rounded-xl bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-black border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${theme.primaryColor}/50 transition-all outline-none`} autoFocus />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <DatePicker label="Data Início" value={formStartDate} onChange={setFormStartDate} className="w-full" />
                                                <DatePicker label="Data Fim" value={formEndDate} onChange={setFormEndDate} className="w-full" />
                                            </div>
                                        </div>

                                        <div className={`${theme.softBg} p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6`}>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                <span className="material-symbols-outlined text-indigo-500">school</span>
                                                Detalhamento Acadêmico
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="label">Série</label>
                                                    <div className="input-group"><span className="material-symbols-outlined text-slate-400">school</span>{activeSeries?.name || formSeriesId}</div>
                                                </div>
                                                <div>
                                                    <label className="label">Componente Curricular</label>
                                                    <input type="text" value={formSubject} onChange={e => setFormSubject(e.target.value)} placeholder="Ex: Ciências" className={`w-full font-bold p-3 rounded-xl bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-black border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${theme.primaryColor}/50 transition-all outline-none`} />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="label">Turma</label>
                                                    <div className="relative">
                                                        <select aria-label="Turma" title="Turma" value={formSection} onChange={e => setFormSection(e.target.value)} className={`w-full font-bold p-3 rounded-xl bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-black border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${theme.primaryColor}/50 appearance-none outline-none`}>
                                                            <option value="">Selecione...</option>
                                                            {activeSeries?.sections?.map(section => (
                                                                <option key={section} value={section}>{section}</option>
                                                            ))}
                                                            <option value="Todas as Turmas">Todas as Turmas</option>
                                                        </select>
                                                        <span className="material-symbols-outlined absolute right-3 top-3.5 pointer-events-none text-slate-500">expand_more</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="label">Tipo de Atividade</label>
                                                    <div className="relative">
                                                        <select value={formActivityType} onChange={e => setFormActivityType(e.target.value)} title="Tipo de Atividade" className={`w-full font-bold p-3 rounded-xl bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-black border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${theme.primaryColor}/50 appearance-none outline-none`}>
                                                            <option value="">Selecione...</option>
                                                            <option value="Aula Expositiva">Aula Expositiva</option>
                                                            <option value="Atividade Prática">Atividade Prática</option>
                                                            <option value="Trabalho em Grupo">Trabalho em Grupo</option>
                                                            <option value="Avaliação">Avaliação</option>
                                                            <option value="Outro">Outro</option>
                                                        </select>
                                                        <span className="material-symbols-outlined absolute right-3 top-3.5 pointer-events-none text-slate-500">expand_more</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="label">Duração Estimada</label>
                                                    <input type="text" value={formDuration} onChange={e => setFormDuration(e.target.value)} placeholder="Ex: 2 aulas de 50min" className={`w-full font-bold p-3 rounded-xl bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-black border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${theme.primaryColor}/50 transition-all outline-none`} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`${theme.softBg} p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6`}>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                <span className="material-symbols-outlined text-indigo-500">manage_accounts</span>
                                                Responsáveis
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="label">Coordenação Pedagógica</label>
                                                    <input type="text" value={formCoordinator} onChange={e => setFormCoordinator(e.target.value)} placeholder="Nome do Coodenador(a)" className={`w-full font-bold p-3 rounded-xl bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-black border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${theme.primaryColor}/50 transition-all outline-none`} />
                                                </div>
                                                <div>
                                                    <label className="label">Professor(a)</label>
                                                    <input type="text" value={currentUser?.name} disabled className="input-field opacity-60 cursor-not-allowed" title="Professor" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col-reverse sm:flex-row justify-end pt-4 gap-3">
                                            <button onClick={() => setActiveTab('conteudo')} className={`btn-primary bg-${theme.primaryColor} flex items-center justify-center gap-2 w-full sm:w-auto`}>
                                                Próximo: Conteúdo <span className="material-symbols-outlined">arrow_forward</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'conteudo' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                                        <div>
                                            <label className="label mb-2 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-indigo-500">target</span>
                                                Objetivos de Aprendizagem
                                            </label>
                                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                                <RichTextEditor value={formObjectives} onChange={setFormObjectives} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label mb-2 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-indigo-500">description</span>
                                                Descrição / Roteiro da Aula
                                            </label>
                                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                                <RichTextEditor value={formDescription} onChange={setFormDescription} />
                                            </div>
                                        </div>
                                        <div className="flex flex-col-reverse sm:flex-row justify-between pt-4 gap-3">
                                            <button onClick={() => setActiveTab('geral')} className="btn-ghost flex items-center justify-center gap-2 w-full sm:w-auto">
                                                <span className="material-symbols-outlined">arrow_back</span> Voltar
                                            </button>
                                            <button onClick={() => setActiveTab('bncc')} className={`btn-primary bg-${theme.primaryColor} flex items-center justify-center gap-2 w-full sm:w-auto`}>
                                                Próximo: BNCC <span className="material-symbols-outlined">arrow_forward</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'bncc' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                                        <div>
                                            <label className="label mb-2 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-indigo-500">verified</span>
                                                Códigos da BNCC
                                            </label>
                                            <textarea value={formBncc} onChange={e => setFormBncc(e.target.value)} className={`w-full font-bold p-3 rounded-xl bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-black border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${theme.primaryColor}/50 transition-all outline-none resize-none h-32 font-mono text-sm`} placeholder="Ex: EF06CI01, EF06CI02..." />
                                            <p className="text-xs text-slate-400 mt-1">Separe os códigos por vírgula ou nova linha.</p>
                                        </div>
                                        <div>
                                            <label className="label mb-2 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-indigo-500">psychology</span>
                                                Metodologia de Ensino
                                            </label>
                                            <textarea value={formMethodology} onChange={e => setFormMethodology(e.target.value)} className={`w-full font-bold p-3 rounded-xl bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-black border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${theme.primaryColor}/50 transition-all outline-none resize-none h-48`} placeholder="Descreva as estratégias metodológicas utilizadas..." />
                                        </div>
                                        <div className="flex flex-col-reverse sm:flex-row justify-between pt-4 gap-3">
                                            <button onClick={() => setActiveTab('conteudo')} className="btn-ghost flex items-center justify-center gap-2 w-full sm:w-auto">
                                                <span className="material-symbols-outlined">arrow_back</span> Voltar
                                            </button>
                                            <button onClick={() => setActiveTab('recursos')} className={`btn-primary bg-${theme.primaryColor} flex items-center justify-center gap-2 w-full sm:w-auto`}>
                                                Próximo: Recursos <span className="material-symbols-outlined">arrow_forward</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'recursos' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div>
                                            <label className="label">Recursos Utilizados</label>
                                            <textarea title="Recursos Utilizados" placeholder="Listar os recursos utilizados..." value={formResources} onChange={e => setFormResources(e.target.value)} className={`w-full font-bold p-3 rounded-xl bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-black border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${theme.primaryColor}/50 transition-all outline-none resize-none h-32`} />
                                        </div>

                                        <div className="space-y-3">
                                            <label className="label">Anexos</label>
                                            <div className="flex flex-wrap gap-2">
                                                {formFiles.map((file, index) => (
                                                    <div key={index} className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                                        <span className="text-xs font-bold">{file.name}</span>
                                                        <span className="text-[10px] text-slate-500">{file.size}</span>
                                                        <button onClick={() => setFormFiles(prev => prev.filter((_, i) => i !== index))} className="text-red-500 hover:text-red-700"><span className="material-symbols-outlined text-[16px]">close</span></button>
                                                    </div>
                                                ))}
                                                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all font-bold text-xs uppercase">
                                                    <span className="material-symbols-outlined text-[18px]">add_circle</span> Adicionar
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-8 gap-4">
                                            <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
                                                <button onClick={() => setActiveTab('bncc')} className="btn-ghost flex items-center justify-center gap-2 w-full sm:w-auto">
                                                    <span className="material-symbols-outlined">arrow_back</span> Voltar
                                                </button>
                                                {selectedPlanId && <button onClick={handleDelete} className="btn-danger flex items-center justify-center gap-2 w-full sm:w-auto"><span className="material-symbols-outlined">delete</span> Excluir</button>}
                                            </div>

                                            <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
                                                <button onClick={() => setIsEditing(false)} className="btn-ghost w-full sm:w-auto text-center">Cancelar</button>
                                                <button onClick={handleSave} className={`btn-primary bg-${theme.primaryColor} flex items-center justify-center gap-2 w-full sm:w-auto`}>
                                                    <span className="material-symbols-outlined">check_circle</span> Salvar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    // VIEW MODE (Print / Detailed)
                    <div className="flex-1 overflow-y-auto relative animate-in fade-in h-full custom-scrollbar bg-slate-50 dark:bg-black/20">
                        {currentPlan && (
                            <div className="landscape-container mx-auto bg-white shadow-lg my-4 md:my-8 print:my-0 print:shadow-none text-black transition-all duration-300 relative">
                                <div className="p-4 md:p-[10mm] print:p-0 overflow-x-auto">
                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap justify-between md:justify-end gap-2 md:gap-3 mb-6 print:hidden sticky top-0 md:relative z-10 bg-white/95 md:bg-transparent backdrop-blur-sm p-2 md:p-0 border-b md:border-none border-slate-100">
                                        <button onClick={() => { setViewMode(false); setSelectedPlanId(null); setIsEditing(false); setShowForm(false); }} className="md:hidden flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold">
                                            <span className="material-symbols-outlined">arrow_back</span>
                                        </button>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setIsEditing(true); setShowForm(true); setViewMode(false); }} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors text-sm md:text-base">
                                                <span className="material-symbols-outlined text-lg">edit</span> <span className="hidden sm:inline">Editar</span>
                                            </button>
                                            <button onClick={handleExportWord} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-lg shadow-blue-500/20 text-sm md:text-base">
                                                <span className="material-symbols-outlined text-lg">description</span> <span className="hidden sm:inline">Word</span>
                                            </button>
                                            <button onClick={() => {
                                                // IFRAME PRINTING IMPLEMENTATION to keep app background dark
                                                const printContent = document.querySelector('.printable-content');
                                                if (!printContent) return;

                                                const iframe = document.createElement('iframe');
                                                iframe.style.display = 'none';
                                                document.body.appendChild(iframe);

                                                const doc = iframe.contentWindow?.document;
                                                if (!doc) return;

                                                // Copy styles
                                                const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
                                                styles.forEach(style => {
                                                    doc.head.appendChild(style.cloneNode(true));
                                                });

                                                // Add print-specific robust styles for iframe
                                                const printStyle = doc.createElement('style');
                                                printStyle.textContent = `
                                                    @page { size: landscape; margin: 0; }
                                                    body { background: white !important; margin: 0; padding: 10mm !important; box-sizing: border-box; }
                                                    .printable-content { visibility: visible !important; position: static !important; width: 100% !important; margin: 0 !important; }
                                                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                                                `;
                                                doc.head.appendChild(printStyle);

                                                // Copy content
                                                doc.body.innerHTML = printContent.outerHTML;

                                                // Wait for styles/images then print
                                                setTimeout(() => {
                                                    iframe.contentWindow?.print();
                                                    setTimeout(() => {
                                                        document.body.removeChild(iframe);
                                                    }, 100);
                                                }, 500);
                                            }} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors shadow-lg shadow-indigo-500/20 text-sm md:text-base">
                                                <span className="material-symbols-outlined text-lg">print</span> <span className="hidden sm:inline">PDF</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* ATTACHMENTS VIEW (Screen Only) */}
                                    {currentPlan.files && currentPlan.files.length > 0 && (
                                        <div className="mb-8 px-4 md:px-[10mm] print:hidden">
                                            <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                                <span className="material-symbols-outlined">attachment</span> Anexos
                                            </h3>
                                            <div className="flex flex-wrap gap-3">
                                                {currentPlan.files.map((file, index) => (
                                                    <a
                                                        key={index}
                                                        href={file.url}
                                                        download={file.name}
                                                        className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group text-decoration-none"
                                                    >
                                                        <span className="material-symbols-outlined text-slate-500 group-hover:text-indigo-500 transition-colors">description</span>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{file.name}</span>
                                                            <span className="text-[10px] text-slate-500 uppercase">{file.size}</span>
                                                        </div>
                                                        <span className="material-symbols-outlined text-slate-400 group-hover:text-indigo-500 transition-colors text-lg ml-2">download</span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* PRINTABLE CONTENT (Matches CENSC Layout - Landscape) */}
                                    <div className="printable-content bg-white min-w-[700px] md:min-w-0">
                                        <div className="flex justify-between items-start mb-6">
                                            <table className="w-full border-collapse border-none">
                                                <tbody>
                                                    <tr>
                                                        <td className="w-[65%] align-top border-none p-0">
                                                            <table className="w-full border-collapse border-none">
                                                                <tbody>
                                                                    <tr>
                                                                        <td className="w-24 py-1"><span className="text-xs font-bold whitespace-nowrap">Turma:</span></td>
                                                                        <td className="border-b border-black py-1 px-2"><span className="text-sm font-bold">
                                                                            {(currentPlan.section && currentPlan.section !== 'Todas' && currentPlan.section !== 'Todas as Turmas' && currentPlan.section !== 'Única')
                                                                                ? `${activeSeries?.name} - ${currentPlan.section}`
                                                                                : `${activeSeries?.name} - ${activeSeries?.sections?.join(', ') || 'Todas as Turmas'}`}
                                                                        </span></td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="w-24 py-1"><span className="text-xs font-bold whitespace-nowrap">Professor:</span></td>
                                                                        <td className="border-b border-black py-1 px-2"><span className="text-sm font-bold uppercase">{currentUser?.name}</span></td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="w-24 py-1"><span className="text-xs font-bold whitespace-nowrap">Componente:</span></td>
                                                                        <td className="border-b border-black py-1 px-2"><span className="text-sm font-bold text-[#0369a1]">{currentPlan.subject}</span></td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="w-24 py-1"><span className="text-xs font-bold whitespace-nowrap">Período:</span></td>
                                                                        <td className="border-b border-black py-1 px-2"><span className="text-sm font-bold">
                                                                            {new Date(currentPlan.startDate + 'T12:00:00').toLocaleDateString('pt-BR')} até {new Date(currentPlan.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                                        </span></td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="w-24 py-1"><span className="text-xs font-bold whitespace-nowrap">Coordenação:</span></td>
                                                                        <td className="border-b border-black py-1 px-2"><span className="text-sm font-bold uppercase">{currentPlan.coordinator_name || 'MOISÉS FERREIRA'}</span></td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                        <td className="w-[1%] border-l border-slate-300 p-0"></td>
                                                        <td className="w-[34%] align-middle border-none text-right p-0">
                                                            <div className="flex flex-col items-end">
                                                                <div className="text-[#0ea5e9] text-5xl font-black leading-none font-arial-black">CENSC</div>
                                                                <div className="text-[#0ea5e9] text-[8px] font-bold uppercase mt-1 text-right leading-tight">
                                                                    CENTRO EDUCACIONAL<br />NOSSA SRA DO CENÁCULO
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="border-b-2 border-black mb-6 w-full"></div>

                                        {/* TABLE */}
                                        <div className="border border-black">
                                            <table className="w-full border-collapse table-fixed">
                                                <thead>
                                                    <tr className="bg-[#d9d9d9]">
                                                        <th className="border-r border-black p-2 text-[11px] font-bold uppercase w-[17%] text-center align-middle text-black leading-tight">HABILIDADE(s)<br />CONTEMPLADA(s)</th>
                                                        <th className="border-r border-black p-2 text-[11px] font-bold uppercase w-[16%] text-center align-middle text-black leading-tight">OBJETO DE<br />CONHECIMENTO</th>
                                                        <th className="border-r border-black p-2 text-[11px] font-bold uppercase w-[16%] text-center align-middle text-black leading-tight">RECURSOS<br />UTILIZADOS</th>
                                                        <th className="border-r border-black p-2 text-[11px] font-bold uppercase w-[31%] text-center align-middle text-black leading-tight">DESENVOLVIMENTO</th>
                                                        <th className="border-r border-black p-2 text-[11px] font-bold uppercase w-[10%] text-center align-middle text-black leading-tight">DURAÇÃO</th>
                                                        <th className="border-black p-2 text-[11px] font-bold uppercase w-[10%] text-center align-middle text-black leading-tight">TIPO DE<br />ATIVIDADE</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td className="border-r border-black p-2 text-[12px] align-top h-[400px] break-words whitespace-normal">
                                                            <ul className="list-disc pl-4 space-y-1">
                                                                {currentPlan.bncc_codes?.split('\n').filter(Boolean).map((code, i) => (
                                                                    <li key={i}>{code}</li>
                                                                ))}
                                                                {currentPlan.objectives && (
                                                                    <li dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentPlan.objectives).replace(/<[^>]+>/g, ' ') }}></li>
                                                                )}
                                                            </ul>
                                                        </td>
                                                        <td className="border-r border-black p-2 text-[12px] align-top font-bold break-words whitespace-normal">
                                                            <ul className="list-disc pl-4">
                                                                <li>{currentPlan.title}</li>
                                                            </ul>
                                                        </td>
                                                        <td className="border-r border-black p-2 text-[12px] align-top break-words whitespace-normal">
                                                            <ul className="list-disc pl-4">
                                                                <li>{currentPlan.resources}</li>
                                                            </ul>
                                                        </td>
                                                        <td className="border-r border-black p-2 text-[12px] align-top break-words whitespace-normal">
                                                            <ul className="list-disc pl-4 space-y-2">
                                                                {currentPlan.methodology && <li>{currentPlan.methodology}</li>}
                                                                {currentPlan.description && (
                                                                    <li dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentPlan.description).replace(/<[^>]+>/g, ' ') }}></li>
                                                                )}
                                                            </ul>
                                                        </td>
                                                        <td className="border-r border-black p-2 text-[12px] align-top text-center break-words whitespace-normal">
                                                            <ul className="list-disc pl-4">
                                                                <li>{currentPlan.duration}</li>
                                                            </ul>
                                                        </td>
                                                        <td className="border-black p-2 text-[12px] align-top text-center break-words whitespace-normal">
                                                            <ul className="list-disc pl-4">
                                                                <li>{currentPlan.activity_type}</li>
                                                            </ul>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* FOOTER / OBS */}
                                        <div className="mt-4">
                                            <div className="font-bold text-sm uppercase mb-1">OBSERVAÇÕES:</div>
                                            <div className="border border-black p-2">
                                                <div className="border-b border-black h-6 mb-1"></div>
                                                <div className="border-b border-black h-6 mb-1"></div>
                                                <div className="border-b border-black h-6 mb-1 border-none"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
};
// Build trigger: 2026-01-13 00:54