import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useClass } from '../contexts/ClassContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { Student } from '../types';
import { supabase } from '../lib/supabase';
import { TransferStudentModal } from '../components/TransferStudentModal';
import { BulkTransferModal } from '../components/BulkTransferModal';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import type Tesseract from 'tesseract.js';

interface StudentsListProps {
    mode?: 'manage' | 'report';
}

import { useStudentsData } from '../hooks/useStudentsData';

export const StudentsList: React.FC<StudentsListProps> = ({ mode = 'manage' }) => {
    const navigate = useNavigate();
    const { selectedSeriesId, selectedSection, activeSeries } = useClass();
    const { currentUser } = useAuth();
    const theme = useTheme();

    // Use the hybrid hook - works for both Online and Offline modes based on config
    const {
        students,
        loading,
        addStudent,
        updateStudent,
        deleteStudent,
        refresh: refreshStudents
    } = useStudentsData(selectedSeriesId?.toString(), selectedSection, currentUser?.id);

    // ANIMATIONS
    const containerVariants: any = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants: any = {
        hidden: { opacity: 0, y: 20, filter: "blur(5px)" },
        visible: {
            opacity: 1, y: 0, filter: "blur(0px)",
            transition: { type: 'spring', stiffness: 100, damping: 12 }
        }
    };

    // Local UI state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newStudentName, setNewStudentName] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [importText, setImportText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [transferringStudent, setTransferringStudent] = useState<Student | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [isBulkTransferring, setIsBulkTransferring] = useState(false);

    // OCR State
    const [ocrImage, setOcrImage] = useState<string | null>(null);
    const [crop, setCrop] = useState<Crop>({
        unit: '%',
        x: 5,
        y: 5,
        width: 90,
        height: 90
    });
    const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
    const [isOcrProcessing, setIsOcrProcessing] = useState(false);
    const [showCropper, setShowCropper] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const workerRef = useRef<Tesseract.Worker | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Initialize Worker only when needed (Lazy)
    useEffect(() => {
        return () => {
            // Cleanup on unmount
            workerRef.current?.terminate();
        };
    }, []);

    const handleEdit = (student: Student) => {
        setEditingId(student.id);
        setEditName(student.name);
    };

    const saveEdit = async () => {
        if (!editingId) return;
        try {
            await updateStudent(editingId, { name: editName });
            setEditingId(null);
        } catch (error) {
            console.error('Error updating student:', error);
            alert("Erro ao atualizar.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este aluno?')) return;
        try {
            await deleteStudent(id);
        } catch (error) {
            console.error('Error deleting student:', error);
            alert("Erro ao remover.");
        }
    };

    // Helper to generate unique matricula (5 digits)
    const generateMatricula = () => Math.floor(10000 + Math.random() * 90000).toString();

    // Robust UUID Generator Fallback
    const generateUUID = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            try {
                return crypto.randomUUID();
            } catch (e) {
                console.warn("crypto.randomUUID failed, using fallback");
            }
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

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

            if (error) throw error;

            await refreshStudents();
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

    const handleImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setOcrImage(reader.result as string);
                setShowCropper(true);
                // Reset crop
                setCrop({ unit: '%', x: 5, y: 5, width: 90, height: 90 });
            };
            reader.readAsDataURL(file);
        }
    };

    const performOCR = async () => {
        if (!imgRef.current || !completedCrop) return;

        setIsOcrProcessing(true);
        try {
            // 1. Create canvas to get cropped image
            const canvas = document.createElement('canvas');
            const img = imgRef.current;

            // Use the displayed image's natural dimensions vs displayed dimensions
            const scaleX = img.naturalWidth / img.width;
            const scaleY = img.naturalHeight / img.height;

            const pixelRatio = window.devicePixelRatio || 1;

            canvas.width = completedCrop.width * scaleX;
            canvas.height = completedCrop.height * scaleY;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Optimize image for OCR (Grayscale + High Contrast approach could go here)
                ctx.drawImage(
                    img,
                    completedCrop.x * scaleX,
                    completedCrop.y * scaleY,
                    completedCrop.width * scaleX,
                    completedCrop.height * scaleY,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                // Check worker availability
                if (!workerRef.current) {
                    // Lazy load Tesseract
                    const TesseractModule = (await import('tesseract.js')).default;
                    // Fallback re-init if something happened
                    workerRef.current = await TesseractModule.createWorker('por');
                }

                // 2. OCR using persistent worker
                // Using 'image/png' might be slightly cleaner than jpeg for text
                const { data: { text } } = await workerRef.current.recognize(canvas.toDataURL('image/png'));

                // 3. Clean and populate
                const cleanedNames = text.split('\n')
                    .map(line => {
                        // Remove digits, dots, dashes at START of line (numbering)
                        let cleaned = line.replace(/^[\d\s.-]+/, '').trim();
                        // Remove common OCR noise characters anywhere
                        cleaned = cleaned.replace(/[|\\/_(){}\[\]]/g, '');
                        // Aggressive cleanup for single-letter noise
                        if (cleaned.length <= 2) return '';
                        return cleaned;
                    })
                    .filter(name => name.length >= 3) // Filter short noise strings
                    .join('\n');

                setImportText(prev => prev ? `${prev}\n${cleanedNames}` : cleanedNames);
                setShowCropper(false);
                setOcrImage(null);
            }
        } catch (error) {
            console.error("OCR Error:", error);
            alert("Erro ao ler imagem.");
        } finally {
            setIsOcrProcessing(false);
        }
    };

    const handleAddStudent = async () => {
        if (!newStudentName.trim() || !currentUser) return;
        if (!selectedSeriesId || !selectedSection) {
            alert("Selecione uma turma primeiro!");
            return;
        }

        const initials = newStudentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const newNumber = generateMatricula();

        // Prepare data - hook handles specific field requirements
        const newStudentData = {
            id: generateUUID(), // Always generate ID for consistency with fallback
            name: newStudentName,
            number: newNumber,
            series_id: selectedSeriesId,
            seriesId: selectedSeriesId.toString(), // Provide both for compatibility
            section: selectedSection,
            initials: initials,
            color: `from-${theme.primaryColor} to-${theme.secondaryColor}`,
            units: {},
            user_id: currentUser.id,
            userId: currentUser.id
        };

        try {
            await addStudent(newStudentData);
            setNewStudentName('');
            setIsAdding(false);
        } catch (error) {
            console.error("Error adding student:", error);
            alert("Erro ao adicionar.");
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

                if (item.existing) {
                    return null;
                } else {
                    const initials = item.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                    const newNumber = generateMatricula();

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
            await refreshStudents();
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
            <div className="flex flex-col items-center justify-center p-12 bg-surface-card rounded-3xl border-2 border-dashed border-border-default animate-in fade-in zoom-in duration-500">
                <div className={`size-20 rounded-2xl bg-${theme.primaryColor}/10 flex items-center justify-center mb-6`}>
                    <span className={`material-symbols-outlined text-4xl text-${theme.primaryColor}`}>{theme.icon}</span>
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-2">Nenhuma Turma Selecionada</h3>
                <p className="text-text-muted text-center max-w-sm mb-8">Selecione uma turma no menu superior para gerenciar os alunos.</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto flex flex-col gap-4 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 lg:pb-12">
            {/* HEADER AREA */}

            {/* 1. MOBILE HEADER (Compact, Action-Focused) */}
            <div className="md:hidden flex flex-col gap-3 w-full animate-in slide-in-from-top-2 duration-300">
                {mode === 'manage' && selectedIds.length > 0 ? (
                    /* Mobile Bulk Actions (Replaces Title) */
                    <div className="bg-surface-card p-3 rounded-xl border border-border-default shadow-sm flex items-center gap-2 animate-in fade-in zoom-in">
                        <button
                            onClick={() => setIsBulkTransferring(true)}
                            className="flex-1 flex items-center justify-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-bold h-10 px-2 rounded-lg text-xs"
                        >
                            <span className="material-symbols-outlined text-lg">move_up</span>
                            Transferir ({selectedIds.length})
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold h-10 px-2 rounded-lg text-xs"
                        >
                            <span className="material-symbols-outlined text-lg">delete</span>
                            Remover
                        </button>
                    </div>
                ) : (
                    /* Normal Mobile Header */
                    <>
                        <div className="flex items-center justify-between px-1">
                            <div>
                                <h1 className="text-[1.75rem] font-[900] text-text-primary leading-[0.9] tracking-tighter">
                                    {activeSeries?.name}<span className="opacity-20 mx-1.5">/</span>{selectedSection}
                                </h1>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className={`size-2 rounded-full animate-pulse theme-bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]`}></div>
                                    <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] opacity-80">
                                        {students.length} {students.length === 1 ? 'Matriculado' : 'Matriculados'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Actions Grid - High Performance UI */}
                        <div className="grid grid-cols-2 gap-2 w-full">
                            <button
                                onClick={() => setIsAdding(!isAdding)}
                                className={`relative group flex items-center justify-center gap-1.5 h-12 rounded-xl text-white text-xs font-black transition-all active:scale-[0.97] overflow-hidden theme-gradient-to-br theme-shadow-primary`}
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <span className="material-symbols-outlined text-lg">person_add</span>
                                <span>Novo</span>
                            </button>
                            <button
                                onClick={() => setIsImporting(true)}
                                className="flex items-center justify-center gap-1.5 h-12 rounded-xl bg-surface-card/60 backdrop-blur-md border border-border-default text-text-primary text-xs font-black shadow-sm hover:bg-surface-subtle active:scale-[0.97] transition-all"
                            >
                                <span className="material-symbols-outlined text-lg text-text-muted">upload_file</span>
                                <span>Importar</span>
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* 2. DESKTOP HEADER (Original Card Style - Hidden on Mobile) */}
            <div className={`hidden md:flex bg-surface-card p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-border-default flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden group`}>
                <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-${theme.primaryColor}/5 to-transparent rounded-full -mr-32 -mt-32 blur-3xl group-hover:from-${theme.primaryColor}/10 transition-colors duration-700`}></div>

                <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 w-full lg:w-auto">
                    <div className={`flex size-16 rounded-2xl bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white items-center justify-center shadow-lg shadow-${theme.primaryColor}/20`}>
                        <span className="material-symbols-outlined text-3xl">groups</span>
                    </div>
                    <div className="flex flex-col text-center md:text-left">
                        <h1 className="text-3xl font-black text-text-primary tracking-tight">Gerenciar Turma</h1>
                        <p className="text-base text-text-muted font-medium">Alunos de <span className={`text-${theme.primaryColor} font-bold`}>{activeSeries?.name} • {selectedSection}</span></p>
                    </div>
                </div>

                <div className="flex flex-row items-center gap-2 w-full lg:w-auto relative z-10 transition-all">
                    {mode === 'manage' ? (
                        <>
                            {selectedIds.length > 0 ? (
                                <div className="flex flex-row items-center gap-2 animate-in fade-in zoom-in w-full">
                                    <button
                                        onClick={() => setIsBulkTransferring(true)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-600 font-bold h-10 md:h-12 px-2 rounded-xl transition-all active:scale-95 text-xs md:text-base"
                                    >
                                        <span className="material-symbols-outlined text-lg">move_up</span>
                                        <span className="truncate">Transferir ({selectedIds.length})</span>
                                    </button>
                                    <button
                                        onClick={handleBulkDelete}
                                        className="flex-1 flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-600 font-bold h-10 md:h-12 px-2 rounded-xl transition-all active:scale-95 text-xs md:text-base"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                        <span className="truncate">Remover</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                                    <button
                                        onClick={() => setIsImporting(true)}
                                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 rounded-xl bg-surface-card border border-border-default text-text-primary font-bold shadow-sm hover:bg-surface-subtle transition-all active:scale-95`}
                                    >
                                        <span className="material-symbols-outlined text-xl">upload_file</span>
                                        <span className="md:hidden">Importar</span>
                                        <span className="hidden md:inline">Importar</span>
                                    </button>
                                    <button
                                        onClick={() => setIsAdding(!isAdding)}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 rounded-xl text-white font-bold shadow-lg transition-all active:scale-95 theme-bg-primary theme-shadow-primary"
                                    >
                                        <span className="material-symbols-outlined text-xl">add_circle</span>
                                        <span className="md:hidden">Novo</span>
                                        <span className="hidden md:inline">Novo Aluno</span>
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 px-4 py-3 rounded-xl font-bold border border-indigo-100 dark:border-indigo-800 flex items-center justify-center gap-2 text-xs md:text-base">
                            <span className="material-symbols-outlined">touch_app</span>
                            Selecione um aluno
                        </div>
                    )}
                </div>
            </div>

            {/* Bulk Import Modal */}
            {
                isImporting && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-2xl p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-300 border-2 border-border-default max-h-[90dvh] overflow-y-auto custom-scrollbar flex flex-col">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="size-12 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 theme-text-primary">
                                    <span className="material-symbols-outlined">publish</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Importação em Massa</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">Cole a lista de nomes ou anexe um arquivo de texto.</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex-1 h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-center justify-center gap-3 font-black group shadow-sm"
                                    >
                                        <span className="material-symbols-outlined group-hover:bounce theme-text-primary">attach_file</span>
                                        <span className="hidden sm:inline">Texto (TXT/CSV)</span>
                                        <span className="sm:hidden">Texto</span>
                                    </button>
                                    <button
                                        onClick={() => imageInputRef.current?.click()}
                                        className="flex-1 h-14 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-300 hover:border-indigo-300 transition-all flex items-center justify-center gap-3 font-black group shadow-sm"
                                    >
                                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">photo_camera</span>
                                        <span className="hidden sm:inline">Via Foto/Imagem</span>
                                        <span className="sm:hidden">Imagem</span>
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileImport}
                                        accept="text/plain,text/csv,application/vnd.ms-excel"
                                        title="Importar arquivo de texto ou CSV"
                                        aria-label="Importar arquivo de texto ou CSV"
                                        className="hidden"
                                    />
                                    <input
                                        type="file"
                                        ref={imageInputRef}
                                        onChange={handleImageSelection}
                                        accept="image/*"
                                        title="Importar lista via foto ou imagem"
                                        aria-label="Importar lista via foto ou imagem"
                                        className="hidden"
                                    />
                                </div>

                                <textarea
                                    value={importText}
                                    onChange={(e) => setImportText(e.target.value)}
                                    title="Lista de nomes para importação"
                                    placeholder="Alice Silva&#10;Bernardo Souza&#10;Carlos Henrique..."
                                    className="w-full h-48 md:h-64 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-4 transition-all resize-none font-bold leading-relaxed custom-scrollbar text-sm md:text-base outline-none focus:ring-primary/20"
                                />
                                <div className="flex items-center justify-between mt-3 px-2">
                                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <span className="size-2 rounded-full theme-bg-primary"></span>
                                        {importText.split('\n').filter(n => n.trim().length > 0).length} nomes identificados
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Pressione Enter para cada novo nome</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsImporting(false)}
                                    className="flex-1 h-14 rounded-2xl font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all uppercase tracking-widest text-xs border border-slate-200 dark:border-slate-700"
                                    disabled={isProcessing}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleBulkImport}
                                    className="flex-[2] h-14 rounded-2xl text-white font-black shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest text-xs theme-bg-primary theme-shadow-primary"
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
                    <div className={`bg-${theme.primaryColor}/5 border-2 border-dashed border-${theme.primaryColor}/20 p-4 sm:p-8 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-300`}>
                        <div className="flex items-center gap-3 mb-4 sm:mb-6">
                            <span className={`material-symbols-outlined text-${theme.primaryColor}`}>person_add</span>
                            <h4 className="font-black text-text-primary uppercase tracking-widest text-sm">Adicionar Novo Aluno</h4>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="text"
                                value={newStudentName}
                                onChange={(e) => setNewStudentName(e.target.value)}
                                placeholder="Digite o nome completo do aluno..."
                                title="Nome do Aluno"
                                aria-label="Nome do Aluno"
                                className={`flex-1 h-12 sm:h-14 px-4 sm:px-6 rounded-2xl border-2 border-border-default bg-surface-card focus:ring-4 focus:ring-${theme.primaryColor}/10 focus:border-${theme.primaryColor} transition-all font-bold`}
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAddStudent}
                                    className="h-12 sm:h-14 px-6 sm:px-8 text-white rounded-2xl font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 theme-bg-primary theme-shadow-primary"
                                >
                                    <span className="material-symbols-outlined text-xl">save</span>
                                    Salvar
                                </button>
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="h-12 sm:h-14 px-4 sm:px-6 bg-surface-card text-text-muted rounded-2xl font-black border border-border-default hover:bg-surface-subtle transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* OCR Cropper Overlay */}
            <AnimatePresence>
                {showCropper && (
                    <div className="fixed inset-0 z-[110] flex flex-col bg-slate-950 animate-in fade-in duration-300">
                        <div className="flex-1 relative flex p-4 overflow-auto custom-scrollbar">
                            {ocrImage && (
                                <ReactCrop
                                    crop={crop}
                                    onChange={(c) => setCrop(c)}
                                    onComplete={(c) => setCompletedCrop(c)}
                                    className="flex-shrink-0 shadow-2xl shadow-black/50 m-auto"
                                >
                                    <img
                                        ref={imgRef}
                                        src={ocrImage}
                                        alt="Crop source"
                                        className="max-w-full max-h-[75vh] object-contain"
                                    />
                                </ReactCrop>
                            )}
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 flex flex-col gap-4 border-t border-slate-200 dark:border-slate-800 z-20">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined theme-text-primary">crop_free</span>
                                    Ajuste a área de seleção
                                </h3>
                                <button onClick={() => setShowCropper(false)} className="p-2 text-slate-400">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <button
                                onClick={performOCR}
                                disabled={isOcrProcessing || !completedCrop}
                                className="w-full h-14 rounded-2xl text-white font-black shadow-xl flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 theme-bg-primary theme-shadow-primary"
                            >
                                {isOcrProcessing ? (
                                    <>
                                        <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">auto_fix_high</span>
                                        Extrair Nomes da Seleção
                                    </>
                                )}
                            </button>
                            <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Arraste os cantos ou a área para selecionar a coluna de nomes
                            </p>
                        </div>
                    </div>
                )}
            </AnimatePresence>

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
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar aluno por nome ou número..."
                                title="Buscar Aluno"
                                className="w-full h-12 pl-12 pr-4 bg-surface-card border border-border-default rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
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

                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        >
                            {students
                                .filter(s =>
                                    searchQuery === '' ||
                                    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    s.number.toString().includes(searchQuery)
                                )
                                .length === 0 ? (
                                <div className="col-span-full py-20 text-center bg-surface-card rounded-[32px] border border-border-default">
                                    <div className="size-20 rounded-full bg-surface-subtle flex items-center justify-center mb-4 mx-auto">
                                        <span className="material-symbols-outlined text-text-disabled text-4xl">group_off</span>
                                    </div>
                                    <h4 className="font-bold text-text-muted">Nenhum aluno encontrado</h4>
                                    <p className="text-sm text-text-disabled">Verifique os filtros de turma.</p>
                                </div>
                            ) : (
                                students
                                    .filter(s =>
                                        searchQuery === '' ||
                                        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        s.number.toString().includes(searchQuery)
                                    )
                                    .map((student, index) => (
                                        <motion.div
                                            key={student.id}
                                            variants={itemVariants}
                                            layoutId={`student-card-${student.id}`}
                                            onClick={() => navigate(`/reports/${student.id}`)}
                                            className="group bg-surface-card rounded-[24px] p-6 border border-border-default shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/20 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
                                        >
                                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${student.color || `from-${theme.primaryColor} to-${theme.secondaryColor}`} opacity-10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500`}></div>

                                            <div className="flex items-start justify-between mb-4 relative z-10">
                                                <div className={`size-14 rounded-2xl bg-gradient-to-br ${student.color || `from-${theme.primaryColor} to-${theme.secondaryColor}`} flex items-center justify-center text-white text-lg font-black shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300`}>
                                                    {student.initials}
                                                </div>
                                                <span className="px-3 py-1 rounded-lg bg-surface-subtle border border-border-subtle text-[10px] font-black text-text-muted uppercase tracking-widest">
                                                    #{student.number}
                                                </span>
                                            </div>

                                            <div className="relative z-10">
                                                <h3 className="text-lg font-black text-text-primary mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                                                    {student.name}
                                                </h3>
                                                <p className="text-xs font-medium text-text-muted mb-6">
                                                    {activeSeries?.name} • {selectedSection}
                                                </p>

                                                <button className="w-full h-10 rounded-xl bg-surface-subtle text-text-muted font-bold text-xs uppercase tracking-widest group-hover:bg-indigo-600 group-hover:text-white transition-all flex items-center justify-center gap-2">
                                                    <span>Relatório</span>
                                                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                            )}
                        </motion.div>
                    </div>
                ) : (
                    /* MANAGE MODE: RESPONSIVE LAYOUT (Card List on Mobile, Table on Desktop) */
                    <div className="flex flex-col">

                        {/* A. MOBILE CARD VIEW (< md) */}
                        <div className="md:hidden flex flex-col gap-1.5">
                            {students.length === 0 ? (
                                <div className="py-12 text-center bg-surface-card rounded-[24px] border border-border-default">
                                    <div className="size-16 rounded-full bg-surface-subtle flex items-center justify-center mb-4 mx-auto">
                                        <span className="material-symbols-outlined text-text-disabled text-3xl">group_off</span>
                                    </div>
                                    <h4 className="font-bold text-text-muted">Lista vazia</h4>
                                    <p className="text-xs text-text-disabled mt-1">Adicione alunos no botão acima.</p>
                                </div>
                            ) : (
                                students.map((student) => (
                                    <motion.div
                                        layoutId={`student-card-mobile-${student.id}`}
                                        key={student.id}
                                        className={`bg-surface-card p-3 rounded-[24px] border border-border-default shadow-md shadow-slate-200/40 dark:shadow-none relative overflow-hidden transition-all duration-300 ${selectedIds.includes(student.id) ? 'ring-2 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}
                                    >
                                        <div className="flex items-center gap-3 relative z-10 w-full">
                                            {/* Checkbox - Premium Custom Look */}
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="size-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 checked:bg-primary checked:border-primary transition-all cursor-pointer accent-indigo-600 shadow-sm"
                                                    checked={selectedIds.includes(student.id)}
                                                    onChange={() => toggleSelect(student.id)}
                                                    aria-label={`Selecionar ${student.name}`}
                                                />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-3">
                                                    {/* Name & ID Stacked to save horizontal space */}
                                                    <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                                                        <h3 className="font-[900] text-text-primary text-[0.95rem] leading-none truncate capitalize tracking-tight mb-1">
                                                            {student.name.toLowerCase()}
                                                        </h3>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[9px] font-black text-text-disabled uppercase tracking-widest opacity-40">
                                                                MATRÍCULA
                                                            </span>
                                                            <span className="text-[10px] font-mono font-bold text-text-muted/70 bg-surface-subtle/50 px-1.5 py-0.5 rounded-md border border-border-default/30">
                                                                {student.number}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Guaranteed Action Bar - Grouped Glass Style */}
                                                    <div className="flex items-center p-0.5 bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-white/50 dark:border-white/10 shadow-sm gap-0.5">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEdit(student); }}
                                                            className="size-9 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 active:scale-90 transition-all flex items-center justify-center"
                                                        >
                                                            <span className="material-symbols-outlined text-[19px]">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setTransferringStudent(student); }}
                                                            className="size-9 rounded-xl text-amber-600/80 hover:bg-white dark:hover:bg-slate-800 active:scale-90 transition-all flex items-center justify-center"
                                                        >
                                                            <span className="material-symbols-outlined text-[19px]">move_up</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(student.id); }}
                                                            className="size-9 rounded-xl text-red-600/80 hover:bg-white dark:hover:bg-slate-800 active:scale-90 transition-all flex items-center justify-center"
                                                        >
                                                            <span className="material-symbols-outlined text-[19px]">delete</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Editing State Inline */}
                                                {editingId === student.id && (
                                                    <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={editName}
                                                                onChange={(e) => setEditName(e.target.value)}
                                                                className="flex-1 h-9 px-2 rounded-lg border-2 border-primary bg-white dark:bg-black font-bold text-sm focus:outline-none"
                                                                autoFocus
                                                                title="Editar Nome do Aluno"
                                                            />
                                                            <button
                                                                onClick={saveEdit}
                                                                className="size-9 rounded-lg bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-all font-black"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">check</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* B. DESKTOP TABLE VIEW (Hidden < md) */}
                        <div className={`hidden md:block bg-surface-card border border-border-default rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden`}>
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-surface-subtle/50 border-b border-border-default">
                                            <th className="px-4 py-3 w-12">
                                                <div className="flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        className="size-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 checked:bg-primary checked:border-primary transition-all cursor-pointer accent-indigo-600"
                                                        checked={students.length > 0 && selectedIds.length === students.length}
                                                        onChange={toggleSelectAll}
                                                        title="Selecionar todos os alunos"
                                                    />
                                                </div>
                                            </th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted tracking-widest w-24">Nº</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted tracking-widest">Nome do Aluno</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted tracking-widest text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <motion.tbody
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        className="divide-y divide-border-subtle"
                                    >
                                        {students.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <div className="size-20 rounded-full bg-surface-subtle flex items-center justify-center mb-4">
                                                            <span className="material-symbols-outlined text-text-disabled text-4xl">group_off</span>
                                                        </div>
                                                        <h4 className="font-bold text-text-muted">A lista está vazia</h4>
                                                        <p className="text-sm text-text-disabled">Comece adicionando seu primeiro aluno acima.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            students.map((student) => (
                                                <motion.tr
                                                    layoutId={`student-row-${student.id}`}
                                                    variants={itemVariants}
                                                    key={student.id}
                                                    className={`group transition-all border-b border-border-subtle ${selectedIds.includes(student.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-surface-card hover:bg-surface-subtle'}`}
                                                >
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center justify-center">
                                                            <input
                                                                type="checkbox"
                                                                className="size-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 checked:bg-primary checked:border-primary transition-all cursor-pointer accent-indigo-600"
                                                                checked={selectedIds.includes(student.id)}
                                                                onChange={() => toggleSelect(student.id)}
                                                                title={`Selecionar ${student.name}`}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-4">
                                                        <span className="font-mono text-sm font-bold text-text-muted bg-surface-subtle px-2 py-1 rounded-lg">
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
                                                                    className="h-10 px-4 rounded-xl border-2 border-indigo-500 bg-white dark:bg-black font-bold text-sm focus:outline-none shadow-lg shadow-indigo-500/20 w-full max-w-sm"
                                                                    placeholder="Nome do aluno"
                                                                    title="Editar nome do aluno"
                                                                    autoFocus
                                                                />
                                                                <button onClick={saveEdit} className="size-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 hover:scale-110 active:scale-95 transition-all">
                                                                    <span className="material-symbols-outlined font-bold">check</span>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="font-bold text-text-primary text-base Group-hover:text-indigo-600 transition-colors">
                                                                {student.name}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleEdit(student)}
                                                                className="size-9 rounded-lg hover:bg-surface-subtle text-text-muted hover:text-indigo-500 transition-colors flex items-center justify-center"
                                                                title="Editar Nome"
                                                            >
                                                                <span className="material-symbols-outlined text-lg">edit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => setTransferringStudent(student)}
                                                                className="size-9 rounded-lg hover:bg-amber-50 text-text-muted hover:text-amber-500 transition-colors flex items-center justify-center"
                                                                title="Transferir Aluno"
                                                            >
                                                                <span className="material-symbols-outlined text-lg">move_up</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(student.id)}
                                                                className="size-9 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors flex items-center justify-center"
                                                                title="Remover Aluno"
                                                            >
                                                                <span className="material-symbols-outlined text-lg">delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        )}
                                    </motion.tbody>
                                </table>
                            </div>
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
                        refreshStudents();
                        setTransferringStudent(null);
                    }}
                />
            )}

            <BulkTransferModal
                isOpen={isBulkTransferring}
                onClose={() => setIsBulkTransferring(false)}
                studentIds={selectedIds}
                onSuccess={() => {
                    refreshStudents();
                    setSelectedIds([]);
                    setIsBulkTransferring(false);
                }}
            />

            <div className={`flex items-center justify-center gap-4 py-4`}>
                <div className="h-px flex-1 bg-border-subtle"></div>
                <div className="px-6 py-2 bg-surface-subtle rounded-full border border-border-default">
                    <span className="text-xs font-black text-text-muted uppercase tracking-widest">
                        Total de <span className={`text-${theme.primaryColor}`}>{students.length}</span> alunos matriculados
                    </span>
                </div>
                <div className="h-px flex-1 bg-border-subtle"></div>
            </div>
        </div >
    );
};

