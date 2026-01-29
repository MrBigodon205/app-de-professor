
import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import { useTheme } from '../hooks/useTheme';
import { Student, Grades as GradesType } from '../types';
import { supabase } from '../lib/supabase';
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

interface GradeRowProps {
    student: Student;
    selectedUnit: string;
    theme: any;
    onGradeChange: (studentId: string, field: string, value: string) => void;
}

const GradeRow = React.memo(({ student, selectedUnit, theme, onGradeChange }: GradeRowProps) => {
    const currentConfig = UNIT_CONFIGS[selectedUnit as keyof typeof UNIT_CONFIGS];

    const getGrade = (field: string) => {
        return student.units?.[selectedUnit]?.[field]?.toString() || '';
    };

    const total = calculateUnitTotal(student, selectedUnit);
    const finalResult = getStatusResult(student, selectedUnit);

    // RESULTS TAB ROW
    if (selectedUnit === 'results') {
        const { annualTotal } = calculateAnnualSummary(student);
        const res = getStatusResult(student, 'results'); // Using standardized helper
        return (
            <motion.tr
                variants={{
                    hidden: { opacity: 0, y: 10, filter: "blur(5px)" },
                    visible: {
                        opacity: 1, y: 0, filter: "blur(0px)",
                        transition: { type: 'spring', stiffness: 120, damping: 14 }
                    }
                }}
                layoutId={`grade-row-res-${student.id}`}
                className="hover:bg-surface-subtle transition-colors duration-150"
            >
                <td className="sticky left-0 z-30 bg-surface-card px-4 py-4 whitespace-nowrap text-xs text-text-muted font-mono border-r border-transparent group-hover:bg-surface-subtle transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    {student.number}
                </td>
                <td className="sticky left-12 z-30 bg-surface-card px-4 py-4 whitespace-nowrap border-r border-transparent group-hover:bg-surface-subtle transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-3">
                        <div className={`student-avatar size-8 text-xs bg-gradient-to-br ${student.color || 'from-indigo-600 to-indigo-800'}`}>
                            {student.initials}
                        </div>
                        <div className="text-xs font-bold text-text-primary">
                            {student.name}
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-text-primary">
                    {annualTotal.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">pts</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${res.bg} ${res.color}`}>
                        {res.text}
                    </span>
                </td>
            </motion.tr>
        );
    }

    return (
        <motion.tr
            variants={{
                hidden: { opacity: 0, y: 10, filter: "blur(5px)" },
                visible: {
                    opacity: 1, y: 0, filter: "blur(0px)",
                    transition: { type: 'spring', stiffness: 120, damping: 14 }
                }
            }}
            layoutId={`grade-row-${student.id}`}
            className="group hover:bg-surface-subtle transition-colors duration-150"
        >
            <td className="sticky left-0 z-30 bg-surface-card px-4 py-4 whitespace-nowrap text-xs text-text-muted font-mono border-r border-transparent group-hover:bg-surface-subtle transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                {student.number}
            </td>
            <td className="sticky left-12 z-30 bg-surface-card px-4 py-4 whitespace-nowrap border-r border-transparent group-hover:bg-surface-subtle transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-3">
                    <div className={`student-avatar size-8 text-xs bg-gradient-to-br ${student.color || 'from-indigo-600 to-indigo-800'}`}>
                        {student.initials}
                    </div>
                    <div className="text-xs font-bold text-text-primary truncate max-w-[150px]">
                        {student.name}
                    </div>
                </div>
            </td>
            {currentConfig?.columns.map((col: any) => {
                let currentMax = col.max;
                if (selectedUnit === '3' && col.key === 'exam') {
                    const talentShowVal = Number(student.units?.['3']?.['talentShow']) || 0;
                    if (talentShowVal > 0) currentMax = 8.0;
                }

                return (
                    <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                        <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max={currentMax}
                            step="0.1"
                            className={`w-full min-w-[50px] text-center bg-surface-subtle border border-border-default rounded-lg px-1 py-1.5 focus:ring-2 focus:ring-${theme.baseColor}-500 focus:border-transparent transition-all font-mono text-xs shadow-sm`}
                            value={getGrade(col.key)}
                            onChange={(e) => onGradeChange(student.id, col.key, e.target.value)}
                            placeholder="-"
                        />
                    </td>
                );
            })}
            <td className="px-6 py-4 whitespace-nowrap text-center bg-surface-subtle/30">
                {(selectedUnit === 'final' || selectedUnit === 'recovery') ? (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${finalResult.bg} ${finalResult.color}`}>
                        {finalResult.text}
                    </span>
                ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${total >= 6
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                        }`}>
                        {total.toFixed(1)}
                    </span>
                )}
            </td>
        </motion.tr>
    );
});

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
    const saveTimeoutRefs = useRef<{ [key: string]: any }>({});


    // Fetch Data
    const fetchData = async (silent = false) => {
        if (!currentUser || !selectedSeriesId || !selectedSection) return;
        if (!silent) setLoading(true);
        try {
            // 1. Fetch Students (Online Only)
            const { data: studentsData, error: sError } = await supabase
                .from('students')
                .select('*')
                .eq('series_id', selectedSeriesId)
                .eq('section', selectedSection)
                .eq('user_id', currentUser.id)
                .order('number', { ascending: true });

            if (sError) throw sError;

            // 2. Fetch Grades (Online Only)
            const studentIds = studentsData.map(s => s.id);
            const { data: gradesData, error: gError } = await supabase
                .from('grades')
                .select('*')
                .in('student_id', studentIds)
                .eq('subject', activeSubject)
                .eq('user_id', currentUser.id);

            if (gError) throw gError;

            // 3. Merge
            const formatted: Student[] = studentsData.map(s => {
                const sGrades = gradesData?.filter(g => g.student_id.toString() === s.id.toString()) || [];
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
                    classId: s.series_id?.toString() || selectedSeriesId,
                    section: s.section,
                    userId: s.user_id,
                    units: unitsMap
                };
            });

            // Sort by number (Dexie might not return sorted)
            formatted.sort((a, b) => a.name.localeCompare(b.name));

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
        // Handle Brazilian locale (comma -> dot)
        const normalizedValue = value.replace(',', '.');
        const numericValue = value === '' ? null : parseFloat(normalizedValue);

        // Allow if it's a valid number OR if null (clearing)
        if (value !== '' && (numericValue === null || isNaN(numericValue))) return;

        // 1. Optimistic Update
        setStudents(prev => prev.map(s => {
            if (s.id === studentId) {
                const newUnits = { ...s.units };
                if (!newUnits[selectedUnit]) newUnits[selectedUnit] = {};

                // Dynamic Max Calculation
                const col = UNIT_CONFIGS[selectedUnit as keyof typeof UNIT_CONFIGS]?.columns.find((c: any) => c.key === field);
                let currentMax = col ? col.max : 10;

                // Unit 3 Special Rule: If Talent Show > 0, Exam Max is 8
                if (selectedUnit === '3') {
                    const talentShowVal = field === 'talentShow'
                        ? numericValue
                        : (Number(newUnits[selectedUnit]['talentShow']) || 0);

                    if (field === 'exam' && (talentShowVal || 0) > 0) {
                        currentMax = 8.0;
                    }
                }

                let finalVal = numericValue;
                if (finalVal !== null && finalVal > currentMax) finalVal = currentMax;

                newUnits[selectedUnit] = {
                    ...newUnits[selectedUnit],
                    [field]: numericValue === null ? '' : finalVal
                };

                // Side Effect: If updating 'talentShow' in Unit 3, check if 'exam' needs clamping
                if (selectedUnit === '3' && field === 'talentShow') {
                    const currentExam = Number(newUnits[selectedUnit]['exam']);
                    if (numericValue !== null && numericValue > 0 && !isNaN(currentExam) && currentExam > 8) {
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

                // Saving grades...

                const payload = {
                    student_id: parseInt(studentId), // Keep number for Supabase
                    unit: selectedUnit,
                    data: unitData,
                    user_id: currentUser!.id,
                    series_id: parseInt(selectedSeriesId!),
                    section: selectedSection,
                    subject: activeSubject
                };

                // 1. Direct Online Save
                await supabase
                    .from('grades')
                    .upsert(payload);

                // if (error) throw error; // No error throwing here, we handle sync errors in queue
                // Saved successfully locally.

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
                <div className="h-16 bg-surface-subtle rounded-xl"></div>
                <div className="space-y-4">
                    <div className="h-10 bg-surface-subtle rounded-lg w-1/3"></div>
                    <div className="grid grid-cols-1 gap-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-14 bg-surface-subtle rounded-lg border border-border-subtle"></div>
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
        <div className="space-y-4 md:space-y-6 pb-6 lg:pb-12">
            {/* ANIMATIONS */}
            <motion.div className="hidden" animate={{ opacity: 0 }} /> {/* Hack to ensure motion is used/defined if needed elsewhere */}
            {/* Header Controls */}
            <div className="glass-card-soft fluid-p-s flex flex-col md:flex-row justify-between items-center gap-4 mb-2">
                <div className="flex flex-wrap gap-2 bg-surface-subtle p-1 rounded-lg w-full md:w-auto" data-tour="grades-units">
                    {['1', '2', '3', 'final', 'recovery', 'results'].map((unit) => (
                        <button
                            key={unit}
                            onClick={() => setSelectedUnit(unit)}
                            className={`flex-1 md:flex-none px-3 py-2 rounded-md text-sm font-bold transition-all duration-200 whitespace-nowrap ${selectedUnit === unit
                                ? 'theme-active shadow-md transform scale-105'
                                : 'text-text-muted hover:bg-surface-card'
                                }`}
                        >
                            <span>
                                {unit === 'final' ? 'Final' : unit === 'recovery' ? 'Recuperação' : unit === 'results' ? 'Resultado' : `${unit}ª Unidade`}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">

                    {/* Saving Indicator */}
                    {isSaving ? (
                        <span className="hidden sm:flex items-center text-amber-500 text-sm font-bold bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 transition-all">
                            <span className="material-symbols-outlined text-sm mr-2 animate-pulse">cloud_upload</span>
                            Salvando...
                        </span>
                    ) : (
                        <span className="hidden sm:flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-bold bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 transition-all">
                            <span className="material-symbols-outlined text-sm mr-2">check_circle</span>
                            <span>Salvo</span>
                        </span>
                    )}

                    <button
                        onClick={() => setShowExportModal(true)}
                        className={`flex items-center space-x-2 px-4 py-2 bg-${theme.baseColor}-500 hover:bg-${theme.baseColor}-600 text-white rounded-lg transition-colors shadow-md shadow-${theme.baseColor}-500/20`}
                        data-tour="grades-export"
                    >
                        <span className="material-symbols-outlined text-lg">download</span>
                        <span>Exportar PDF</span>
                    </button>
                </div>
            </div>

            {/* Export Modal */}
            <AnimatePresence>
                {showExportModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-surface-card rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] flex flex-col"
                        >
                            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2 shrink-0">
                                <span className="material-symbols-outlined text-indigo-600">settings</span>
                                Configurar Relatório PDF
                            </h3>

                            <div className="space-y-4 mb-6 overflow-y-auto custom-scrollbar flex-1 pr-2">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">Unidades para Incluir:</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['1', '2', '3', 'final', 'recovery', 'results'] as const).map(key => (
                                            <label key={key} className="flex items-center space-x-2 p-2 rounded hover:bg-surface-subtle cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={exportConfig.units[key]}
                                                    onChange={e => setExportConfig(prev => ({
                                                        ...prev,
                                                        units: { ...prev.units, [key]: e.target.checked }
                                                    }))}
                                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-sm text-text-secondary font-bold">
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

                                <div className="pt-4 border-t border-border-default">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={exportConfig.detailed}
                                            onChange={e => setExportConfig(prev => ({ ...prev, detailed: e.target.checked }))}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-text-primary">Detalhar colunas de notas</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 shrink-0 pt-4 border-t border-border-default">
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className="px-4 py-2 text-text-muted hover:bg-surface-subtle rounded-lg transition-colors"
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
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="card overflow-hidden shadow-premium border-none">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] border-collapse">
                        <thead className={`bg-surface-subtle/50 backdrop-blur-md border-b border-border-default`}>
                            <tr>
                                <th className="sticky left-0 z-40 bg-surface-subtle/95 backdrop-blur-md px-4 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider w-12 border-b border-border-default shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    Nº
                                </th>
                                <th className="sticky left-12 z-40 bg-surface-subtle/95 backdrop-blur-md px-4 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider min-w-[180px] border-b border-border-default shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    Nome
                                </th>
                                {selectedUnit === 'results' ? (
                                    <>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-text-muted uppercase tracking-wider">
                                            Total Anual
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-text-muted uppercase tracking-wider">
                                            Situação Final
                                        </th>
                                    </>
                                ) : (
                                    <>
                                        {currentConfig?.columns.map((col: any) => (
                                            <th key={col.key} className="px-4 py-4 text-center text-xs font-bold text-text-muted uppercase tracking-wider w-32">
                                                <div className="flex flex-col items-center">
                                                    <span>{col.label}</span>
                                                    <span className="text-[10px] opacity-70 font-normal">
                                                        (Max: {col.max})
                                                    </span>
                                                </div>
                                            </th>
                                        ))}
                                        <th className="px-6 py-4 text-center text-xs font-bold text-text-muted uppercase tracking-wider w-40 bg-surface-subtle/50">
                                            {(selectedUnit === 'final' || selectedUnit === 'recovery') ? 'Situação' : 'Média'}
                                        </th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <motion.tbody
                            variants={{
                                hidden: { opacity: 0 },
                                visible: {
                                    opacity: 1,
                                    transition: { staggerChildren: 0.05 }
                                }
                            }}
                            initial="hidden"
                            animate="visible"
                            key={selectedUnit} // Key forces re-mount (and thus re-stagger) when unit changes
                            className="divide-y divide-border-subtle"
                        >
                            {visibleStudents.map((student) => (
                                <GradeRow
                                    key={student.id}
                                    student={student}
                                    selectedUnit={selectedUnit}
                                    theme={theme}
                                    onGradeChange={handleGradeChange}
                                />
                            ))}
                        </motion.tbody>
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
        </div >
    );
};