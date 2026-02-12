import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSchool } from '../contexts/SchoolContext';
import { supabase } from '../../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    AlertTriangle,
    CheckCircle2,
    MessageSquare,
    Award,
    Download,
    Search,
    Filter,
    Calendar,
    User,
    BookOpen
} from 'lucide-react';

interface Occurrence {
    id: number;
    student_id: number;
    student_name: string;
    student_class: string;
    date: string;
    type: string;
    description: string;
    subject: string;
    teacher_name: string;
}

interface OccurrenceStats {
    total: number;
    positive: number;
    neutral: number;
    negative: number;
    byTeacher: Map<string, number>;
}

const TYPE_MAP: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    'positiva': { label: 'Positiva', icon: <Award size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    'neutra': { label: 'Neutra', icon: <MessageSquare size={16} />, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    'negativa': { label: 'Negativa', icon: <AlertTriangle size={16} />, color: 'text-rose-600', bg: 'bg-rose-500/10' },
    'observacao': { label: 'Observação', icon: <MessageSquare size={16} />, color: 'text-slate-600', bg: 'bg-slate-500/10' },
};

export default function InstitutionalOccurrences() {
    const { currentSchool } = useSchool();

    const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('month');

    // Fetch occurrences
    useEffect(() => {
        if (!currentSchool?.id) return;

        const fetchOccurrences = async () => {
            setLoading(true);
            try {
                const now = new Date();
                let dateFilter = null;

                if (dateRange === 'week') {
                    const weekAgo = new Date(now);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    dateFilter = weekAgo.toISOString().split('T')[0];
                } else if (dateRange === 'month') {
                    const monthAgo = new Date(now);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    dateFilter = monthAgo.toISOString().split('T')[0];
                }

                let query = supabase
                    .from('occurrences')
                    .select(`
                        id, student_id, date, type, description, subject,
                        students:student_id (name, series_id, section),
                        profiles:user_id (name)
                    `)
                    .eq('school_id', currentSchool.id)
                    .order('date', { ascending: false })
                    .limit(300);

                if (dateFilter) {
                    query = query.gte('date', dateFilter);
                }

                const { data, error } = await query;

                if (error) throw error;

                const processed = (data || []).map((occ: any) => ({
                    id: occ.id,
                    student_id: occ.student_id,
                    student_name: occ.students?.name || 'Aluno',
                    student_class: `${occ.students?.series_id || ''}º ${occ.students?.section || ''}`,
                    date: occ.date,
                    type: occ.type || 'observacao',
                    description: occ.description || '',
                    subject: occ.subject || 'Geral',
                    teacher_name: occ.profiles?.name || 'Professor'
                }));

                setOccurrences(processed);
            } catch (err) {
                console.error('Error fetching occurrences:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchOccurrences();
    }, [currentSchool?.id, dateRange]);

    // Calculate stats
    const stats = useMemo((): OccurrenceStats => {
        const byTeacher = new Map<string, number>();
        let positive = 0, neutral = 0, negative = 0;

        occurrences.forEach(occ => {
            // Count by type
            if (occ.type === 'positiva') positive++;
            else if (occ.type === 'negativa') negative++;
            else neutral++;

            // Count by teacher
            const count = byTeacher.get(occ.teacher_name) || 0;
            byTeacher.set(occ.teacher_name, count + 1);
        });

        return {
            total: occurrences.length,
            positive,
            neutral,
            negative,
            byTeacher
        };
    }, [occurrences]);

    // Filter occurrences
    const filtered = useMemo(() => {
        return occurrences.filter(occ => {
            // Type filter
            if (filterType !== 'all' && occ.type !== filterType) return false;

            // Search filter
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return (
                    occ.student_name.toLowerCase().includes(q) ||
                    occ.description.toLowerCase().includes(q) ||
                    occ.teacher_name.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [occurrences, filterType, searchQuery]);

    // Export PDF
    const handleExportPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text('Relatório de Ocorrências', 14, 15);
        doc.setFontSize(10);
        doc.text(`Escola: ${currentSchool?.name || 'Instituição'}`, 14, 22);
        doc.text(`Período: ${dateRange === 'week' ? 'Última Semana' : dateRange === 'month' ? 'Último Mês' : 'Todos'}`, 14, 28);
        doc.text(`Total: ${filtered.length} ocorrências`, 14, 34);

        autoTable(doc, {
            startY: 42,
            head: [['Data', 'Aluno', 'Tipo', 'Descrição', 'Professor']],
            body: filtered.map(occ => [
                new Date(occ.date).toLocaleDateString('pt-BR'),
                occ.student_name,
                TYPE_MAP[occ.type]?.label || occ.type,
                occ.description.substring(0, 50) + (occ.description.length > 50 ? '...' : ''),
                occ.teacher_name
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [79, 70, 229] }
        });

        doc.save(`ocorrencias_${dateRange}_${new Date().toISOString().split('T')[0]}.pdf`);
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
                        <MessageSquare className="text-primary" size={28} />
                        Ocorrências
                    </h1>
                    <p className="text-text-secondary text-sm mt-1">
                        Visualize todas as ocorrências registradas pelos professores
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

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-card border border-border-default rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-text-muted mb-2">
                        <MessageSquare size={18} />
                        <span className="text-xs font-bold uppercase">Total</span>
                    </div>
                    <div className="text-3xl font-bold text-text-primary">{stats.total}</div>
                </div>
                <div className="bg-surface-card border border-border-default rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-emerald-600 mb-2">
                        <Award size={18} />
                        <span className="text-xs font-bold uppercase">Positivas</span>
                    </div>
                    <div className="text-3xl font-bold text-emerald-600">{stats.positive}</div>
                </div>
                <div className="bg-surface-card border border-border-default rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                        <MessageSquare size={18} />
                        <span className="text-xs font-bold uppercase">Neutras</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">{stats.neutral}</div>
                </div>
                <div className="bg-surface-card border border-border-default rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-rose-600 mb-2">
                        <AlertTriangle size={18} />
                        <span className="text-xs font-bold uppercase">Negativas</span>
                    </div>
                    <div className="text-3xl font-bold text-rose-600">{stats.negative}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-surface-card border border-border-default rounded-2xl p-4 space-y-4">
                {/* Date Range */}
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

                <div className="flex flex-col md:flex-row gap-4">
                    {/* Type Filter */}
                    <div className="flex-1">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">
                            Tipo
                        </label>
                        <select
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                            title="Filtrar por tipo"
                            className="w-full bg-surface-subtle border border-border-default rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                            <option value="all">Todos os tipos</option>
                            <option value="positiva">Positiva</option>
                            <option value="neutra">Neutra</option>
                            <option value="negativa">Negativa</option>
                            <option value="observacao">Observação</option>
                        </select>
                    </div>

                    {/* Search */}
                    <div className="flex-1">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">
                            Buscar
                        </label>
                        <div className="relative">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Nome do aluno, descrição..."
                                className="w-full bg-surface-subtle border border-border-default rounded-xl py-3 pl-12 pr-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Occurrences List */}
            <div className="bg-surface-card border border-border-default rounded-2xl overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
                            <MessageSquare size={48} className="mb-4 opacity-50" />
                            <p>Nenhuma ocorrência encontrada</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border-default">
                            {filtered.map(occ => {
                                const typeInfo = TYPE_MAP[occ.type] || TYPE_MAP['observacao'];
                                return (
                                    <motion.div
                                        key={occ.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="p-4 hover:bg-surface-subtle/50 transition-colors"
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Type Icon */}
                                            <div className={`p-2 rounded-xl ${typeInfo.bg} ${typeInfo.color}`}>
                                                {typeInfo.icon}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-4 mb-1">
                                                    <h4 className="font-medium text-text-primary truncate">
                                                        {occ.student_name}
                                                    </h4>
                                                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${typeInfo.bg} ${typeInfo.color}`}>
                                                        {typeInfo.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-text-secondary mb-2 line-clamp-2">
                                                    {occ.description}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {new Date(occ.date).toLocaleDateString('pt-BR')}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <User size={12} />
                                                        {occ.teacher_name}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <BookOpen size={12} />
                                                        {occ.subject}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
