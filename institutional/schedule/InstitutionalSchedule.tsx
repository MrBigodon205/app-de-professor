import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSchool } from '../contexts/SchoolContext';
import { supabase } from '../../lib/supabase';
import {
    Calendar,
    Clock,
    Users,
    ChevronDown,
    Plus,
    Trash2,
    Save,
    X,
    AlertCircle,
    BookOpen
} from 'lucide-react';

interface ClassWithSubjects {
    id: string;
    name: string;
    grade: string;
    section: string;
    subjects: {
        id: string;
        subject: string;
        teacher_id: string | null;
        teacher_name: string | null;
    }[];
}

interface ScheduleSlot {
    id?: string;
    class_subject_id: string;
    weekday: number;
    start_time: string;
    end_time: string;
    subject?: string;
    teacher_name?: string | null;
}

interface TimeSlotConfig {
    start: string;
    end: string;
}

const WEEKDAYS = [
    { id: 1, label: 'Segunda' },
    { id: 2, label: 'Terça' },
    { id: 3, label: 'Quarta' },
    { id: 4, label: 'Quinta' },
    { id: 5, label: 'Sexta' },
];

const DEFAULT_TIME_SLOTS: TimeSlotConfig[] = [
    { start: '07:30', end: '08:20' },
    { start: '08:20', end: '09:10' },
    { start: '09:30', end: '10:20' },
    { start: '10:20', end: '11:10' },
    { start: '11:10', end: '12:00' },
];

const SUBJECT_COLORS: Record<string, string> = {
    'Português': 'bg-blue-500',
    'Matemática': 'bg-emerald-500',
    'História': 'bg-amber-500',
    'Geografia': 'bg-green-600',
    'Ciências': 'bg-purple-500',
    'Biologia': 'bg-green-500',
    'Física': 'bg-indigo-500',
    'Química': 'bg-pink-500',
    'Inglês': 'bg-red-500',
    'Educação Física': 'bg-orange-500',
    'Artes': 'bg-fuchsia-500',
    'default': 'bg-slate-500'
};

