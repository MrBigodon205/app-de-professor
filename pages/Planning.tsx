import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useClass } from '../contexts/ClassContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { Plan, AttachmentFile } from '../types';
import { supabase } from '../lib/supabase';
import { db } from '../lib/db';
import { useSync } from '../hooks/useSync';
import { ENABLE_OFFLINE_MODE } from '../lib/offlineConfig';
import DOMPurify from 'dompurify';
import { RichTextEditor } from '../components/RichTextEditor';
import { DatePicker } from '../components/DatePicker';
import { useDebounce } from '../hooks/useDebounce';
import { jsPDF } from 'jspdf';
import { DynamicSelect } from '../components/DynamicSelect';
import FileViewerModal from '../components/FileViewerModal';
import { FileImporterModal } from '../components/FileImporterModal';

export const Planning: React.FC = () => {
    const { activeSeries, selectedSeriesId, selectedSection, classes } = useClass();
    const { currentUser, activeSubject } = useAuth();
    const theme = useTheme();
    const { triggerSync } = useSync();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // UI State
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<'geral' | 'conteudo' | 'bncc' | 'recursos'>('geral');
    const [viewMode, setViewMode] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

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
    const [viewerFile, setViewerFile] = useState<{ name: string; url: string; } | null>(null);
    const [isImporterOpen, setIsImporterOpen] = useState(false);

    // Helper for offline ID generation
    const generateUUID = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    // Bulk Delete State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // File Helpers (Moved up/Refactored)
    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const processFiles = async (files: File[]) => {
        if (files.length === 0) return;

        const newFiles = await Promise.all(files.map(async (file) => {
            const reader = new FileReader();
            const fileData = await new Promise((resolve) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(file);
            });

            if (fileData === null) return null;

            return {
                id: generateUUID(),
                name: file.name,
                size: formatBytes(file.size),
                type: file.type,
                url: fileData as string,
                file: file
            };
        }));

        setFormFiles(prevFiles => [...prevFiles, ...newFiles.filter(f => f !== null) as typeof formFiles]);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        await processFiles(files);
        e.target.value = '';
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Tem certeza que deseja excluir ${selectedIds.length} aulas?`)) return;

        setLoading(true);
        try {
            if (!ENABLE_OFFLINE_MODE) {
                // ONLINE ONLY
                const { error } = await supabase.from('plans').delete().in('id', selectedIds);
                if (error) throw error;
            } else {
                // OFFLINE/HYBRID
                // 1. Local Delete
                await db.plans.bulkDelete(selectedIds);

                // 2. Queue Delete
                const timestamp = Date.now();
                const queueItems = selectedIds.map(id => ({
                    table: 'plans',
                    action: 'DELETE',
                    payload: { id },
                    status: 'pending',
                    createdAt: timestamp,
                    retryCount: 0
                }));
                await db.syncQueue.bulkAdd(queueItems as any);
                triggerSync();
            }

            setPlans(prev => prev.filter(p => !selectedIds.includes(p.id)));
            setSelectedIds([]);
            setIsSelectionMode(false);
            if (selectedPlanId && selectedIds.includes(selectedPlanId)) {
                setSelectedPlanId(null);
                setShowForm(false);
            }
            alert(`${selectedIds.length} planejamentos excluídos.`);
        } catch (error: any) {
            console.error('Error deleting plans:', error);
            alert('Erro ao excluir planos: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setLoading(false);
        }
    };


    const prevSeriesIdRef = useRef<string | null>(selectedSeriesId);
    const hasMounted = useRef(false);

    useEffect(() => {
        fetchPlans();

        // Only reset UI state if the series has actually changed
        // and we are not currently in the middle of editing/creating (unless the series changed)
        if (hasMounted.current) {
            if (prevSeriesIdRef.current !== selectedSeriesId) {
                // If series changed, we MUST reset to avoid data mismatch
                setSelectedPlanId(null);
                setShowForm(false);
                setViewMode(false);
                prevSeriesIdRef.current = selectedSeriesId;
            }
        } else {
            hasMounted.current = true;
            // Initial mount logic
            if (window.innerWidth < 1024) {
                setSelectedPlanId(null);
                setShowForm(false);
                setViewMode(false);
            }
        }
    }, [selectedSeriesId, currentUser, activeSubject]);

    useEffect(() => {
        if (selectedSeriesId && !showForm && !isEditing) {
            setFormSeriesId(selectedSeriesId);
        }
    }, [selectedSeriesId, showForm, isEditing]);

    const fetchPlans = async (silent = false) => {
        if (!currentUser) return;
        if (!silent) setLoading(true);
        try {
            let planData: any[] = [];

            if (!ENABLE_OFFLINE_MODE) {
                // --- ONLINE ONLY MODE ---
                let query = supabase.from('plans').select('*').eq('user_id', currentUser.id);

                if (selectedSeriesId) query = query.eq('series_id', selectedSeriesId);
                if (activeSubject) {
                    query = query.or(`subject.eq.${activeSubject},subject.is.null`);
                }

                const { data, error } = await query;
                if (error) throw error;

                const serverPlans = data || [];

                // OPTIMISTIC UI: Get local pending items
                const pendingPlans = await db.plans
                    .filter(p => p.syncStatus === 'pending' && p.user_id === currentUser.id)
                    .toArray();

                // Merge
                const planMap = new Map();
                serverPlans.forEach(p => planMap.set(p.id.toString(), p));
                pendingPlans.forEach(p => planMap.set(p.id.toString(), p));

                planData = Array.from(planMap.values());

                // Cache safe data
                const pendingIds = new Set(pendingPlans.map(p => p.id.toString()));
                const safeCacheData = serverPlans.filter(p => !pendingIds.has(p.id.toString()));

                if (safeCacheData.length > 0) {
                    await db.plans.bulkPut(safeCacheData.map(p => ({
                        ...p,
                        id: p.id.toString(),
                        syncStatus: 'synced'
                    })));
                }

            } else {
                // --- HYBRID MODE (Offline) ---
                console.log("Offline: Loading Plans from Dexie");
                let collection = db.plans.where('user_id').equals(currentUser.id);
                planData = await collection.toArray();

                if (selectedSeriesId) {
                    planData = planData.filter(p => p.series_id === selectedSeriesId || p.series_id === parseInt(selectedSeriesId));
                }
                if (activeSubject) {
                    planData = planData.filter(p => p.subject === activeSubject);
                }
            }

            const formatted: Plan[] = planData.map(p => ({
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
            // ONLY auto-select if NOT in editing/creating mode and no current selection
            if (formatted.length > 0 && !selectedPlanId && !showForm && !viewMode && window.innerWidth >= 1024) {
                setSelectedPlanId(formatted[0].id);
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
    }, [selectedSeriesId, currentUser, activeSubject]);

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
        setFormSubject(activeSubject || '');
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

    const handleClone = (plan: Plan) => {
        setIsEditing(true);
        setSelectedPlanId(null); // Key: set to null so it creates a new record on save
        setShowForm(true);
        setViewMode(false);

        setFormTitle(`${plan.title} (Cópia)`);
        setFormStartDate(new Date().toLocaleDateString('sv-SE')); // Set to today
        setFormEndDate(new Date().toLocaleDateString('sv-SE'));
        setFormDescription(plan.description);
        setFormFiles(plan.files || []); // Clone files too
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
        // OFFLINE CHECK: File uploads require internet (for now)
        const hasNewFiles = formFiles.some(f => f.url.startsWith('data:'));
        if (hasNewFiles && !navigator.onLine) {
            alert("Você está Offline. O envio de novos arquivos requer internet.");
            return;
        }

        setLoading(true);

        try {
            // --- FILE UPLOAD LOGIC (Online Only) ---
            // If offline, we can't upload files yet. We blocked above.
            const processedFiles = await Promise.all(formFiles.map(async (file) => {
                if (file.url.startsWith('data:')) {
                    const parts = file.url.split(';base64,');
                    const mime = parts[0].split(':')[1];
                    const bstr = atob(parts[1]);
                    let n = bstr.length;
                    const u8arr = new Uint8Array(n);
                    while (n--) { u8arr[n] = bstr.charCodeAt(n); }
                    const blob = new Blob([u8arr], { type: mime });

                    const sanitizedName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.-]/g, "_");
                    const fileName = `planning/${generateUUID()}-${sanitizedName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('planning-attachments')
                        .upload(fileName, blob, {
                            cacheControl: '3600',
                            upsert: false
                        });

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('planning-attachments')
                        .getPublicUrl(fileName);

                    return { ...file, url: publicUrl };
                }
                return file;
            }));

            const planData = {
                title: formTitle,
                start_date: formStartDate,
                end_date: formEndDate,
                description: formDescription,
                series_id: formSeriesId,
                section: formSection || null,
                files: processedFiles,
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

            // 1. Determine ID and Action
            let finalId = selectedPlanId;
            let action: 'INSERT' | 'UPDATE' = 'INSERT';

            if (selectedPlanId && isEditing && plans.some(p => p.id === selectedPlanId)) {
                // UPDATE
                action = 'UPDATE';
            } else {
                // CREATE or CLONE
                finalId = generateUUID();
                action = 'INSERT';
            }

            if (!finalId) throw new Error("Falha ao gerar ID");

            if (!ENABLE_OFFLINE_MODE) {
                // --- ONLINE MODE (WEB) ---
                const { error } = await supabase.from('plans').upsert({
                    ...planData,
                    id: finalId
                });
                if (error) throw error;
                // Success message below at common logic
            } else {
                // --- OFFLINE/HYBRID MODE ---
                const localPayload = {
                    ...planData,
                    id: finalId,
                    syncStatus: 'pending' as const
                };
                await db.plans.put(localPayload);

                await db.syncQueue.add({
                    table: 'plans',
                    action: action,
                    payload: { ...planData, id: finalId },
                    status: 'pending',
                    createdAt: Date.now(),
                    retryCount: 0
                });

                triggerSync();
            }

            // --- COMMON UI UPDATES ---
            alert(action === 'INSERT' ? "Planejamento criado com sucesso!" : "Planejamento atualizado com sucesso!");

            await fetchPlans(true);

            if (action === 'INSERT') {
                setSelectedPlanId(finalId);
            }
            setShowForm(false);
            setViewMode(true);
            setIsEditing(false);

        } catch (e: any) {
            console.error(e);
            alert("Erro ao salvar: " + (e.message || "Erro desconhecido"));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedPlanId) return;
        if (!window.confirm("Tem certeza que deseja apagar este planejamento?")) return;
        setLoading(true);
        try {

            if (!ENABLE_OFFLINE_MODE) {
                // ONLINE ONLY
                const { error } = await supabase.from('plans').delete().eq('id', selectedPlanId);
                if (error) throw error;
            } else {
                // Local Delete
                await db.plans.delete(selectedPlanId);

                // Queue Delete
                await db.syncQueue.add({
                    table: 'plans',
                    action: 'DELETE',
                    payload: { id: selectedPlanId },
                    status: 'pending',
                    createdAt: Date.now(),
                    retryCount: 0
                });

                triggerSync();
            }

            // UI Update
            setPlans(plans.filter(p => p.id !== selectedPlanId));
            setSelectedPlanId(null);
            setIsEditing(false);
            setShowForm(false);
            setViewMode(false);
            alert("Planejamento excluído!");

        } catch (e: any) {
            console.error(e);
            alert("Erro ao excluir: " + e.message);
        } finally {
            setLoading(false);
        }
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

    const handleExportPDF = () => {
        if (!currentPlan) return;

        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const margin = 10;
        const pageWidth = doc.internal.pageSize.getWidth();
        const contentWidth = pageWidth - (margin * 2);

        // Header Section
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Turma:', margin, margin + 5);
        doc.setFont('helvetica', 'normal');
        const sectionName = (currentPlan.section && currentPlan.section !== 'Todas' && currentPlan.section !== 'Todas as Turmas' && currentPlan.section !== 'Única')
            ? `${activeSeries?.name} - ${currentPlan.section}`
            : `${activeSeries?.name} - ${activeSeries?.sections?.join(', ') || 'Todas as Turmas'}`;
        doc.text(sectionName, margin + 25, margin + 5);
        doc.line(margin + 25, margin + 6, margin + 120, margin + 6);

        doc.setFont('helvetica', 'bold');
        doc.text('Professor:', margin, margin + 12);
        doc.setFont('helvetica', 'normal');
        doc.text(currentUser?.name?.toUpperCase() || '', margin + 25, margin + 12);
        doc.line(margin + 25, margin + 13, margin + 120, margin + 13);

        doc.setFont('helvetica', 'bold');
        doc.text('Componente:', margin, margin + 19);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(3, 105, 161); // #0369a1
        doc.text(currentPlan.subject || '', margin + 25, margin + 19);
        doc.line(margin + 25, margin + 20, margin + 120, margin + 20);
        doc.setTextColor(0, 0, 0);

        doc.setFont('helvetica', 'bold');
        doc.text('Período:', margin, margin + 26);
        doc.setFont('helvetica', 'normal');
        const periodText = `${new Date(currentPlan.startDate + 'T12:00:00').toLocaleDateString('pt-BR')} até ${new Date(currentPlan.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}`;
        doc.text(periodText, margin + 25, margin + 26);
        doc.line(margin + 25, margin + 27, margin + 120, margin + 27);

        doc.setFont('helvetica', 'bold');
        doc.text('Coordenação:', margin, margin + 33);
        doc.setFont('helvetica', 'normal');
        doc.text(currentPlan.coordinator_name || 'MOISÉS FERREIRA', margin + 25, margin + 33);
        doc.line(margin + 25, margin + 34, margin + 120, margin + 34);

        // Logo Section
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(28);
        doc.setTextColor(14, 165, 233); // #0ea5e9
        doc.text('CENSC', pageWidth - margin - 50, margin + 15);
        doc.setFontSize(8);
        doc.text('CENTRO EDUCACIONAL', pageWidth - margin - 50, margin + 22);
        doc.text('NOSSA SRA DO CENÁCULO', pageWidth - margin - 50, margin + 26);
        doc.setTextColor(0, 0, 0);

        doc.setLineWidth(0.5);
        doc.line(margin, margin + 40, pageWidth - margin, margin + 40);

        // Content Table
        const tableTop = margin + 45;
        const colWidths = [0.17, 0.16, 0.16, 0.31, 0.10, 0.10].map(w => w * contentWidth);
        const headers = ['HABILIDADES', 'OBJETO CONH.', 'RECURSOS', 'DESENVOLVIMENTO', 'DURAÇÃO', 'TIPO'];

        doc.setFillColor(217, 217, 217);
        doc.rect(margin, tableTop, contentWidth, 10, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');

        let currentX = margin;
        headers.forEach((h, i) => {
            doc.rect(currentX, tableTop, colWidths[i], 10);
            doc.text(h, currentX + (colWidths[i] / 2), tableTop + 6, { align: 'center' });
            currentX += colWidths[i];
        });

        // Content Data
        const rowHeight = 80;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        currentX = margin;

        // Habilidades
        doc.rect(currentX, tableTop + 10, colWidths[0], rowHeight);
        const habText = [
            ...(currentPlan.bncc_codes?.split('\n').filter(Boolean) || []),
            (currentPlan.objectives ? currentPlan.objectives.replace(/<[^>]+>/g, ' ') : '')
        ].join('\n');
        doc.text(doc.splitTextToSize(habText, colWidths[0] - 4), currentX + 2, tableTop + 15);

        currentX += colWidths[0];
        doc.rect(currentX, tableTop + 10, colWidths[1], rowHeight);
        doc.text(doc.splitTextToSize(currentPlan.title, colWidths[1] - 4), currentX + 2, tableTop + 15);

        currentX += colWidths[1];
        doc.rect(currentX, tableTop + 10, colWidths[2], rowHeight);
        doc.text(doc.splitTextToSize(currentPlan.resources || '', colWidths[2] - 4), currentX + 2, tableTop + 15);

        currentX += colWidths[2];
        doc.rect(currentX, tableTop + 10, colWidths[3], rowHeight);
        const devText = [
            currentPlan.methodology || '',
            (currentPlan.description ? currentPlan.description.replace(/<[^>]+>/g, ' ') : '')
        ].join('\n\n');
        doc.text(doc.splitTextToSize(devText, colWidths[3] - 4), currentX + 2, tableTop + 15);

        currentX += colWidths[3];
        doc.rect(currentX, tableTop + 10, colWidths[4], rowHeight);
        doc.text(currentPlan.duration || '', currentX + (colWidths[4] / 2), tableTop + 15, { align: 'center' });

        currentX += colWidths[4];
        doc.rect(currentX, tableTop + 10, colWidths[5], rowHeight);
        doc.text(currentPlan.activity_type || '', currentX + (colWidths[5] / 2), tableTop + 15, { align: 'center' });

        // Footer
        const footerTop = tableTop + 10 + rowHeight + 5;
        doc.setFont('helvetica', 'bold');
        doc.text('OBSERVAÇÕES:', margin, footerTop);
        doc.rect(margin, footerTop + 2, contentWidth, 20);
        doc.line(margin, footerTop + 9, pageWidth - margin, footerTop + 9);
        doc.line(margin, footerTop + 16, pageWidth - margin, footerTop + 16);

        doc.save(`Planejamento-${currentPlan.title}.pdf`);
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
    const displayedPlans = React.useMemo(() => {
        return plans.filter(plan => {
            const matchesSearch = plan.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                (plan.description && plan.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
            const matchesSection = !filterSection || plan.section === filterSection;
            return matchesSearch && matchesSection;
        });
    }, [plans, debouncedSearchTerm, filterSection]);

    return (
        <main className="flex flex-col gap-4 md:gap-6 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 md:pb-8 relative fluid-p-m fluid-gap-m px-4 md:px-0 w-full h-full overflow-hidden">
            {/* Landscape FAB for New Plan */}
            <button
                onClick={handleNewPlan}
                className="hidden landscape:flex fixed bottom-6 right-6 z-50 bg-primary hover:bg-primary-dark text-white size-12 rounded-2xl shadow-xl border border-white/20 items-center justify-center transition-all hover:scale-110 active:scale-95 lg:hidden"
                title="Nova Aula"
            >
                <span className="material-symbols-outlined text-3xl">add</span>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain" title="Adicionar anexo" aria-label="Adicionar anexo" />

            {/* ANIMATION VARIANTS */}
            {/* These align with the "Premium" feel of the Dashboard */}
            <motion.div className="hidden" animate={{ opacity: 0 }} /> {/* Hack to ensure motion is used if needed elsewhere or just defining variants below */}

            {/* AI MODAL */}


            {/* Sidebar */}
            <div className={`w-full lg:w-80 h-full flex flex-col gap-4 shrink-0 transition-all ${selectedPlanId || isEditing || showForm ? 'hidden lg:flex' : 'flex'}`} data-tour="planning-sidebar">
                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 landscape:p-2">
                    <div className="flex justify-between items-center mb-4 landscape:mb-0 landscape:gap-2">
                        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                            <button className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all bg-white dark:bg-slate-700 shadow-sm landscape:py-1`} style={{ color: theme.primaryColorHex }}>
                                Aulas
                            </button>
                            <Link to="/activities" className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all landscape:py-1">
                                Ativ.
                            </Link>
                        </div>
                        <button onClick={handleNewPlan} className={`text-white size-9 rounded-xl flex items-center justify-center transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0`} title="Nova Aula" data-tour="planning-new-btn" style={{ backgroundColor: theme.primaryColorHex, boxShadow: `0 10px 15px -3px ${theme.primaryColorHex}33` }}>
                            <span className="material-symbols-outlined text-[20px]">add</span>
                        </button>
                    </div>
                    {/* Bulk Selection Controls */}
                    <div className="flex gap-2 mb-4 landscape:mb-0">
                        {isSelectionMode ? (
                            <div className="flex items-center gap-2 w-full">
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={selectedIds.length === 0}
                                    className="flex-1 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                    Excluir ({selectedIds.length})
                                </button>
                                <button
                                    onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }}
                                    className="px-3 py-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs font-bold uppercase"
                                >
                                    Cancelar
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsSelectionMode(true)}
                                className="w-full py-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 border border-dashed border-slate-300 dark:border-slate-700"
                            >
                                <span className="material-symbols-outlined text-sm">checklist</span>
                                Selecionar
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[20px]">search</span>
                        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${theme.primaryColor}/50 text-sm transition-all focus:bg-white dark:focus:bg-black`} />
                    </div>
                </div>

                {/* Section Filter Pills */}
                {activeSeries && activeSeries.sections?.length > 0 && (
                    <div className="px-1">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                            <button
                                onClick={() => setFilterSection('')}
                                className={`shrink-0 px-5 py-2.5 lg:px-3 lg:py-1 rounded-xl text-sm font-black transition-all border-2 ${filterSection === ''
                                    ? `bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white border-transparent shadow-md shadow-${theme.primaryColor}/20`
                                    : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-200'
                                    }`}
                            >
                                Todas
                            </button>
                            {activeSeries.sections.map(sec => (
                                <button
                                    key={sec}
                                    onClick={() => setFilterSection(sec)}
                                    className={`shrink-0 px-5 py-2.5 lg:px-3 lg:py-1 rounded-xl text-sm font-black transition-all border-2 ${filterSection === sec
                                        ? `bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white border-transparent shadow-md shadow-${theme.primaryColor}/20`
                                        : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-200'
                                        }`}
                                >
                                    Turma {sec}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <motion.div
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.1,
                                delayChildren: 0.1
                            }
                        }
                    }}
                    initial="hidden"
                    animate="visible"
                    className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 pb-24 lg:pb-0 min-h-0"
                >

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
                        displayedPlans.map((plan, idx) => (
                            <motion.button
                                key={plan.id}
                                variants={{
                                    hidden: { opacity: 0, x: -20, filter: "blur(5px)" },
                                    visible: {
                                        opacity: 1, x: 0, filter: "blur(0px)",
                                        transition: { type: 'spring', stiffness: 100, damping: 12 }
                                    }
                                }}
                                layoutId={`plan-card-${plan.id}`}
                                onClick={() => isSelectionMode ? toggleSelection(plan.id) : handleSelectPlan(plan)}
                                className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 group relative overflow-hidden shadow-sm ${isSelectionMode
                                    ? (selectedIds.includes(plan.id) ? `bg-${theme.primaryColor}/5 border-${theme.primaryColor} dark:bg-${theme.primaryColor}/20` : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-slate-800')
                                    : (selectedPlanId === plan.id ? `bg-white dark:bg-surface-dark border-${theme.primaryColor} shadow-${theme.primaryColor}/10 ring-1 ring-${theme.primaryColor}` : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600')
                                    }`}
                            >
                                {isSelectionMode && (
                                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 size-5 rounded border-2 flex items-center justify-center transition-all z-10 ${selectedIds.includes(plan.id) ? `bg-${theme.primaryColor} border-${theme.primaryColor}` : 'border-slate-300 bg-white'}`}>
                                        {selectedIds.includes(plan.id) && <span className="material-symbols-outlined text-sm text-white font-bold">check</span>}
                                    </div>
                                )}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 landscape:hidden ${selectedPlanId === plan.id ? '' : 'bg-transparent group-hover:bg-slate-200'} transition-all z-20`} style={{ backgroundColor: selectedPlanId === plan.id ? theme.primaryColorHex : undefined }}></div>
                                <div className={`pl-4 w-full transition-all duration-300 ${isSelectionMode ? 'pl-16 landscape:pl-16' : 'landscape:pl-0'}`}>

                                    <div className="flex justify-between items-start mb-2 landscape:mb-0 landscape:flex-row landscape:items-center">
                                        <h4 className={`font-bold text-base md:text-lg truncate pr-2 flex-1 ${selectedPlanId === plan.id ? `text-${theme.primaryColor}` : 'text-slate-800 dark:text-slate-200'}`}>{plan.title}</h4>
                                        <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-lg">chevron_right</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 landscape:hidden">
                                        {plan.section && (
                                            <span className={`px-2.5 py-1 rounded-md text-[0.7rem] font-bold ${selectedPlanId === plan.id ? `bg-${theme.primaryColor}/10 text-${theme.primaryColor}` : 'bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300'}`}>
                                                Turma {plan.section}
                                            </span>
                                        )}
                                        {plan.activity_type && (
                                            <span className={`px-2.5 py-1 rounded-md text-[0.7rem] font-bold flex items-center gap-1 ${selectedPlanId === plan.id ? `bg-${theme.primaryColor}/10 text-${theme.primaryColor}` : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                                <span className="material-symbols-outlined text-[0.7rem]">
                                                    {plan.activity_type.includes('Expositiva') ? 'school' :
                                                        plan.activity_type.includes('Prática') ? 'science' :
                                                            plan.activity_type.includes('Grupo') ? 'groups' :
                                                                plan.activity_type.includes('Avaliação') ? 'assignment_turned_in' :
                                                                    'category'}
                                                </span>
                                                {plan.activity_type}
                                            </span>
                                        )}
                                        {plan.theme_area && plan.theme_area !== 'Geral' && (
                                            <span className={`px-2.5 py-1 rounded-md text-[0.7rem] font-bold ${selectedPlanId === plan.id ? `bg-${theme.primaryColor}/10 text-${theme.primaryColor}` : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                                {plan.theme_area}
                                            </span>
                                        )}
                                        <span className={`px-2.5 py-1 rounded-md text-[0.7rem] font-bold ${selectedPlanId === plan.id ? `bg-${theme.primaryColor}/10 text-${theme.primaryColor}` : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                            {new Date(plan.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                    {/* Mobile Landscape Only Date */}
                                    <div className="hidden landscape:block text-xs text-slate-400 mt-1">
                                        {new Date(plan.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                                    </div>
                                </div>
                            </motion.button>
                        ))
                    )}
                </motion.div>
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
                        <button onClick={handleNewPlan} className={`group relative inline-flex items-center justify-center gap-3 text-white text-lg font-bold py-4 px-8 rounded-2xl shadow-xl transition-all hover:-translate-y-1 active:translate-y-0 overflow-hidden`} style={{ backgroundColor: theme.primaryColorHex, boxShadow: `0 20px 25px -5px ${theme.primaryColorHex}33` }}>
                            <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform duration-300">add</span> Criar Nova Aula
                        </button>
                    </div>
                ) : showForm ? (
                    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                        {/* EDITOR HEADER */}
                        <div className="p-6 landscape:p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-surface-dark z-20 sticky top-0 shadow-sm">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => { setSelectedPlanId(null); setIsEditing(false); setShowForm(false); }}
                                    className="lg:hidden p-2 -ml-2 text-slate-400"
                                >
                                    <span className="material-symbols-outlined">arrow_back</span>
                                </button>
                                <h2 className="text-xl landscape:text-base font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className={`size-8 rounded-lg bg-${theme.primaryColor}/10 text-${theme.primaryColor} flex items-center justify-center landscape:hidden`}>
                                        <span className="material-symbols-outlined text-lg">{selectedPlanId ? 'edit_document' : 'post_add'}</span>
                                    </div>
                                    {selectedPlanId ? 'Editar Aula' : 'Nova Aula'}
                                </h2>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 landscape:p-4 custom-scrollbar pb-0">
                            <div className="max-w-4xl mx-auto flex flex-col gap-8 landscape:gap-4">

                                {/* 1. GERAL */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 ml-1">Título da Aula</label>
                                        <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Ex: Introdução à Célula" className={`w-full text-lg font-bold p-4 rounded-xl bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-black border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${theme.primaryColor}/50 transition-all outline-none`} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <DynamicSelect
                                                label="Turma"
                                                value={formSection}
                                                onChange={setFormSection}
                                                options={[
                                                    ...(activeSeries?.sections?.map(s => ({ value: s, label: s, icon: 'groups' })) || []),
                                                    { value: 'Todas as Turmas', label: 'Todas as Turmas', icon: 'domain' }
                                                ]}
                                                placeholder="Selecione..."
                                            />
                                        </div>
                                        <div>
                                            <DynamicSelect
                                                label="Tipo de Atividade"
                                                value={formActivityType}
                                                onChange={setFormActivityType}
                                                options={[
                                                    { value: 'Aula Expositiva', label: 'Aula Expositiva', icon: 'school', color: 'blue' },
                                                    { value: 'Atividade Prática', label: 'Atividade Prática', icon: 'science', color: 'indigo' },
                                                    { value: 'Trabalho em Grupo', label: 'Trabalho em Grupo', icon: 'groups', color: 'violet' },
                                                    { value: 'Avaliação', label: 'Avaliação', icon: 'assignment_turned_in', color: 'rose' },
                                                    { value: 'Outro', label: 'Outro', icon: 'category', color: 'slate' }
                                                ]}
                                                placeholder="Selecione..."
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <DatePicker label="Início" value={formStartDate} onChange={setFormStartDate} />
                                            <DatePicker label="Fim" value={formEndDate} onChange={setFormEndDate} />
                                        </div>
                                        <div>
                                            <label className="label">Duração Estimada</label>
                                            <input type="text" value={formDuration} onChange={e => setFormDuration(e.target.value)} placeholder="Ex: 2 aulas de 50min" className={`w-full font-bold p-3 rounded-xl bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-black border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${theme.primaryColor}/50 transition-all outline-none`} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label">Coordenador Pedagógico</label>
                                        <input type="text" value={formCoordinator} onChange={e => setFormCoordinator(e.target.value)} placeholder="Nome do Coordenador" className={`w-full font-bold p-3 rounded-xl bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-black border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${theme.primaryColor}/50 transition-all outline-none`} />
                                    </div>
                                </div>

                                {/* 2. CONTEÚDO */}
                                <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-indigo-500">menu_book</span>
                                        Conteúdo
                                    </h3>
                                    <div>
                                        <label className="label mb-2 flex items-center gap-2">Objetivos de Aprendizagem</label>
                                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                            <RichTextEditor value={formObjectives} onChange={setFormObjectives} placeholder="Quais os objetivos desta aula?" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label mb-2 flex items-center gap-2">Descrição / Roteiro</label>
                                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                            <RichTextEditor value={formDescription} onChange={setFormDescription} placeholder="Detalhamento do roteiro da aula..." />
                                        </div>
                                    </div>
                                </div>

                                {/* 3. BNCC */}
                                <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-emerald-500">verified</span>
                                        BNCC & Metodologia
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="label mb-2">Códigos da BNCC</label>
                                            <textarea value={formBncc} onChange={e => setFormBncc(e.target.value)} className={`w-full font-bold p-3 rounded-xl bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-black border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${theme.primaryColor}/50 transition-all outline-none resize-none h-32 font-mono text-sm`} placeholder="Ex: EF06CI01, EF06CI02..." />
                                        </div>
                                        <div>
                                            <label className="label mb-2">Metodologia</label>
                                            <textarea value={formMethodology} onChange={e => setFormMethodology(e.target.value)} className={`w-full font-bold p-3 rounded-xl bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-black border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${theme.primaryColor}/50 transition-all outline-none resize-none h-32`} placeholder="Estratégias utilizadas..." />
                                        </div>
                                    </div>
                                </div>

                                {/* 4. RECURSOS */}
                                <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-amber-500">build</span>
                                        Recursos & Avaliação
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="label">Recursos</label>
                                            <textarea value={formResources} onChange={e => setFormResources(e.target.value)} className={`w-full font-bold p-3 rounded-xl bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-black border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${theme.primaryColor}/50 transition-all outline-none resize-none h-24`} placeholder="Recursos necessários..." />
                                        </div>
                                        <div>
                                            <label className="label">Avaliação</label>
                                            <textarea value={formAssessment} onChange={e => setFormAssessment(e.target.value)} className={`w-full font-bold p-3 rounded-xl bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-black border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${theme.primaryColor}/50 transition-all outline-none resize-none h-24`} placeholder="Critérios avaliativos..." />
                                        </div>
                                    </div>
                                </div>

                                {/* 5. ANEXOS (FILES) */}
                                <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-xs font-black uppercase text-slate-400 ml-1 tracking-widest">Materiais de Apoio</div>
                                        <button
                                            onClick={() => setIsImporterOpen(true)}
                                            type="button"
                                            className={`flex items-center gap-2 px-5 py-3 bg-${theme.primaryColor}/10 text-${theme.primaryColor} rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-${theme.primaryColor} hover:text-white transition-all active:scale-95 border border-${theme.primaryColor}/20 hover:border-transparent shadow-sm`}
                                        >
                                            <span className="material-symbols-outlined text-base">upload_file</span>
                                            Adicionar Arquivo
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {formFiles.map((file, index) => (
                                            <div key={index} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 group shadow-sm">
                                                <div className={`size-10 rounded-lg bg-${theme.primaryColor}/10 text-${theme.primaryColor} flex items-center justify-center shrink-0`}>
                                                    <span className="material-symbols-outlined">description</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold truncate text-slate-700 dark:text-slate-200">{file.name}</div>
                                                    <div className="text-xs text-slate-400">{file.size}</div>
                                                </div>
                                                <button
                                                    onClick={() => setFormFiles(prev => prev.filter((_, i) => i !== index))}
                                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                    title="Remover arquivo"
                                                >
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

                                {/* FOOTER ACTIONS */}
                                <div className="max-w-4xl mx-auto mt-8 mb-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                    <button onClick={() => { setIsEditing(false); setShowForm(false); }} className="px-6 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
                                    {selectedPlanId && (
                                        <button onClick={handleDelete} className="px-6 py-2.5 rounded-xl text-red-500 font-bold hover:bg-red-50 transition-colors">Excluir</button>
                                    )}
                                    <button onClick={handleSave} className="px-8 py-2.5 rounded-xl text-white font-bold shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0" style={{ backgroundColor: theme.primaryColorHex, boxShadow: `0 10px 15px -3px ${theme.primaryColorHex}40` }}>
                                        Salvar Aula
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>


                ) : (
                    <div className="flex-1 overflow-y-auto relative animate-in fade-in h-full custom-scrollbar bg-slate-50 dark:bg-black/20">
                        {currentPlan ? (
                            <div className="flex flex-col min-h-full">
                                {/* Premium Header */}
                                <div className={`h-48 bg-gradient-to-r ${theme.bgGradient} relative overflow-hidden shrink-0`}>
                                    <div className="absolute inset-0 opacity-10 flex flex-wrap gap-8 justify-end p-8 rotate-12 scale-150 pointer-events-none">
                                        <span className="material-symbols-outlined text-[150px] text-white">{theme.icon}</span>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-black/50 to-transparent">
                                        <div className="flex gap-2 mb-2">
                                            <span className="px-2 py-1 rounded-md bg-white/20 backdrop-blur-none text-white text-[10px] md:text-xs font-bold border border-white/20 hover:bg-white/30 transition-all">
                                                {activeSeries?.name}
                                            </span>
                                            {currentPlan.section && (
                                                <span className="px-2 py-1 rounded-md bg-white/20 backdrop-blur-none text-white text-[10px] md:text-xs font-bold border border-white/20 hover:bg-white/30 transition-all">
                                                    Turma {currentPlan.section}
                                                </span>
                                            )}
                                        </div>
                                        <h1 className="text-2xl md:text-3xl md:text-4xl font-bold text-white shadow-sm flex flex-wrap items-center gap-2 md:gap-3 leading-tight">
                                            <span className="material-symbols-outlined text-[24px] md:text-[40px] hidden sm:inline-block">menu_book</span>
                                            {currentPlan.title}
                                        </h1>
                                    </div>



                                    {/* Mobile Back Button (Visible on View Mode) */}
                                    <div className="absolute top-4 left-4 lg:hidden z-10">
                                        <button
                                            onClick={() => setSelectedPlanId(null)}
                                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md border border-white/20 transition-all shadow-lg active:scale-95"
                                            title="Voltar"
                                        >
                                            <span className="material-symbols-outlined">arrow_back</span>
                                        </button>
                                    </div>

                                    {/* Actions (Visible on Mobile & Desktop) */}
                                    <div className="absolute top-4 right-4 lg:top-6 lg:right-6 flex gap-2 lg:gap-3 z-10 animate-in fade-in slide-in-from-right-4 duration-500 delay-200">
                                        <button
                                            onClick={handleExportPDF}
                                            className="p-2 size-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all shadow-lg flex items-center justify-center hover:scale-105 active:scale-95"
                                            title="Baixar PDF"
                                        >
                                            <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                                        </button>
                                        <button
                                            onClick={handleExportWord}
                                            className="p-2 size-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all shadow-lg flex items-center justify-center hover:scale-105 active:scale-95"
                                            title="Baixar Word"
                                        >
                                            <span className="material-symbols-outlined text-xl">description</span>
                                        </button>
                                        <button
                                            onClick={() => currentPlan && handleClone(currentPlan)}
                                            className="p-2 size-10 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/40 text-white backdrop-blur-md border border-white/20 transition-all shadow-lg flex items-center justify-center hover:scale-105 active:scale-95"
                                            title="Clonar Aula"
                                        >
                                            <span className="material-symbols-outlined text-xl">content_copy</span>
                                        </button>
                                        <button
                                            onClick={() => { setIsEditing(true); setShowForm(true); }}
                                            className="p-2 size-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all shadow-lg flex items-center justify-center hover:scale-105 active:scale-95"
                                            title="Editar Aula"
                                        >
                                            <span className="material-symbols-outlined text-xl">edit</span>
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="p-2 size-10 rounded-2xl bg-red-500/20 hover:bg-red-500/40 text-white backdrop-blur-md border border-white/20 transition-all shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 group"
                                            title="Excluir Aula"
                                        >
                                            <span className="material-symbols-outlined text-lg group-hover:text-red-200 transaction-colors">delete</span>
                                        </button>
                                    </div>
                                </div>



                                {/* Metadata Grid */}
                                <div className="p-8 max-w-5xl mx-auto w-full space-y-8 flex-1">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                            <div className="size-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined">event</span>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Data</div>
                                                <div className="font-bold text-slate-700 dark:text-gray-200 text-sm truncate">
                                                    {new Date(currentPlan.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                            <div className="size-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined">school</span>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Disciplina</div>
                                                <div className="font-bold text-slate-700 dark:text-gray-200 text-sm truncate">
                                                    {currentPlan.subject || 'Não definida'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                            <div className="size-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined">timer</span>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Duração</div>
                                                <div className="font-bold text-slate-700 dark:text-gray-200 text-sm truncate">
                                                    {currentPlan.duration || 'Não definida'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                            <div className="size-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined">category</span>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Eixo / Tema</div>
                                                <div className="font-bold text-slate-700 dark:text-gray-200 text-sm truncate">
                                                    {currentPlan.theme_area || 'Geral'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* CONTENT PREVIEW CARDS */}
                                <div className="px-8 max-w-5xl mx-auto w-full space-y-6 flex-1">
                                    {/* Row 1: Objeto & Habilidades */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-3">
                                                <span className="material-symbols-outlined text-indigo-500">menu_book</span>
                                                Conteúdo & Objetivos
                                            </h3>

                                            <div className="space-y-4">


                                                {currentPlan.objectives && (
                                                    <div>
                                                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">Objetivos de Aprendizagem</label>
                                                        <div className="text-sm text-slate-600 dark:text-slate-300 client-rendered-html leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentPlan.objectives) }} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-3">
                                                <span className="material-symbols-outlined text-emerald-500">verified</span>
                                                BNCC & Habilidades
                                            </h3>

                                            <div>
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {currentPlan.bncc_codes?.split('\n').filter(Boolean).map((code, i) => (
                                                        <span key={i} className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 rounded-md text-xs font-bold font-mono border border-emerald-200 dark:border-emerald-500/30 break-all whitespace-normal h-auto">
                                                            {code}
                                                        </span>
                                                    ))}
                                                    {(!currentPlan.bncc_codes) && <span className="text-slate-400 text-sm italic">Nenhum código informado</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 2: Desenvolvimento (Full Width) */}
                                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-3">
                                            <span className="material-symbols-outlined text-blue-500">play_circle</span>
                                            Desenvolvimento & Metodologia
                                        </h3>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {currentPlan.methodology && (
                                                <div>
                                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 block">Metodologia</label>
                                                    <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed break-words">
                                                        {currentPlan.methodology}
                                                    </div>
                                                </div>
                                            )}

                                            {currentPlan.description && (
                                                <div>
                                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 block">Roteiro da Aula</label>
                                                    <div className="text-sm text-slate-600 dark:text-slate-300 client-rendered-html leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentPlan.description) }} />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Row 3: Recursos & Avaliação */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-3">
                                                <span className="material-symbols-outlined text-amber-500">build</span>
                                                Recursos
                                            </h3>
                                            <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line break-words">
                                                {currentPlan.resources || 'Nenhum recurso específico listado.'}
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-3">
                                                <span className="material-symbols-outlined text-rose-500">assignment_turned_in</span>
                                                Avaliação
                                            </h3>
                                            <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line break-words">
                                                {currentPlan.assessment || 'Nenhuma avaliação específica listada.'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Print Button (Screen Only) */}
                                    <div className="flex justify-end print:hidden">
                                        <button
                                            onClick={() => {
                                                const printContent = document.querySelector('.printable-content');
                                                if (!printContent) return;
                                                const iframe = document.createElement('iframe');
                                                iframe.style.position = 'absolute';
                                                iframe.style.top = '-9999px';
                                                iframe.style.left = '-9999px';
                                                document.body.appendChild(iframe);
                                                const doc = iframe.contentWindow?.document;
                                                if (!doc) return;
                                                const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
                                                styles.forEach(style => doc.head.appendChild(style.cloneNode(true)));
                                                const printStyle = doc.createElement('style');
                                                printStyle.textContent = `@page {size: landscape; margin: 0; } body {background: white !important; margin: 0; padding: 10mm !important; } .printable-content {visibility: visible !important; width: 100% !important; margin: 0 !important; }`;
                                                doc.head.appendChild(printStyle);
                                                doc.body.innerHTML = printContent.outerHTML;
                                                setTimeout(() => {
                                                    iframe.contentWindow?.print();
                                                    setTimeout(() => document.body.removeChild(iframe), 100);
                                                }, 500);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl shadow-lg transition-all"
                                        >
                                            <span className="material-symbols-outlined">print</span> Imprimir Documento
                                        </button>
                                    </div>

                                    {/* ATTACHMENTS VIEW (Screen Only) */}
                                    {currentPlan.files && currentPlan.files.length > 0 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100 print:hidden">
                                            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                                <span className={`material-symbols-outlined text-${theme.primaryColor}`}>attachment</span>
                                                Anexos
                                            </h3>
                                            <div className="flex flex-wrap gap-3">
                                                {currentPlan.files.map((file, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group shadow-sm max-w-full"
                                                    >
                                                        <div className="flex items-center gap-3 flex-1 min-w-0 pointer-events-none">
                                                            <span className="material-symbols-outlined text-slate-500 group-hover:text-indigo-500 transition-colors">description</span>
                                                            <div className="flex flex-col min-w-0 truncate">
                                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{file.name}</span>
                                                                <span className="text-[10px] text-slate-500 uppercase">{file.size}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <div className="flex items-center gap-1">
                                                                {(
                                                                    // Image/PDF always viewable (native/base64 compatible)
                                                                    (file.name.match(/\.(pdf|jpg|jpeg|png|webp)$/i) ||
                                                                        file.url.startsWith('data:image') ||
                                                                        file.url.startsWith('data:application/pdf')) ||
                                                                    // Office files ONLY viewable if saved (public URL), NOT base64/data:
                                                                    (file.name.match(/\.(doc|docx|ppt|pptx|xls|xlsx)$/i) && !file.url.startsWith('data:'))
                                                                ) && (
                                                                        <button
                                                                            onClick={() => setViewerFile(file)}
                                                                            className="p-2 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
                                                                            title={file.url.startsWith('data:') && file.name.match(/\.(doc|docx|ppt|pptx|xls|xlsx)$/i) ? "Salve para visualizar" : "Visualizar / Apresentar"}
                                                                        >
                                                                            <span className="material-symbols-outlined">visibility</span>
                                                                        </button>
                                                                    )}
                                                                <a
                                                                    href={file.url}
                                                                    download={file.name}
                                                                    className="p-2 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all"
                                                                    title="Baixar"
                                                                >
                                                                    <span className="material-symbols-outlined">download</span>
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="border-t border-slate-100 dark:border-slate-800 my-8 print:hidden"></div>

                                    {/* PRINTABLE CONTENT (Matches CENSC Layout - Landscape) */}
                                    <div className="printable-content bg-white p-[10mm] hidden print:block">
                                        <div className="flex justify-between items-start mb-6">
                                            <table className="w-full border-collapse border-none">
                                                <tbody>
                                                    <tr>
                                                        <td className="w-[65%] align-top border-none p-0">
                                                            <table className="w-full border-collapse border-none">
                                                                <tbody>
                                                                    <tr>
                                                                        <td className="w-24 py-1"><span className="text-xs font-bold">Turma:</span></td>
                                                                        <td className="border-b border-black py-1 px-2">
                                                                            <span className="text-sm font-bold">
                                                                                {(currentPlan.section && currentPlan.section !== 'Todas' && currentPlan.section !== 'Todas as Turmas' && currentPlan.section !== 'Única')
                                                                                    ? `${activeSeries?.name} - ${currentPlan.section}`
                                                                                    : `${activeSeries?.name} - ${activeSeries?.sections?.join(', ') || 'Todas as Turmas'}`}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="w-24 py-1"><span className="text-xs font-bold">Professor:</span></td>
                                                                        <td className="border-b border-black py-1 px-2"><span className="text-sm font-bold uppercase">{currentUser?.name}</span></td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="w-24 py-1"><span className="text-xs font-bold">Componente:</span></td>
                                                                        <td className="border-b border-black py-1 px-2"><span className="text-sm font-bold text-[#0369a1]">{currentPlan.subject}</span></td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="w-24 py-1"><span className="text-xs font-bold">Período:</span></td>
                                                                        <td className="border-b border-black py-1 px-2">
                                                                            <span className="text-sm font-bold">
                                                                                {new Date(currentPlan.startDate + 'T12:00:00').toLocaleDateString('pt-BR')} até {new Date(currentPlan.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="w-24 py-1"><span className="text-xs font-bold">Coordenação:</span></td>
                                                                        <td className="border-b border-black py-1 px-2"><span className="text-sm font-bold uppercase">{currentPlan.coordinator_name || 'MOISÉS FERREIRA'}</span></td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                        <td className="w-[1%] border-l border-slate-300"></td>
                                                        <td className="w-[34%] align-middle text-right">
                                                            <div className="flex flex-col items-end">
                                                                <div className="text-[#0ea5e9] text-5xl font-black leading-none">CENSC</div>
                                                                <div className="text-[#0ea5e9] text-[8px] font-bold uppercase mt-1 leading-tight">CENTRO EDUCACIONAL<br />NOSSA SRA DO CENÁCULO</div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="border-b-2 border-black mb-6 w-full"></div>
                                        <div className="border border-black">
                                            <table className="w-full border-collapse table-fixed">
                                                <thead>
                                                    <tr className="bg-[#d9d9d9]">
                                                        <th className="border-r border-black p-2 text-[10px] font-bold uppercase w-[17%] text-center align-middle">HABILIDADE(s)<br />CONTEMPLADA(s)</th>
                                                        <th className="border-r border-black p-2 text-[10px] font-bold uppercase w-[16%] text-center align-middle">OBJETO DE<br />CONHECIMENTO</th>
                                                        <th className="border-r border-black p-2 text-[10px] font-bold uppercase w-[16%] text-center align-middle">RECURSOS<br />UTILIZADOS</th>
                                                        <th className="border-r border-black p-2 text-[10px] font-bold uppercase w-[31%] text-center align-middle">DESENVOLVIMENTO</th>
                                                        <th className="border-r border-black p-2 text-[10px] font-bold uppercase w-[10%] text-center align-middle">DURAÇÃO</th>
                                                        <th className="border-black p-2 text-[10px] font-bold uppercase w-[10%] text-center align-middle">TIPO DE<br />ATIVIDADE</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td className="border-r border-black p-2 text-[11px] align-top h-[400px]">
                                                            <ul className="list-disc pl-4 space-y-1">
                                                                {currentPlan.bncc_codes?.split('\n').filter(Boolean).map((code, i) => (
                                                                    <li key={i}>{code}</li>
                                                                ))}
                                                                {currentPlan.objectives && (
                                                                    <li dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentPlan.objectives).replace(/<[^>]+>/g, ' ') }}></li>
                                                                )}
                                                            </ul>
                                                        </td>
                                                        <td className="border-r border-black p-2 text-[11px] align-top font-bold">
                                                            <ul className="list-disc pl-4"><li>{currentPlan.title}</li></ul>
                                                        </td>
                                                        <td className="border-r border-black p-2 text-[11px] align-top">
                                                            <ul className="list-disc pl-4"><li>{currentPlan.resources}</li></ul>
                                                        </td>
                                                        <td className="border-r border-black p-2 text-[11px] align-top">
                                                            <ul className="list-disc pl-4 space-y-2">
                                                                {currentPlan.methodology && <li>{currentPlan.methodology}</li>}
                                                                {currentPlan.description && (
                                                                    <li dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentPlan.description).replace(/<[^>]+>/g, ' ') }}></li>
                                                                )}
                                                            </ul>
                                                        </td>
                                                        <td className="border-r border-black p-2 text-[11px] align-top text-center">
                                                            <ul className="list-disc pl-4"><li>{currentPlan.duration}</li></ul>
                                                        </td>
                                                        <td className="border-black p-2 text-[11px] align-top text-center">
                                                            <ul className="list-disc pl-4"><li>{currentPlan.activity_type}</li></ul>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-surface-dark">
                                <span className="material-symbols-outlined text-6xl text-slate-200 mb-4 font-black">search_off</span>
                                <h3 className="text-xl font-bold text-slate-400">Plano não encontrado</h3>
                                <p className="text-slate-400 text-sm mt-2 max-w-xs">O plano selecionado não foi encontrado ou foi excluído.</p>
                                <button
                                    onClick={() => { setSelectedPlanId(null); setViewMode(false); }}
                                    className="mt-6 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all"
                                >
                                    Voltar à Lista
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {/* FILE VIEWER MODAL */}
            {viewerFile && (
                <FileViewerModal
                    isOpen={!!viewerFile}
                    onClose={() => setViewerFile(null)}
                    file={viewerFile as any}
                />
            )}

            <FileImporterModal
                isOpen={isImporterOpen}
                onClose={() => setIsImporterOpen(false)}
                onFileSelect={(files) => {
                    if (files) processFiles(Array.from(files));
                }}
                multiple
            />


        </main>
    );
};
// Build trigger: 2026-01-13 00:54