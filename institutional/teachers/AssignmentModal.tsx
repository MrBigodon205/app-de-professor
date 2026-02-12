import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { SUBJECTS } from '../../types';
import {
    X,
    Plus,
    Trash2,
    BookOpen,
    Layout as LayoutIcon,
    Save,
    Loader2,
    AlertCircle
} from 'lucide-react';

interface ClassAssignment {
    id: string;
    subject_name: string;
    class_id: string;
    class?: {
        name: string;
        grade: string;
    };
}

interface InstitutionalClass {
    id: string;
    name: string;
    grade: string;
}

interface AssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    teacher: {
        id: string; // member id
        user_id: string;
        profile: {
            name: string;
        };
    } | null;
    institutionId: string;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({ isOpen, onClose, teacher, institutionId }) => {
    const [assignments, setAssignments] = useState<ClassAssignment[]>([]);
    const [classes, setClasses] = useState<InstitutionalClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    useEffect(() => {
        if (isOpen && teacher && institutionId) {
            fetchData();
        }
    }, [isOpen, teacher, institutionId]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch available classes
            const { data: classesData, error: classesError } = await supabase
                .from('institutional_classes')
                .select('id, name, grade')
                .eq('institution_id', institutionId)
                .order('name');

            if (classesError) throw classesError;
            setClasses(classesData || []);

            // 2. Fetch current assignments for this teacher
            const { data: assignmentsData, error: assignmentsError } = await supabase
                .from('class_subjects')
                .select(`
                    id,
                    subject_name,
                    class_id,
                    class:institutional_classes (name, grade)
                `)
                .eq('teacher_id', teacher?.user_id);

            if (assignmentsError) throw assignmentsError;

            const formatted = (assignmentsData || []).map((item: any) => {
                const classData = Array.isArray(item.class) ? item.class[0] : item.class;
                return {
                    id: item.id,
                    subject_name: item.subject_name,
                    class_id: item.class_id,
                    class: classData
                };
            });

            setAssignments(formatted);
        } catch (err: any) {
            console.error('[AssignmentModal] Error:', err);
            setError('Erro ao carregar dados.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAssignment = async () => {
        if (!selectedClassId || !selectedSubject || !teacher) return;

        // Check for duplicates
        if (assignments.some(a => a.class_id === selectedClassId && a.subject_name === selectedSubject)) {
            setError('Este professor já possui esta disciplina nesta turma.');
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const { data, error: insertError } = await supabase
                .from('class_subjects')
                .insert({
                    class_id: selectedClassId,
                    subject_name: selectedSubject,
                    teacher_id: teacher.user_id
                })
                .select(`
                    id,
                    subject_name,
                    class_id,
                    class:institutional_classes (name, grade)
                `)
                .single();

            if (insertError) throw insertError;

            const classData = Array.isArray(data.class) ? data.class[0] : data.class;

            setAssignments(prev => [...prev, {
                id: data.id,
                subject_name: data.subject_name,
                class_id: data.class_id,
                class: classData
            }]);

            setSelectedSubject('');
            // Keep class selected for convenience if adding multiple subjects
        } catch (err: any) {
            console.error('[AssignmentModal] Save error:', err);
            setError('Erro ao salvar atribuição. Verifique se a disciplina já existe nesta turma.');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveAssignment = async (id: string) => {
        setError(null);
        try {
            // We just set teacher_id to null instead of deleting the subject record, 
            // because the subject might still be needed in the class, just with a different teacher.
            const { error: updateError } = await supabase
                .from('class_subjects')
                .update({ teacher_id: null })
                .eq('id', id);

            if (updateError) throw updateError;

            setAssignments(prev => prev.filter(a => a.id !== id));
        } catch (err: any) {
            console.error('[AssignmentModal] Remove error:', err);
            setError('Erro ao remover atribuição.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50 dark:bg-slate-800/50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Gerenciar Atribuições
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Professor: <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{teacher?.profile.name}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        title="Fechar modal"
                        className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2"
                            >
                                <AlertCircle size={16} />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Assignment Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-indigo-50/50 dark:bg-indigo-500/5 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Turma</label>
                            <select
                                value={selectedClassId}
                                title="Selecionar Turma"
                                onChange={(e) => setSelectedClassId(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="">Selecionar Turma...</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Disciplina</label>
                            <div className="flex gap-2">
                                <select
                                    value={selectedSubject}
                                    title="Selecionar Disciplina"
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="">Disciplina...</option>
                                    {SUBJECTS.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleAddAssignment}
                                    disabled={!selectedClassId || !selectedSubject || saving || loading}
                                    className="px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center min-w-[100px]"
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                    <span className="ml-2">Add</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Active Assignments */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                            <BookOpen size={16} className="text-indigo-500" />
                            Atribuições Atuais
                        </h4>

                        {loading ? (
                            <div className="py-10 text-center">
                                <Loader2 className="animate-spin mx-auto text-indigo-500 mb-2" size={32} />
                                <p className="text-sm text-gray-500">Carregando atribuições...</p>
                            </div>
                        ) : assignments.length === 0 ? (
                            <div className="py-10 text-center bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                                <LayoutIcon className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={40} />
                                <p className="text-sm text-gray-500">Nenhuma turma atribuída a este professor.</p>
                            </div>
                        ) : (
                            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                <div className="grid grid-cols-1 gap-2">
                                    {assignments.map((assignment) => (
                                        <motion.div
                                            key={assignment.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/5 rounded-2xl group hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all shadow-sm"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                    <BookOpen size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                                                        {assignment.subject_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                        <LayoutIcon size={12} />
                                                        {assignment.class?.name} ({assignment.class?.grade})
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveAssignment(assignment.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                                title="Remover Atribuição"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 flex justify-end bg-gray-50 dark:bg-slate-800/50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
