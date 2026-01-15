
import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';
import { Student, Grades as GradesType } from '../types';
import DOMPurify from 'dompurify';
import { UNIT_CONFIGS, calculateUnitTotal, calculateAnnualSummary, getStatusResult } from '../utils/gradeCalculations';

// UNIT_CONFIGS removed (imported from utils)

interface GradeData {
    [key: string]: number;
}

interface ExportConfig {
    units: {
        '1': boolean;
        '2': boolean;
        '3': boolean;
        'final': boolean;
        'recovery': boolean;
        'results': boolean;
    };
    detailed: boolean;
}

interface GradeRecord {
    id: string;
    student_id: number;
    unit: string;
    data: GradeData;
    user_id: string;
}

export const Grades: React.FC = () => {
    const { selectedSeriesId, selectedSection, activeSeries } = useClass();
    const { currentUser, activeSubject } = useAuth();
    const theme = useTheme();
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedUnit, setSelectedUnit] = useState<string>('1');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportConfig, setExportConfig] = useState<ExportConfig>({
        units: { '1': true, '2': true, '3': true, 'final': true, 'recovery': true, 'results': true },
        detailed: true
    });

    // Track pending changes: { studentId: { field: value } }
    const pendingChangesRef = useRef<{ [studentId: string]: GradeData }>({});
    const saveTimeoutRefs = useRef<{ [key: string]: NodeJS.Timeout }>({});

    // Fetch Data
    const fetchData = async (silent = false) => {
        if (!currentUser || !selectedSeriesId || !selectedSection) return;
        if (!silent) setLoading(true);
        try {
            // 1. Fetch Students
            const { data: studentsData, error: studentsError } = await supabase
                .from('students')
                .select('*')
                .eq('series_id', selectedSeriesId)
                .eq('section', selectedSection)
                .eq('user_id', currentUser.id)
                .order('number', { ascending: true });

            if (studentsError) throw studentsError;

            // 2. Fetch Grades (from new table)
            const studentIds = studentsData.map(s => s.id);
            const { data: gradesData, error: gradesError } = await supabase
                .from('grades')
                .select('*')
                .in('student_id', studentIds)
                .eq('subject', activeSubject)
                .eq('user_id', currentUser.id); // Security check

            if (gradesError) throw gradesError;

            // 3. Merge
            const formatted: Student[] = studentsData.map(s => {
                // Find all grade records for this student
                const sGrades = gradesData?.filter(g => g.student_id === s.id) || [];
                const unitsMap: any = {};

                sGrades.forEach(g => {
                    unitsMap[g.unit] = g.data || {};
                });

                return {
                    id: s.id.toString(),
                    name: s.name,
                    number: s.number,
                    initials: s.initials || '',
                    color: s.color || '',
                    classId: s.series_id.toString(),
                    section: s.section,
                    userId: s.user_id,
                    units: unitsMap
                };
            });

            setStudents(formatted);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedSeriesId && selectedSection) {
            fetchData();
        }
    }, [selectedSeriesId, selectedSection, currentUser, activeSubject]);

    // Save to DB
    const saveToDB = async (studentId: string) => {
        const changes = pendingChangesRef.current[studentId];
        if (!changes || Object.keys(changes).length === 0) return;
    };

    const studentsRef = useRef(students);
    useEffect(() => { studentsRef.current = students; }, [students]);

    const handleGradeChange = (studentId: string, field: string, value: string) => {
        const numericValue = value === '' ? null : parseFloat(value);
        if (value !== '' && (numericValue === null || isNaN(numericValue))) return;

        // 1. Optimistic Update
        setStudents(prev => prev.map(s => {
            if (s.id === studentId) {
                const newUnits = { ...s.units };
                if (!newUnits[selectedUnit]) newUnits[selectedUnit] = {};

                // Dynamic Max Calculation
                const col = UNIT_CONFIGS[selectedUnit as keyof typeof UNIT_CONFIGS]?.columns.find(c => c.key === field);
                let currentMax = col ? col.max : 10;

                // Unit 3 Special Rule: If Talent Show > 0, Exam Max is 8
                if (selectedUnit === '3') {
                    const talentShowVal = field === 'talentShow'
                        ? numericValue
                        : (Number(newUnits[selectedUnit]['talentShow']) || 0);

                    if (field === 'exam' && talentShowVal > 0) {
                        currentMax = 8.0;
                    }
                }

                let finalVal = numericValue;
                if (finalVal > currentMax) finalVal = currentMax;

                newUnits[selectedUnit] = {
                    ...newUnits[selectedUnit],
                    [field]: numericValue === null ? '' : finalVal
                };

                // Side Effect: If updating 'talentShow' in Unit 3, check if 'exam' needs clamping
                if (selectedUnit === '3' && field === 'talentShow') {
                    const currentExam = Number(newUnits[selectedUnit]['exam']);
                    if (numericValue > 0 && !isNaN(currentExam) && currentExam > 8) {
                        newUnits[selectedUnit]['exam'] = 8.0;
                    }
                }

                return { ...s, units: newUnits };
            }
            return s;
        }));

        // 2. Debounced Save
        setIsSaving(true);
        if (saveTimeoutRefs.current[studentId]) clearTimeout(saveTimeoutRefs.current[studentId]);

        saveTimeoutRefs.current[studentId] = setTimeout(async () => {
            try {
                // Get latest student state from Ref
                const student = studentsRef.current.find(s => s.id === studentId);
                if (!student) return;

                const unitData = student.units[selectedUnit] || {};

                console.log(`Saving grades for ${student.name} (Unit ${selectedUnit})...`);

                const payload = {
                    student_id: parseInt(studentId), // Ensure ID is number if DB expects bigint
                    unit: selectedUnit,
                    data: unitData,
                    user_id: currentUser!.id,
                    series_id: parseInt(selectedSeriesId!),
                    section: selectedSection,
                    subject: activeSubject
                };

                const { error } = await supabase
                    .from('grades')
                    .upsert(payload, { onConflict: 'student_id, unit, subject' });

                if (error) throw error;
                console.log("Saved successfully.");

            } catch (err: any) {
                console.error("Save failed:", err);
                alert(`Erro ao salvar: ${err.message}`);
            } finally {
                delete saveTimeoutRefs.current[studentId];
                if (Object.keys(saveTimeoutRefs.current).length === 0) setIsSaving(false);
            }
        }, 1000);
    };

    const getGrade = (student: Student, field: string) => {
        return student.units?.[selectedUnit]?.[field]?.toString() || '';
    };

    // calculateUnitTotal removed (imported from utils)

    const calculateTotal = (student: Student) => {
        // Only used for Unit 1, 2, 3 display
        return calculateUnitTotal(student, selectedUnit);
    };

    // calculateAnnualSummary removed (imported from utils)

    const getFinalResult = (student: Student) => {
        return getStatusResult(student, selectedUnit);
    }

    // Utility to convert tailwind color names or hex to RGB for jsPDF
    const getThemeRGB = (colorClass: string): [number, number, number] => {
        const map: Record<string, [number, number, number]> = {
            'indigo-600': [79, 70, 229],
            'emerald-600': [5, 150, 105],
            'rose-600': [225, 29, 72],
            'amber-600': [217, 119, 6],
            'slate-600': [71, 85, 105],
        };
        return map[colorClass] || [79, 70, 229];
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        const primaryRGB = getThemeRGB(`${theme.baseColor}-600`);

        // --- HELPER: Draw Premium Header ---
        const drawHeader = () => {
            doc.setFillColor(...primaryRGB);
            doc.rect(0, 0, 210, 40, 'F');

            // Circles
            doc.setFillColor(255, 255, 255);
            doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
            doc.circle(190, 10, 40, 'F');
            doc.circle(20, 50, 30, 'F');
            doc.setGState(new (doc as any).GState({ opacity: 1 }));

            // Brand
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('CENSC', 14, 25);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Centro Educacional Nossa Sra do Cenáculo', 14, 32);

            // Badge
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(135, 10, 60, 20, 3, 3, 'F');
            doc.setTextColor(...primaryRGB);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('RELATÓRIO DE NOTAS', 165, 17, { align: 'center' });

            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text(`${activeSeries?.name} - ${selectedSection}`, 165, 22, { align: 'center' });
            doc.text(currentUser?.name?.toUpperCase() || '', 165, 26, { align: 'center' });
        };

        drawHeader();

        let currentY = 50;
        const keysToCheck = ['1', '2', '3', 'final', 'recovery', 'results'] as const;

        keysToCheck.forEach((key) => {
            if (!exportConfig.units[key]) return;

            // Filter Students Logic
            const filtered = students.filter(s => {
                if (key === '1' || key === '2' || key === '3' || key === 'results') return true;
                const { baseTotal, status } = calculateAnnualSummary(s);
                if (key === 'final') return baseTotal >= 8.0 && baseTotal < 18.0;
                if (key === 'recovery') return status === 'RECOVERY';
                return true;
            });

            if (filtered.length === 0 && key !== 'results') return;

            // Title
            const title = key === 'final' ? 'Prova Final' : key === 'recovery' ? 'Recuperação' : key === 'results' ? 'Resultado Final Anual' : `${key}ª Unidade`;

            doc.setFillColor(30, 41, 59);
            doc.circle(16, currentY - 2, 2, 'F');
            doc.setFontSize(12);
            doc.setTextColor(30, 41, 59);
            doc.setFont('helvetica', 'bold');
            doc.text(title.toUpperCase(), 22, currentY);

            // Build Table Data
            let headCols = ['Nº', 'ALUNO'];
            const config = UNIT_CONFIGS[key as keyof typeof UNIT_CONFIGS];

            if (key !== 'results' && exportConfig.detailed && config) {
                headCols = [...headCols, ...config.columns.map((c: any) => c.label.toUpperCase())];
            }

            if (key === 'results') {
                headCols.push('TOTAL ANUAL', 'SITUAÇÃO');
            } else {
                headCols.push(key === 'final' || key === 'recovery' ? 'STATUS' : 'MÉDIA');
            }

            const body = filtered.map(s => {
                const row: any[] = [s.number, s.name];

                if (key !== 'results' && exportConfig.detailed && config) {
                    config.columns.forEach((col: any) => {
                        row.push(getGrade(s, col.key) || '-');
                    });
                }

                if (key === 'results') {
                    const { annualTotal } = calculateAnnualSummary(s);
                    const res = getFinalResult(s);
                    row.push(annualTotal.toFixed(1));
                    row.push(res.text); // Will be replaced by badge
                } else if (key === 'final' || key === 'recovery') {
                    const res = getFinalResult(s);
                    row.push(res.text); // Will be replaced by badge
                } else {
                    const avg = calculateUnitTotal(s, key);
                    row.push(avg.toFixed(1));
                }

                return row;
            });

            autoTable(doc, {
                startY: currentY + 5,
                head: [headCols],
                body: body,
                theme: 'grid',
                styles: {
                    fontSize: 8,
                    cellPadding: 3,
                    valign: 'middle',
                    halign: 'center',
                    lineColor: [241, 245, 249],
                    lineWidth: 0.1,
                    textColor: [71, 85, 105]
                },
                headStyles: {
                    fillColor: [248, 250, 252],
                    textColor: [71, 85, 105],
                    fontStyle: 'bold',
                    lineWidth: 0,
                },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 15 },
                    1: { halign: 'left', cellWidth: 60, fontStyle: 'bold' },
                    [headCols.length - 1]: { fontStyle: 'bold' }
                },
                didParseCell: (data) => {
                    // Color Low Grades Red
                    if (data.section === 'body' && data.column.index > 1) {
                        const val = parseFloat(data.cell.raw as string);
                        if (!isNaN(val) && val < 6.0) {
                            data.cell.styles.textColor = [239, 68, 68];
                        }
                    }
                },
                didDrawCell: (data) => {
                    // Draw Badges for Status/Result
                    const isResultCol = (key === 'results' && data.column.index === headCols.length - 1);
                    const isStatusCol = ((key === 'final' || key === 'recovery') && data.column.index === headCols.length - 1);

                    if (data.section === 'body' && (isResultCol || isStatusCol)) {
                        const text = data.cell.raw as string;
                        // Hide original text
                        // Actually autoTable will draw text after this hook if we don't return false or something? 
                        // Wait, didDrawCell is called AFTER text. 
                        // Better to clear text in didParseCell if we want to custom draw fully.

                        // Let's just draw a colored RECT behind the text? No, text color needs to be white.

                        const x = data.cell.x + 2;
                        const y = data.cell.y + 2;
                        const w = data.cell.width - 4;
                        const h = data.cell.height - 4;

                        let color: [number, number, number] = [148, 163, 184]; // Slate
                        if (text.includes('Aprovado')) color = [34, 197, 94]; // Green
                        else if (text.includes('Reprovado') || text.includes('Perdeu')) color = [239, 68, 68]; // Red
                        else if (text.includes('Recuperação') || text.includes('Prova Final')) color = [245, 158, 11]; // Amber

                        doc.setFillColor(...color);
                        doc.roundedRect(x, y, w, h, 2, 2, 'F');

                        doc.setTextColor(255, 255, 255);
                        doc.setFontSize(7);
                        doc.setFont("helvetica");
                        doc.setFont("helvetica", "bold");
                        doc.text(text, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: 'center' });
                    }
                },
                willDrawCell: (data) => {
                    // Suppress default text for badge columns
                    const isResultCol = (key === 'results' && data.column.index === headCols.length - 1);
                    const isStatusCol = ((key === 'final' || key === 'recovery') && data.column.index === headCols.length - 1);
                    if (data.section === 'body' && (isResultCol || isStatusCol)) {
                        data.cell.text = [];
                    }
                }
            });

            currentY = (doc as any).lastAutoTable.finalY + 15;

            // New Page check
            if (currentY > 250) {
                doc.addPage();
                drawHeader();
                currentY = 50;
            }
        });

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Página ${i} de ${pageCount} • Gerado por Prof. Acerta+`, 105, 290, { align: 'center' });
        }

        doc.save(`Notas_${activeSeries?.name}_${selectedSection}.pdf`);
        setShowExportModal(false);
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                <div className="space-y-4">
                    <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/3"></div>
                    <div className="grid grid-cols-1 gap-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-14 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const currentConfig = UNIT_CONFIGS[selectedUnit as keyof typeof UNIT_CONFIGS];

    // Filter students for display
    const visibleStudents = students.filter(s => {
        if (selectedUnit === '1' || selectedUnit === '2' || selectedUnit === '3' || selectedUnit === 'results') return true;

        const { baseTotal, status } = calculateAnnualSummary(s);

        if (selectedUnit === 'final') {
            // Show all students who qualify for the Final phase (8.0 to 17.9)
            // even if they already failed it (so the teacher can fix the grade)
            return baseTotal >= 8.0 && baseTotal < 18.0;
        }

        if (selectedUnit === 'recovery') {
            // Show all who are in Recovery phase (Directly < 8 OR failed Final)
            return status === 'RECOVERY';
        }

        return true;
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Controls */}
            <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto max-w-full" data-tour="grades-units">
                    {['1', '2', '3', 'final', 'recovery', 'results'].map((unit) => (
                        <button
                            key={unit}
                            onClick={() => setSelectedUnit(unit)}
                            className={`px-4 py-2 mobile-landscape-compact rounded-md text-sm font-bold transition-all duration-200 whitespace-nowrap ${selectedUnit === unit
                                ? `bg-${theme.baseColor}-600 dark:bg-${theme.baseColor}-500 text-white shadow-md transform scale-105`
                                : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                                }`}
                        >
                            <span className="mobile-landscape-hidden">
                                {unit === 'final' ? 'Prova Final' : unit === 'recovery' ? 'Recuperação' : unit === 'results' ? 'Resultado' : `${unit}ª Unidade`}
                            </span>
                            <span className="hidden mobile-landscape-block">
                                {unit === 'final' ? 'Final' : unit === 'recovery' ? 'Recup.' : unit === 'results' ? 'Total' : `${unit}ª`}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    {/* Saving Indicator */}
                    {isSaving ? (
                        <span className="flex items-center text-amber-500 text-sm font-bold bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 transition-all">
                            <span className="material-symbols-outlined text-sm mr-2 animate-pulse">cloud_upload</span>
                            Salvando...
                        </span>
                    ) : (
                        <span className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-bold bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 mobile-landscape-compact rounded-full border border-emerald-200 dark:border-emerald-800 transition-all">
                            <span className="material-symbols-outlined text-sm mr-2 mobile-landscape-mr-0">check_circle</span>
                            <span className="mobile-landscape-hidden">Salvo</span>
                        </span>
                    )}

                    <button
                        onClick={() => setShowExportModal(true)}
                        className={`flex items-center space-x-2 px-4 py-2 mobile-landscape-compact bg-${theme.baseColor}-500 hover:bg-${theme.baseColor}-600 text-white rounded-lg transition-colors shadow-md shadow-${theme.baseColor}-500/20`}
                        data-tour="grades-export"
                    >
                        <span className="material-symbols-outlined text-lg">download</span>
                        <span className="mobile-landscape-hidden">Exportar PDF</span>
                    </button>
                </div>
            </div>

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in max-h-[90vh] flex flex-col">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 shrink-0">
                            <span className="material-symbols-outlined text-indigo-600">settings</span>
                            Configurar Relatório PDF
                        </h3>

                        <div className="space-y-4 mb-6 overflow-y-auto custom-scrollbar flex-1 pr-2">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Unidades para Incluir:</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['1', '2', '3', 'final', 'recovery', 'results'] as const).map(key => (
                                        <label key={key} className="flex items-center space-x-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={exportConfig.units[key]}
                                                onChange={e => setExportConfig(prev => ({
                                                    ...prev,
                                                    units: { ...prev.units, [key]: e.target.checked }
                                                }))}
                                                className="rounded text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-slate-600 dark:text-slate-300 font-bold">
                                                {{
                                                    '1': '1ª Unidade',
                                                    '2': '2ª Unidade',
                                                    '3': '3ª Unidade',
                                                    'final': 'Prova Final',
                                                    'recovery': 'Recuperação',
                                                    'results': 'Resultado Final'
                                                }[key]}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={exportConfig.detailed}
                                        onChange={e => setExportConfig(prev => ({ ...prev, detailed: e.target.checked }))}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Detalhar colunas de notas</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 shrink-0 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={exportPDF}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-all flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">download</span>
                                Gerar PDF
                            </button>
                        </div>
                    </div>

                    {/* Mobile Landscape Compact Controls */}
                    <div className="hidden mobile-landscape-flex-row w-full items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">{activeSeries?.name || 'Série?'} - {selectedSection}</span>
                            <span className="text-slate-300">|</span>
                            <select
                                value={selectedUnit}
                                onChange={(e) => setSelectedUnit(Number(e.target.value))}
                                className="bg-transparent text-xs font-bold text-indigo-600 dark:text-indigo-400 border-none outline-none p-0 cursor-pointer"
                                aria-label="Seletor de Unidade"
                            >
                                {[1, 2, 3, 4].map(unit => (
                                    <option key={unit} value={unit} className="text-slate-800 dark:text-white bg-white dark:bg-slate-800">{unit}ª Un.</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    alert("Use o modo retrato para trocar de turma.");
                                }}
                                className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg text-slate-500 dark:text-slate-400"
                            >
                                <span className="material-symbols-outlined text-[18px]">tune</span>
                            </button>
                            <button onClick={() => setShowExportModal(true)} className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-lg">
                                <span className="material-symbols-outlined text-[18px]">download</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Grades Table */}
            <div className="glass-panel rounded-xl overflow-hidden shadow-lg border border-slate-200/60 dark:border-slate-700/60">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className={`bg-${theme.baseColor}-50 dark:bg-slate-800 border-b border-${theme.baseColor}-100 dark:border-slate-700`}>
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-16">
                                    Nº
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Nome
                                </th>
                                {selectedUnit === 'results' ? (
                                    <>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Total Anual
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Situação Final
                                        </th>
                                    </>
                                ) : (
                                    <>
                                        {currentConfig?.columns.map((col) => (
                                            <th key={col.key} className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-32">
                                                <div className="flex flex-col items-center">
                                                    <span>{col.label}</span>
                                                    <span className="text-[10px] opacity-70 font-normal">
                                                        (Max: {col.max})
                                                    </span>
                                                </div>
                                            </th>
                                        ))}
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-40 bg-slate-50/50 dark:bg-slate-800/50">
                                            {(selectedUnit === 'final' || selectedUnit === 'recovery') ? 'Situação' : 'Média'}
                                        </th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {visibleStudents.map((student) => {
                                // RESULTS TAB ROW
                                if (selectedUnit === 'results') {
                                    const { annualTotal } = calculateAnnualSummary(student);
                                    const res = getFinalResult(student);
                                    return (
                                        <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 font-mono">
                                                {student.number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br ${student.color} flex items-center justify-center text-white text-xs font-bold shadow-sm mr-3`}>
                                                        {student.initials}
                                                    </div>
                                                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                                                        {student.name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-slate-700 dark:text-slate-300">
                                                {annualTotal.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">pts</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${res.bg} ${res.color}`}>
                                                    {res.text}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                }

                                return (
                                    <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 font-mono">
                                            {student.number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br ${student.color} flex items-center justify-center text-white text-xs font-bold shadow-sm mr-3`}>
                                                    {student.initials}
                                                </div>
                                                <div className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {student.name}
                                                </div>
                                            </div>
                                        </td>
                                        {currentConfig?.columns.map((col) => {
                                            let currentMax = col.max;
                                            if (selectedUnit === '3' && col.key === 'exam') {
                                                const talentShowVal = Number(getGrade(student, 'talentShow')) || 0;
                                                if (talentShowVal > 0) currentMax = 8.0;
                                            }

                                            return (
                                                <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="number"
                                                        inputMode="decimal"
                                                        min="0"
                                                        max={currentMax}
                                                        step="0.1"
                                                        className={`w-full min-w-[60px] text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-${theme.baseColor}-500 focus:border-transparent transition-all font-mono text-sm`}
                                                        value={getGrade(student, col.key)}
                                                        onChange={(e) => handleGradeChange(student.id, col.key, e.target.value)}
                                                        placeholder="-"
                                                    />
                                                </td>
                                            );
                                        })}
                                        <td className="px-6 py-4 whitespace-nowrap text-center bg-slate-50/30 dark:bg-slate-800/30">
                                            {(selectedUnit === 'final' || selectedUnit === 'recovery') ? (
                                                (() => {
                                                    const res = getFinalResult(student);
                                                    return (
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${res.bg} ${res.color}`}>
                                                            {res.text}
                                                        </span>
                                                    )
                                                })()
                                            ) : (
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${calculateTotal(student) >= 6
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                                                    }`}>
                                                    {calculateTotal(student).toFixed(1)}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>

                    {visibleStudents.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-slate-500 dark:text-slate-400">
                                {selectedUnit === 'final' ? 'Nenhum aluno em Prova Final.' :
                                    selectedUnit === 'recovery' ? 'Nenhum aluno em Recuperação.' :
                                        'Nenhum aluno encontrado nesta turma.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};