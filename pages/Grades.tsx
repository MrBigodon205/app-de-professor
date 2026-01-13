
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';
import { Student, Grades as GradesType } from '../types';
import DOMPurify from 'dompurify';

const UNIT_CONFIGS: any = {
    '1': {
        columns: [
            { key: 'qualitative', label: 'Qualitativo', max: 2.0 },
            { key: 'simulado', label: 'Simulado', max: 2.0 },
            { key: 'test', label: 'Teste', max: 4.0 },
            { key: 'workshop', label: 'Workshop', max: 2.0 },
            { key: 'exam', label: 'Prova', max: 10.0 },
        ],
    },
    '2': {
        columns: [
            { key: 'qualitative', label: 'Qualitativo', max: 2.0 },
            { key: 'simulado', label: 'Simulado', max: 2.0 },
            { key: 'test', label: 'Teste', max: 4.0 },
            { key: 'scienceFair', label: 'Feira de Ciências', max: 2.0 },
            { key: 'exam', label: 'Prova', max: 10.0 },
        ],
    },
    '3': {
        columns: [
            { key: 'qualitative', label: 'Qualitativo', max: 2.0 },
            { key: 'simulado', label: 'Simulado', max: 2.0 },
            { key: 'test', label: 'Teste', max: 4.0 },
            { key: 'gincana', label: 'Gincana', max: 2.0 },
            { key: 'talentShow', label: 'Amostra de Talentos', max: 2.0 },
            { key: 'exam', label: 'Prova', max: 10.0 },
        ],
    },
    'final': {
        columns: [
            { key: 'final_exam', label: 'Prova Final', max: 10.0 },
        ],
    },
    'recovery': {
        columns: [
            { key: 'recovery_exam', label: 'Recuperação', max: 10.0 },
        ],
    },
    'results': {
        columns: []
    }
};

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
    const { currentUser } = useAuth();
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
    }, [selectedSeriesId, selectedSection, currentUser]);

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
                    section: selectedSection
                };

                const { error } = await supabase
                    .from('grades')
                    .upsert(payload, { onConflict: 'student_id, unit' });

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

    const calculateUnitTotal = (student: Student, unit: string) => {
        const grades = student.units?.[unit] || {};
        const total = Object.values(grades).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
        // Average 0-10 only for units 1, 2, 3 (sum of max is 20)
        if (unit === '1' || unit === '2' || unit === '3') return total / 2;
        return total; // Final/Recovery sum of max is 10, no division needed
    };

    const calculateTotal = (student: Student) => {
        // Only used for Unit 1, 2, 3 display
        return calculateUnitTotal(student, selectedUnit);
    };

    const calculateAnnualSummary = (student: Student) => {
        const u1 = calculateUnitTotal(student, '1');
        const u2 = calculateUnitTotal(student, '2');
        const u3 = calculateUnitTotal(student, '3');
        const annualTotal = u1 + u2 + u3; // Max 30

        // Match the UI display exactly (8.0 must be 8.0)
        const displayTotal = Number(annualTotal.toFixed(1));

        let status: 'APPROVED' | 'FINAL' | 'RECOVERY' | 'FAILED' = 'APPROVED';
        let needed = 0;
        let finalNeeded = 0;
        let finalExamPoints = 0;

        if (displayTotal >= 18.0) {
            status = 'APPROVED';
        } else if (displayTotal >= 8.0) {
            status = 'FINAL';
            finalNeeded = 18.0 - displayTotal;
            needed = finalNeeded;

            // Logic: Fail Final -> Go to Recovery (only if a grade is present)
            const rawFinal = student.units?.['final']?.['final_exam'];
            if (rawFinal !== undefined && rawFinal !== null && rawFinal !== '') {
                const finalExam = Number(rawFinal);
                finalExamPoints = finalExam;
                if (finalExam < needed) {
                    status = 'RECOVERY';
                    needed = 6; // Rule: Previous grade zeroed, needs min 6.0 in Recovery
                } else {
                    status = 'APPROVED'; // Passed Final
                }
            }
        } else {
            status = 'RECOVERY';
            needed = 6; // Direct to Recovery: Previous grade zeroed, needs 6.0
            finalNeeded = 0;
        }

        // Adjust annual total display based on current phase
        let finalAnnualTotal = displayTotal + finalExamPoints;

        if (status === 'RECOVERY') {
            const rawRec = student.units?.['recovery']?.['recovery_exam'];
            // If in recovery, the previous points are "zeroed". We only show the recovery exam grade.
            if (rawRec !== undefined && rawRec !== null && rawRec !== '') {
                finalAnnualTotal = Number(rawRec);
            } else {
                finalAnnualTotal = 0; // "Zerado"
            }
        }

        return { annualTotal: finalAnnualTotal, baseTotal: displayTotal, status, needed, finalNeeded };
    };

    const getFinalResult = (student: Student) => {
        const { status, needed, finalNeeded } = calculateAnnualSummary(student);

        if (status === 'APPROVED') {
            if (finalNeeded > 0) return { text: 'Aprovado por prova final', color: 'text-emerald-600', bg: 'bg-emerald-100' };
            return { text: 'Aprovado', color: 'text-emerald-600', bg: 'bg-emerald-100' };
        }

        if (status === 'FINAL' || (selectedUnit === 'final' && status === 'RECOVERY' && finalNeeded > 0)) {
            const rawFinal = student.units?.['final']?.['final_exam'];
            const targetScore = selectedUnit === 'final' ? finalNeeded : needed;
            const needsText = `Prova Final (Precisa: ${targetScore.toFixed(1)})`;

            if (rawFinal !== undefined && rawFinal !== null && rawFinal !== '') {
                const finalExam = Number(rawFinal);
                if (finalExam >= targetScore) return { text: 'Aprovado por prova final', color: 'text-emerald-600', bg: 'bg-emerald-100' };

                return { text: 'Perdeu na Prova Final', color: 'text-red-600', bg: 'bg-red-100' };
            }
            return { text: needsText, color: 'text-amber-600', bg: 'bg-amber-100' };
        }

        if (status === 'RECOVERY') {
            const rawRec = student.units?.['recovery']?.['recovery_exam'];
            if (rawRec !== undefined && rawRec !== null && rawRec !== '') {
                const recoveryExam = Number(rawRec);
                if (recoveryExam >= 6.0) return { text: 'Aprovado (Rec)', color: 'text-emerald-600', bg: 'bg-emerald-100' };
                return { text: 'Reprovado', color: 'text-red-600', bg: 'bg-red-100' };
            }
            return { text: 'Recuperação (Min: 6.0)', color: 'text-rose-600', bg: 'bg-rose-100' };
        }



        return { text: '-', color: 'text-slate-500', bg: 'bg-slate-100' };
    }

    const exportPDF = () => {
        const logoText = "CENSC";
        const logoSub = "CENTRO EDUCACIONAL<br>NOSSA SRA DO CENÁCULO";

        const generateReportHTML = () => {
            let sectionsHTML = '';
            const keysToCheck = ['1', '2', '3', 'final', 'recovery', 'results'] as const;

            keysToCheck.forEach((key) => {
                if (!exportConfig.units[key]) return;

                const title = key === 'final' ? 'Prova Final' : key === 'recovery' ? 'Recuperação' : key === 'results' ? 'Resultado Final Anual' : `${key}ª Unidade`;

                let headCols = ['Nº', 'Nome'];
                const config = UNIT_CONFIGS[key as keyof typeof UNIT_CONFIGS];

                if (key !== 'results' && exportConfig.detailed && config) {
                    headCols = [...headCols, ...config.columns.map((c: any) => c.label)];
                }

                if (key === 'results') {
                    headCols.push('Total Anual', 'Situação');
                } else {
                    headCols.push(key === 'final' || key === 'recovery' ? 'Status' : 'Média');
                }

                const filtered = students.filter(s => {
                    if (key === '1' || key === '2' || key === '3' || key === 'results') return true;
                    const { baseTotal, status } = calculateAnnualSummary(s);
                    if (key === 'final') return baseTotal >= 8.0 && baseTotal < 18.0;
                    if (key === 'recovery') return status === 'RECOVERY';
                    return true;
                });

                if (filtered.length === 0 && key !== 'results') return;

                const rowsHTML = filtered.map(s => {
                    const { annualTotal } = calculateAnnualSummary(s);
                    const res = getFinalResult(s);

                    let cells = `
                        <td style="text-align: center; width: 40px;">${s.number}</td>
                        <td style="text-align: left; padding-left: 10px;">${s.name}</td>
                    `;

                    if (key !== 'results' && exportConfig.detailed && config) {
                        config.columns.forEach((col: any) => {
                            cells += `<td style="text-align: center;">${getGrade(s, col.key) || '-'}</td>`;
                        });
                    }

                    if (key === 'results') {
                        cells += `
                            <td style="text-align: center; font-weight: bold;">${annualTotal.toFixed(1)}</td>
                            <td style="text-align: center;"><span class="status-badge ${res.color}">${res.text}</span></td>
                        `;
                    } else if (key === 'final' || key === 'recovery') {
                        cells += `<td style="text-align: center;"><span class="status-badge ${res.color}">${res.text}</span></td>`;
                    } else {
                        cells += `<td style="text-align: center; font-weight: bold;">${calculateUnitTotal(s, key).toFixed(1)}</td>`;
                    }

                    return `<tr>${cells}</tr>`;
                }).join('');

                sectionsHTML += `
                    <div class="report-section">
                        <h2 class="section-title">${title}</h2>
                        <table>
                            <thead>
                                <tr>${headCols.map(h => `<th>${h}</th>`).join('')}</tr>
                            </thead>
                            <tbody>
                                ${rowsHTML}
                            </tbody>
                        </table>
                    </div>
                `;
            });

            return sectionsHTML;
        };

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    @page { size: portrait; margin: 15mm; }
                    body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; line-height: 1.5; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0ea5e9; padding-bottom: 15px; margin-bottom: 30px; }
                    .school-info { flex: 1; }
                    .school-name { font-size: 24pt; font-weight: 900; color: #0ea5e9; font-family: 'Arial Black', sans-serif; letter-spacing: -1.5px; margin: 0; line-height: 1; }
                    .school-sub { font-size: 9pt; color: #0ea5e9; font-weight: bold; text-transform: uppercase; margin-top: 4px; display: block; }
                    .report-info { text-align: right; }
                    .report-title { font-size: 14pt; font-weight: bold; color: #64748b; margin: 0; text-transform: uppercase; }
                    .class-info { font-size: 11pt; color: #334155; font-weight: bold; margin-top: 5px; }
                    
                    .report-section { margin-bottom: 40px; break-inside: avoid; }
                    .section-title { font-size: 12pt; font-weight: 800; color: #1e293b; background: #f1f5f9; padding: 8px 12px; border-radius: 6px; margin-bottom: 15px; border-left: 4px solid #0ea5e9; text-transform: uppercase; letter-spacing: 0.5px; }
                    
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt; }
                    th { background-color: #f8fafc; color: #64748b; font-weight: bold; text-transform: uppercase; font-size: 8pt; padding: 8px; border: 1px solid #e2e8f0; text-align: center; }
                    td { padding: 8px; border: 1px solid #e2e8f0; color: #334155; }
                    tr:nth-child(even) { background-color: #fcfcfc; }
                    
                    .status-badge { font-weight: bold; padding: 2px 8px; border-radius: 99px; font-size: 8pt; display: inline-block; white-space: nowrap; }
                    .text-emerald-600 { color: #059669; }
                    .text-red-600 { color: #dc2626; }
                    .text-rose-600 { color: #e11d48; }
                    .text-slate-500 { color: #64748b; }
                    
                    .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 8pt; color: #94a3b8; padding: 10px 0; border-top: 1px solid #f1f5f9; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="school-info">
                        <h1 class="school-name">CENSC</h1>
                        <span class="school-sub">CENTRO EDUCACIONAL NOSSA SRA DO CENÁCULO</span>
                    </div>
                    <div class="report-info">
                        <p class="report-title">Relatório de Desempenho Escolar</p>
                        <p class="class-info">${activeSeries?.name} - Turma ${selectedSection}</p>
                        <p style="font-size: 9pt; color: #64748b; margin-top: 2px;">Professor: ${currentUser?.name?.toUpperCase()}</p>
                    </div>
                </div>

                ${generateReportHTML()}

                <div class="footer">
                    Gerado pelo Prof. Acerta+ em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
                </div>
            </body>
            </html>
        `;

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        doc.open();
        doc.write(htmlContent);
        doc.close();

        setTimeout(() => {
            iframe.contentWindow?.print();
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 100);
        }, 500);

        setShowExportModal(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-${theme.baseColor}-600`}></div>
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
        <div className="space-y-6 animate-fade-in">
            {/* Header Controls */}
            <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto max-w-full">
                    {['1', '2', '3', 'final', 'recovery', 'results'].map((unit) => (
                        <button
                            key={unit}
                            onClick={() => setSelectedUnit(unit)}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all duration-200 whitespace-nowrap ${selectedUnit === unit
                                ? `bg-${theme.baseColor}-600 dark:bg-${theme.baseColor}-500 text-white shadow-md transform scale-105`
                                : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                                }`}
                        >
                            {unit === 'final' ? 'Prova Final' : unit === 'recovery' ? 'Recuperação' : unit === 'results' ? 'Resultado' : `${unit}ª Unidade`}
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
                        <span className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-bold bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 transition-all">
                            <span className="material-symbols-outlined text-sm mr-2">check_circle</span>
                            Salvo
                        </span>
                    )}

                    <button
                        onClick={() => setShowExportModal(true)}
                        className={`flex items-center space-x-2 px-4 py-2 bg-${theme.baseColor}-500 hover:bg-${theme.baseColor}-600 text-white rounded-lg transition-colors shadow-md shadow-${theme.baseColor}-500/20`}
                    >
                        <span className="material-symbols-outlined text-lg">download</span>
                        <span>Exportar PDF</span>
                    </button>
                </div>
            </div>

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-indigo-600">settings</span>
                            Configurar Relatório PDF
                        </h3>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Unidades para Incluir:</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(Object.keys(exportConfig.units) as Array<keyof typeof exportConfig.units>).map(key => (
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
                                            <span className="text-sm text-slate-600 dark:text-slate-300">
                                                {key === 'final' ? 'Prova Final' : key === 'recovery' ? 'Recuperação' : key === 'results' ? 'Resultado Final' : `${key}ª Unidade`}
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

                        <div className="flex justify-end gap-2">
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
                </div>
            )}

            {/* Grades Table */}
            <div className="glass-panel rounded-xl overflow-hidden shadow-lg border border-slate-200/60 dark:border-slate-700/60">
                <div className="overflow-x-auto">
                    <table className="w-full">
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
                                                        className={`w-full text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-${theme.baseColor}-500 focus:border-transparent transition-all font-mono text-sm`}
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