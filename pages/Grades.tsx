import React, { useState, useEffect, useRef, useCallback } from 'react';
// import jsPDF from 'jspdf'; // Dynamic
// import autoTable from 'jspdf-autotable'; // Dynamic
import { VARIANTS } from '../constants/motion';
import { motion } from 'framer-motion';
import { AnimatedRow } from '../components/ui/AnimatedRow';
import { AnimatedCard } from '../components/ui/AnimatedCard';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import { useTheme } from '../hooks/useTheme';
import { Student, Grades as GradesType } from '../types';
import { supabase } from '../lib/supabase';
import DOMPurify from 'dompurify';
import { UNIT_CONFIGS, calculateUnitTotal, calculateAnnualSummary, getStatusResult } from '../utils/gradeCalculations';

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

// MOBILE CARD COMPONENT
const MobileGradeCard = React.memo(({ student, selectedUnit, theme, onGradeChange }: GradeRowProps) => {
    const currentConfig = UNIT_CONFIGS[selectedUnit as keyof typeof UNIT_CONFIGS];
    const total = calculateUnitTotal(student, selectedUnit);
    const finalResult = getStatusResult(student, selectedUnit);

    return (
        <AnimatedCard
            className="bg-surface-card rounded-xl p-3 shadow-sm border border-border-default space-y-3"
        >
            {/* Header: Student Info & Total */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`student-avatar size-9 text-xs shrink-0 bg-gradient-to-br ${student.color || 'from-indigo-600 to-indigo-800'} text-white shadow-md flex items-center justify-center rounded-full font-bold`}>
                        {student.initials}
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-bold text-text-primary leading-tight truncate">
                            {student.number}. {student.name}
                        </div>
                    </div>
                </div>

                {selectedUnit !== 'results' && (
                    <div className={`shrink-0 flex flex-col items-end px-2 py-1 rounded bg-surface-subtle border border-border-default min-w-[60px]`}>
                        <span className="text-[9px] uppercase tracking-wider text-text-muted font-bold">Média</span>
                        <span className={`text-base font-black leading-none ${total >= 6 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {total.toFixed(1)}
                        </span>
                    </div>
                )}

                {selectedUnit === 'results' && (
                    <span className={`shrink-0 inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${finalResult.bg} ${finalResult.color}`}>
                        {finalResult.text}
                    </span>
                )}
            </div>

            {/* Content: Inputs or Results */}
            <div className={`pt-2 border-t border-border-subtle ${selectedUnit !== 'results' ? 'bg-surface-subtle/30 -mx-3 px-3 pb-2 mb-[-12px] rounded-b-xl' : ''}`}>
                {selectedUnit === 'results' ? (
                    <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-text-muted font-bold uppercase">Total Anual</span>
                        <span className="text-lg font-black text-text-primary">{calculateAnnualSummary(student).annualTotal.toFixed(1)} <span className="text-xs font-normal text-text-muted">pts</span></span>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                        {currentConfig?.columns.map((col: any) => {
                            let currentMax = col.max;
                            if (selectedUnit === '3' && col.key === 'exam') {
                                const talentShowVal = Number(student.units?.['3']?.['talentShow']) || 0;
                                if (talentShowVal > 0) currentMax = 8.0;
                            }
                            const val = student.units?.[selectedUnit]?.[col.key]?.toString() || '';

                            const inputId = `mobile-grade-${student.id}-${selectedUnit}-${col.key}`;

                            return (
                                <div key={col.key} className="flex flex-col bg-surface-card rounded border border-border-default/50 overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                                    <div className="flex justify-between items-center bg-surface-subtle/50 px-2 py-1 border-b border-border-default/30">
                                        <label htmlFor={inputId} className="text-[9px] font-bold text-text-secondary uppercase tracking-wider truncate cursor-pointer">
                                            {col.label}
                                        </label>
                                        <span className="text-[8px] text-text-muted font-mono bg-border-default/20 px-1 rounded">Max {currentMax}</span>
                                    </div>
                                    <input
                                        id={inputId}
                                        name={inputId}
                                        type="number"
                                        inputMode="decimal"
                                        className={`w-full bg-transparent px-2 py-1.5 text-sm font-mono text-center focus:outline-none`}
                                        placeholder="-"
                                        value={val}
                                        onChange={(e) => onGradeChange(student.id, col.key, e.target.value)}
                                    />
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </AnimatedCard>
    );
});

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
            <AnimatedRow
                className="hover:bg-surface-subtle transition-colors duration-150"
            >
                <td className="sticky left-0 z-30 bg-surface-card px-4 py-4 whitespace-nowrap text-xs text-text-muted font-mono border-r border-transparent group-hover:bg-surface-subtle transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    {student.number}
                </td>
                <td className="sticky left-12 z-30 bg-surface-card px-4 py-4 whitespace-nowrap border-r border-transparent group-hover:bg-surface-subtle transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-3">
                        <div className={`student-avatar size-8 text-xs bg-gradient-to-br ${student.color || 'from-indigo-600 to-indigo-800'} flex items-center justify-center rounded-full text-white font-bold`}>
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
            </AnimatedRow>
        );
    }

    return (
        <AnimatedRow
            className="group hover:bg-surface-subtle transition-colors duration-150"
        >
            <td className="sticky left-0 z-30 bg-surface-card px-4 py-4 whitespace-nowrap text-xs text-text-muted font-mono border-r border-transparent group-hover:bg-surface-subtle transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                {student.number}
            </td>
            <td className="sticky left-12 z-30 bg-surface-card px-4 py-4 whitespace-nowrap border-r border-transparent group-hover:bg-surface-subtle transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-3">
                    <div className={`student-avatar size-8 text-xs bg-gradient-to-br ${student.color || 'from-indigo-600 to-indigo-800'} flex items-center justify-center rounded-full text-white font-bold`}>
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
                const inputId = `desktop-grade-${student.id}-${selectedUnit}-${col.key}`;

                return (
                    <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                        <input
                            id={inputId}
                            name={inputId}
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max={currentMax}
                            step="0.1"
                            className={`w-full min-w-[50px] text-center bg-surface-subtle border border-border-default rounded-lg px-1 py-1.5 focus:ring-2 focus:ring-${theme.baseColor}-500 focus:border-transparent transition-all font-mono text-xs shadow-sm`}
                            value={getGrade(col.key)}
                            onChange={(e) => onGradeChange(student.id, col.key, e.target.value)}
                            placeholder="-"
                            aria-label={`${col.label} for ${student.name}`}
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
        </AnimatedRow>
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

    const handleGradeChange = useCallback((studentId: string, field: string, value: string) => {
        // Handle Brazilian locale (comma -> dot)
        const normalizedValue = value.replace(',', '.');
        const numericValue = value === '' ? null : parseFloat(normalizedValue);

        // Allow if it's a valid number OR if null (clearing)
        if (value !== '' && (numericValue === null || isNaN(numericValue))) return;

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
                    .upsert(payload, { onConflict: 'student_id, unit, subject' });

                // if (error) throw error; // No error throwing here, we handle sync errors in queue
                // Saved successfully locally.

            } catch (err: any) {
                console.error("Save failed:", err);
                // alert(`Erro ao salvar: ${err.message}`); // Disable alert for smoother typing
            } finally {
                delete saveTimeoutRefs.current[studentId];
                if (Object.keys(saveTimeoutRefs.current).length === 0) setIsSaving(false);
            }
        }, 1000);
    }, [selectedUnit, selectedSeriesId, selectedSection, currentUser, activeSubject]);

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

    const exportPDF = async () => {
        const { jsPDF } = await import('jspdf');
        const autoTable = (await import('jspdf-autotable')).default;

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
        <div
            className="space-y-4 md:space-y-6 pb-24 md:pb-12"
        >
            {/* ANIMATIONS - Removed hidden dummy, now using proper stagger on parent */}

            {/* Header Controls - Optmized for Mobile */}
            <div className="glass-card-soft p-2 md:p-4 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 md:static z-40 backdrop-blur-xl md:backdrop-blur-none bg-surface-page/80 md:bg-transparent -mx-4 px-4 md:mx-0 shadow-sm md:shadow-none border-b border-border-default/50 md:border-none">

                {/* Horizontal Scroll Unit Selector */}
                <div className="w-full md:w-auto overflow-x-auto custom-scrollbar pb-1 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0">
                    <div className="flex gap-2 min-w-max">
                        {['1', '2', '3', 'final', 'recovery', 'results'].map((unit) => (
                            <button
                                key={unit}
                                onClick={() => setSelectedUnit(unit)}
                                className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-200 whitespace-nowrap shadow-sm border ${selectedUnit === unit
                                    ? `bg-${theme.baseColor}-100 text-${theme.baseColor}-700 border-${theme.baseColor}-200 dark:bg-${theme.baseColor}-900/40 dark:text-${theme.baseColor}-300 dark:border-${theme.baseColor}-700 ring-2 ring-${theme.baseColor}-500/20`
                                    : 'bg-surface-card text-text-secondary border-border-default hover:bg-surface-subtle'
                                    }`}
                            >
                                {unit === 'final' ? 'Prova Final' : unit === 'recovery' ? 'Recuperação' : unit === 'results' ? 'Resultado Final' : `${unit}ª Unidade`}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                    {/* Saving Indicator */}
                    {isSaving ? (
                        <span className="flex items-center text-amber-500 text-xs font-bold bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800 transition-all">
                            <span className="material-symbols-outlined text-sm mr-2 animate-pulse">cloud_upload</span>
                            Salvando
                        </span>
                    ) : (
                        <span className="flex items-center text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 transition-all">
                            <span className="material-symbols-outlined text-sm mr-2">check_circle</span>
                            Salvo
                        </span>
                    )}

                    <button
                        onClick={() => setShowExportModal(true)}
                        className={`flex items-center space-x-2 px-4 py-2 bg-${theme.baseColor}-600 text-white rounded-lg shadow-lg shadow-${theme.baseColor}-500/30 active:scale-95 transition-all text-xs font-bold uppercase tracking-wide`}
                    >
                        <span className="material-symbols-outlined text-lg">download</span>
                        <span className="hidden sm:inline">Exportar PDF</span>
                    </button>
                </div>
            </div>

            {/* Export Modal (Logic remains same, just rendering access) */}
            {showExportModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                    {/* ... Modal Content Reuse ... */}
                    <div
                        className="bg-surface-card rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] flex flex-col border border-border-subtle"
                    >
                        <h3 className="text-lg font-black text-text-primary mb-4 flex items-center gap-2 shrink-0">
                            <span className={`material-symbols-outlined text-${theme.baseColor}-600`}>picture_as_pdf</span>
                            Relatório PDF
                        </h3>

                        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-1">
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Unidades</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.keys(exportConfig.units).map(key => (
                                        <label key={key} className="flex items-center gap-3 p-3 rounded-lg bg-surface-subtle/50 hover:bg-surface-subtle transition-colors cursor-pointer border border-border-default/50 group">
                                            <div
                                                className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all backdrop-blur-md ${exportConfig.units[key as keyof typeof exportConfig.units] ? 'theme-bg-primary border-primary shadow-lg shadow-primary/20 scale-105' : 'border-slate-400 dark:border-slate-500 bg-white/60 dark:bg-slate-800/60 group-hover:border-primary/50'}`}
                                            >
                                                {exportConfig.units[key as keyof typeof exportConfig.units] && (
                                                    <motion.span
                                                        initial={{ scale: 0.5, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        className="material-symbols-outlined text-white text-lg font-black"
                                                    >
                                                        check
                                                    </motion.span>
                                                )}
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={exportConfig.units[key as keyof typeof exportConfig.units]}
                                                onChange={e => setExportConfig(prev => ({
                                                    ...prev,
                                                    units: { ...prev.units, [key]: e.target.checked }
                                                }))}
                                                className="sr-only"
                                            />
                                            <span className="text-sm font-medium text-text-primary">
                                                {key === 'final' ? 'Prova Final' : key === 'recovery' ? 'Recuperação' : key === 'results' ? 'Resultado' : `${key}ª Unidade`}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Opções</h4>
                                <label className="flex items-center gap-3 p-3 rounded-lg bg-surface-subtle/50 hover:bg-surface-subtle transition-colors cursor-pointer border border-border-default/50 group">
                                    <div
                                        className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all backdrop-blur-md ${exportConfig.detailed ? 'theme-bg-primary border-primary shadow-lg shadow-primary/20 scale-105' : 'border-slate-400 dark:border-slate-500 bg-white/60 dark:bg-slate-800/60 group-hover:border-primary/50'}`}
                                    >
                                        {exportConfig.detailed && (
                                            <motion.span
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="material-symbols-outlined text-white text-lg font-black"
                                            >
                                                check
                                            </motion.span>
                                        )}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={exportConfig.detailed}
                                        onChange={e => setExportConfig(prev => ({ ...prev, detailed: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <span className="text-sm font-medium text-text-primary">Incluir detalhes das notas</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 shrink-0 pt-4 border-t border-border-default">
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="px-4 py-2.5 text-text-secondary font-bold hover:bg-surface-subtle rounded-lg transition-colors text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={exportPDF}
                                className={`px-6 py-2.5 bg-${theme.baseColor}-600 hover:bg-${theme.baseColor}-700 text-white rounded-lg shadow-lg shadow-${theme.baseColor}-500/30 transition-all flex items-center gap-2 font-bold text-sm`}
                            >
                                <span className="material-symbols-outlined text-lg">download</span>
                                Baixar PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ERROR STATE */}
            {visibleStudents.length === 0 && !loading && (
                <div className="text-center py-12 px-4 rounded-xl border border-dashed border-border-default bg-surface-subtle/30">
                    <span className="material-symbols-outlined text-4xl text-text-muted mb-3 opacity-50 block">sentiment_dissatisfied</span>
                    <p className="text-text-muted text-sm">Nenhum aluno encontrado para {selectedUnit === 'results' ? 'o resultado final' : 'esta unidade'}.</p>
                </div>
            )}

            {/* DESKTOP TABLE VIEW (Hidden on Mobile) */}
            <div className="hidden lg:block card overflow-hidden shadow-premium border-none">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] border-collapse">
                        {/* ... Existing Table Header ... */}
                        <thead className={`bg-surface-subtle/50 backdrop-blur-md border-b border-border-default`}>
                            <tr>
                                <th className="sticky left-0 z-40 bg-surface-subtle/95 backdrop-blur-md px-4 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider w-12 border-b border-border-default shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    Nº
                                </th>
                                <th className="sticky left-12 z-40 bg-surface-subtle/95 backdrop-blur-md px-4 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider min-w-[250px] border-b border-border-default shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    Nome
                                </th>
                                {selectedUnit === 'results' ? (
                                    <>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-text-muted uppercase tracking-wider">
                                            Total Anual
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-text-muted uppercase tracking-wider">
                                            Situação
                                        </th>
                                    </>
                                ) : (
                                    <>
                                        {currentConfig?.columns.map((col: any) => (
                                            <th key={col.key} className="px-4 py-4 text-center text-xs font-bold text-text-muted uppercase tracking-wider">
                                                {col.label}
                                                <span className="block text-[9px] opacity-70 font-normal normal-case">
                                                    Max: {(selectedUnit === '3' && col.key === 'exam') ? '10/8' : col.max}
                                                </span>
                                            </th>
                                        ))}
                                        <th className="px-6 py-4 text-center text-xs font-bold text-text-muted uppercase tracking-wider bg-surface-subtle/30 border-l border-border-default/50">
                                            {(selectedUnit === 'final' || selectedUnit === 'recovery') ? 'Status' : 'Média'}
                                        </th>
                                    </>
                                )}
                            </tr>
                        </thead>

                        <motion.tbody
                            key={selectedUnit}
                            className="divide-y divide-border-subtle"
                            variants={VARIANTS.staggerContainer}
                            initial="initial"
                            animate="animate"
                        >
                            {visibleStudents.map(student => (
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
                </div>
            </div>

            {/* MOBILE CARD VIEW (Visible on Mobile) */}
            <motion.div
                className="lg:hidden space-y-3"
                variants={VARIANTS.staggerContainer}
                initial="initial"
                animate="animate"
            >
                {visibleStudents.map(student => (
                    <MobileGradeCard
                        key={student.id}
                        student={student}
                        selectedUnit={selectedUnit}
                        theme={theme}
                        onGradeChange={handleGradeChange}
                    />
                ))}
            </motion.div>
        </div>
    );
};