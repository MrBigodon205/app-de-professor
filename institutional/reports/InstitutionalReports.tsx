import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    FileText,
    Download,
    Search,
    User,
    Star,
    Save,
    X,
    Plus,
    ChevronRight,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

interface Student {
    id: number;
    name: string;
    class_name: string;
    series_id: number;
    section: string;
}

interface Report {
    id?: number;
    student_id: number;
    unit: string;
    report_text: string;
    behavior_score: number;
    participation_score: number;
    development_score: number;
    recommendations: string;
    coordinator_name?: string;
    updated_at?: string;
}

const UNITS = [
    { id: '1', label: '1ª Unidade' },
    { id: '2', label: '2ª Unidade' },
    { id: '3', label: '3ª Unidade' },
    { id: 'final', label: 'Final' },
];

const SCORE_LABELS = ['', 'Insuficiente', 'Regular', 'Bom', 'Muito Bom', 'Excelente'];

export default function InstitutionalReports() {
    const { currentSchool } = useSchool();
    const { currentUser } = useAuth();

    const [students, setStudents] = useState<Student[]>([]);
    const [reports, setReports] = useState<Map<string, Report>>(new Map());
    const [loading, setLoading] = useState(true);
    const [selectedUnit, setSelectedUnit] = useState('1');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Current report being edited
    const [editingReport, setEditingReport] = useState<Report | null>(null);

    // Fetch students and reports
    useEffect(() => {
        if (!currentSchool?.id) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch all students
                const { data: studentsData, error: studentsError } = await supabase
                    .from('students')
                    .select('id, name, series_id, section')
                    .eq('school_id', currentSchool.id)
                    .eq('active', true)
                    .order('name');

                if (studentsError) throw studentsError;

                const processedStudents = (studentsData || []).map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    series_id: s.series_id,
                    section: s.section || '',
                    class_name: `${s.series_id}º ${s.section || ''}`
                }));

                setStudents(processedStudents);

                // Fetch existing reports
                const { data: reportsData, error: reportsError } = await supabase
                    .from('pedagogical_reports')
                    .select('*, profiles:coordinator_id (name)')
                    .eq('institution_id', currentSchool.id);

                if (reportsError) throw reportsError;

                const reportsMap = new Map<string, Report>();
                (reportsData || []).forEach((r: any) => {
                    const key = `${r.student_id}-${r.unit}`;
                    reportsMap.set(key, {
                        id: r.id,
                        student_id: r.student_id,
                        unit: r.unit,
                        report_text: r.report_text,
                        behavior_score: r.behavior_score,
                        participation_score: r.participation_score,
                        development_score: r.development_score,
                        recommendations: r.recommendations || '',
                        coordinator_name: r.profiles?.name,
                        updated_at: r.updated_at
                    });
                });

                setReports(reportsMap);
            } catch (err: any) {
                console.error('Error fetching data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentSchool?.id]);

    // Filter students
    const filteredStudents = useMemo(() => {
        if (!searchQuery) return students;
        const q = searchQuery.toLowerCase();
        return students.filter(s => s.name.toLowerCase().includes(q));
    }, [students, searchQuery]);

    // Open report editor
    const openReportEditor = (student: Student) => {
        setSelectedStudent(student);
        const key = `${student.id}-${selectedUnit}`;
        const existing = reports.get(key);

        if (existing) {
            setEditingReport({ ...existing });
        } else {
            setEditingReport({
                student_id: student.id,
                unit: selectedUnit,
                report_text: '',
                behavior_score: 3,
                participation_score: 3,
                development_score: 3,
                recommendations: ''
            });
        }
    };

    // Save report
    const handleSaveReport = async () => {
        if (!editingReport || !currentSchool?.id || !currentUser?.id) return;

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const reportData = {
                student_id: editingReport.student_id,
                institution_id: currentSchool.id,
                unit: editingReport.unit,
                coordinator_id: currentUser.id,
                report_text: editingReport.report_text,
                behavior_score: editingReport.behavior_score,
                participation_score: editingReport.participation_score,
                development_score: editingReport.development_score,
                recommendations: editingReport.recommendations,
                updated_at: new Date().toISOString()
            };

            let result;
            if (editingReport.id) {
                // Update existing
                result = await supabase
                    .from('pedagogical_reports')
                    .update(reportData)
                    .eq('id', editingReport.id)
                    .select()
                    .single();
            } else {
                // Insert new
                result = await supabase
                    .from('pedagogical_reports')
                    .insert(reportData)
                    .select()
                    .single();
            }

            if (result.error) throw result.error;

            // Update local state
            const key = `${editingReport.student_id}-${editingReport.unit}`;
            setReports(prev => {
                const next = new Map(prev);
                next.set(key, { ...editingReport, id: result.data.id });
                return next;
            });

            setSuccess('Parecer salvo com sucesso!');
            setTimeout(() => {
                setSelectedStudent(null);
                setEditingReport(null);
                setSuccess(null);
            }, 1500);
        } catch (err: any) {
            console.error('Error saving report:', err);
            setError(err.message || 'Erro ao salvar parecer');
        } finally {
            setSaving(false);
        }
    };

    // Export to PDF
    const handleExportPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text(`Pareceres Pedagógicos - ${UNITS.find(u => u.id === selectedUnit)?.label}`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Escola: ${currentSchool?.name || 'Instituição'}`, 14, 22);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

        const tableData = filteredStudents.map(student => {
            const key = `${student.id}-${selectedUnit}`;
            const report = reports.get(key);
            return [
                student.name,
                student.class_name,
                report ? SCORE_LABELS[report.behavior_score] : '-',
                report ? SCORE_LABELS[report.participation_score] : '-',
                report ? SCORE_LABELS[report.development_score] : '-',
                report ? '✓' : '-'
            ];
        });

        autoTable(doc, {
            startY: 36,
            head: [['Aluno', 'Turma', 'Comportamento', 'Participação', 'Desenvolvimento', 'Parecer']],
            body: tableData,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [79, 70, 229] }
        });

        doc.save(`pareceres_${selectedUnit}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Get report status for a student
    const getReportStatus = (studentId: number) => {
        const key = `${studentId}-${selectedUnit}`;
        return reports.has(key);
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
                        Pareceres Pedagógicos
                    </h1>
                    <p className="text-text-secondary text-sm mt-1">
                        Avaliações descritivas por unidade
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

            {/* Unit Selector */}
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

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-card border border-border-default rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">{students.length}</div>
                    <div className="text-xs text-text-muted uppercase font-bold">Alunos</div>
                </div>
                <div className="bg-surface-card border border-border-default rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-emerald-600 mb-1">
                        {students.filter(s => getReportStatus(s.id)).length}
                    </div>
                    <div className="text-xs text-text-muted uppercase font-bold">Com Parecer</div>
                </div>
                <div className="bg-surface-card border border-border-default rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-amber-600 mb-1">
                        {students.filter(s => !getReportStatus(s.id)).length}
                    </div>
                    <div className="text-xs text-text-muted uppercase font-bold">Pendentes</div>
                </div>
                <div className="bg-surface-card border border-border-default rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-text-primary mb-1">
                        {students.length > 0
                            ? Math.round((students.filter(s => getReportStatus(s.id)).length / students.length) * 100)
                            : 0}%
                    </div>
                    <div className="text-xs text-text-muted uppercase font-bold">Concluído</div>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar aluno..."
                    className="w-full bg-surface-subtle border border-border-default rounded-xl py-3 pl-12 pr-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
            </div>

            {/* Students List */}
            <div className="bg-surface-card border border-border-default rounded-2xl overflow-hidden">
                <div className="max-h-[500px] overflow-y-auto divide-y divide-border-default">
                    {filteredStudents.length === 0 ? (
                        <div className="p-12 text-center text-text-muted">
                            <User size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Nenhum aluno encontrado</p>
                        </div>
                    ) : (
                        filteredStudents.map(student => {
                            const hasReport = getReportStatus(student.id);
                            return (
                                <motion.div
                                    key={student.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-4 flex items-center gap-4 hover:bg-surface-subtle/50 cursor-pointer transition-colors"
                                    onClick={() => openReportEditor(student)}
                                >
                                    <div className={`p-2 rounded-xl ${hasReport ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                                        {hasReport ? (
                                            <CheckCircle2 size={20} className="text-emerald-600" />
                                        ) : (
                                            <Plus size={20} className="text-amber-600" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-text-primary truncate">{student.name}</h4>
                                        <p className="text-xs text-text-muted">Turma: {student.class_name}</p>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${hasReport
                                        ? 'bg-emerald-500/10 text-emerald-600'
                                        : 'bg-amber-500/10 text-amber-600'
                                        }`}>
                                        {hasReport ? 'Concluído' : 'Pendente'}
                                    </span>
                                    <ChevronRight size={18} className="text-text-muted" />
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Report Editor Modal */}
            <AnimatePresence>
                {selectedStudent && editingReport && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                        onClick={() => { setSelectedStudent(null); setEditingReport(null); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-surface-card rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-border-default flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-text-primary">{selectedStudent.name}</h2>
                                    <p className="text-sm text-text-muted">
                                        {selectedStudent.class_name} • {UNITS.find(u => u.id === selectedUnit)?.label}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setSelectedStudent(null); setEditingReport(null); }}
                                    title="Fechar"
                                    className="p-2 hover:bg-surface-subtle rounded-lg"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 space-y-6">
                                {/* Scores */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { key: 'behavior_score', label: 'Comportamento' },
                                        { key: 'participation_score', label: 'Participação' },
                                        { key: 'development_score', label: 'Desenvolvimento' },
                                    ].map(({ key, label }) => (
                                        <div key={key}>
                                            <label className="text-xs font-bold text-text-muted uppercase mb-2 block">
                                                {label}
                                            </label>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(score => (
                                                    <button
                                                        key={score}
                                                        onClick={() => setEditingReport({
                                                            ...editingReport,
                                                            [key]: score
                                                        })}
                                                        className={`flex-1 p-2 rounded-lg transition-all ${(editingReport as any)[key] >= score
                                                            ? 'bg-primary text-white'
                                                            : 'bg-surface-subtle text-text-muted hover:bg-surface-elevated'
                                                            }`}
                                                        title={SCORE_LABELS[score]}
                                                    >
                                                        <Star size={16} className="mx-auto" fill={(editingReport as any)[key] >= score ? 'currentColor' : 'none'} />
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-xs text-center text-text-muted mt-1">
                                                {SCORE_LABELS[(editingReport as any)[key]]}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Report Text */}
                                <div>
                                    <label className="text-xs font-bold text-text-muted uppercase mb-2 block">
                                        Parecer Descritivo *
                                    </label>
                                    <textarea
                                        value={editingReport.report_text}
                                        onChange={e => setEditingReport({ ...editingReport, report_text: e.target.value })}
                                        placeholder="Descreva o desenvolvimento do aluno durante esta unidade..."
                                        rows={5}
                                        className="w-full bg-surface-subtle border border-border-default rounded-xl py-3 px-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                    />
                                </div>

                                {/* Recommendations */}
                                <div>
                                    <label className="text-xs font-bold text-text-muted uppercase mb-2 block">
                                        Recomendações
                                    </label>
                                    <textarea
                                        value={editingReport.recommendations}
                                        onChange={e => setEditingReport({ ...editingReport, recommendations: e.target.value })}
                                        placeholder="Sugestões para melhoria ou pontos de atenção..."
                                        rows={3}
                                        className="w-full bg-surface-subtle border border-border-default rounded-xl py-3 px-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                    />
                                </div>

                                {/* Error/Success */}
                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-600">
                                        <AlertCircle size={18} />
                                        <span className="text-sm">{error}</span>
                                    </div>
                                )}
                                {success && (
                                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-600">
                                        <CheckCircle2 size={18} />
                                        <span className="text-sm">{success}</span>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-border-default flex justify-end gap-2">
                                <button
                                    onClick={() => { setSelectedStudent(null); setEditingReport(null); }}
                                    className="px-4 py-2 text-text-secondary hover:bg-surface-subtle rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveReport}
                                    disabled={saving || !editingReport.report_text.trim()}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {saving ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                    ) : (
                                        <Save size={18} />
                                    )}
                                    Salvar Parecer
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
