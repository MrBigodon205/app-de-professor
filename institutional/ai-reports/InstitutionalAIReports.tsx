import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSchool } from '../contexts/SchoolContext';
import { supabase } from '../../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    BrainCircuit,
    AlertTriangle,
    TrendingUp,
    Users,
    Search,
    RefreshCw,
    FileText,
    Brain,
    CheckCircle2,
    XCircle,
    Download
} from 'lucide-react';

interface StudentRisk {
    student_id: number;
    name: string;
    class_name: string;
    risk_level: 'baixo' | 'medio' | 'alto' | 'critico';
    academic_score: number; // 0-100
    attendance_rate: number; // 0-100
    negative_occurrences: number;
    insights: string[];
}

interface AIInsight {
    id: number;
    student_id: number;
    analysis_type: string;
    risk_level: string;
    content: string;
    generated_at: string;
}

export default function InstitutionalAIReports() {
    const { currentSchool } = useSchool();

    const [studentsMask, setStudentsMask] = useState<StudentRisk[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRisk, setSelectedRisk] = useState<string>('all');
    const [lastGeneration, setLastGeneration] = useState<string | null>(null);

    // Fetch and Analyze Data
    const fetchAndAnalyze = async (forceRegenerate = false) => {
        if (!currentSchool?.id) return;

        setLoading(true);
        if (forceRegenerate) setGenerating(true);

        try {
            // 1. Fetch Students
            const { data: students } = await supabase
                .from('students')
                .select('id, name, series_id, section')
                .eq('school_id', currentSchool.id)
                .eq('active', true);

            if (!students) throw new Error('No students found');

            // 2. Fetch Data needed for analysis (simulated for now by getting raw data)
            // In a real AI scenario, this would be passed to an LLM.
            // Here we use "Rule-Based AI" (Symbolic AI).

            // Fetch occurrences count
            const { data: occurrences } = await supabase
                .from('occurrences')
                .select('student_id, type')
                .eq('institution_id', currentSchool.id);

            // Fetch attendance (mocked average for now as getting all daily attendance is heavy)
            // Ideally we would query a summarized view.

            // Process each student
            const riskAnalysis = students.map(student => {
                // Rule-based Analysis
                const studOccurrences = occurrences?.filter(o => o.student_id === student.id) || [];
                const negativeOccs = studOccurrences.filter(o => o.type === 'negative').length;

                // Simulate academic & attendance for demo (replace with real queries if available/performant)
                const mockAttendance = Math.floor(Math.random() * (100 - 60) + 60); // Random 60-100%
                const mockAcademic = Math.floor(Math.random() * (100 - 40) + 40); // Random 40-100 score

                let risk: 'baixo' | 'medio' | 'alto' | 'critico' = 'baixo';
                const insights = [];

                // Logic
                if (mockAttendance < 75) {
                    risk = 'alto';
                    insights.push('Frequência crítica abaixo de 75%');
                } else if (mockAttendance < 85) {
                    if (risk === 'baixo') risk = 'medio';
                    insights.push('Frequência em alerta');
                }

                if (negativeOccs > 2) {
                    risk = 'critico';
                    insights.push(`${negativeOccs} ocorrências disciplinares negativas`);
                } else if (negativeOccs > 0) {
                    // Upgrade risk if it's currently low
                    if (risk === 'baixo') risk = 'medio';
                    insights.push('Comportamento requer atenção');
                }

                if (mockAcademic < 50) {
                    // Upgrade to alto if not already critical
                    if (risk !== 'critico') risk = 'alto';
                    insights.push('Desempenho acadêmico insuficiente');
                }

                // Normalizer
                if (insights.length === 0) insights.push('Desempenho estável e positivo');

                return {
                    student_id: student.id,
                    name: student.name,
                    class_name: `${student.series_id}º ${student.section || ''}`,
                    risk_level: risk,
                    academic_score: mockAcademic,
                    attendance_rate: mockAttendance,
                    negative_occurrences: negativeOccs,
                    insights
                };
            });

            setStudentsMask(riskAnalysis);

            // Save to DB if regenerating
            if (forceRegenerate) {
                // Bulk insert insights (clearing old ones for simplicity or versioning)
                // For this demo, we just update the local state to show "Live" analysis
                setLastGeneration(new Date().toISOString());
            }

        } catch (err) {
            console.error('Error analyzing:', err);
        } finally {
            setLoading(false);
            setGenerating(false);
        }
    };

    useEffect(() => {
        fetchAndAnalyze();
    }, [currentSchool?.id]);

    // Filters
    const filteredStudents = useMemo(() => {
        return studentsMask.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRisk = selectedRisk === 'all' || s.risk_level === selectedRisk;
            return matchesSearch && matchesRisk;
        }).sort((a, b) => {
            const riskOrder = { critico: 3, alto: 2, medio: 1, baixo: 0 };
            return riskOrder[b.risk_level] - riskOrder[a.risk_level];
        });
    }, [studentsMask, searchQuery, selectedRisk]);

    // Stats
    const stats = useMemo(() => ({
        critico: studentsMask.filter(s => s.risk_level === 'critico').length,
        alto: studentsMask.filter(s => s.risk_level === 'alto').length,
        medio: studentsMask.filter(s => s.risk_level === 'medio').length,
        baixo: studentsMask.filter(s => s.risk_level === 'baixo').length,
    }), [studentsMask]);

    // Export PDF
    const handleExportPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text('Relatório de Inteligência Pedagógica', 14, 15);
        doc.setFontSize(10);
        doc.text(`Escola: ${currentSchool?.name || 'Instituição'}`, 14, 22);
        doc.text(`Data da Análise: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

        autoTable(doc, {
            startY: 36,
            head: [['Aluno', 'Turma', 'Risco', 'Frequência', 'Ocorrências', 'Principais Insights']],
            body: filteredStudents.map(s => [
                s.name,
                s.class_name,
                s.risk_level.toUpperCase(),
                `${s.attendance_rate}%`,
                s.negative_occurrences.toString(),
                s.insights.join(', ')
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [79, 70, 229] },
            columnStyles: {
                2: { fontStyle: 'bold' },
                5: { cellWidth: 80 }
            }
        });

        doc.save(`relatorio_ia_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    if (loading && !studentsMask.length) {
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
                        <BrainCircuit className="text-primary" size={28} />
                        Inteligência Pedagógica
                    </h1>
                    <p className="text-text-secondary text-sm mt-1">
                        Análise automática de risco e comportamento escolar
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => fetchAndAnalyze(true)}
                        disabled={generating}
                        className="flex items-center gap-2 px-4 py-2 bg-surface-subtle text-text-primary rounded-xl font-medium hover:bg-surface-elevated transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={generating ? 'animate-spin' : ''} />
                        {generating ? 'Analisando...' : 'Atualizar Análise'}
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                    >
                        <Download size={18} />
                        Exportar Relatório
                    </button>
                </div>
            </div>

            {/* Risk Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-card border border-rose-500/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-rose-600 uppercase">Risco Crítico</span>
                        <AlertTriangle size={16} className="text-rose-600" />
                    </div>
                    <div className="text-3xl font-bold text-text-primary">{stats.critico}</div>
                    <p className="text-xs text-text-muted mt-1">Alunos requerem atenção imediata</p>
                </div>
                <div className="bg-surface-card border border-orange-500/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-orange-600 uppercase">Risco Alto</span>
                        <TrendingUp size={16} className="text-orange-600" />
                    </div>
                    <div className="text-3xl font-bold text-text-primary">{stats.alto}</div>
                    <p className="text-xs text-text-muted mt-1">Tendência negativa identificada</p>
                </div>
                <div className="bg-surface-card border border-yellow-500/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-yellow-600 uppercase">Risco Médio</span>
                        <Brain size={16} className="text-yellow-600" />
                    </div>
                    <div className="text-3xl font-bold text-text-primary">{stats.medio}</div>
                    <p className="text-xs text-text-muted mt-1">Pontos de atenção observados</p>
                </div>
                <div className="bg-surface-card border border-emerald-500/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-emerald-600 uppercase">Risco Baixo</span>
                        <CheckCircle2 size={16} className="text-emerald-600" />
                    </div>
                    <div className="text-3xl font-bold text-text-primary">{stats.baixo}</div>
                    <p className="text-xs text-text-muted mt-1">Desempenho esperado ou superior</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Buscar aluno..."
                        className="w-full bg-surface-subtle border border-border-default rounded-xl py-3 pl-12 pr-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'critico', 'alto', 'medio', 'baixo'] as const).map(risk => (
                        <button
                            key={risk}
                            onClick={() => setSelectedRisk(risk)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${selectedRisk === risk
                                ? 'bg-primary text-white'
                                : 'bg-surface-subtle text-text-secondary hover:bg-surface-elevated'
                                }`}
                        >
                            {risk === 'all' ? 'Todos' : risk}
                        </button>
                    ))}
                </div>
            </div>

            {/* AI Analysis List */}
            <div className="bg-surface-card border border-border-default rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-surface-subtle">
                            <tr>
                                <th className="text-left p-4 font-medium text-text-muted">Aluno</th>
                                <th className="text-center p-4 font-medium text-text-muted">Risco</th>
                                <th className="text-center p-4 font-medium text-text-muted">Frequência</th>
                                <th className="text-center p-4 font-medium text-text-muted">Ocorrências</th>
                                <th className="text-left p-4 font-medium text-text-muted">Análise IA</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default">
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-text-muted">
                                        Nenhum aluno encontrado com os filtros atuais.
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map(student => (
                                    <tr key={student.student_id} className="hover:bg-surface-subtle/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-text-primary">{student.name}</div>
                                            <div className="text-xs text-text-muted">{student.class_name}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold uppercase ${student.risk_level === 'critico' ? 'bg-rose-500/10 text-rose-600' :
                                                student.risk_level === 'alto' ? 'bg-orange-500/10 text-orange-600' :
                                                    student.risk_level === 'medio' ? 'bg-yellow-500/10 text-yellow-600' :
                                                        'bg-emerald-500/10 text-emerald-600'
                                                }`}>
                                                {student.risk_level}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-16 h-2 bg-surface-subtle rounded-full overflow-hidden">
                                                    {/* eslint-disable-next-line */}
                                                    <motion.div
                                                        className={`h-full ${student.attendance_rate < 75 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${student.attendance_rate}%` }}
                                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium">{student.attendance_rate}%</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center font-medium">
                                            {student.negative_occurrences}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {student.insights.map((insight, i) => (
                                                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-elevated border border-border-default text-xs text-text-secondary">
                                                        <BrainCircuit size={10} className="text-primary opacity-50" />
                                                        {insight}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
