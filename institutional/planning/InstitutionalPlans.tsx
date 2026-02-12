import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSchool } from '../contexts/SchoolContext';
import { supabase } from '../../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import InstitutionalPlanningTemplates from './InstitutionalPlanningTemplates';
import {
    FileText,
    Download,
    Search,
    Calendar,
    User,
    BookOpen,
    Target,
    ChevronDown,
    ChevronUp,
    Filter,
    Eye,
    X,
    Layout
} from 'lucide-react';

interface Plan {
    id: number;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    subject: string;
    theme_area: string;
    objectives: string;
    methodology: string;
    resources: string;
    assessment: string;
    bncc_codes: string;
    activity_type: string;
    teacher_name: string;
    class_name: string;
    files: any[];
    created_at: string;
    template_id?: string;
}

export default function InstitutionalPlans() {
    const { currentSchool } = useSchool();

    const [activeTab, setActiveTab] = useState<'plans' | 'templates'>('plans');
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSubject, setFilterSubject] = useState<string>('all');
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [expandedPlans, setExpandedPlans] = useState<Set<number>>(new Set());

    // Get unique subjects
    const subjects = useMemo(() => {
        const unique = new Set(plans.map(p => p.subject).filter(Boolean));
        return Array.from(unique).sort();
    }, [plans]);

    // Fetch plans
    useEffect(() => {
        if (!currentSchool?.id) return;

        const fetchPlans = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('plans')
                    .select(`
                        id, title, description, start_date, end_date, subject, theme_area,
                        objectives, methodology, resources, assessment, bncc_codes, 
                        activity_type, files, created_at, series_id, section, template_id,
                        profiles:user_id (name)
                    `)
                    .eq('school_id', currentSchool.id)
                    .order('created_at', { ascending: false })
                    .limit(200);

                if (error) throw error;

                const processed = (data || []).map((plan: any) => ({
                    id: plan.id,
                    title: plan.title || 'Sem título',
                    description: plan.description || '',
                    start_date: plan.start_date,
                    end_date: plan.end_date,
                    subject: plan.subject || 'Geral',
                    theme_area: plan.theme_area || '',
                    objectives: plan.objectives || '',
                    methodology: plan.methodology || '',
                    resources: plan.resources || '',
                    assessment: plan.assessment || '',
                    bncc_codes: plan.bncc_codes || '',
                    activity_type: plan.activity_type || 'Plano de Aula',
                    teacher_name: plan.profiles?.name || 'Professor',
                    class_name: `${plan.series_id || ''}º ${plan.section || ''}`,
                    files: plan.files || [],
                    created_at: plan.created_at,
                    template_id: plan.template_id
                }));

                setPlans(processed);
            } catch (err) {
                console.error('Error fetching plans:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();
    }, [currentSchool?.id]);

    // Filter plans
    const filtered = useMemo(() => {
        return plans.filter(plan => {
            if (filterSubject !== 'all' && plan.subject !== filterSubject) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return (
                    plan.title.toLowerCase().includes(q) ||
                    plan.teacher_name.toLowerCase().includes(q) ||
                    plan.theme_area.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [plans, filterSubject, searchQuery]);

    // Toggle expand
    const toggleExpand = (id: number) => {
        setExpandedPlans(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Export to PDF
    const handleExportPDF = (plan?: Plan) => {
        const doc = new jsPDF();

        if (plan) {
            // Single plan export
            doc.setFontSize(16);
            doc.text(plan.title, 14, 15);
            doc.setFontSize(10);
            doc.text(`Professor(a): ${plan.teacher_name}`, 14, 24);
            doc.text(`Disciplina: ${plan.subject} | Turma: ${plan.class_name}`, 14, 30);
            doc.text(`Período: ${new Date(plan.start_date).toLocaleDateString('pt-BR')} - ${new Date(plan.end_date).toLocaleDateString('pt-BR')}`, 14, 36);

            let y = 46;
            const sections = [
                { title: 'Objetivos', content: plan.objectives },
                { title: 'Metodologia', content: plan.methodology },
                { title: 'Recursos', content: plan.resources },
                { title: 'Avaliação', content: plan.assessment },
                { title: 'Área Temática', content: plan.theme_area },
                { title: 'Códigos BNCC', content: plan.bncc_codes },
            ];

            sections.forEach(sec => {
                if (sec.content) {
                    doc.setFontSize(11);
                    doc.setFont(undefined!, 'bold');
                    doc.text(sec.title, 14, y);
                    y += 6;
                    doc.setFont(undefined!, 'normal');
                    doc.setFontSize(9);
                    const lines = doc.splitTextToSize(sec.content, 180);
                    doc.text(lines, 14, y);
                    y += lines.length * 5 + 8;
                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }
                }
            });

            doc.save(`plano_${plan.id}_${plan.title.substring(0, 20)}.pdf`);
        } else {
            // All plans export
            doc.setFontSize(16);
            doc.text('Relatório de Planejamentos', 14, 15);
            doc.setFontSize(10);
            doc.text(`Escola: ${currentSchool?.name || 'Instituição'}`, 14, 22);
            doc.text(`Total: ${filtered.length} planejamentos`, 14, 28);

            autoTable(doc, {
                startY: 36,
                head: [['Título', 'Professor', 'Disciplina', 'Turma', 'Período']],
                body: filtered.map(p => [
                    p.title.substring(0, 30),
                    p.teacher_name,
                    p.subject,
                    p.class_name,
                    `${new Date(p.start_date).toLocaleDateString('pt-BR')} - ${new Date(p.end_date).toLocaleDateString('pt-BR')}`
                ]),
                styles: { fontSize: 8 },
                headStyles: { fillColor: [79, 70, 229] }
            });

            doc.save(`planejamentos_${new Date().toISOString().split('T')[0]}.pdf`);
        }
    };

    // Export to Editable Word (Hybrid)
    const handleExportDOCX = async (plan: Plan) => {
        try {
            // Dynamically import docx and file-saver only when needed
            const { Document, Packer, Paragraph, TextRun, ImageRun, Header, Footer, TextWrappingType, TextWrappingSide, HeightRule, WidthType, FrameAnchorType, HorizontalPositionAlign, VerticalPositionAlign } = await import('docx');
            const { saveAs } = await import('file-saver');

            // 1. Load the background image
            let backgroundBlob: Blob | null = null;
            let imageWidth = 794; // A4 width in pixels approx
            let imageHeight = 1123; // A4 height in pixels approx

            if (plan.files && plan.files.length > 0 && plan.files[0].file_url) {
                try {
                    const response = await fetch(plan.files[0].file_url);
                    backgroundBlob = await response.blob();
                } catch (e) {
                    console.error("Failed to load background image", e);
                }
            }

            // 2. Create the document sections (pages)
            const children = [];

            // If we have a background, add it as a full-page image in the header/body
            // Note: Word doesn't support "true" CSS background images easily. 
            // The best trick is an image anchored behind text.

            if (backgroundBlob) {
                const imageBuffer = await backgroundBlob.arrayBuffer();
                const image = new ImageRun({
                    data: imageBuffer,
                    transformation: {
                        width: imageWidth,
                        height: imageHeight,
                    },
                    floating: {
                        horizontalPosition: {
                            offset: 0 as any,
                        },
                        verticalPosition: {
                            offset: 0 as any,
                        },
                        behindDocument: true,
                    },
                    type: "png", // fallback type
                });
                children.push(new Paragraph({ children: [image] }));
            }

            // 3. Add Content Fields as Text Boxes (Frames)
            let elements: any[] = [];

            // Try to fetch template elements if available
            if (plan.template_id) {
                const { data: templateData } = await supabase
                    .from('planning_templates')
                    .select('elements')
                    .eq('id', plan.template_id)
                    .single();

                if (templateData?.elements) {
                    elements = templateData.elements;
                }
            }

            // Map of standard fields to potential element names
            // This is a fuzzy matching strategy
            const fieldMap: Record<string, string> = {
                'title': plan.title,
                'teacher_name': plan.teacher_name,
                'class_name': plan.class_name,
                'subject': plan.subject,
                'objectives': plan.objectives || '',
                'methodology': plan.methodology || '',
                'assessment': plan.assessment || '',
                'resources': plan.resources || '',
                'bncc_codes': plan.bncc_codes || '',
                'theme_area': plan.theme_area || ''
            };

            const elementChildren: any[] = [];

            if (elements.length > 0) {
                // We have layout! Use precise positioning.
                // We need to match Plan data to Elements.
                // Strategy: 
                // 1. If element.name matches a field key (e.g. "Objetivos"), use that value.
                // 2. If no match, leave it empty or put placeholder.

                elements.forEach(el => {
                    // Normalize name for matching
                    const normalizedName = el.name.toLowerCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                        .replace(/ /g, "_");

                    // Try to find a matching value
                    let value = "";

                    // Direct match
                    if (fieldMap[normalizedName]) value = fieldMap[normalizedName];

                    // Common Aliases
                    else if (normalizedName.includes("objetivo")) value = fieldMap['objectives'];
                    else if (normalizedName.includes("metodologia")) value = fieldMap['methodology'];
                    else if (normalizedName.includes("recurso")) value = fieldMap['resources'];
                    else if (normalizedName.includes("avaliacao")) value = fieldMap['assessment'];
                    else if (normalizedName.includes("titulo")) value = fieldMap['title'];
                    else if (normalizedName.includes("professor")) value = fieldMap['teacher_name'];
                    else if (normalizedName.includes("turma")) value = fieldMap['class_name'];
                    else if (normalizedName.includes("disciplina")) value = fieldMap['subject'];
                    else if (normalizedName.includes("bncc")) value = fieldMap['bncc_codes'];
                    else if (normalizedName.includes("tema")) value = fieldMap['theme_area'];

                    if (value) {
                        // Create a Text Frame at the specific position
                        // Note: DOCX coordinates are in Twips (1/1440 inch). 
                        // Our internal elements are likely in PX relative to a 794px width (A4 @ 96 DPI).
                        // Conversion factor: 1px = 15 twips approx (96 DPI).
                        // Actually, generic Word width is ~11900 twips. 794px * 15 = 11910. CLOSE ENOUGH.

                        const xTwips = Math.round(el.x * 15);
                        const yTwips = Math.round(el.y * 15);
                        const wTwips = Math.round(el.width * 15);
                        const hTwips = Math.round(el.height * 15);

                        elementChildren.push(
                            new Paragraph({
                                frame: {
                                    type: "absolute",
                                    position: {
                                        x: xTwips, // Absolute horizontal
                                        y: yTwips, // Absolute vertical
                                    },
                                    width: wTwips,
                                    height: hTwips,
                                    anchorLock: true,
                                    anchor: {
                                        horizontal: FrameAnchorType.TEXT,
                                        vertical: FrameAnchorType.TEXT
                                    }
                                },
                                children: [
                                    new TextRun({
                                        text: value,
                                        font: "Arial",
                                        size: 20, // 10pt
                                    })
                                ]
                            })
                        );
                    }
                });
            }

            if (elementChildren.length > 0) {
                children.push(...elementChildren);
            } else {
                // Fallback to list if no elements found
                const fieldStyles = {
                    font: "Arial",
                    size: 24, // 12pt
                };

                const createField = (label: string, value: string) => {
                    return [
                        new Paragraph({
                            children: [
                                new TextRun({ text: label, bold: true, ...fieldStyles }),
                            ],
                            spacing: { before: 200 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: value || "________________", ...fieldStyles })
                            ]
                        })
                    ];
                };

                children.push(
                    ...createField("Título do Plano:", plan.title),
                    ...createField("Professor:", plan.teacher_name),
                    ...createField("Turma:", plan.class_name),
                    ...createField("Disciplina:", plan.subject),
                    ...createField("Objetivos:", plan.objectives),
                    ...createField("Metodologia:", plan.methodology),
                    ...createField("Avaliação:", plan.assessment),
                    ...createField("Recursos:", plan.resources),
                );
            }


            const doc = new Document({
                sections: [{
                    properties: {},
                    children: children,
                }],
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, `plano_${plan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`);

        } catch (error) {
            console.error('Error exporting DOCX:', error);
            alert('Erro ao gerar documento Word. Tente novamente.');
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            </div>

            {/* Tabs */}
            <div className="flex bg-surface-subtle p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('plans')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'plans' ? 'bg-surface-card text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
                >
                    Planejamentos Enviados
                </button>
                <button
                    onClick={() => setActiveTab('templates')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'templates' ? 'bg-surface-card text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
                >
                    Modelos de Planejamento
                </button>
            </div>

            <div className="ml-auto">
                {activeTab === 'plans' && (
                    <button
                        onClick={() => handleExportPDF()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                    >
                        <Download size={18} />
                        Exportar Todos
                    </button>
                )}
            </div>


            {
                activeTab === 'templates' ? (
                    <InstitutionalPlanningTemplates />
                ) : (
                    <>
                        {/* Filters */}
                        <div className="bg-surface-card border border-border-default rounded-2xl p-4 space-y-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Subject Filter */}
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">
                                        Disciplina
                                    </label>
                                    <select
                                        value={filterSubject}
                                        onChange={e => setFilterSubject(e.target.value)}
                                        title="Filtrar por disciplina"
                                        className="w-full bg-surface-subtle border border-border-default rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    >
                                        <option value="all">Todas as disciplinas</option>
                                        {subjects.map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
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
                                            placeholder="Título, professor, tema..."
                                            className="w-full bg-surface-subtle border border-border-default rounded-xl py-3 pl-12 pr-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-surface-card border border-border-default rounded-2xl p-4 text-center">
                                <div className="text-3xl font-bold text-primary mb-1">{plans.length}</div>
                                <div className="text-xs text-text-muted uppercase font-bold">Total</div>
                            </div>
                            <div className="bg-surface-card border border-border-default rounded-2xl p-4 text-center">
                                <div className="text-3xl font-bold text-text-primary mb-1">{subjects.length}</div>
                                <div className="text-xs text-text-muted uppercase font-bold">Disciplinas</div>
                            </div>
                            <div className="bg-surface-card border border-border-default rounded-2xl p-4 text-center">
                                <div className="text-3xl font-bold text-text-primary mb-1">{new Set(plans.map(p => p.teacher_name)).size}</div>
                                <div className="text-xs text-text-muted uppercase font-bold">Professores</div>
                            </div>
                            <div className="bg-surface-card border border-border-default rounded-2xl p-4 text-center">
                                <div className="text-3xl font-bold text-text-primary mb-1">{filtered.length}</div>
                                <div className="text-xs text-text-muted uppercase font-bold">Filtrados</div>
                            </div>
                        </div>

                        {/* Plans List */}
                        <div className="space-y-4">
                            {filtered.length === 0 ? (
                                <div className="bg-surface-card border border-border-default rounded-2xl p-12 text-center text-text-muted">
                                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>Nenhum planejamento encontrado</p>
                                </div>
                            ) : (
                                filtered.map(plan => {
                                    const isExpanded = expandedPlans.has(plan.id);
                                    return (
                                        <motion.div
                                            key={plan.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="bg-surface-card border border-border-default rounded-2xl overflow-hidden"
                                        >
                                            {/* Header */}
                                            <div
                                                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-surface-subtle/50 transition-colors"
                                                onClick={() => toggleExpand(plan.id)}
                                            >
                                                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                                    <FileText size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-text-primary truncate">{plan.title}</h3>
                                                    <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <User size={12} />
                                                            {plan.teacher_name}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <BookOpen size={12} />
                                                            {plan.subject}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {new Date(plan.start_date).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedPlan(plan); }}
                                                        className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                        title="Ver detalhes"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleExportPDF(plan); }}
                                                        className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                        title="Exportar PDF"
                                                    >
                                                        <Download size={18} />
                                                    </button>
                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </div>
                                            </div>

                                            {/* Expanded Content */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="border-t border-border-default"
                                                    >
                                                        <div className="p-4 bg-surface-subtle/30 space-y-3">
                                                            {plan.objectives && (
                                                                <div>
                                                                    <span className="text-xs font-bold text-text-muted uppercase">Objetivos:</span>
                                                                    <p className="text-sm text-text-secondary mt-1">{plan.objectives}</p>
                                                                </div>
                                                            )}
                                                            {plan.methodology && (
                                                                <div>
                                                                    <span className="text-xs font-bold text-text-muted uppercase">Metodologia:</span>
                                                                    <p className="text-sm text-text-secondary mt-1">{plan.methodology}</p>
                                                                </div>
                                                            )}
                                                            {plan.bncc_codes && (
                                                                <div>
                                                                    <span className="text-xs font-bold text-text-muted uppercase">Códigos BNCC:</span>
                                                                    <p className="text-sm text-text-secondary mt-1">{plan.bncc_codes}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>

                        {/* Detail Modal */}
                        <AnimatePresence>
                            {selectedPlan && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                                    onClick={() => setSelectedPlan(null)}
                                >
                                    <motion.div
                                        initial={{ scale: 0.95, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.95, opacity: 0 }}
                                        className="bg-surface-card rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="p-6 border-b border-border-default flex items-center justify-between">
                                            <h2 className="text-xl font-bold text-text-primary">{selectedPlan.title}</h2>
                                            <button onClick={() => setSelectedPlan(null)} title="Fechar" className="p-2 hover:bg-surface-subtle rounded-lg">
                                                <X size={20} />
                                            </button>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-text-muted">Professor:</span>
                                                    <p className="font-medium">{selectedPlan.teacher_name}</p>
                                                </div>
                                                <div>
                                                    <span className="text-text-muted">Disciplina:</span>
                                                    <p className="font-medium">{selectedPlan.subject}</p>
                                                </div>
                                                <div>
                                                    <span className="text-text-muted">Turma:</span>
                                                    <p className="font-medium">{selectedPlan.class_name}</p>
                                                </div>
                                                <div>
                                                    <span className="text-text-muted">Período:</span>
                                                    <p className="font-medium">
                                                        {new Date(selectedPlan.start_date).toLocaleDateString('pt-BR')} - {new Date(selectedPlan.end_date).toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                            </div>
                                            {selectedPlan.theme_area && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-text-muted uppercase mb-1">Área Temática</h4>
                                                    <p className="text-sm text-text-secondary">{selectedPlan.theme_area}</p>
                                                </div>
                                            )}
                                            {selectedPlan.objectives && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-text-muted uppercase mb-1">Objetivos</h4>
                                                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{selectedPlan.objectives}</p>
                                                </div>
                                            )}
                                            {selectedPlan.methodology && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-text-muted uppercase mb-1">Metodologia</h4>
                                                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{selectedPlan.methodology}</p>
                                                </div>
                                            )}
                                            {selectedPlan.resources && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-text-muted uppercase mb-1">Recursos</h4>
                                                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{selectedPlan.resources}</p>
                                                </div>
                                            )}
                                            {selectedPlan.assessment && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-text-muted uppercase mb-1">Avaliação</h4>
                                                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{selectedPlan.assessment}</p>
                                                </div>
                                            )}
                                            {selectedPlan.bncc_codes && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-text-muted uppercase mb-1">Códigos BNCC</h4>
                                                    <p className="text-sm text-text-secondary">{selectedPlan.bncc_codes}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 border-t border-border-default flex justify-end gap-2">
                                            <button
                                                onClick={() => handleExportDOCX(selectedPlan)}
                                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90"
                                            >
                                                <FileText size={18} />
                                                Baixar Word Editável
                                            </button>
                                            <button
                                                onClick={() => handleExportPDF(selectedPlan)}
                                                className="flex items-center gap-2 px-4 py-2 bg-surface-subtle text-text-primary rounded-xl font-medium hover:bg-surface-elevated border border-border-default"
                                            >
                                                <Download size={18} />
                                                PDF
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )
            }
        </div >
    );
}
