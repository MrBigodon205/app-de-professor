import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSchool } from '../contexts/SchoolContext';
import { supabase } from '../../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    Calendar,
    Download,
    Users,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    BarChart3
} from 'lucide-react';

interface ClassAttendanceStats {
    class_id: string;
    grade: string;
    section: string;
    total_records: number;
    present: number;
    absent: number;
    justified: number;
    no_class: number;
    presence_rate: number;
}

interface AttendanceRecord {
    id: number;
    student_id: number;
    student_name: string;
    class_name: string;
    date: string;
    status: string;
    subject: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    'P': { label: 'Presente', color: 'text-emerald-600', bg: 'bg-emerald-500' },
    'F': { label: 'Falta', color: 'text-rose-600', bg: 'bg-rose-500' },
    'J': { label: 'Justificada', color: 'text-amber-600', bg: 'bg-amber-500' },
    'S': { label: 'Sem Aula', color: 'text-slate-500', bg: 'bg-slate-400' },
};

export default function StudentAttendanceOverview() {
    const { currentSchool } = useSchool();

    const [classStats, setClassStats] = useState<ClassAttendanceStats[]>([]);
    const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('week');
    const [searchQuery, setSearchQuery] = useState('');

    // Calculate date filter
    const getDateFilter = () => {
        const now = new Date();
        if (dateRange === 'week') {
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return weekAgo.toISOString().split('T')[0];
        } else if (dateRange === 'month') {
            const monthAgo = new Date(now);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return monthAgo.toISOString().split('T')[0];
        }
        return null;
    };

    // Fetch attendance data
    useEffect(() => {
        if (!currentSchool?.id) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const dateFilter = getDateFilter();

                // Fetch classes for context
                const { data: classes } = await supabase
                    .from('classes')
                    .select('id, grade, section')
                    .eq('institution_id', currentSchool.id)
                    .eq('is_active', true);

                // Fetch attendance records with student info
                let query = supabase
                    .from('attendance')
                    .select(`
                        id, student_id, date, status, subject,
                        students:student_id (name, series_id, section)
                    `)
                    .eq('school_id', currentSchool.id)
                    .order('date', { ascending: false })
                    .limit(500);

                if (dateFilter) {
                    query = query.gte('date', dateFilter);
                }

                const { data: attendance } = await query;

                // Calculate stats per class
                const statsMap = new Map<string, ClassAttendanceStats>();

                (attendance || []).forEach((rec: any) => {
                    const classKey = `${rec.students?.series_id}-${rec.students?.section || ''}`;

                    if (!statsMap.has(classKey)) {
                        const cls = classes?.find((c: any) =>
                            c.id.toString() === rec.students?.series_id?.toString()
                        );
                        statsMap.set(classKey, {
                            class_id: classKey,
                            grade: cls?.grade || rec.students?.series_id?.toString() || 'N/A',
                            section: cls?.section || rec.students?.section || '',
                            total_records: 0,
                            present: 0,
                            absent: 0,
                            justified: 0,
                            no_class: 0,
                            presence_rate: 0
                        });
                    }

                    const stat = statsMap.get(classKey)!;
                    stat.total_records++;

                    switch (rec.status) {
                        case 'P': stat.present++; break;
                        case 'F': stat.absent++; break;
                        case 'J': stat.justified++; break;
                        case 'S': stat.no_class++; break;
                    }
                });

                // Calculate presence rate
                const stats = Array.from(statsMap.values()).map(stat => ({
                    ...stat,
                    presence_rate: stat.total_records > 0
                        ? ((stat.present + stat.justified) / (stat.total_records - stat.no_class)) * 100
                        : 0
                })).sort((a, b) => (parseInt(a.grade) || 0) - (parseInt(b.grade) || 0));

                setClassStats(stats);

                // Format recent records
                const recent = (attendance || []).slice(0, 100).map((rec: any) => ({
                    id: rec.id,
                    student_id: rec.student_id,
                    student_name: rec.students?.name || 'Aluno',
                    class_name: `${rec.students?.series_id || ''}º ${rec.students?.section || ''}`,
                    date: rec.date,
                    status: rec.status,
                    subject: rec.subject || 'Geral'
                }));

                setRecentRecords(recent);
            } catch (err) {
                console.error('Error fetching attendance:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentSchool?.id, dateRange]);

    // Filter records by search
    const filteredRecords = useMemo(() => {
        if (!searchQuery) return recentRecords;
        const q = searchQuery.toLowerCase();
        return recentRecords.filter(r =>
            r.student_name.toLowerCase().includes(q) ||
            r.subject.toLowerCase().includes(q)
        );
    }, [recentRecords, searchQuery]);

    // Overall stats
    const overallStats = useMemo(() => {
        const total = classStats.reduce((sum, s) => sum + s.total_records, 0);
        const present = classStats.reduce((sum, s) => sum + s.present, 0);
        const absent = classStats.reduce((sum, s) => sum + s.absent, 0);
        const justified = classStats.reduce((sum, s) => sum + s.justified, 0);
        const noClass = classStats.reduce((sum, s) => sum + s.no_class, 0);
        const validTotal = total - noClass;

        return {
            total,
            present,
            absent,
            justified,
            presenceRate: validTotal > 0 ? ((present + justified) / validTotal) * 100 : 0
        };
    }, [classStats]);

    // Export PDF
    const handleExportPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text('Relatório de Frequência Institucional', 14, 15);
        doc.setFontSize(10);
        doc.text(`Escola: ${currentSchool?.name || 'Instituição'}`, 14, 22);
        doc.text(`Período: ${dateRange === 'week' ? 'Última Semana' : dateRange === 'month' ? 'Último Mês' : 'Todos'}`, 14, 28);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 34);

        // Stats table
        autoTable(doc, {
            startY: 42,
            head: [['Turma', 'Total', 'Presentes', 'Faltas', 'Justificadas', '% Presença']],
            body: classStats.map(s => [
                `${s.grade}º ${s.section}`,
                s.total_records.toString(),
                s.present.toString(),
                s.absent.toString(),
                s.justified.toString(),
                `${s.presence_rate.toFixed(1)}%`
            ]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [79, 70, 229] }
        });

        doc.save(`frequencia_${dateRange}_${new Date().toISOString().split('T')[0]}.pdf`);
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
                        <Calendar className="text-primary" size={28} />
                        Frequência dos Alunos
                    </h1>
                    <p className="text-text-secondary text-sm mt-1">
                        Visão geral da frequência de todas as turmas
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

            {/* Date Range Filter */}
            <div className="flex flex-wrap gap-2">
                {(['week', 'month', 'all'] as const).map(range => (
                    <button
                        key={range}
                        onClick={() => setDateRange(range)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${dateRange === range
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-surface-subtle text-text-secondary hover:bg-surface-elevated'
                            }`}
                    >
                        {range === 'week' ? 'Última Semana' : range === 'month' ? 'Último Mês' : 'Todos'}
                    </button>
                ))}
            </div>

            {/* Overall Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-card border border-border-default rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-emerald-600 mb-2">
                        <CheckCircle2 size={20} />
                        <span className="text-xs font-bold uppercase">Presenças</span>
                    </div>
                    <div className="text-3xl font-bold text-text-primary">{overallStats.present}</div>
                </div>
                <div className="bg-surface-card border border-border-default rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-rose-600 mb-2">
                        <XCircle size={20} />
                        <span className="text-xs font-bold uppercase">Faltas</span>
                    </div>
                    <div className="text-3xl font-bold text-text-primary">{overallStats.absent}</div>
                </div>
                <div className="bg-surface-card border border-border-default rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-amber-600 mb-2">
                        <Clock size={20} />
                        <span className="text-xs font-bold uppercase">Justificadas</span>
                    </div>
                    <div className="text-3xl font-bold text-text-primary">{overallStats.justified}</div>
                </div>
                <div className="bg-surface-card border border-border-default rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-primary mb-2">
                        <TrendingUp size={20} />
                        <span className="text-xs font-bold uppercase">Taxa Presença</span>
                    </div>
                    <div className="text-3xl font-bold text-text-primary">{overallStats.presenceRate.toFixed(1)}%</div>
                </div>
            </div>

            {/* Per-Class Stats */}
            <div className="bg-surface-card border border-border-default rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-border-default">
                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <BarChart3 size={20} />
                        Frequência por Turma
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-surface-subtle">
                                <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase">Turma</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase">Total</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase">Presentes</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase">Faltas</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase">Justificadas</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase">% Presença</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default">
                            {classStats.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                                        Nenhum registro de frequência encontrado
                                    </td>
                                </tr>
                            ) : (
                                classStats.map(stat => (
                                    <motion.tr
                                        key={stat.class_id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-surface-subtle/50"
                                    >
                                        <td className="px-4 py-3 font-medium text-text-primary">
                                            {stat.grade}º {stat.section}
                                        </td>
                                        <td className="px-4 py-3 text-center text-text-secondary">{stat.total_records}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-emerald-600 font-medium">{stat.present}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-rose-600 font-medium">{stat.absent}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-amber-600 font-medium">{stat.justified}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${stat.presence_rate >= 75
                                                ? 'bg-emerald-500/10 text-emerald-600'
                                                : stat.presence_rate >= 50
                                                    ? 'bg-amber-500/10 text-amber-600'
                                                    : 'bg-rose-500/10 text-rose-600'
                                                }`}>
                                                {stat.presence_rate.toFixed(1)}%
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Records */}
            <div className="bg-surface-card border border-border-default rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-border-default flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <Users size={20} />
                        Registros Recentes
                    </h3>
                    <div className="relative w-full md:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Buscar aluno..."
                            className="w-full bg-surface-subtle border border-border-default rounded-xl py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 bg-surface-subtle">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-bold text-text-muted uppercase">Aluno</th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-text-muted uppercase">Turma</th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-text-muted uppercase">Data</th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-text-muted uppercase">Disciplina</th>
                                <th className="px-4 py-2 text-center text-xs font-bold text-text-muted uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default">
                            {filteredRecords.slice(0, 50).map(rec => (
                                <tr key={rec.id} className="hover:bg-surface-subtle/50">
                                    <td className="px-4 py-2 text-sm text-text-primary">{rec.student_name}</td>
                                    <td className="px-4 py-2 text-sm text-text-secondary">{rec.class_name}</td>
                                    <td className="px-4 py-2 text-sm text-text-secondary">
                                        {new Date(rec.date).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-text-secondary">{rec.subject}</td>
                                    <td className="px-4 py-2 text-center">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_MAP[rec.status]?.bg || 'bg-slate-400'
                                            } text-white`}>
                                            {STATUS_MAP[rec.status]?.label || rec.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
