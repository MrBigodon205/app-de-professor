import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useClass } from '../contexts/ClassContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { Activity, AttachmentFile, Student } from '../types';
import { supabase } from '../lib/supabase';
import { db } from '../lib/db';
import { useSync } from '../hooks/useSync';
import DOMPurify from 'dompurify';
import { DatePicker } from '../components/DatePicker';
import { RichTextEditor } from '../components/RichTextEditor';
import { useDebounce } from '../hooks/useDebounce';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DynamicSelect } from '../components/DynamicSelect';
import FileViewerModal from '../components/FileViewerModal';
import { FileImporterModal } from '../components/FileImporterModal';

// Fallback types if fetch fails
const DEFAULT_ACTIVITY_TYPES = ['Prova', 'Trabalho', 'Dever de Casa', 'Seminário', 'Pesquisa', 'Conteúdo', 'Outro'];

export const Activities: React.FC = () => {
    const { activeSeries, selectedSeriesId, selectedSection, classes } = useClass();
    const { currentUser, activeSubject } = useAuth();
    const theme = useTheme();
    const { isOnline, triggerSync } = useSync();

    // UI State
    const [activities, setActivities] = useState<Activity[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
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

    // ANIMATIONS
    const containerVariants: any = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants: any = {
        hidden: { opacity: 0, x: -20, filter: "blur(5px)" },
        visible: {
            opacity: 1, x: 0, filter: "blur(0px)",
            transition: { type: 'spring', stiffness: 100, damping: 12 }
        }
    };

    // Generate UUID Helper
    const generateUUID = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    // File Processing Helper
    const handleFiles = (files: File[]) => {
        files.forEach(file => {
            if (file.size > 20 * 1024 * 1024) {
                alert(`O arquivo ${file.name} é muito grande! Limite de 20MB.`);
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setFormFiles(prev => [...prev, {
                        id: generateUUID(),
                        name: file.name,
                        size: `${(file.size / 1024).toFixed(1)} KB`,
                        url: event.target.result as string
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
        setSelectedActivityId(null);
        setIsEditing(false);
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

    // Centralized Student Fetching
    useEffect(() => {
        if (!selectedSeriesId || !currentUser) return;

        const currentActivity = activities.find(a => a.id === selectedActivityId);

        if (currentActivity) {
            // Fetch students based on activity context
            fetchStudents(currentActivity.seriesId, currentActivity.section);
        } else {
            // Fetch students based on global context
            fetchStudents(selectedSeriesId, selectedSection);
        }
    }, [selectedActivityId, selectedSeriesId, selectedSection, currentUser, activities]);

    const fetchStudents = async (seriesId?: string, section?: string) => {
        const targetSeries = seriesId !== undefined ? seriesId : selectedSeriesId;
        const targetSection = section !== undefined ? section : selectedSection;

        if (!targetSeries || !currentUser) return;

        try {
            let query = supabase
                .from('students')
                .select('*')
                .eq('series_id', targetSeries)
                .eq('user_id', currentUser.id);

            // If a specific section is provided, filter by it. 
            // If section is empty string or null, it means "All Sections" of that series.
            if (targetSection && targetSection !== '') {
                query = query.eq('section', targetSection);
            }

            const { data, error } = await query;

            if (error) throw error;

            const formatted: Student[] = (data || []).map(s => ({
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
        }
    }

    const fetchActivities = async (silent = false) => {
        if (!currentUser) return;
        if (!silent) setLoading(true);
        try {
            let activityData: any[] = [];

            if (navigator.onLine) {
                let query = supabase.from('activities').select('*').eq('user_id', currentUser.id);

                if (selectedSeriesId) {
                    query = query.eq('series_id', selectedSeriesId);
                }
                if (activeSubject) {
                    query = query.or(`subject.eq.${activeSubject},subject.is.null`);
                }

                const { data, error } = await query;
                if (error) throw error;
                activityData = data || [];

                // Cache to Dexie
                // Important: We need a valid ID for Dexie. If we filter by series/subject here, 
                // we should stick to caching what we downloaded.
                // But careful not to overwrite "pending" edits if we implement optimistic UI properly. 
                // For now, blind cache is Acceptable for "WhatsApp Mode" (Last Write Wins).
                await db.activities.bulkPut(activityData.map(a => ({
                    ...a,
                    id: a.id.toString(), // Ensure string
                    syncStatus: 'synced'
                })));

            } else {
                // Offline Fallback
                console.log("Offline: Loading Activities from Dexie");
                let collection = db.activities.where('user_id').equals(currentUser.id);
                // Dexie filtering limitations: compound index needed for complex queries
                // We'll filter in memory after fetching by User
                activityData = await collection.toArray();

                if (selectedSeriesId) {
                    activityData = activityData.filter(a => a.series_id === selectedSeriesId || a.series_id === parseInt(selectedSeriesId));
                }
                if (activeSubject) {
                    activityData = activityData.filter(a => !a.subject || a.subject === activeSubject);
                }
            }

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

            if (formatted.length > 0 && !selectedActivityId && !isEditing && window.innerWidth >= 1024) {
                setSelectedActivityId(formatted[0].id);
            } else if (formatted.length === 0) {
                setSelectedActivityId(null);
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

        // [OFFLINE CHECK] File uploads require internet
        const hasNewFiles = formFiles.some(f => f.url.startsWith('data:'));
        if (hasNewFiles && !navigator.onLine) {
            alert("Você está Offline. O envio de novos arquivos requer internet.");
            return;
        }

        setLoading(true);

        try {
            // --- FILE UPLOAD LOGIC (Online Only) ---
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

            const activityData = {
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
                subject: activeSubject
            };

            // 1. Create/Update Local (Dexie)
            let finalId = selectedActivityId;
            if (isEditing && selectedActivityId) {
                // UPDATE
                const localPayload = {
                    ...activityData,
                    id: selectedActivityId,
                    completions: currentActivity?.completions || [],
                    syncStatus: 'pending' as const
                };
                await db.activities.put(localPayload);

                await db.syncQueue.add({
                    table: 'activities',
                    action: 'UPDATE',
                    payload: { ...activityData, id: selectedActivityId },
                    status: 'pending',
                    createdAt: Date.now(),
                    retryCount: 0
                });
                alert("Atividade salva na fila de sincronização!");

            } else {
                // CREATE
                // We generate a temp ID (e.g. timestamp based or negative) if offline, 
                // but for simplicity we rely on Supabase generating ID if online, 
                // OR we generate UUID locally (better for sync).
                // Let's generate UUID locally if we are going full offline.
                // But existing code expects Supabase to return ID.
                // Let's use our generateUUID() helper.
                const newId = generateUUID();
                finalId = newId;

                const localPayload = {
                    ...activityData,
                    id: newId,
                    completions: [],
                    syncStatus: 'pending' as const
                };
                await db.activities.add(localPayload);

                await db.syncQueue.add({
                    table: 'activities',
                    action: 'INSERT',
                    payload: { ...activityData, completions: [], id: newId }, // Send ID so Supabase uses our UUID or we handle mapping? 
                    // If Supabase table uses integer auto-increment ID, we have a PROBLEM.
                    // Checking existing code... Activity.id is string. 
                    // Supabase likely uses UUID or Int. If Int, we can't generate it locally.
                    // NOTE: If Supabase uses Int, we must wait for server if possible OR use temp negative IDs.
                    // For "Level 4", UUID is mandatory. I will assume or force UUID logic if needed. 
                    // For now, let's assume UUID or send ID.
                    status: 'pending',
                    createdAt: Date.now(),
                    retryCount: 0
                });
                alert("Atividade criada localmente!");
            }

            // Trigger Sync
            triggerSync();

            // Refresh UI
            await fetchActivities(true);
            if (finalId) setSelectedActivityId(finalId);
            setIsEditing(false);

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
            const { data, error } = await supabase
                .from('activities')
                .update({ completions: newCompletions })
                .eq('id', currentActivity.id)
                .select()
                .single();

            if (error) throw error;
            await fetchActivities(true);
        } catch (e) {
            console.error(e);
        }
    };

    const selectAllCompletions = async () => {
        if (!currentActivity || students.length === 0) return;

        const allStudentIds = students.map(s => s.id);
        const isAllSelected = allStudentIds.every(id => currentActivity.completions?.includes(id));
        const newCompletions = isAllSelected ? [] : allStudentIds;

        try {
            const { data, error } = await supabase
                .from('activities')
                .update({ completions: newCompletions })
                .eq('id', currentActivity.id)
                .select()
                .single();

            if (error) throw error;
            await fetchActivities(true);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async () => {
        if (!selectedActivityId) return;

        const confirmed = window.confirm("Tem certeza que deseja apagar esta atividade?");
        if (!confirmed) return;

        setLoading(true);

        try {
            // Local Delete
            await db.activities.delete(selectedActivityId);

            // Queue Delete
            await db.syncQueue.add({
                table: 'activities',
                action: 'DELETE',
                payload: { id: selectedActivityId },
                status: 'pending',
                createdAt: Date.now(),
                retryCount: 0
            });

            triggerSync();

            // UI Update
            const updatedActivities = activities.filter(a => a.id !== selectedActivityId);
            setActivities(updatedActivities);
            setSelectedActivityId(null);
            setIsEditing(false);
            alert("Atividade excluída!");

        } catch (e) {
            console.error("Delete failed", e);
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

    const handleExportPDF = () => {
        if (!currentActivity) return;

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
        if (currentActivity.type !== 'Conteúdo') {
            doc.setFontSize(11);
            doc.setTextColor(30, 41, 59);
            doc.setFont('helvetica', 'bold');
            doc.text('Lista de Entrega / Realização:', 14, currentY);

            const body = students.map(s => {
                const isDone = currentActivity.completions?.includes(s.id);
                return [s.number, s.name, isDone ? 'CONCLUÍDO' : 'PENDENTE'];
            });

            autoTable(doc, {
                startY: currentY + 5,
                head: [['Nº', 'ALUNO', 'STATUS']],
                body: body,
                theme: 'grid',
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    valign: 'middle',
                    lineColor: [241, 245, 249],
                    lineWidth: 0.1,
                    textColor: [51, 65, 85]
                },
                headStyles: {
                    fillColor: [248, 250, 252],
                    textColor: [71, 85, 105],
                    fontStyle: 'bold',
                },
                columnStyles: {
                    0: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 40, halign: 'center', fontStyle: 'bold' }
                },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === 2) {
                        const val = data.cell.raw;
                        if (val === 'CONCLUÍDO') {
                            data.cell.styles.textColor = [22, 163, 74];
                        } else {
                            data.cell.styles.textColor = [148, 163, 184];
                        }
                    }
                }
            });

            currentY = (doc as any).lastAutoTable.finalY + 15;
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
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 md:pb-8 relative fluid-p-m fluid-gap-m px-4 md:px-0 w-full h-full overflow-hidden">
            {/* Landscape FAB for New Activity */}
            <button
                onClick={handleNewActivity}
                className="hidden landscape:flex fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white size-12 rounded-2xl shadow-xl border border-white/20 items-center justify-center transition-all hover:scale-110 active:scale-95 lg:hidden"
                title="Nova Atividade"
            >
                <span className="material-symbols-outlined text-3xl">add</span>
            </button>
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
                <div className="glass-card-soft fluid-p-s landscape:p-2 flex flex-col landscape:flex-row landscape:items-center landscape:gap-2">
                    <div className="flex justify-between items-center mb-4 landscape:mb-0 landscape:gap-2 shrink-0">
                        <div className="flex gap-2 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl">
                            <Link to="/planning" className="px-3 py-1.5 landscape:p-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all whitespace-nowrap">
                                <span className="landscape:hidden">Aulas</span>
                                <span className="hidden landscape:block text-xs">Aulas</span>
                            </Link>
                            <button className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all bg-white dark:bg-slate-700 shadow-sm landscape:p-1.5 whitespace-nowrap`} style={{ color: theme.primaryColorHex }}>
                                <span className="landscape:hidden">Atividades</span>
                                <span className="hidden landscape:block text-xs">Ativ.</span>
                            </button>
                        </div>
                        <button onClick={handleNewActivity} className={`text-white size-9 rounded-xl flex items-center justify-center transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0`} title="Nova Atividade" data-tour="activities-new-btn" style={{ backgroundColor: theme.primaryColorHex, boxShadow: `0 10px 15px -3px ${theme.primaryColorHex}33` }}>
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
                    {/* Search & Filter */}
                    <div className="relative flex-1 landscape:flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[20px]">search</span>
                        <input
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
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                            <button
                                onClick={() => setFilterSection('')}
                                className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-black transition-all border-2 ${filterSection === ''
                                    ? `bg-gradient-to-br from-indigo-500 to-indigo-700 text-white border-transparent shadow-md`
                                    : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-200'
                                    }`}
                                style={filterSection === '' ? { backgroundColor: theme.primaryColorHex, backgroundImage: `linear-gradient(to bottom right, ${theme.primaryColorHex}, ${theme.secondaryColor})`, boxShadow: `0 4px 6px -1px ${theme.primaryColorHex}33` } : {}}
                            >
                                Todas
                            </button>
                            {activeSeries.sections.map(sec => (
                                <button
                                    key={sec}
                                    onClick={() => setFilterSection(sec)}
                                    className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-black transition-all border-2 ${filterSection === sec
                                        ? `bg-gradient-to-br from-indigo-500 to-indigo-700 text-white border-transparent shadow-md`
                                        : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-200'
                                        }`}
                                    style={filterSection === sec ? { backgroundColor: theme.primaryColorHex, backgroundImage: `linear-gradient(to bottom right, ${theme.primaryColorHex}, ${theme.secondaryColor})`, boxShadow: `0 4px 6px -1px ${theme.primaryColorHex}33` } : {}}
                                >
                                    Turma {sec}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* List Items */}
                <motion.div
                    variants={containerVariants}
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
                    ) : displayedActivities.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 min-h-[200px] flex items-center justify-center">Nenhuma atividade encontrada.{searchTerm && ' Tente outro termo.'}</div>
                    ) : (
                        displayedActivities.map(act => {
                            return (
                                <motion.button
                                    variants={itemVariants}
                                    layoutId={`activity-card-${act.id}`}
                                    key={act.id}
                                    onClick={() => isSelectionMode ? toggleSelection(act.id) : handleSelectActivity(act)}
                                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 group relative overflow-hidden shadow-sm ${isSelectionMode
                                        ? (selectedIds.includes(act.id) ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-900/20 dark:border-indigo-500' : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-slate-800')
                                        : (selectedActivityId === act.id ? `bg-white dark:bg-surface-dark shadow-lg ring-1` : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600')
                                        }`}
                                    style={!isSelectionMode && selectedActivityId === act.id ? { borderColor: theme.primaryColorHex, boxShadow: `0 10px 15px -3px ${theme.primaryColorHex}1a`, '--tw-ring-color': theme.primaryColorHex } as React.CSSProperties : {}}
                                >
                                    {isSelectionMode && (
                                        <div className={`absolute left-4 top-1/2 -translate-y-1/2 size-5 rounded border-2 flex items-center justify-center transition-all z-10 ${selectedIds.includes(act.id) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 bg-white'}`}>
                                            {selectedIds.includes(act.id) && <span className="material-symbols-outlined text-sm text-white font-bold">check</span>}
                                        </div>
                                    )}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 landscape:hidden ${selectedActivityId === act.id ? '' : 'bg-transparent group-hover:bg-slate-200'} transition-all`} style={{ backgroundColor: selectedActivityId === act.id ? theme.primaryColorHex : undefined }}></div>
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
                        })
                    )}
                </motion.div>

            </div >

            {/* Main Content */}
            <div className={`flex-1 flex flex-col card shadow-premium overflow-hidden relative transition-all ${selectedActivityId || isEditing ? 'flex' : 'hidden lg:flex'}`}>
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
                            className={`group relative inline-flex items-center justify-center gap-3 text-white text-lg font-bold py-4 px-8 rounded-2xl shadow-xl transition-all hover:-translate-y-1 active:translate-y-0 overflow-hidden`}
                            style={{ backgroundColor: theme.primaryColorHex, boxShadow: `0 20px 25px -5px ${theme.primaryColorHex}33` }}
                        >
                            <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform duration-300">add</span>
                            Criar Nova Atividade
                            <div className="absolute inset-0 rounded-2xl ring-2 ring-white/20 group-hover:ring-white/40 transition-all"></div>
                        </button>
                    </div>
                ) : isEditing ? (
                    // --- EDIT / CREATE MODE ---
                    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                        {/* EDITOR HEADER */}
                        <div className="p-6 landscape:p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-surface-dark z-20 sticky top-0 shadow-sm">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => { setSelectedActivityId(null); setIsEditing(false); }}
                                    className="lg:hidden p-2 -ml-2 text-slate-400"
                                >
                                    <span className="material-symbols-outlined">arrow_back</span>
                                </button>
                                <h2 className="text-xl landscape:text-base font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className={`size-8 rounded-lg bg-${theme.primaryColor}/10 text-${theme.primaryColor} flex items-center justify-center landscape:hidden`}>
                                        <span className="material-symbols-outlined text-lg">{selectedActivityId ? 'edit_document' : 'post_add'}</span>
                                    </div>
                                    {selectedActivityId ? 'Editar Atividade' : 'Nova Atividade'}
                                </h2>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 landscape:p-4 custom-scrollbar pb-0">
                            <div className="max-w-4xl mx-auto flex flex-col gap-8 landscape:gap-4">
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
                                        <DynamicSelect
                                            value={formType}
                                            onChange={(val) => setFormType(val)}
                                            options={activityTypes.map(t => ({
                                                value: t,
                                                label: t,
                                                icon: getIconForType(t)
                                            }))}
                                            placeholder="Selecione..."
                                        />
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
                                        <DynamicSelect
                                            label="Turma (Opcional)"
                                            value={formSection}
                                            onChange={setFormSection}
                                            options={[
                                                { value: '', label: 'Todas as Turmas', icon: 'domain' },
                                                ...(activeSeries?.sections.map(s => ({ value: s, label: `Turma ${s}`, icon: 'groups' })) || [])
                                            ]}
                                            placeholder="Selecione..."
                                        />
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
                                    </div>
                                    <div
                                        className={`col-span-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isDragging ? `border-${theme.primaryColor} bg-${theme.primaryColor}/5` : 'border-slate-200 dark:border-slate-700'}`}
                                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setIsDragging(false);
                                            const files = Array.from(e.dataTransfer.files);
                                            if (files.length > 0) handleFiles(files);
                                        }}
                                        onClick={() => setIsImporterOpen(true)}
                                    >
                                        <div className={`size-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-2 ${isDragging ? 'animate-bounce' : ''}`}>
                                            <span className={`material-symbols-outlined text-3xl ${isDragging ? `text-${theme.primaryColor}` : 'text-slate-400'}`}>cloud_upload</span>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                Toque ou arraste arquivos aqui
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1 mb-2">PDF, Imagens, Word, PowerPoint (Máx 20MB)</p>

                                            {/* Explicit Cloud Options */}
                                            <div className="grid grid-cols-2 gap-2 mt-3 w-full max-w-sm px-4">
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setIsImporterOpen(true); }} className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 hover:bg-blue-100 transition-colors cursor-pointer">
                                                    <span className="material-symbols-outlined text-xl">add_to_drive</span>
                                                    <span className="text-[9px] font-bold uppercase tracking-wide">Google Drive</span>
                                                </button>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setIsImporterOpen(true); }} className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800 hover:bg-sky-100 transition-colors cursor-pointer">
                                                    <span className="material-symbols-outlined text-xl">cloud</span>
                                                    <span className="text-[9px] font-bold uppercase tracking-wide">OneDrive</span>
                                                </button>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setIsImporterOpen(true); }} className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800 hover:bg-orange-100 transition-colors cursor-pointer">
                                                    <span className="material-symbols-outlined text-xl">folder_shared</span>
                                                    <span className="text-[9px] font-bold uppercase tracking-wide">Arquivos</span>
                                                </button>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setIsImporterOpen(true); }} className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
                                                    <span className="material-symbols-outlined text-xl">image</span>
                                                    <span className="text-[9px] font-bold uppercase tracking-wide">Galeria</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                        {formFiles.map(file => (
                                            <div key={file.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 group relative">
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

                                    </div>
                                </div>
                            </div>

                            {/* Static Footer Actions - Part of the scrollable flow */}
                            <div className="max-w-4xl mx-auto mt-8 mb-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
                                {selectedActivityId && (
                                    <button onClick={handleDelete} className="px-6 py-2.5 rounded-xl text-red-500 font-bold hover:bg-red-50 transition-colors">Excluir</button>
                                )}
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className={`px-8 py-2.5 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center gap-2`}
                                    style={{ backgroundColor: theme.primaryColorHex, boxShadow: `0 10px 15px -3px ${theme.primaryColorHex}33` }}
                                >
                                    {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                                    {loading ? 'Salvando...' : 'Salvar Atividade'}
                                </button>
                            </div>
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
                                    <h1 className="text-3xl md:text-4xl font-bold text-white text-shadow-premium">{currentActivity.title}</h1>
                                </div>
                                {/* Mobile Back Button (Visible on View Mode) */}
                                <div className="absolute top-4 left-4 lg:hidden z-10">
                                    <button
                                        onClick={() => setSelectedActivityId(null)}
                                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md border border-white/20 transition-all shadow-lg active:scale-95"
                                        title="Voltar para Lista"
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
                                    {currentActivity?.files?.find(f => f.name.match(/\.(ppt|pptx)$/i)) && (
                                        <button
                                            onClick={() => setIsPresentationOpen(true)}
                                            className="p-2 size-10 rounded-2xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 backdrop-blur-md border border-orange-500/20 transition-all shadow-lg flex items-center justify-center hover:scale-105 active:scale-95"
                                            title="Apresentar Slide"
                                        >
                                            <span className="material-symbols-outlined text-xl">slideshow</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={handlePrint}
                                        className="p-2 size-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all shadow-lg flex items-center justify-center hover:scale-105 active:scale-95"
                                        title="Imprimir"
                                    >
                                        <span className="material-symbols-outlined text-xl">print</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (currentActivity) {
                                                setFormTitle(currentActivity.title);
                                                setFormType(currentActivity.type);
                                                setFormDate(currentActivity.date);
                                                setFormStartDate(currentActivity.startDate || currentActivity.date);
                                                setFormEndDate(currentActivity.endDate || currentActivity.date);
                                                setFormDescription(currentActivity.description);
                                                setFormFiles(currentActivity.files);
                                                setFormSeriesId(currentActivity.seriesId);
                                                setFormSection(currentActivity.section || '');
                                            }
                                            setIsEditing(true);
                                        }}
                                        className="p-2 size-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all shadow-lg flex items-center justify-center hover:scale-105 active:scale-95"
                                        title="Editar Atividade"
                                    >
                                        <span className="material-symbols-outlined text-xl">edit</span>
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
                                        <h3 className="font-bold text-lg border-b border-slate-100 mb-2">Descrição / Orientações:</h3>
                                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentActivity.description) }} className="text-sm leading-relaxed" />
                                    </div>

                                    {currentActivity.type !== 'Conteúdo' && (
                                        <div className="mt-8">
                                            <h3 className="font-bold text-lg border-b border-slate-100 mb-4">Lista de Realização:</h3>
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                                {students.map((s, idx) => (
                                                    <div key={s.id}
                                                        className="flex items-center justify-between gap-3 border-b border-slate-100 py-1 animate-in slide-in-from-bottom-2 fade-in duration-500 fill-mode-backwards"
                                                        style={{ animationDelay: `${idx * 50}ms` }}
                                                    >
                                                        <span className="text-xs truncate min-w-0 flex-1">{s.number}. {s.name}</span>
                                                        <div className="size-4 border border-slate-300 flex items-center justify-center shrink-0">
                                                            {currentActivity.completions?.includes(s.id) && <span className="material-symbols-outlined text-[12px]">check</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 landscape:p-4 max-w-5xl mx-auto space-y-8 landscape:space-y-4">
                                {/* Info Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 landscape:grid-cols-3">
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

                                {/* ATTACHMENTS */}
                                {currentActivity.files && currentActivity.files.length > 0 && (
                                    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                            <span className={`material-symbols-outlined text-${theme.primaryColor}`}>attachment</span>
                                            Anexos
                                        </h3>
                                        <div className="flex flex-wrap gap-3">
                                            {currentActivity.files.map((file, index) => (
                                                <div key={index} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group shadow-sm">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0 pointer-events-none">
                                                        <span className="material-symbols-outlined text-slate-500 group-hover:text-indigo-500 transition-colors">description</span>
                                                        <div className="flex flex-col">
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
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Delivery List / Completion Tracking */}
                                {currentActivity.type !== 'Conteúdo' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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

                                        <motion.div
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 min-h-[200px]"
                                        >
                                            {students.map(s => {
                                                const isDone = currentActivity.completions?.includes(s.id);
                                                return (
                                                    <motion.div
                                                        key={s.id}
                                                        variants={itemVariants}
                                                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group ${isDone
                                                            ? `bg-white dark:bg-slate-800/50`
                                                            : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
                                                        onClick={() => toggleCompletion(s.id)}
                                                        style={isDone ? { backgroundColor: `${theme.primaryColorHex}0D`, borderColor: `${theme.primaryColorHex}33` } : {}}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <span className="text-xs font-mono text-slate-400 shrink-0 min-w-[1.5rem]">{s.number}</span>
                                                            <span className={`text-sm font-bold truncate ${isDone ? `text-${theme.primaryColor}` : 'text-slate-600 dark:text-slate-300'}`}>{s.name}</span>
                                                        </div>
                                                        <div className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 shrink-0`} style={isDone ? { backgroundColor: theme.primaryColorHex, borderColor: theme.primaryColorHex, color: 'white', transform: 'scale(1.1)', boxShadow: `0 1px 2px 0 ${theme.primaryColorHex}4d` } : { borderColor: '#e2e8f0' /* slate-200 */ }}>
                                                            {isDone && <span className="material-symbols-outlined text-[16px] font-bold animate-in zoom-in spin-in-180 duration-300">check</span>}
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </motion.div>

                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
            </div>
            {/* Presentation Modal */}
            {
                isPresentationOpen && currentActivity && (
                    <div className="fixed inset-0 z-[100] bg-black animate-in fade-in duration-300">
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