export default function InstitutionalSchedule() {
    const { currentSchool, isCoordinator } = useSchool();

    const [classes, setClasses] = useState<ClassWithSubjects[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
    const [timeSlots, setTimeSlots] = useState<TimeSlotConfig[]>(DEFAULT_TIME_SLOTS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Modal state for adding/editing slots
    const [editingSlot, setEditingSlot] = useState<{ weekday: number; slotIndex: number } | null>(null);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

    const selectedClass = useMemo(() =>
        classes.find(c => c.id === selectedClassId),
        [classes, selectedClassId]
    );

    // Fetch classes with their subjects
    useEffect(() => {
        if (!currentSchool?.id) return;

        const fetchClasses = async () => {
            setLoading(true);
            try {
                const { data: classesData, error: classesError } = await supabase
                    .from('classes')
                    .select(`
                        id, name, grade, section,
                        class_subjects (
                            id, subject,
                            class_assignments (
                                user_id,
                                profiles:user_id (name)
                            )
                        )
                    `)
                    .eq('institution_id', currentSchool.id)
                    .eq('is_active', true)
                    .order('grade')
                    .order('section');

                if (classesError) throw classesError;

                const formattedClasses = (classesData || []).map((cls: any) => ({
                    id: cls.id,
                    name: cls.name,
                    grade: cls.grade,
                    section: cls.section,
                    subjects: (cls.class_subjects || []).map((cs: any) => ({
                        id: cs.id,
                        subject: cs.subject,
                        teacher_id: cs.class_assignments?.[0]?.user_id || null,
                        teacher_name: cs.class_assignments?.[0]?.profiles?.name || null
                    }))
                }));

                setClasses(formattedClasses);
                if (formattedClasses.length > 0 && !selectedClassId) {
                    setSelectedClassId(formattedClasses[0].id);
                }
            } catch (err) {
                console.error('Error fetching classes:', err);
                setError('Erro ao carregar turmas');
            } finally {
                setLoading(false);
            }
        };

        fetchClasses();
    }, [currentSchool?.id]);

    // Fetch schedules for selected class
    useEffect(() => {
        if (!selectedClassId || !currentSchool?.id) return;

        const fetchSchedules = async () => {
            try {
                const { data, error } = await supabase
                    .from('institution_schedules')
                    .select(`
                        id, weekday, start_time, end_time, class_subject_id,
                        class_subjects:class_subject_id (
                            subject,
                            class_assignments (
                                profiles:user_id (name)
                            )
                        )
                    `)
                    .eq('institution_id', currentSchool.id)
                    .in('class_subject_id', selectedClass?.subjects.map(s => s.id) || []);

                if (error) throw error;

                const formattedSchedules = (data || []).map((s: any) => ({
                    id: s.id,
                    class_subject_id: s.class_subject_id,
                    weekday: s.weekday,
                    start_time: s.start_time.slice(0, 5),
                    end_time: s.end_time.slice(0, 5),
                    subject: s.class_subjects?.subject,
                    teacher_name: s.class_subjects?.class_assignments?.[0]?.profiles?.name
                }));

                setSchedules(formattedSchedules);
            } catch (err) {
                console.error('Error fetching schedules:', err);
            }
        };

        fetchSchedules();
    }, [selectedClassId, currentSchool?.id, selectedClass?.subjects]);

    const getSlotSchedule = (weekday: number, start: string) => {
        return schedules.find(s =>
            s.weekday === weekday && s.start_time === start
        );
    };

    const getSubjectColor = (subject: string) => {
        return SUBJECT_COLORS[subject] || SUBJECT_COLORS.default;
    };

    const handleSlotClick = (weekday: number, slotIndex: number) => {
        if (!isCoordinator) return;
        setEditingSlot({ weekday, slotIndex });
        const existingSlot = getSlotSchedule(weekday, timeSlots[slotIndex].start);
        setSelectedSubjectId(existingSlot?.class_subject_id || '');
    };

    const handleSaveSlot = async () => {
        if (!editingSlot || !selectedClass || !currentSchool?.id) return;

        setSaving(true);
        setError(null);

        try {
            const { weekday, slotIndex } = editingSlot;
            const slot = timeSlots[slotIndex];
            const existingSlot = getSlotSchedule(weekday, slot.start);

            if (selectedSubjectId === '' && existingSlot?.id) {
                // Remove existing slot
                const { error } = await supabase
                    .from('institution_schedules')
                    .delete()
                    .eq('id', existingSlot.id);

                if (error) throw error;
                setSchedules(prev => prev.filter(s => s.id !== existingSlot.id));
            } else if (selectedSubjectId) {
                const selectedSubject = selectedClass.subjects.find(s => s.id === selectedSubjectId);

                if (existingSlot?.id) {
                    // Update existing
                    const { error } = await supabase
                        .from('institution_schedules')
                        .update({
                            class_subject_id: selectedSubjectId,
                            teacher_id: selectedSubject?.teacher_id
                        })
                        .eq('id', existingSlot.id);

                    if (error) throw error;

                    setSchedules(prev => prev.map(s =>
                        s.id === existingSlot.id
                            ? { ...s, class_subject_id: selectedSubjectId, subject: selectedSubject?.subject, teacher_name: selectedSubject?.teacher_name }
                            : s
                    ));
                } else {
                    // Insert new
                    const { data, error } = await supabase
                        .from('institution_schedules')
                        .insert({
                            institution_id: currentSchool.id,
                            class_subject_id: selectedSubjectId,
                            teacher_id: selectedSubject?.teacher_id,
                            weekday,
                            start_time: slot.start,
                            end_time: slot.end
                        })
                        .select()
                        .single();

                    if (error) throw error;

                    setSchedules(prev => [...prev, {
                        id: data.id,
                        class_subject_id: selectedSubjectId,
                        weekday,
                        start_time: slot.start,
                        end_time: slot.end,
                        subject: selectedSubject?.subject,
                        teacher_name: selectedSubject?.teacher_name
                    }]);
                }
            }

            setEditingSlot(null);
            setSuccess('Horário salvo com sucesso!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error('Error saving slot:', err);
            setError(err.message || 'Erro ao salvar horário');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                        <Calendar className="text-primary" size={28} />
                        Grade de Horários
                    </h1>
                    <p className="text-text-secondary text-sm mt-1">
                        Gerencie os horários das aulas por turma
                    </p>
                </div>
            </div>

            {/* Class Selector */}
            <div className="bg-surface-card border border-border-default rounded-2xl p-4">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">
                    Selecionar Turma
                </label>
                <div className="flex flex-wrap gap-2">
                    {classes.map(cls => (
                        <button
                            key={cls.id}
                            onClick={() => setSelectedClassId(cls.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedClassId === cls.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'bg-surface-subtle text-text-secondary hover:bg-surface-elevated'
                                }`}
                        >
                            {cls.grade}º {cls.section}
                        </button>
                    ))}
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                    <AlertCircle className="text-red-500 shrink-0" size={20} />
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {success && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3"
                >
                    <span className="text-emerald-500">✓</span>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>
                </motion.div>
            )}

            {/* Schedule Grid */}
            {selectedClass && (
                <div className="bg-surface-card border border-border-default rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead>
                                <tr className="bg-surface-subtle">
                                    <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider w-24">
                                        <Clock size={14} className="inline mr-2" />
                                        Horário
                                    </th>
                                    {WEEKDAYS.map(day => (
                                        <th key={day.id} className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider">
                                            {day.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-default">
                                {timeSlots.map((slot, slotIndex) => (
                                    <tr key={slotIndex} className="hover:bg-surface-subtle/50">
                                        <td className="px-4 py-2 text-sm font-mono text-text-secondary whitespace-nowrap">
                                            {slot.start} - {slot.end}
                                        </td>
                                        {WEEKDAYS.map(day => {
                                            const schedule = getSlotSchedule(day.id, slot.start);
                                            return (
                                                <td
                                                    key={day.id}
                                                    className="px-2 py-2"
                                                >
                                                    <button
                                                        onClick={() => handleSlotClick(day.id, slotIndex)}
                                                        disabled={!isCoordinator}
                                                        className={`w-full min-h-[60px] rounded-xl p-2 transition-all ${schedule
                                                            ? `${getSubjectColor(schedule.subject || '')} text-white`
                                                            : 'bg-surface-subtle hover:bg-surface-elevated border-2 border-dashed border-border-default'
                                                            } ${isCoordinator ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'}`}
                                                    >
                                                        {schedule ? (
                                                            <div className="text-center">
                                                                <div className="text-xs font-bold truncate">
                                                                    {schedule.subject}
                                                                </div>
                                                                {schedule.teacher_name && (
                                                                    <div className="text-[10px] opacity-80 truncate mt-0.5">
                                                                        {schedule.teacher_name}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full">
                                                                <Plus size={16} className="text-text-muted" />
                                                            </div>
                                                        )}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Legend */}
            {selectedClass && selectedClass.subjects.length > 0 && (
                <div className="bg-surface-card border border-border-default rounded-2xl p-4">
                    <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                        <BookOpen size={16} />
                        Disciplinas desta Turma
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {selectedClass.subjects.map(sub => (
                            <div
                                key={sub.id}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white ${getSubjectColor(sub.subject)}`}
                            >
                                {sub.subject}
                                {sub.teacher_name && (
                                    <span className="opacity-75 ml-1">({sub.teacher_name})</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {editingSlot && selectedClass && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setEditingSlot(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-surface-card border border-border-default rounded-2xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-text-primary">
                                    Editar Horário
                                </h3>
                                <button
                                    onClick={() => setEditingSlot(null)}
                                    className="p-2 hover:bg-surface-subtle rounded-full"
                                    title="Fechar"
                                >
                                    <X size={20} className="text-text-muted" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="p-3 bg-surface-subtle rounded-xl">
                                    <div className="text-xs text-text-muted uppercase font-bold mb-1">Horário</div>
                                    <div className="text-sm font-medium text-text-primary">
                                        {WEEKDAYS.find(d => d.id === editingSlot.weekday)?.label} - {timeSlots[editingSlot.slotIndex].start} às {timeSlots[editingSlot.slotIndex].end}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">
                                        Disciplina
                                    </label>
                                    <select
                                        value={selectedSubjectId}
                                        onChange={e => setSelectedSubjectId(e.target.value)}
                                        title="Selecionar disciplina"
                                        className="w-full bg-surface-subtle border border-border-default rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    >
                                        <option value="">— Vazio (remover) —</option>
                                        {selectedClass.subjects.map(sub => (
                                            <option key={sub.id} value={sub.id}>
                                                {sub.subject} {sub.teacher_name ? `(${sub.teacher_name})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setEditingSlot(null)}
                                        className="flex-1 py-3 border border-border-default rounded-xl font-medium text-text-secondary hover:bg-surface-subtle transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveSlot}
                                        disabled={saving}
                                        className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                        ) : (
                                            <>
                                                <Save size={16} />
                                                Salvar
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
