import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useSchool } from '../contexts/SchoolContext';
import { supabase } from '../../lib/supabase';
import { SUBJECTS } from '../../types';
import {
    ArrowLeft,
    Plus,
    Trash2,
    BookOpen,
    User,
    Save,
    Check
} from 'lucide-react';

interface ClassSubject {
    id: string;
    class_id: string;
    subject_name: string;
    teacher_id: string | null;
    teacher?: {
        id: string;
        name: string;
        email: string;
    };
}

interface Teacher {
    id: string;
    user_id: string;
    role: string;
    status: string;
    profile: {
        name: string;
        email: string;
        photo_url?: string;
    };
}

interface ClassDetails {
    id: string;
    name: string;
    grade: string;
    shift: string;
}

export const ClassSubjectsManager: React.FC = () => {
    const { id: institutionId, classId } = useParams<{ id: string; classId: string }>();
    const { currentSchool, isCoordinator } = useSchool();
    const navigate = useNavigate();

    const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
    const [subjects, setSubjects] = useState<ClassSubject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAddSubject, setShowAddSubject] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState('');

    useEffect(() => {
        if (classId && institutionId) {
            fetchData();
        }
    }, [classId, institutionId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch class details
            const { data: classData } = await supabase
                .from('institutional_classes')
                .select('*')
                .eq('id', classId)
                .single();

            if (classData) setClassDetails(classData);

            // Fetch subjects for this class
            const { data: subjectsData } = await supabase
                .from('class_subjects')
                .select(`
          id,
          class_id,
          subject_name,
          teacher_id
        `)
                .eq('class_id', classId);

            // Fetch teachers for this institution
            const { data: teachersData } = await supabase
                .from('institution_teachers')
                .select(`
          id,
          user_id,
          role,
          status,
          profile:profiles(name, email, photo_url)
        `)
                .eq('institution_id', institutionId)
                .eq('status', 'active');

            // Transform and enrich subjects with teacher data
            const enrichedSubjects = (subjectsData || []).map(subj => {
                const teacher = teachersData?.find(t => t.user_id === subj.teacher_id);
                return {
                    ...subj,
                    teacher: teacher ? {
                        id: teacher.user_id,
                        name: (teacher.profile as any)?.name || 'Sem nome',
                        email: (teacher.profile as any)?.email || ''
                    } : undefined
                };
            });

            setSubjects(enrichedSubjects);
            setTeachers((teachersData || []).map(t => ({
                ...t,
                profile: t.profile as any
            })));

        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const addSubject = async () => {
        if (!selectedSubject || !classId) return;

        // Check if subject already exists
        if (subjects.some(s => s.subject_name === selectedSubject)) {
            alert('Esta disciplina já está cadastrada para esta turma.');
            return;
        }

        setSaving(true);
        try {
            const { data, error } = await supabase
                .from('class_subjects')
                .insert({
                    class_id: classId,
                    subject_name: selectedSubject,
                    teacher_id: null
                })
                .select()
                .single();

            if (error) throw error;

            setSubjects(prev => [...prev, { ...data, teacher: undefined }]);
            setShowAddSubject(false);
            setSelectedSubject('');
        } catch (err) {
            console.error('Error adding subject:', err);
            alert('Erro ao adicionar disciplina.');
        } finally {
            setSaving(false);
        }
    };

    const removeSubject = async (subjectId: string) => {
        if (!confirm('Tem certeza que deseja remover esta disciplina?')) return;

        try {
            const { error } = await supabase
                .from('class_subjects')
                .delete()
                .eq('id', subjectId);

            if (error) throw error;

            setSubjects(prev => prev.filter(s => s.id !== subjectId));
        } catch (err) {
            console.error('Error removing subject:', err);
            alert('Erro ao remover disciplina.');
        }
    };

    const assignTeacher = async (subjectId: string, teacherUserId: string | null) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('class_subjects')
                .update({ teacher_id: teacherUserId })
                .eq('id', subjectId);

            if (error) throw error;

            // Update local state
            setSubjects(prev => prev.map(subj => {
                if (subj.id === subjectId) {
                    const teacher = teachers.find(t => t.user_id === teacherUserId);
                    return {
                        ...subj,
                        teacher_id: teacherUserId,
                        teacher: teacher ? {
                            id: teacher.user_id,
                            name: teacher.profile?.name || 'Sem nome',
                            email: teacher.profile?.email || ''
                        } : undefined
                    };
                }
                return subj;
            }));
        } catch (err) {
            console.error('Error assigning teacher:', err);
            alert('Erro ao atribuir professor.');
        } finally {
            setSaving(false);
        }
    };

    const getAvailableSubjects = () => {
        const usedSubjects = subjects.map(s => s.subject_name);
        return SUBJECTS.filter(s => !usedSubjects.includes(s));
    };

    if (!isCoordinator) {
        return (
            <div className="p-10 text-center text-text-secondary">
                Apenas coordenadores podem gerenciar disciplinas.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/20"></div>
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-page p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(`/institution/${institutionId}/classes`)}
                        className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Voltar para Turmas
                    </button>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                                <span className="p-2 bg-primary/10 rounded-xl">
                                    <BookOpen className="text-primary" size={24} />
                                </span>
                                {classDetails?.name || 'Turma'}
                            </h1>
                            <p className="text-text-secondary mt-2">
                                {classDetails?.grade} • {classDetails?.shift} — Gerencie as disciplinas e professores
                            </p>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowAddSubject(true)}
                            className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Adicionar Disciplina
                        </motion.button>
                    </div>
                </div>

                {/* Subjects Grid */}
                <div className="space-y-4">
                    {subjects.length === 0 ? (
                        <div className="text-center py-16 bg-surface-card rounded-2xl border border-dashed border-border-default">
                            <BookOpen className="mx-auto text-text-muted mb-4" size={48} />
                            <p className="text-text-secondary mb-4">Nenhuma disciplina cadastrada.</p>
                            <button
                                onClick={() => setShowAddSubject(true)}
                                className="text-primary font-bold hover:underline"
                            >
                                Adicionar primeira disciplina
                            </button>
                        </div>
                    ) : (
                        subjects.map((subject, index) => (
                            <motion.div
                                key={subject.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-surface-card rounded-2xl border border-border-default p-5 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <BookOpen className="text-primary" size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-text-primary text-lg">
                                                {subject.subject_name}
                                            </h3>
                                            {subject.teacher ? (
                                                <div className="flex items-center gap-2 text-sm text-text-secondary">
                                                    <User size={14} />
                                                    <span>{subject.teacher.name}</span>
                                                    <span className="text-text-muted">({subject.teacher.email})</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-amber-600 dark:text-amber-400">
                                                    Sem professor atribuído
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <select
                                            value={subject.teacher_id || ''}
                                            onChange={(e) => assignTeacher(subject.id, e.target.value || null)}
                                            aria-label={`Selecionar professor para ${subject.subject_name}`}
                                            className="bg-surface-elevated border border-border-default rounded-xl py-2 px-4 text-text-primary focus:outline-none focus:border-primary min-w-[200px]"
                                        >
                                            <option value="">Selecionar professor...</option>
                                            {teachers.map(teacher => (
                                                <option key={teacher.user_id} value={teacher.user_id}>
                                                    {teacher.profile?.name || 'Sem nome'} ({teacher.role})
                                                </option>
                                            ))}
                                        </select>

                                        <button
                                            onClick={() => removeSubject(subject.id)}
                                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                                            title="Remover disciplina"
                                            aria-label={`Remover disciplina ${subject.subject_name}`}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Summary Card */}
                {subjects.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-8 bg-surface-card rounded-2xl border border-border-default p-6"
                    >
                        <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                            <Check className="text-emerald-500" size={20} />
                            Resumo
                        </h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-surface-elevated rounded-xl p-4">
                                <div className="text-2xl font-black text-primary">{subjects.length}</div>
                                <div className="text-sm text-text-muted">Disciplinas</div>
                            </div>
                            <div className="bg-surface-elevated rounded-xl p-4">
                                <div className="text-2xl font-black text-emerald-500">
                                    {subjects.filter(s => s.teacher_id).length}
                                </div>
                                <div className="text-sm text-text-muted">Com Professor</div>
                            </div>
                            <div className="bg-surface-elevated rounded-xl p-4">
                                <div className="text-2xl font-black text-amber-500">
                                    {subjects.filter(s => !s.teacher_id).length}
                                </div>
                                <div className="text-sm text-text-muted">Pendentes</div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Add Subject Modal */}
                <AnimatePresence>
                    {showAddSubject && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setShowAddSubject(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                className="bg-surface-elevated w-full max-w-md rounded-3xl p-6 shadow-2xl"
                            >
                                <h3 className="text-xl font-bold text-text-primary mb-4">
                                    Adicionar Disciplina
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-bold text-text-muted uppercase tracking-wide mb-2 block">
                                            Disciplina
                                        </label>
                                        <select
                                            value={selectedSubject}
                                            onChange={(e) => setSelectedSubject(e.target.value)}
                                            aria-label="Selecionar disciplina"
                                            className="w-full bg-surface-card border border-border-default rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:border-primary"
                                        >
                                            <option value="">Selecione uma disciplina...</option>
                                            {getAvailableSubjects().map(subject => (
                                                <option key={subject} value={subject}>
                                                    {subject}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="pt-4 border-t border-border-default flex gap-3">
                                        <button
                                            onClick={() => setShowAddSubject(false)}
                                            className="flex-1 py-3 bg-surface-card border border-border-default rounded-xl font-bold text-text-secondary hover:bg-surface-elevated transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={addSubject}
                                            disabled={!selectedSubject || saving}
                                            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {saving ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Save size={18} />
                                            )}
                                            Adicionar
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default ClassSubjectsManager;
