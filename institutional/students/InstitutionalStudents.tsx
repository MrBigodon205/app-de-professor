import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useSchool } from '../contexts/SchoolContext';
import { supabase } from '../../lib/supabase';
import {
    Users,
    UserPlus,
    Search,
    Filter,
    Edit2,
    Trash2,
    Heart,
    Cake,
    ArrowRightLeft,
    X,
    Save,
    AlertCircle
} from 'lucide-react';
import { useToast } from '../../components/Toast';

interface InstitutionalStudent {
    id: string;
    institution_id: string;
    name: string;
    registration_number: string | null;
    birth_date: string | null;
    is_inclusion_student: boolean;
    inclusion_notes: string | null;
    photo_url: string | null;
    status: 'active' | 'transferred' | 'inactive';
    parent_name: string | null;
    parent_phone: string | null;
    parent_email: string | null;
    address: string | null;
    created_at: string;
    enrollments?: ClassEnrollment[];
}

interface ClassEnrollment {
    id: string;
    student_id: string;
    class_id: string;
    enrolled_at: string;
    class?: {
        id: string;
        name: string;
        grade: string;
    };
}

interface InstitutionalClass {
    id: string;
    name: string;
    grade: string;
    shift: string;
}

export const InstitutionalStudents: React.FC = () => {
    const { id: institutionId } = useParams<{ id: string }>();
    const { currentSchool, isCoordinator } = useSchool();
    const navigate = useNavigate();
    const { success, error: showError, showConfirm } = useToast();

    const [students, setStudents] = useState<InstitutionalStudent[]>([]);
    const [classes, setClasses] = useState<InstitutionalClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterClass, setFilterClass] = useState<string>('all');
    const [filterInclusion, setFilterInclusion] = useState<boolean | null>(null);
    const [showBirthdays, setShowBirthdays] = useState(false);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState<InstitutionalStudent | null>(null);
    const [transferringStudent, setTransferringStudent] = useState<InstitutionalStudent | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        registration_number: '',
        birth_date: '',
        is_inclusion_student: false,
        inclusion_notes: '',
        parent_name: '',
        parent_phone: '',
        parent_email: '',
        address: '',
        class_id: ''
    });

    useEffect(() => {
        if (institutionId) {
            fetchData();
        }
    }, [institutionId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch students
            const { data: studentsData } = await supabase
                .from('institutional_students')
                .select(`
          *,
          enrollments:class_enrollments(
            id,
            student_id,
            class_id,
            enrolled_at,
            class:institutional_classes(id, name, grade)
          )
        `)
                .eq('institution_id', institutionId)
                .eq('status', 'active')
                .order('name');

            // Fetch classes
            const { data: classesData } = await supabase
                .from('institutional_classes')
                .select('id, name, grade, shift')
                .eq('institution_id', institutionId)
                .order('name');

            setStudents(studentsData || []);
            setClasses(classesData || []);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = useMemo(() => {
        let result = students;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.name.toLowerCase().includes(query) ||
                s.registration_number?.toLowerCase().includes(query)
            );
        }

        // Class filter
        if (filterClass !== 'all') {
            result = result.filter(s =>
                s.enrollments?.some(e => e.class_id === filterClass)
            );
        }

        // Inclusion filter
        if (filterInclusion !== null) {
            result = result.filter(s => s.is_inclusion_student === filterInclusion);
        }

        // Birthday filter (today)
        if (showBirthdays) {
            const today = new Date();
            const month = today.getMonth() + 1;
            const day = today.getDate();
            result = result.filter(s => {
                if (!s.birth_date) return false;
                const [, m, d] = s.birth_date.split('-').map(Number);
                return m === month && d === day;
            });
        }

        return result;
    }, [students, searchQuery, filterClass, filterInclusion, showBirthdays]);

    const upcomingBirthdays = useMemo(() => {
        const today = new Date();
        const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        return students.filter(s => {
            if (!s.birth_date) return false;
            const [, month, day] = s.birth_date.split('-').map(Number);
            const thisYearBirthday = new Date(today.getFullYear(), month - 1, day);
            return thisYearBirthday >= today && thisYearBirthday <= next7Days;
        }).sort((a, b) => {
            const [, am, ad] = (a.birth_date || '').split('-').map(Number);
            const [, bm, bd] = (b.birth_date || '').split('-').map(Number);
            return (am * 100 + ad) - (bm * 100 + bd);
        });
    }, [students]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!institutionId) return;

        try {
            if (editingStudent) {
                // Update
                const { error } = await supabase
                    .from('institutional_students')
                    .update({
                        name: formData.name,
                        registration_number: formData.registration_number || null,
                        birth_date: formData.birth_date || null,
                        is_inclusion_student: formData.is_inclusion_student,
                        inclusion_notes: formData.inclusion_notes || null,
                        parent_name: formData.parent_name || null,
                        parent_phone: formData.parent_phone || null,
                        parent_email: formData.parent_email || null,
                        address: formData.address || null
                    })
                    .eq('id', editingStudent.id);

                if (error) throw error;
            } else {
                // Insert
                const { data: newStudent, error } = await supabase
                    .from('institutional_students')
                    .insert({
                        institution_id: institutionId,
                        name: formData.name,
                        registration_number: formData.registration_number || null,
                        birth_date: formData.birth_date || null,
                        is_inclusion_student: formData.is_inclusion_student,
                        inclusion_notes: formData.inclusion_notes || null,
                        parent_name: formData.parent_name || null,
                        parent_phone: formData.parent_phone || null,
                        parent_email: formData.parent_email || null,
                        address: formData.address || null
                    })
                    .select()
                    .single();

                if (error) throw error;

                // Enroll in class if selected
                if (newStudent && formData.class_id) {
                    await supabase.from('class_enrollments').insert({
                        student_id: newStudent.id,
                        class_id: formData.class_id
                    });
                }
            }

            fetchData();
            resetForm();
            success('Aluno salvo com sucesso!');
        } catch (err: any) {
            console.error('Save error:', err);
            showError(`Erro ao salvar: ${err.message}`);
        }
    };

    const handleTransfer = async (newClassId: string) => {
        if (!transferringStudent) return;

        try {
            // Remove from old class
            await supabase
                .from('class_enrollments')
                .delete()
                .eq('student_id', transferringStudent.id);

            // Add to new class
            if (newClassId) {
                await supabase.from('class_enrollments').insert({
                    student_id: transferringStudent.id,
                    class_id: newClassId
                });
            }

            fetchData();
            setShowTransferModal(false);
            setTransferringStudent(null);
            success('Aluno transferido com sucesso!');
        } catch (err: any) {
            console.error('Transfer error:', err);
            showError(`Erro ao transferir: ${err.message}`);
        }
    };

    const handleDelete = async (student: InstitutionalStudent) => {
        showConfirm(
            `Tem certeza que deseja excluir ${student.name}?`,
            async () => {
                try {
                    const { error } = await supabase
                        .from('institutional_students')
                        .update({ status: 'inactive' })
                        .eq('id', student.id);

                    if (error) throw error;
                    setStudents(prev => prev.filter(s => s.id !== student.id));
                    success('Aluno excluído com sucesso!');
                } catch (err: any) {
                    console.error('Delete error:', err);
                    showError(`Erro: ${err.message}`);
                }
            }
        );
    };

    const resetForm = () => {
        setFormData({
            name: '',
            registration_number: '',
            birth_date: '',
            is_inclusion_student: false,
            inclusion_notes: '',
            parent_name: '',
            parent_phone: '',
            parent_email: '',
            address: '',
            class_id: ''
        });
        setShowAddModal(false);
        setEditingStudent(null);
    };

    const openEditModal = (student: InstitutionalStudent) => {
        setEditingStudent(student);
        setFormData({
            name: student.name,
            registration_number: student.registration_number || '',
            birth_date: student.birth_date || '',
            is_inclusion_student: student.is_inclusion_student,
            inclusion_notes: student.inclusion_notes || '',
            parent_name: student.parent_name || '',
            parent_phone: student.parent_phone || '',
            parent_email: student.parent_email || '',
            address: student.address || '',
            class_id: student.enrollments?.[0]?.class_id || ''
        });
        setShowAddModal(true);
    };

    if (!isCoordinator) {
        return (
            <div className="p-10 text-center text-text-secondary">
                Apenas coordenadores podem gerenciar alunos.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/20" />
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-page p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto"
            >
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                            <span className="p-2 bg-primary/10 rounded-xl">
                                <Users className="text-primary" size={24} />
                            </span>
                            Alunos
                        </h1>
                        <p className="text-text-secondary mt-1">
                            {students.length} alunos cadastrados
                        </p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowAddModal(true)}
                        className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                        <UserPlus size={18} />
                        Novo Aluno
                    </motion.button>
                </div>

                {/* Birthday Alert */}
                {upcomingBirthdays.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl"
                    >
                        <div className="flex items-center gap-3">
                            <Cake className="text-amber-500" size={24} />
                            <div>
                                <h3 className="font-bold text-amber-800 dark:text-amber-200">
                                    🎂 Aniversariantes da Semana
                                </h3>
                                <p className="text-sm text-amber-600 dark:text-amber-400">
                                    {upcomingBirthdays.map(s => s.name).join(', ')}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou matrícula..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-surface-card border border-border-default rounded-xl focus:outline-none focus:border-primary"
                        />
                    </div>

                    <select
                        value={filterClass}
                        onChange={e => setFilterClass(e.target.value)}
                        aria-label="Filtrar por turma"
                        className="px-4 py-2.5 bg-surface-card border border-border-default rounded-xl focus:outline-none focus:border-primary"
                    >
                        <option value="all">Todas as Turmas</option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => setFilterInclusion(filterInclusion === true ? null : true)}
                        className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 transition-colors ${filterInclusion === true
                            ? 'bg-pink-500 text-white border-pink-500'
                            : 'bg-surface-card border-border-default text-text-secondary hover:border-pink-500'
                            }`}
                    >
                        <Heart size={16} />
                        Inclusão
                    </button>

                    <button
                        onClick={() => setShowBirthdays(!showBirthdays)}
                        className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 transition-colors ${showBirthdays
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-surface-card border-border-default text-text-secondary hover:border-amber-500'
                            }`}
                    >
                        <Cake size={16} />
                        Aniversário Hoje
                    </button>
                </div>

                {/* Students Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.length === 0 ? (
                        <div className="col-span-full text-center py-16 bg-surface-card rounded-2xl border border-dashed border-border-default">
                            <Users className="mx-auto text-text-muted mb-4" size={48} />
                            <p className="text-text-secondary">Nenhum aluno encontrado.</p>
                        </div>
                    ) : (
                        filteredStudents.map((student, index) => (
                            <motion.div
                                key={student.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="bg-surface-card rounded-2xl border border-border-default p-5 hover:shadow-lg transition-shadow group relative"
                            >
                                {student.is_inclusion_student && (
                                    <div className="absolute top-3 right-3">
                                        <span className="p-1.5 bg-pink-500/10 rounded-lg" title="Aluno de Inclusão">
                                            <Heart className="text-pink-500" size={16} />
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                        {student.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-text-primary truncate">{student.name}</h3>
                                        <p className="text-sm text-text-muted">
                                            {student.registration_number || 'Sem matrícula'}
                                        </p>
                                        {student.enrollments?.[0]?.class && (
                                            <span className="inline-block mt-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-lg">
                                                {student.enrollments[0].class.name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-border-default flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEditModal(student)}
                                        className="p-2 text-text-muted hover:text-primary rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTransferringStudent(student);
                                            setShowTransferModal(true);
                                        }}
                                        className="p-2 text-text-muted hover:text-amber-500 rounded-lg transition-colors"
                                        title="Transferir de Turma"
                                    >
                                        <ArrowRightLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(student)}
                                        className="p-2 text-text-muted hover:text-rose-500 rounded-lg transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Add/Edit Modal */}
                <AnimatePresence>
                    {showAddModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
                            onClick={resetForm}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                className="bg-surface-elevated w-full max-w-2xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-text-primary">
                                        {editingStudent ? 'Editar Aluno' : 'Novo Aluno'}
                                    </h3>
                                    <button onClick={resetForm} className="p-2 hover:bg-surface-elevated rounded-lg" title="Fechar" aria-label="Fechar modal">
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="text-sm font-bold text-text-muted uppercase tracking-wide mb-1 block">
                                                Nome Completo *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                aria-label="Nome completo do aluno"
                                                placeholder="Digite o nome completo"
                                                className="w-full bg-surface-card border border-border-default rounded-xl py-3 px-4 focus:outline-none focus:border-primary"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-bold text-text-muted uppercase tracking-wide mb-1 block">
                                                Matrícula
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.registration_number}
                                                onChange={e => setFormData({ ...formData, registration_number: e.target.value })}
                                                aria-label="Número de matrícula"
                                                placeholder="Ex: 2024001"
                                                className="w-full bg-surface-card border border-border-default rounded-xl py-3 px-4 focus:outline-none focus:border-primary"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-bold text-text-muted uppercase tracking-wide mb-1 block">
                                                Data de Nascimento
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.birth_date}
                                                onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                                                aria-label="Data de nascimento"
                                                title="Data de nascimento"
                                                className="w-full bg-surface-card border border-border-default rounded-xl py-3 px-4 focus:outline-none focus:border-primary"
                                            />
                                        </div>

                                        {!editingStudent && (
                                            <div className="col-span-2">
                                                <label className="text-sm font-bold text-text-muted uppercase tracking-wide mb-1 block">
                                                    Turma
                                                </label>
                                                <select
                                                    value={formData.class_id}
                                                    onChange={e => setFormData({ ...formData, class_id: e.target.value })}
                                                    aria-label="Selecionar turma do aluno"
                                                    title="Turma do aluno"
                                                    className="w-full bg-surface-card border border-border-default rounded-xl py-3 px-4 focus:outline-none focus:border-primary"
                                                >
                                                    <option value="">Selecione uma turma...</option>
                                                    {classes.map(cls => (
                                                        <option key={cls.id} value={cls.id}>{cls.name} - {cls.grade}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {/* Inclusion Section */}
                                    <div className="p-4 bg-pink-50 dark:bg-pink-900/10 rounded-xl border border-pink-200 dark:border-pink-800">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_inclusion_student}
                                                onChange={e => setFormData({ ...formData, is_inclusion_student: e.target.checked })}
                                                className="w-5 h-5 rounded border-pink-300 text-pink-600 focus:ring-pink-500"
                                            />
                                            <div>
                                                <span className="font-bold text-pink-700 dark:text-pink-300 flex items-center gap-2">
                                                    <Heart size={16} /> Aluno de Inclusão
                                                </span>
                                                <p className="text-sm text-pink-600 dark:text-pink-400">
                                                    Marque se o aluno tem necessidades especiais
                                                </p>
                                            </div>
                                        </label>

                                        {formData.is_inclusion_student && (
                                            <div className="mt-4">
                                                <label className="text-sm font-bold text-pink-700 dark:text-pink-300 mb-1 block">
                                                    Observações de Inclusão
                                                </label>
                                                <textarea
                                                    value={formData.inclusion_notes}
                                                    onChange={e => setFormData({ ...formData, inclusion_notes: e.target.value })}
                                                    rows={3}
                                                    placeholder="Ex: TDAH, Autismo, necessita de acompanhamento..."
                                                    className="w-full bg-white dark:bg-slate-800 border border-pink-200 dark:border-pink-700 rounded-xl py-3 px-4 focus:outline-none focus:border-pink-500"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Parent Info */}
                                    <div className="border-t border-border-default pt-5">
                                        <h4 className="font-bold text-text-secondary mb-4">Responsável</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm text-text-muted mb-1 block">Nome</label>
                                                <input
                                                    type="text"
                                                    value={formData.parent_name}
                                                    onChange={e => setFormData({ ...formData, parent_name: e.target.value })}
                                                    aria-label="Nome do responsável"
                                                    placeholder="Nome do responsável"
                                                    className="w-full bg-surface-card border border-border-default rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-text-muted mb-1 block">Telefone</label>
                                                <input
                                                    type="tel"
                                                    value={formData.parent_phone}
                                                    onChange={e => setFormData({ ...formData, parent_phone: e.target.value })}
                                                    aria-label="Telefone do responsável"
                                                    placeholder="(99) 99999-9999"
                                                    className="w-full bg-surface-card border border-border-default rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-sm text-text-muted mb-1 block">Email</label>
                                                <input
                                                    type="email"
                                                    value={formData.parent_email}
                                                    onChange={e => setFormData({ ...formData, parent_email: e.target.value })}
                                                    aria-label="Email do responsável"
                                                    placeholder="email@exemplo.com"
                                                    className="w-full bg-surface-card border border-border-default rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-border-default flex gap-3">
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="flex-1 py-3 bg-surface-card border border-border-default rounded-xl font-bold text-text-secondary"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2"
                                        >
                                            <Save size={18} />
                                            {editingStudent ? 'Atualizar' : 'Cadastrar'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Transfer Modal */}
                <AnimatePresence>
                    {showTransferModal && transferringStudent && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setShowTransferModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                className="bg-surface-elevated w-full max-w-md rounded-3xl p-6 shadow-2xl"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <ArrowRightLeft className="text-amber-500" size={24} />
                                    <div>
                                        <h3 className="text-xl font-bold text-text-primary">Transferir Aluno</h3>
                                        <p className="text-sm text-text-muted">{transferringStudent.name}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-sm text-text-secondary mb-4">
                                        Selecione a nova turma:
                                    </p>

                                    {classes.map(cls => (
                                        <button
                                            key={cls.id}
                                            onClick={() => handleTransfer(cls.id)}
                                            disabled={transferringStudent.enrollments?.[0]?.class_id === cls.id}
                                            className={`w-full p-4 rounded-xl border text-left transition-all ${transferringStudent.enrollments?.[0]?.class_id === cls.id
                                                ? 'bg-primary/10 border-primary text-primary cursor-not-allowed'
                                                : 'bg-surface-card border-border-default hover:border-primary hover:bg-primary/5'
                                                }`}
                                        >
                                            <div className="font-bold">{cls.name}</div>
                                            <div className="text-sm text-text-muted">{cls.grade} • {cls.shift}</div>
                                            {transferringStudent.enrollments?.[0]?.class_id === cls.id && (
                                                <span className="text-xs text-primary">Turma atual</span>
                                            )}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => handleTransfer('')}
                                        className="w-full p-4 rounded-xl border border-dashed border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors"
                                    >
                                        <AlertCircle className="inline mr-2" size={16} />
                                        Remover de todas as turmas
                                    </button>
                                </div>

                                <button
                                    onClick={() => setShowTransferModal(false)}
                                    className="w-full mt-4 py-3 bg-surface-card border border-border-default rounded-xl font-bold text-text-secondary"
                                >
                                    Cancelar
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default InstitutionalStudents;
