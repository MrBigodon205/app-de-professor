import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useClass } from '../contexts/ClassContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { Activity, AttachmentFile, Student } from '../types';
import { supabase } from '../lib/supabase';
import DOMPurify from 'dompurify';
import { DatePicker } from '../components/DatePicker';
import { RichTextEditor } from '../components/RichTextEditor';
import { useDebounce } from '../hooks/useDebounce';
// import { jsPDF } from 'jspdf'; // Dynamic
// import autoTable from 'jspdf-autotable'; // Dynamic
import { motion } from 'framer-motion';
import { VARIANTS } from '../constants/motion';
// import { DynamicSelect } from '../components/DynamicSelect';
import FileViewerModal from '../components/FileViewerModal';
import { FileImporterModal } from '../components/FileImporterModal';
import { useStudentsData } from '../hooks/useStudentsData';

// Fallback types if fetch fails
const DEFAULT_ACTIVITY_TYPES = ['Prova', 'Trabalho', 'Dever de Casa', 'Seminário', 'Pesquisa', 'Conteúdo', 'Outro'];

export const Activities: React.FC = () => {
    const { activeSeries, selectedSeriesId, selectedSection, classes } = useClass();
    const { currentUser, activeSubject } = useAuth();
    const theme = useTheme();

    // UI State
    const [activities, setActivities] = useState<Activity[]>([]);
    // students state managed by useStudentsData hook now
    const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

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

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
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
    const [viewerFile, setViewerFile] = useState<AttachmentFile | null>(null);
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
    const [isPresentationOpen, setIsPresentationOpen] = useState(false); // State for presentation mode
    const [formSeriesId, setFormSeriesId] = useState('');
    const [formSection, setFormSection] = useState('');
    const [filterSection, setFilterSection] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [isImporterOpen, setIsImporterOpen] = useState(false);
    const [hasDraft, setHasDraft] = useState(false);

    // --- DRAFT PERSISTENCE ---
    useEffect(() => {
        const key = `draft_activities_${currentUser?.id}_${selectedSeriesId}`;
        if (isEditing) {
            const draft = {
                formTitle, formType, formDate, formStartDate, formEndDate,
                formDescription, formSeriesId, formSection,
                selectedActivityId, isEditing
            };
            localStorage.setItem(key, JSON.stringify(draft));
        }
    }, [
        formTitle, formType, formDate, formStartDate, formEndDate,
        formDescription, formSeriesId, formSection,
        isEditing
    ]);

    useEffect(() => {
        if (!currentUser || !selectedSeriesId) return;
        const key = `draft_activities_${currentUser.id}_${selectedSeriesId}`;
        const saved = localStorage.getItem(key);
        setHasDraft(!!saved);
    }, [selectedSeriesId, currentUser, isEditing]);

    const loadDraft = () => {
        const key = `draft_activities_${currentUser?.id}_${selectedSeriesId}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setFormTitle(data.formTitle || '');
                setFormType(data.formType || 'Prova');
                setFormDate(data.formDate || '');
                setFormStartDate(data.formStartDate || '');
                setFormEndDate(data.formEndDate || '');
                setFormDescription(data.formDescription || '');
                setFormSeriesId(data.formSeriesId || '');
                setFormSection(data.formSection || '');
                setSelectedActivityId(data.selectedActivityId || null);
                setIsEditing(data.isEditing || true);
            } catch (e) {
                console.error("Failed to load draft", e);
            }
        }
    };

    const clearDraft = () => {
        const key = `draft_activities_${currentUser?.id}_${selectedSeriesId}`;
        localStorage.removeItem(key);
        setHasDraft(false);
    };

    // Auto-load draft on mount if exists
    // Auto-load draft on mount if exists - DISABLED BY USER REQUEST
    /*
    useEffect(() => {
        if (!currentUser || !selectedSeriesId) return;
        const key = `draft_activities_${currentUser.id}_${selectedSeriesId}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                // Only auto-load if it was in editing mode
                if (data.isEditing) {
                    loadDraft();
                }
            } catch (e) {
                console.error("Failed to auto-load draft", e);
            }
        }
    }, [selectedSeriesId, currentUser]); // Run once per series/user change
    */

    // File Processing Helper
    const handleFiles = (files: File[]) => {
        files.forEach(file => {
            if (file.size > 20 * 1024 * 1024) {
                alert(`O arquivo ${file.name} é muito grande! Limite de 20MB.`);
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                const target = event.target;
                if (target?.result) {
                    setFormFiles(prev => [...prev, {
                        id: generateUUID(),
                        name: file.name,
                        size: `${(file.size / 1024).toFixed(1)} KB`,
                        url: target.result as string
                    }]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    // Bulk Delete State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Tem certeza que deseja excluir ${selectedIds.length} atividades?`)) return;

        try {
            const { error } = await supabase.from('activities').delete().in('id', selectedIds);
            if (error) throw error;

            setActivities(prev => prev.filter(a => !selectedIds.includes(a.id)));
            setSelectedIds([]);
            setIsSelectionMode(false);
            if (selectedActivityId && selectedIds.includes(selectedActivityId)) {
                setSelectedActivityId(null);
            }
        } catch (error) {
            console.error('Error deleting activities:', error);
            alert('Erro ao excluir atividades.');
        }
    };

    useEffect(() => {
        fetchActivityTypes();
    }, []);

    useEffect(() => {
        fetchActivities();

        // Navigation / Series Change Logic
        const key = `draft_activities_${currentUser?.id}_${selectedSeriesId}`;
        const saved = localStorage.getItem(key);
        let hasDraftEditing = false;

        if (saved) {
            try {
                const d = JSON.parse(saved);
                if (d.isEditing) hasDraftEditing = true;
            } catch (e) { }
        }

        if (!hasDraftEditing) {
            setSelectedActivityId(null);
            setIsEditing(false);
        }
    }, [selectedSeriesId, activeSubject]);

    // useEffect removed to fix "Create New" bug.
    // If we auto-reset isEditing when selectedActivityId is null, we can't switch to "Create Mode".

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
            // Keep defaults
        }
    };

    useEffect(() => {
        if (selectedSeriesId) {
            setFormSeriesId(selectedSeriesId);
        }
        if (selectedSection) {
            setFormSection(selectedSection);
        }
        // Reset filter when series changes
        setFilterSection('');
    }, [selectedSeriesId, selectedSection]);

    // Centralized Student Fetching via Hook (Offline First)
    const { students } = useStudentsData(
        selectedActivityId ? activities.find(a => a.id === selectedActivityId)?.seriesId : selectedSeriesId?.toString(),
        selectedActivityId ? activities.find(a => a.id === selectedActivityId)?.section : selectedSection,
        currentUser?.id
    );

    const loadActivityFormData = async (act: Activity) => {
        setFormTitle(act.title);
        setFormType(act.type);
        setFormDate(act.date);
        setFormStartDate(act.startDate || act.date);
        setFormEndDate(act.endDate || act.date);
        setFormFiles(act.files);
        setFormSeriesId(act.seriesId);
        setFormSection(act.section || '');

        // Lazy Load Description
        if (act.description) {
            setFormDescription(act.description);
        } else {
            setFormDescription('Carregando...');
            const { data } = await supabase.from('activities').select('description').eq('id', act.id).single();
            if (data) {
                setFormDescription(data.description || '');
            } else {
                setFormDescription('');
            }
        }
    };

    const fetchActivities = async (silent = false) => {
        if (!currentUser) return;
        if (!silent) setLoading(true);
        try {
            // OPTIMIZED FETCH: Exclude 'description' to prevent freezing with large base64 images
            let query = supabase.from('activities')
                .select('id, title, type, date, section, user_id, series_id, start_date, end_date, files, completions, subject, created_at') // Excludes description
                .eq('user_id', currentUser.id);

            if (selectedSeriesId) {
                query = query.eq('series_id', selectedSeriesId);
            }
            if (activeSubject) {
                query = query.or(`subject.eq.${activeSubject},subject.is.null`);
            }

            const { data, error } = await query;
            if (error) throw error;

            const activityData = (data as any[]) || [];

            const formatted: Activity[] = activityData.map(a => ({
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
                userId: a.user_id,
                subject: a.subject,
                createdAt: a.created_at
            }));

            formatted.sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                if (dateB !== dateA) return dateB - dateA;
                const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return createdB - createdA;
            });

            setActivities(formatted);

            // --- UPDATED NAVIGATION LOGIC ---
            if (formatted.length > 0) {
                const isCurrentFound = selectedActivityId ? formatted.find(a => a.id === selectedActivityId) : false;

                if (!isEditing) {
                    // Check if we have a draft that should override this reset
                    const key = `draft_activities_${currentUser?.id}_${selectedSeriesId}`;
                    const hasSavedDraft = localStorage.getItem(key);

                    if (!hasSavedDraft) {
                        if ((!selectedActivityId) || (selectedActivityId && !isCurrentFound)) {
                            setIsEditing(false);
                            // Auto-select disabled by user request. Always reset if invalid.
                            /*
                            if (window.innerWidth >= 1024) {
                                if (formatted.length > 0 && selectedActivityId !== formatted[0].id) {
                                    setSelectedActivityId(formatted[0].id);
                                    loadActivityFormData(formatted[0]);
                                }
                            } else {
                            */
                            if (selectedActivityId !== null) {
                                setSelectedActivityId(null);
                            }
                            // }
                        }
                    }
                    // If draft exists, we do nothing -> preserving isEditing=true (set by loadDraft)
                }
            }
        } catch (e) {
            console.error("Fetch activities failed", e);
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

        // Realtime setup

        const channel = supabase.channel(`activities_sync_${selectedSeriesId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'activities'
                },
                (payload) => {
                    fetchActivities(true);
                }
            )
            .subscribe();

        return () => {
            // Realtime cleanup
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, [selectedSeriesId, currentUser, activeSubject]);

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
        // Smart Default: Use filterSection if global section is not set
        setFormSection(selectedSection || filterSection || '');
        clearDraft();
    };

    const handleSelectActivity = async (act: Activity) => {
        setIsEditing(false);
        setSelectedActivityId(act.id);
        loadActivityFormData(act);
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


        try {
            // --- FILE UPLOAD LOGIC ---
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
                    const fileName = `activities/${generateUUID()}-${sanitizedName}`;

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

            const payload = {
                title: formTitle,
                type: formType,
                date: formDate,
                start_date: formType === 'Conteúdo' ? formStartDate : null,
                end_date: formType === 'Conteúdo' ? formEndDate : null,
                description: formDescription,
                series_id: formSeriesId,
                section: formSection || null,
                files: processedFiles,
                user_id: currentUser?.id,
                subject: activeSubject,
                id: isEditing && selectedActivityId ? selectedActivityId : undefined
            };

            const { data, error } = await supabase
                .from('activities')
                .upsert(payload)
                .select()
                .single();

            if (error) throw error;

            let finalId = selectedActivityId;
            if (data) finalId = data.id;
            alert("Atividade salva com sucesso!");

            // Refresh UI
            await fetchActivities(true);
            // Refresh UI
            await fetchActivities(true);
            // Return to list to avoid "Not Found" errors
            setSelectedActivityId(null);
            setIsEditing(false);
            clearDraft();

        } catch (e: any) {
            console.error("Save Error", e);
            alert("Erro ao salvar: " + e.message);
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
            const { error } = await supabase
                .from('activities')
                .update({ completions: newCompletions })
                .eq('id', currentActivity.id);
            if (error) throw error;
            await fetchActivities(true);
        } catch (e) {
            console.error("Completion toggle failed", e);
            alert("Erro ao atualizar conclusão.");
        }
    };

    const selectAllCompletions = async () => {
        if (!currentActivity || students.length === 0) return;

        const allStudentIds = students.map(s => s.id);
        const allSelected = currentActivity.completions?.length === students.length;
        const newCompletions = allSelected ? [] : allStudentIds;

        try {
            const { error } = await supabase
                .from('activities')
                .update({ completions: newCompletions })
                .eq('id', currentActivity.id);
            if (error) throw error;
            await fetchActivities(true);
        } catch (e) {
            console.error("Select All failed", e);
            alert("Erro ao selecionar todos.");
        }
    };

    const handleDelete = async () => {
        if (!selectedActivityId) return;

        const confirmed = window.confirm("Tem certeza que deseja apagar esta atividade?");
        if (!confirmed) return;

        setLoading(true);

        try {
            const { error } = await supabase.from('activities').delete().eq('id', selectedActivityId);
            if (error) throw error;

            // Cleanup UI (Common)
            const remaining = activities.filter(a => a.id !== selectedActivityId);
            setActivities(remaining);
            setSelectedActivityId(null);
            setIsEditing(false);

        } catch (error) {
            console.error('Error deleting activity:', error);
            alert('Erro ao excluir atividade.');
        } finally {
            setLoading(false);
        }
    };

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFiles(Array.from(files));
        }
        e.target.value = ''; // Reset input
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

    // Utility to convert tailwind color names or hex to RGB for jsPDF
    const getThemeRGB = (colorClass: string): [number, number, number] => {
        const map: Record<string, [number, number, number]> = {
            'indigo-600': [79, 70, 229],
            'emerald-600': [5, 150, 105],
            'rose-600': [225, 29, 72],
            'amber-600': [217, 119, 6],
            'slate-600': [71, 85, 105],
            'blue-500': [59, 130, 246], // Sky/Blue
        };
        return map[colorClass] || [59, 130, 246];
    };

    const handleExportPDF = async () => {
        if (!currentActivity) return;

        const { jsPDF } = await import('jspdf');
        const autoTable = (await import('jspdf-autotable')).default;

        const doc = new jsPDF();
        const primaryRGB = getThemeRGB(`${theme.baseColor}-600`);

        // --- HELPER: Draw Premium Header ---
        const drawHeader = () => {
            doc.setFillColor(...primaryRGB);
            doc.rect(0, 0, 210, 40, 'F');

            // Circles
            doc.setFillColor(255, 255, 255);
            doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
            doc.circle(190, 10, 40, 'F');
            doc.circle(20, 50, 30, 'F');
            doc.setGState(new (doc as any).GState({ opacity: 1 }));

            // Brand
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('CENSC', 14, 25);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Centro Educacional Nossa Sra do Cenáculo', 14, 32);

            // Badge
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(145, 10, 50, 20, 3, 3, 'F');
            doc.setTextColor(...primaryRGB);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('ATIVIDADE', 170, 17, { align: 'center' });

            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);

            const sectionName = currentActivity.section
                ? `${activeSeries?.name} - ${currentActivity.section}`
                : `${activeSeries?.name} - ${activeSeries?.sections?.join(', ') || 'Todas'}`;

            doc.text(sectionName, 170, 22, { align: 'center' });
            doc.text(currentActivity.type.toUpperCase(), 170, 26, { align: 'center' });
        };

        drawHeader();

        // --- Activity Details Card ---
        doc.setFillColor(248, 250, 252); // Slate 50
        doc.setDrawColor(226, 232, 240); // Slate 200
        doc.roundedRect(14, 50, 182, 30, 3, 3, 'FD');

        doc.setTextColor(30, 41, 59);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(currentActivity.title, 20, 60);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);

        const dateText = currentActivity.type === 'Conteúdo'
            ? `${new Date((currentActivity.startDate || currentActivity.date) + 'T12:00:00').toLocaleDateString('pt-BR')} até ${new Date((currentActivity.endDate || currentActivity.date) + 'T12:00:00').toLocaleDateString('pt-BR')}`
            : new Date(currentActivity.date + 'T12:00:00').toLocaleDateString('pt-BR');

        doc.text(`Data: ${dateText}  •  Disciplina: ${(currentUser?.subject || 'Geral').toUpperCase()}`, 20, 68);

        let currentY = 90;

        // Description Section
        if (currentActivity.description) {
            doc.setFontSize(11);
            doc.setTextColor(30, 41, 59);
            doc.setFont('helvetica', 'bold');
            doc.text('Descrição / Orientações:', 14, currentY);

            currentY += 6;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(51, 65, 85);

            const cleanDesc = currentActivity.description.replace(/<[^>]+>/g, ' '); // Strip HTML tags
            const splitDesc = doc.splitTextToSize(cleanDesc, 180);
            doc.text(splitDesc, 14, currentY);
            currentY += (splitDesc.length * 5) + 10;
        }

        // Student List Table
        // Only if it's NOT 'Conteúdo'? Or always? Let's include if it has completions tracked.
        if (currentActivity.type !== 'Conteúdo') {
            doc.setFontSize(11);
            doc.setTextColor(30, 41, 59);
            doc.setFont('helvetica', 'bold');
            doc.text('Lista de Entrega / Realização:', 14, currentY);
            currentY += 5;

            const body = students.map(s => {
                const isDone = currentActivity.completions?.includes(s.id);
                return [s.number, s.name, isDone ? 'OK' : ''];
            });

            autoTable(doc, {
                startY: currentY,
                head: [['Nº', 'ALUNO', 'STATUS']],
                body: body,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
                headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold' },
                columnStyles: {
                    0: { cellWidth: 15, fontStyle: 'bold' },
                    2: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }
                },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === 2) {
                        if (data.cell.raw === 'OK') {
                            data.cell.styles.textColor = [34, 197, 94]; // Green
                        }
                    }
                }
            });
        }

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Página ${i} de ${pageCount} • Gerado por Prof. Acerta+`, 105, 290, { align: 'center' });
        }

        doc.save(`Atividade-${currentActivity.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
    };

    const handlePrint = () => {
        const printContent = document.querySelector('.printable-activity-content');
        if (!printContent) {
            // If No printable div exists yet, alert or handle
            alert("Conteúdo para impressão não encontrado.");
            return;
        }

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

        const printStyle = doc.createElement('style');
        printStyle.textContent = `
            @page { size: portrait; margin: 10mm; }
            body { background: white !important; margin: 0; padding: 0; font-family: sans-serif; }
            .printable-activity-content { visibility: visible !important; width: 100% !important; margin: 0 !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print { display: none !important; }
        `;
        doc.head.appendChild(printStyle);

        doc.body.innerHTML = printContent.outerHTML;

        setTimeout(() => {
            iframe.contentWindow?.print();
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 100);
        }, 500);
    };

    const currentActivity = activities.find(a => a.id === selectedActivityId);

    const displayedActivities = React.useMemo(() => {
        return activities.filter(a => {
            const matchesSearch = a.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                a.type.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
            // Updated filtering logic: Include specific match OR "All Classes" options
            const matchesSection = filterSection === '' ||
                a.section === filterSection ||
                a.section === 'Todas as Turmas' ||
                a.section === 'Todas' ||
                a.section === 'Única' ||
                !a.section;
            return matchesSearch && matchesSection;
        });
    }, [activities, debouncedSearchTerm, filterSection]);

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
        <div
            className="flex flex-col lg:flex-row gap-4 md:gap-6 max-w-[1600px] mx-auto pb-24 md:pb-8 relative fluid-p-m fluid-gap-m px-4 md:px-0 w-full h-full overflow-hidden"
        >
            {/* Landscape FAB for New Activity */}
            <div className="hidden landscape:flex fixed bottom-6 right-6 z-50 flex-col gap-3 lg:hidden">
                {hasDraft && !isEditing && (
                    <button
                        onClick={loadDraft}
                        className="size-12 bg-amber-500 text-white rounded-2xl shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                        title="Continuar Rascunho"
                    >
                        <span className="material-symbols-outlined font-black">edit_note</span>
                    </button>
                )}
                <button
                    onClick={handleNewActivity}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white size-12 rounded-2xl shadow-xl border border-white/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    title="Nova Atividade"
                >
                    <span className="material-symbols-outlined text-3xl">add</span>
                </button>
            </div>
            {/* Hidden File Input */}
            <input
                id="activity-file-upload"
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
                multiple
                onChange={handleFileChange}
                title="Upload de arquivo"
                aria-label="Upload de arquivo"
            />

            {/* Sidebar with Card List Style */}
            <div className={`w-full lg:w-80 h-full flex flex-col gap-4 shrink-0 transition-all ${selectedActivityId || isEditing ? 'hidden lg:flex' : 'flex'}`} data-tour="activities-sidebar">
                {/* Sidebar Header */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 landscape:p-2">
                    <div className="flex justify-between items-center mb-4 landscape:mb-0 landscape:gap-2 shrink-0">
                        <div className="flex gap-2 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl">
                            <Link to="/planning" className="px-3 py-1.5 landscape:p-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all whitespace-nowrap">
                                <span className="landscape:hidden">Aulas</span>
                                <span className="hidden landscape:block text-xs">Aulas</span>
                            </Link>
                            <button className="px-3 py-1.5 rounded-lg text-sm font-bold transition-all bg-white dark:bg-slate-700 shadow-sm landscape:p-1.5 whitespace-nowrap theme-text-primary">
                                <span className="landscape:hidden">Atividades</span>
                                <span className="hidden landscape:block text-xs">Ativ.</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            {hasDraft && !isEditing && (
                                <button
                                    onClick={loadDraft}
                                    className="size-9 bg-amber-500 text-white rounded-xl flex items-center justify-center transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                                    title="Continuar Rascunho"
                                >
                                    <span className="material-symbols-outlined text-[20px]">edit_note</span>
                                </button>
                            )}
                            <button onClick={handleNewActivity} className="text-white size-9 rounded-xl flex items-center justify-center transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0 theme-bg-primary theme-shadow-primary" title="Nova Atividade" data-tour="activities-new-btn">
                                <span className="material-symbols-outlined text-[20px]">add</span>
                            </button>
                        </div>
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
                                className="px-6 py-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 border border-dashed border-slate-300 dark:border-slate-700 whitespace-nowrap"
                            >
                                <span className="material-symbols-outlined text-sm">checklist</span>
                                Selecionar
                            </button>
                        )}
                    </div>
                    {/* Search & Filter */}
                    <div className="relative flex-1 landscape:flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[20px]">search</span>
                        <input
                            id="search-activities"
                            name="search-activities"
                            aria-label="Buscar atividades"
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-${theme.primaryColor}/50 text-sm transition-all focus:bg-white dark:focus:bg-black font-medium`}
                        />
                    </div>
                </div>

                {/* Section Switcher Tabs - Matching Planning.tsx */}
                {activeSeries && activeSeries.sections?.length > 0 && (
                    <div className="px-1">
                        <div className="flex items-center gap-2 flex-wrap py-1">
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
                {/* List Items */}
                <motion.div
                    className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 pb-24 lg:pb-0 min-h-0"
                    variants={VARIANTS.staggerContainer}
                    initial="initial"
                    animate="animate"
                >
                    {loading ? (

                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="w-full h-24 rounded-2xl bg-white/20 dark:bg-slate-900/40 border border-white/10 p-4 animate-pulse">
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
                                <div className="flex gap-2">
                                    <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                    <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                </div>
                            </div>
                        ))
                    ) : displayedActivities.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 min-h-[200px] flex items-center justify-center">Nenhuma atividade encontrada.{searchTerm && ' Tente outro termo.'}</div>
                    ) : (
                        displayedActivities.map(act => (
                            <ActivityListItem
                                key={act.id}
                                act={act}
                                isSelected={selectedIds.includes(act.id)}
                                isSelectionMode={isSelectionMode}
                                selectedActivityId={selectedActivityId}
                                theme={theme}
                                onSelect={handleSelectActivity}
                                onToggle={toggleSelection}
                            />
                        )))
                    }
                </motion.div>

            </div >
            {/* Main Content */}
            <div className={`flex-1 flex flex-col card shadow-premium overflow-hidden relative transition-all ${selectedActivityId || isEditing ? 'flex' : 'hidden lg:flex'}`}>
                {(!selectedActivityId && !isEditing) ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50 dark:bg-slate-800/20">
                        <div className="w-24 h-24 bg-indigo-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <span className="material-symbols-outlined text-5xl text-indigo-200 dark:text-slate-600">assignment</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-600 dark:text-slate-300 mb-2">Nenhuma atividade selecionada</h2>
                        <p className="max-w-xs mx-auto text-sm">Selecione uma atividade ao lado para ver os detalhes ou crie uma nova.</p>
                        <button
                            onClick={handleNewActivity}
                            className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            Criar Atividade
                        </button>
                    </div>
                ) : isEditing ? (
                    // --- EDIT MODE ---
                    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900">
                        {/* Header */}

                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
                            <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <button onClick={() => { setIsEditing(false); setSelectedActivityId(null); }} className="lg:hidden p-1 -ml-2 mr-1 text-slate-400">
                                    <span className="material-symbols-outlined font-black">arrow_back</span>
                                </button>
                                {selectedActivityId ? 'Editar Atividade' : 'Nova Atividade'}
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setIsEditing(false); if (!selectedActivityId) setSelectedActivityId(null); }}
                                    className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="px-6 py-2 rounded-xl font-bold transition-all active:scale-95 text-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:brightness-110 bg-[var(--theme-primary)] text-white shadow-lg shadow-[var(--theme-primary-alpha)]"
                                >
                                    {loading ? <span className="material-symbols-outlined animate-spin text-lg">sync</span> : <span className="material-symbols-outlined text-lg">save</span>}
                                    Salvar
                                </button>
                            </div>
                        </div>

                        {/* Form Body */}
                        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Título da Atividade</label>
                                        <input
                                            value={formTitle}
                                            onChange={e => setFormTitle(e.target.value)}
                                            className="theme-input w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 transition-all font-bold text-lg text-slate-800 dark:text-slate-100 placeholder:font-normal"
                                            placeholder="Ex: Prova de Matemática - 1º Bimestre"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</label>
                                            <div className="flex gap-2">
                                                <select
                                                    aria-label="Tipo de Atividade"
                                                    value={formType}
                                                    onChange={e => setFormType(e.target.value)}
                                                    className="theme-input w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 transition-all font-bold text-sm text-slate-800 dark:text-slate-100"
                                                >
                                                    <option value="" disabled>Selecione...</option>
                                                    {activityTypes.map(t => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>
                                                {/* Add Type Button Placeholder */}
                                                <button
                                                    onClick={() => {
                                                        const newType = prompt("Novo tipo de atividade:");
                                                        if (newType) {
                                                            supabase.from('activity_types').insert({ name: newType }).then(({ error }) => {
                                                                if (!error) {
                                                                    setActivityTypes(prev => [...prev.sort(), newType]);
                                                                    setFormType(newType);
                                                                }
                                                            });
                                                        }
                                                    }}
                                                    className="px-3 rounded-xl border-2 hover:brightness-90 font-bold text-[var(--theme-primary)] border-[var(--theme-primary)] bg-[var(--theme-surface)]"
                                                    title="Adicionar Novo Tipo"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data</label>
                                            <DatePicker
                                                value={formDate}
                                                onChange={setFormDate}
                                            />
                                        </div>
                                    </div>

                                    {formType === 'Conteúdo' && (
                                        <div
                                            className="grid grid-cols-2 gap-4 p-4 rounded-xl border bg-[var(--theme-surface)] border-[rgb(var(--primary)/0.3)]"
                                        >
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-primary)]">Início</label>
                                                <DatePicker value={formStartDate} onChange={setFormStartDate} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-primary)]">Fim</label>
                                                <DatePicker value={formEndDate} onChange={setFormEndDate} />
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Turma (Opcional)</label>
                                            <select
                                                aria-label="Selecione a Turma"
                                                value={formSection}
                                                onChange={e => setFormSection(e.target.value)}
                                                className="theme-input w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 transition-all font-bold text-sm"
                                            >
                                                <option value="">Todas</option>
                                                {activeSeries?.sections?.map(sec => (
                                                    <option key={sec} value={sec}>{sec}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Description & Files */}
                                <div className="space-y-6">
                                    <div className="space-y-2 h-[300px] flex flex-col">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição / Conteúdo</label>
                                        <div
                                            className={`theme-input-wrapper flex-1 border-2 rounded-xl overflow-hidden transition-colors bg-white dark:bg-slate-900 focus-within:!border-[var(--theme-primary)]`}
                                        >
                                            <RichTextEditor
                                                value={formDescription}
                                                onChange={setFormDescription}
                                                placeholder="Digite os detalhes da atividade..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Anexos</label>
                                            <button
                                                onClick={() => setIsImporterOpen(true)}
                                                className="text-xs font-bold flex items-center gap-1 hover:brightness-75 text-[var(--theme-primary)]"
                                            >
                                                <span className="material-symbols-outlined text-sm">cloud_upload</span>
                                                Importar
                                            </button>
                                        </div>

                                        {/* File Drag Area */}
                                        <div
                                            className={`border-2 border-dashed rounded-xl p-6 transition-all text-center ${isDragging
                                                ? `bg-[var(--theme-surface)] border-[var(--theme-primary)]`
                                                : `border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50`
                                                }`}
                                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                            onDragLeave={() => setIsDragging(false)}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                setIsDragging(false);
                                                if (e.dataTransfer.files?.length) handleFiles(Array.from(e.dataTransfer.files));
                                            }}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <div className="flex flex-col items-center gap-2 cursor-pointer">
                                                <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-slate-400">attach_file</span>
                                                </div>
                                                <span className="text-sm font-bold text-slate-500">Clique ou arraste arquivos</span>
                                                <span className="text-[10px] text-slate-400">PDF, Imagens, Word, Excel (Max 20MB)</span>
                                            </div>
                                        </div>

                                        {/* File List */}
                                        <div className="space-y-2 mt-4">
                                            {formFiles.map((file, i) => (
                                                <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl group hover:shadow-sm transition-all">
                                                    <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                        <span className="material-symbols-outlined text-slate-500">description</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{file.name}</div>
                                                        <div className="text-[10px] text-slate-400 uppercase">{file.size}</div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleRemoveFile(file.id); }}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined font-black">close</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div >
                        </div >


                    </div >

                ) : (
                    // --- VIEW MODE ---
                    currentActivity && (
                        <div
                            className="flex-1 overflow-y-auto relative h-[100dvh] md:h-full"
                        >
                            {/* Header Image/Gradient */}
                            <div className={`h-28 md:h-32 lg:h-36 bg-gradient-to-r ${theme.bgGradient} relative overflow-hidden`}>
                                <div className="absolute inset-0 opacity-10 flex flex-wrap gap-8 justify-end p-8 rotate-12 scale-150 pointer-events-none">
                                    <span className="material-symbols-outlined text-[150px] text-white">{theme.icon}</span>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 fluid-p-m bg-gradient-to-t from-black/50 to-transparent">
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
                                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white text-shadow-premium">{currentActivity.title}</h1>
                                </div>
                                {/* Mobile Back Button (Visible on View Mode) */}
                                <div className="absolute top-4 left-4 lg:hidden z-10">
                                    <button
                                        onClick={() => setSelectedActivityId(null)}
                                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md border border-white/20 transition-all shadow-lg active:scale-95"
                                        title="Voltar para Lista"
                                    >
                                        <span className="material-symbols-outlined font-black">arrow_back</span>
                                    </button>
                                </div>

                                {/* Actions (Visible on Mobile & Desktop) */}
                                <div
                                    className="absolute top-4 right-4 lg:top-6 lg:right-6 flex gap-2 lg:gap-3 z-10"
                                >
                                    <button
                                        onClick={handleExportPDF}
                                        className="p-2 size-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all shadow-lg flex items-center justify-center hover:scale-105 active:scale-95"
                                        title="Baixar PDF"
                                    >
                                        <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            const ppt = currentActivity.files?.find(f => f.name.match(/\.(ppt|pptx)$/i));
                                            if (ppt) {
                                                setIsPresentationOpen(true);
                                            } else {
                                                alert("Nenhuma apresentação PowerPoint encontrada nesta atividade.");
                                            }
                                        }}
                                        className="p-2 size-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all shadow-lg flex items-center justify-center hover:scale-105 active:scale-95"
                                        title="Apresentar (PowerPoint)"
                                    >
                                        <span className="material-symbols-outlined text-lg">slideshow</span>
                                    </button>
                                    <button
                                        onClick={() => { setIsEditing(true); }}
                                        className="p-2 size-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all shadow-lg flex items-center justify-center hover:scale-105 active:scale-95"
                                        title="Editar Atividade"
                                    >
                                        <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="p-2 size-10 rounded-2xl bg-red-500/20 hover:bg-red-500/40 text-white backdrop-blur-md border border-white/20 transition-all shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 group"
                                        title="Excluir Atividade"
                                    >
                                        <span className="material-symbols-outlined text-lg group-hover:text-red-200 transaction-colors">delete</span>
                                    </button>
                                </div>
                            </div>



                            {/* HIDDEN PRINTABLE CONTENT */}
                            <div className="hidden">
                                <div className="printable-activity-content p-8 space-y-6 text-black bg-white">
                                    <div className="flex justify-between items-start border-b-2 border-slate-200 pb-4">
                                        <div>
                                            <h1 className="text-3xl font-black text-sky-600">CENSC</h1>
                                            <p className="text-[10px] font-bold uppercase text-slate-500">Centro Educacional Nossa Sra do Cenáculo</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold uppercase text-slate-400">Atividade Pedagógica</p>
                                            <p className="text-sm font-black">{currentActivity.title}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="space-y-1">
                                            <p><span className="font-bold">Turma:</span> {classes.find(c => c.id === currentActivity.seriesId)?.name} {currentActivity.section && `- ${currentActivity.section}`}</p>
                                            <p><span className="font-bold">Professor:</span> {currentUser?.name}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p><span className="font-bold">Tipo:</span> {currentActivity.type}</p>
                                            <p><span className="font-bold">Data:</span> {currentActivity.type === 'Conteúdo'
                                                ? `${new Date((currentActivity.startDate || currentActivity.date) + 'T12:00:00').toLocaleDateString('pt-BR')} - ${new Date((currentActivity.endDate || currentActivity.date) + 'T12:00:00').toLocaleDateString('pt-BR')}`
                                                : new Date(currentActivity.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>

                                    <div className="py-4">
                                        <h3 className="font-bold text-lg mb-2">Descrição / Orientações:</h3>
                                        <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: currentActivity.description || '' }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* View Content */}
                            <div className="fluid-p-m md:fluid-p-l space-y-6 md:space-y-8">
                                {/* INFO CARDS */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tipo</div>
                                        <div className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[18px] text-indigo-500">{getIconForType(currentActivity.type)}</span>
                                            {currentActivity.type}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Data</div>
                                        <div className="font-bold text-slate-700 dark:text-slate-200">
                                            {currentActivity.type === 'Conteúdo'
                                                ? `${new Date((currentActivity.startDate || currentActivity.date) + 'T12:00:00').toLocaleDateString('pt-BR').slice(0, 5)} - ${new Date((currentActivity.endDate || currentActivity.date) + 'T12:00:00').toLocaleDateString('pt-BR').slice(0, 5)}`
                                                : new Date(currentActivity.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Criado em</div>
                                        <div className="font-bold text-slate-700 dark:text-slate-200">{new Date(currentActivity.createdAt || '').toLocaleDateString('pt-BR')}</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Turma</div>
                                        <div className="font-bold text-slate-700 dark:text-slate-200">{currentActivity.section || 'Todas'}</div>
                                    </div>
                                </div>

                                {/* DESCRIPTION */}
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                        <span className={`material-symbols-outlined text-${theme.primaryColor}`}>description</span>
                                        Descrição / Conteúdo
                                    </h3>
                                    <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentActivity.description || '<p class="text-slate-400 italic">Sem descrição.</p>') }} />
                                    </div>
                                </div>

                                {/* ATTACHMENTS */}
                                {currentActivity.files && currentActivity.files.length > 0 && (
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                            <span className={`material-symbols-outlined text-${theme.primaryColor}`}>attachment</span>
                                            Anexos
                                        </h3>
                                        <div className="flex flex-wrap gap-3">
                                            {currentActivity.files.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group shadow-sm max-w-full"
                                                >
                                                    <div className="flex items-center gap-3 flex-1 min-w-0 pointer-events-none">
                                                        <span className="material-symbols-outlined text-slate-500 group-hover:text-indigo-500 transition-colors">description</span>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{file.name}</span>
                                                            <span className="text-[10px] text-slate-500 uppercase">{file.size}</span>
                                                        </div>
                                                    </div>

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
                                                                    className="p-1.5 md:p-2 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
                                                                    title={file.url.startsWith('data:') && file.name.match(/\.(doc|docx|ppt|pptx|xls|xlsx)$/i) ? "Salve para visualizar" : "Visualizar / Apresentar"}
                                                                >
                                                                    <span className="material-symbols-outlined font-black">visibility</span>
                                                                </button>
                                                            )}
                                                        <a
                                                            download={file.name}
                                                            className="p-1.5 md:p-2 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all"
                                                            title="Baixar"
                                                        >
                                                            <span className="material-symbols-outlined font-black">download</span>
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Delivery List / Completion Tracking */}
                                {currentActivity.type !== 'Conteúdo' && (
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center justify-between">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`material-symbols-outlined text-${theme.primaryColor}`}>how_to_reg</span>
                                                    Lista de Entrega / Realização
                                                </div>
                                                <div className="flex flex-col gap-1 w-full max-w-xs">
                                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                        <span>Progresso</span>
                                                        <span>{currentActivity.completions?.length || 0} / {students.length}</span>
                                                    </div>
                                                    <progress
                                                        value={currentActivity.completions?.length || 0}
                                                        max={students.length || 1}
                                                        className={`activity-progress text-${theme.primaryColor}`}
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={selectAllCompletions}
                                                className={`px-4 py-2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:border-${theme.primaryColor} hover:text-${theme.primaryColor} transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2`}
                                            >
                                                <span className="material-symbols-outlined text-base">
                                                    {students.every(s => currentActivity.completions?.includes(s.id)) ? 'deselect' : 'select_all'}
                                                </span>
                                                {students.every(s => currentActivity.completions?.includes(s.id)) ? 'Desmarcar Todos' : 'Marcar Todos'}
                                            </button>
                                        </h3>

                                        <div
                                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 min-h-[200px]"
                                        >
                                            {students.map(s => {
                                                const isDone = currentActivity.completions?.includes(s.id);
                                                return (
                                                    <div
                                                        key={s.id}
                                                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group ${isDone
                                                            ? 'theme-bg-surface-subtle theme-border-soft'
                                                            : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
                                                        onClick={() => toggleCompletion(s.id)}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <span className="text-xs font-mono text-slate-400 shrink-0 min-w-[1.5rem]">{s.number}</span>
                                                            <span className={`text-sm font-bold truncate ${isDone ? `text-${theme.primaryColor}` : 'text-slate-600 dark:text-slate-300'}`}>{s.name}</span>
                                                        </div>
                                                        <div
                                                            className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 shrink-0 backdrop-blur-md ${isDone ? 'theme-bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/20' : 'border-slate-400 dark:border-slate-500 bg-white/60 dark:bg-slate-800/60 hover:border-primary/50 hover:bg-white dark:hover:bg-slate-700'}`}
                                                        >
                                                            {isDone && (
                                                                <motion.span
                                                                    initial={{ scale: 0.5, opacity: 0 }}
                                                                    animate={{ scale: 1, opacity: 1 }}
                                                                    className="material-symbols-outlined text-[16px] font-black"
                                                                >
                                                                    check
                                                                </motion.span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                }
            </div >
            {/* Presentation Modal */}
            {
                isPresentationOpen && currentActivity && (
                    <div
                        className="fixed inset-0 z-[100] bg-black"
                    >
                        <button
                            onClick={() => setIsPresentationOpen(false)}
                            className="absolute top-4 right-4 z-[101] size-12 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-colors"
                        >
                            <span className="material-symbols-outlined text-2xl">close</span>
                        </button>
                        {(() => {
                            const pptFile = currentActivity.files.find(f => f.name.match(/\.(ppt|pptx)$/i));
                            if (pptFile) {
                                return (
                                    <iframe
                                        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(pptFile.url)}`}
                                        className="w-full h-full border-0"
                                        title="Apresentação"
                                    />
                                );
                            }
                            return null;
                        })()}
                    </div>
                )
            }

            {/* File Viewer Modal */}
            {
                viewerFile && (
                    <FileViewerModal
                        isOpen={!!viewerFile}
                        onClose={() => setViewerFile(null)}
                        file={viewerFile}
                    />
                )
            }

            <FileImporterModal
                isOpen={isImporterOpen}
                onClose={() => setIsImporterOpen(false)}
                onFileSelect={(files) => {
                    if (files) handleFiles(Array.from(files));
                }}
                multiple
            />
        </div >
    );
};
const ActivityListItem = React.memo(({ act, isSelected, isSelectionMode, selectedActivityId, theme, onSelect, onToggle }: {
    act: Activity,
    isSelected: boolean,
    isSelectionMode: boolean,
    selectedActivityId: string | null,
    theme: any,
    onSelect: (act: Activity) => void,
    onToggle: (id: string) => void
}) => {
    return (
        <motion.button
            layout="position"
            variants={VARIANTS.fadeUp}
            onClick={() => isSelectionMode ? onToggle(act.id) : onSelect(act)}
            className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 group relative overflow-hidden shadow-sm ${isSelectionMode
                ? (isSelected ? 'bg-indigo-50/10 border-indigo-500 dark:bg-indigo-900/40 dark:border-indigo-500 backdrop-blur-md' : 'bg-white/40 dark:bg-slate-900/60 border-white/20 dark:border-white/5 backdrop-blur-xl')
                : (selectedActivityId === act.id ? `bg-white/60 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg ring-1 theme-ring-primary theme-border-primary theme-shadow-primary` : 'bg-white/40 dark:bg-slate-900/60 border-white/20 dark:border-white/5 backdrop-blur-xl hover:border-slate-300 dark:hover:border-slate-600')
                }`}
            role={isSelectionMode ? "button" : undefined}
            aria-label={isSelectionMode ? `Selecionar atividade, ${isSelected ? 'selecionada' : 'não selecionada'}` : undefined}
            tabIndex={isSelectionMode ? 0 : undefined}
        >
            {isSelectionMode && (
                <div
                    onClick={(e) => { e.stopPropagation(); onToggle(act.id); }}
                    className={`absolute left-4 top-1/2 -translate-y-1/2 size-6 rounded-lg border-2 flex items-center justify-center transition-all z-10 backdrop-blur-md ${isSelected ? 'theme-bg-primary border-primary shadow-lg shadow-primary/20 scale-105' : 'border-slate-400 dark:border-slate-500 bg-white/60 dark:bg-slate-800/60 hover:border-primary hover:bg-white dark:hover:bg-slate-700'}`}
                >
                    {isSelected && (
                        <motion.span
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="material-symbols-outlined text-white text-lg font-black"
                        >
                            check
                        </motion.span>
                    )}
                </div>
            )}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 landscape:hidden ${selectedActivityId === act.id ? 'theme-bg-primary' : 'bg-transparent group-hover:bg-slate-200'} transition-all`}></div>
            <div className={`pl-4 w-full ${isSelectionMode ? 'pl-16 landscape:pl-16' : 'landscape:pl-0'}`}>
                <div className="flex justify-between items-center mb-2 landscape:mb-0 landscape:flex-row landscape:items-center">
                    <h4 className={`font-bold text-base md:text-lg truncate pr-2 flex-1 ${selectedActivityId === act.id ? `text-${theme.primaryColor}` : 'text-slate-800 dark:text-slate-200'}`}>{act.title}</h4>
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-lg">chevron_right</span>
                </div>
                <div className="flex flex-wrap gap-2 landscape:hidden">
                    {act.section && (
                        <span className={`px-2.5 py-1 rounded-md text-[0.7rem] font-bold ${selectedActivityId === act.id ? `bg-${theme.primaryColor}/10 text-${theme.primaryColor}` : 'bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300'}`}>
                            Turma {act.section}
                        </span>
                    )}
                    <span className={`px-2.5 py-1 rounded-md text-[0.7rem] font-bold ${selectedActivityId === act.id ? `bg-${theme.primaryColor}/10 text-${theme.primaryColor}` : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {act.type}
                    </span>
                    <span className={`px-2.5 py-1 rounded-md text-[0.7rem] font-bold ${selectedActivityId === act.id ? `bg-${theme.primaryColor}/10 text-${theme.primaryColor}` : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {new Date(act.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                </div>
                {/* Mobile Landscape Only Date */}
                <div className="hidden landscape:block text-xs text-slate-400 mt-1">
                    {new Date(act.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                </div>
            </div>
        </motion.button>
    );
});
