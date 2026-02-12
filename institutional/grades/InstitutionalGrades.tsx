import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSchool } from '../contexts/SchoolContext';
import { supabase } from '../../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    FileText,
    Download,
    Filter,
    Users,
    BookOpen,
    TrendingUp,
    TrendingDown,
    BarChart3,
    ChevronDown,
    Search,
    AlertCircle
} from 'lucide-react';

interface ClassInfo {
    id: string;
    grade: string;
    section: string;
}

interface TeacherInfo {
    id: string;
    name: string;
}

interface GradeEntry {
    id: string;
    student_id: number;
    student_name: string;
    unit: string;
    subject: string;
    teacher_name: string;
    data: Record<string, number>;
    total: number;
    class_id: string;
    class_name: string;
}

interface ClassStats {
    class_id: string;
    class_name: string;
    total_students: number;
    average: number;
    above_average: number;
    below_average: number;
    subjects_count: number;
}

const UNITS = [
    { id: '1', label: '1ª Unidade' },
    { id: '2', label: '2ª Unidade' },
    { id: '3', label: '3ª Unidade' },
    { id: 'final', label: 'Prova Final' },
    { id: 'recovery', label: 'Recuperação' },
];

export default function InstitutionalGrades() {
    const { currentSchool, isCoordinator } = useSchool();

    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [selectedUnit, setSelectedUnit] = useState('1');
    const [grades, setGrades] = useState<GradeEntry[]>([]);
    const [classStats, setClassStats] = useState<ClassStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

    // Fetch classes
    useEffect(() => {
        if (!currentSchool?.id) return;

        const fetchClasses = async () => {
            try {
                const { data, error } = await supabase
                    .from('classes')
                    .select('id, grade, section')
                    .eq('institution_id', currentSchool.id)
                    .eq('is_active', true)
                    .order('grade')
                    .order('section');

                if (error) throw error;
                setClasses(data || []);
            } catch (err) {
                console.error('Error fetching classes:', err);
            }
        };

        fetchClasses();
    }, [currentSchool?.id]);

    // Fetch grades for overview
    useEffect(() => {
        if (!currentSchool?.id) return;

        const fetchGradesOverview = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch grades with student and teacher info
                let query = supabase
                    .from('grades')
                    .select(`
                        id, student_id, unit, data, subject,
                        students:student_id (name, series_id, section),
                        profiles:user_id (name)
                    `)
                    .eq('school_id', currentSchool.id)
                    .eq('unit', selectedUnit);

                if (selectedClassId) {
                    query = query.eq('series_id', selectedClassId);
                }

                const { data, error } = await query;

                if (error) throw error;

                // Process grades
                const processedGrades = (data || []).map((g: any) => {
                    const gradeData = g.data || {};
                    const total = Object.values(gradeData).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);

                    return {
                        id: g.id,
                        student_id: g.student_id,
                        student_name: g.students?.name || 'Aluno',
                        unit: g.unit,
                        subject: g.subject || 'Geral',
                        teacher_name: g.profiles?.name || 'Professor',
                        data: gradeData,
                        total,
                        class_id: g.students?.series_id?.toString() || '',
                        class_name: `${g.students?.series_id}º ${g.students?.section || ''}`
                    };
                });

                setGrades(processedGrades);

                // Calculate class stats
                const statsMap = new Map<string, { total: number; count: number; above: number; below: number; subjects: Set<string> }>();

                processedGrades.forEach((g: GradeEntry) => {
                    const key = g.class_id;
                    if (!statsMap.has(key)) {
                        statsMap.set(key, { total: 0, count: 0, above: 0, below: 0, subjects: new Set() });
                    }
                    const stat = statsMap.get(key)!;
                    stat.total += g.total;
                    stat.count++;
                    stat.subjects.add(g.subject);
                    if (g.total >= 6) stat.above++;
                    else stat.below++;
                });

                const stats = Array.from(statsMap.entries()).map(([classId, stat]) => {
                    const cls = classes.find(c => c.id === classId);
                    return {
                        class_id: classId,
                        class_name: cls ? `${cls.grade}º ${cls.section}` : classId,
                        total_students: stat.count,
                        average: stat.count > 0 ? stat.total / stat.count : 0,
                        above_average: stat.above,
                        below_average: stat.below,
                        subjects_count: stat.subjects.size
                    };
                });

                setClassStats(stats);
            } catch (err: any) {
                console.error('Error fetching grades:', err);
                setError(err.message || 'Erro ao carregar notas');
            } finally {
                setLoading(false);
            }
        };

        fetchGradesOverview();
    }, [currentSchool?.id, selectedUnit, selectedClassId, classes]);

    // Filter grades by search
    const filteredGrades = useMemo(() => {
        if (!searchQuery) return grades;
        const query = searchQuery.toLowerCase();
        return grades.filter(g =>
            g.student_name.toLowerCase().includes(query) ||
            g.subject.toLowerCase().includes(query) ||
            g.teacher_name.toLowerCase().includes(query)
        );
    }, [grades, searchQuery]);

    // Export to PDF
    const handleExportPDF = () => {
        const doc = new jsPDF();
        const title = `Relatório de Notas - ${selectedUnit === 'final' ? 'Prova Final' : selectedUnit === 'recovery' ? 'Recuperação' : `${selectedUnit}ª Unidade`}`;

        doc.setFontSize(16);
        doc.text(title, 14, 15);
        doc.setFontSize(10);
        doc.text(`Escola: ${currentSchool?.name || 'Instituição'}`, 14, 22);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

        autoTable(doc, {
            startY: 35,
            head: [['Aluno', 'Turma', 'Disciplina', 'Professor', 'Total']],
            body: filteredGrades.map(g => [
                g.student_name,
                g.class_name,
                g.subject,
                g.teacher_name,
                g.total.toFixed(1)
            ]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [79, 70, 229] }
        });

        doc.save(`notas_${selectedUnit}_${new Date().toISOString().split('T')[0]}.pdf`);
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                        <FileText className="text-primary" size={28} />
                        Notas da Instituição
                    </h1>
                    <p className="text-text-secondary text-sm mt-1">
                        Visualize e acompanhe as notas de todas as turmas
                    </p>
                </div>
                <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                    <Download size={18} />
                    Exportar PDF
                </button>
            </div>

            {/* Filters */}
            <div className="bg-surface-card border border-border-default rounded-2xl p-4 space-y-4">
                {/* Unit Selector */}
                <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">
                        Unidade
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {UNITS.map(unit => (
                            <button
                                key={unit.id}
                                onClick={() => setSelectedUnit(unit.id)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedUnit === unit.id
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'bg-surface-subtle text-text-secondary hover:bg-surface-elevated'
                                    }`}
                            >
                                {unit.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Class Filter */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">
                            Filtrar por Turma
                        </label>
                        <select
                            value={selectedClassId || ''}
                            onChange={e => setSelectedClassId(e.target.value || null)}
                            title="Filtrar por turma"
                            className="w-full bg-surface-subtle border border-border-default rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                            <option value="">Todas as turmas</option>
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.grade}º {cls.section}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">
                            Buscar Aluno
                        </label>
                        <div className="relative">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Nome do aluno, disciplina..."
                                className="w-full bg-surface-subtle border border-border-default rounded-xl py-3 pl-12 pr-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                    <AlertCircle className="text-red-500 shrink-0" size={20} />
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* View Mode Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setViewMode('overview')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${viewMode === 'overview'
                            ? 'bg-primary text-white'
                            : 'bg-surface-subtle text-text-secondary hover:bg-surface-elevated'
                        }`}
                >
                    <BarChart3 size={16} className="inline mr-2" />
                    Visão Geral
                </button>
                <button
                    onClick={() => setViewMode('detailed')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${viewMode === 'detailed'
                            ? 'bg-primary text-white'
                            : 'bg-surface-subtle text-text-secondary hover:bg-surface-elevated'
                        }`}
                >
                    <Users size={16} className="inline mr-2" />
                    Lista Detalhada
                </button>
            </div>

            {/* Overview Stats */}
            {viewMode === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classStats.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-text-muted">
                            <FileText size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Nenhuma nota registrada para esta unidade</p>
                        </div>
                    ) : (
                        classStats.map(stat => (
                            <motion.div
                                key={stat.class_id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-surface-card border border-border-default rounded-2xl p-5"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-text-primary">
                                        Turma {stat.class_name}
                                    </h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${stat.average >= 6
                                            ? 'bg-emerald-500/10 text-emerald-600'
                                            : 'bg-amber-500/10 text-amber-600'
                                        }`}>
                                        Média: {stat.average.toFixed(1)}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-surface-subtle rounded-xl p-3">
                                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                            <TrendingUp size={16} />
                                            <span className="text-xs font-bold uppercase">Acima da Média</span>
                                        </div>
                                        <div className="text-2xl font-bold text-text-primary">{stat.above_average}</div>
                                    </div>
                                    <div className="bg-surface-subtle rounded-xl p-3">
                                        <div className="flex items-center gap-2 text-rose-600 mb-1">
                                            <TrendingDown size={16} />
                                            <span className="text-xs font-bold uppercase">Abaixo da Média</span>
                                        </div>
                                        <div className="text-2xl font-bold text-text-primary">{stat.below_average}</div>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
                                    <span className="flex items-center gap-1">
                                        <Users size={14} />
                                        {stat.total_students} registros
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <BookOpen size={14} />
                                        {stat.subjects_count} disciplinas
                                    </span>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {/* Detailed List */}
            {viewMode === 'detailed' && (
                <div className="bg-surface-card border border-border-default rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr className="bg-surface-subtle">
                                    <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Aluno</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Turma</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Disciplina</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Professor</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-default">
                                {filteredGrades.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-text-muted">
                                            <FileText size={32} className="mx-auto mb-2 opacity-50" />
                                            Nenhuma nota encontrada
                                        </td>
                                    </tr>
                                ) : (
                                    filteredGrades.map(g => (
                                        <motion.tr
                                            key={g.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-surface-subtle/50"
                                        >
                                            <td className="px-4 py-3 text-sm font-medium text-text-primary">{g.student_name}</td>
                                            <td className="px-4 py-3 text-sm text-text-secondary">{g.class_name}</td>
                                            <td className="px-4 py-3 text-sm text-text-secondary">{g.subject}</td>
                                            <td className="px-4 py-3 text-sm text-text-secondary">{g.teacher_name}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${g.total >= 6
                                                        ? 'bg-emerald-500/10 text-emerald-600'
                                                        : 'bg-rose-500/10 text-rose-600'
                                                    }`}>
                                                    {g.total.toFixed(1)}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
