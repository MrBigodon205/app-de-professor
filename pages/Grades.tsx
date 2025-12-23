
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';
import { Student, Grades as GradesType } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// import { Save, Download, Calculator, AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react'; // REMOVED

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
};

interface GradeData {
    [key: string]: number;
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

        // Get latest full unit state from React state is risky in timeout?
        // Actually, we should upsert the MERGED state.
        // Let's find the student in current state.
        // We can't access 'students' inside timeout easily without ref.
        // BUT, since we have 'changes', we can fetch-merge-save OR trust client state?
        // Trusting client state (optimistic) is standard.
        // We need the Current Unit Data for this student.

        // Better approach: Pass the "Final Unit Data" to this function.
        // But debounce makes it hard.

        // Let's rely on pendingChangesRef to accumulate.
        // And when saving, we need the BASE data.

        // Alternative: The timeout function should read the LATEST students state via a Ref.
    };

    const studentsRef = useRef(students);
    useEffect(() => { studentsRef.current = students; }, [students]);

    const handleGradeChange = (studentId: string, field: string, value: string) => {
        const numericValue = value === '' ? 0 : parseFloat(value);
        if (isNaN(numericValue)) return;

        // 1. Optimistic Update
        setStudents(prev => prev.map(s => {
            if (s.id === studentId) {
                const newUnits = { ...s.units };
                if (!newUnits[selectedUnit]) newUnits[selectedUnit] = {};

                // Max Value Check
                const col = UNIT_CONFIGS[selectedUnit as keyof typeof UNIT_CONFIGS]?.columns.find(c => c.key === field);
                let finalVal = numericValue;
                if (col && finalVal > col.max) finalVal = col.max;

                newUnits[selectedUnit] = {
                    ...newUnits[selectedUnit],
                    [field]: finalVal
                };
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

    const calculateTotal = (student: Student) => {
        const grades = student.units?.[selectedUnit] || {};
        const total = Object.values(grades).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
        return total / 2;
    };

    const exportPDF = () => {
        const doc = new jsPDF();

        // --- HEADER ---
        doc.setFillColor(63, 81, 181); // Indigo Primary
        doc.rect(0, 0, 210, 35, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('PROF. ACERTA+ | Relatório de Notas', 14, 23);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`${activeSeries?.name || ''} - Turma ${selectedSection} - ${selectedUnit}ª Unidade`, 14, 23, { align: 'left', baseline: 'top', transform: new DOMMatrix().translate(0, 5) } as any);
        // Clean text placement without complex transforms if matrix fails
        doc.text(`${activeSeries?.name || ''} - Turma ${selectedSection} - ${selectedUnit}ª Unidade`, 14, 30);


        const config = UNIT_CONFIGS[selectedUnit as keyof typeof UNIT_CONFIGS];
        if (!config) return;

        const tableBody = students.map(s => {
            const row: any[] = [s.number, s.name];
            config.columns.forEach(col => {
                row.push(getGrade(s, col.key) || '-');
            });
            const avg = calculateTotal(s);
            row.push({
                content: avg.toFixed(1),
                styles: { fontStyle: 'bold', textColor: avg >= 6 ? [22, 163, 74] : [220, 38, 38] }
            });
            return row;
        });

        autoTable(doc, {
            head: [['Nº', 'Nome', ...config.columns.map(c => c.label), 'Média']],
            body: tableBody,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            styles: { fontSize: 10, cellPadding: 4, valign: 'middle' },
            columnStyles: {
                0: { cellWidth: 15, halign: 'center' }, // Number
                1: { fontStyle: 'bold' }, // Name
                [config.columns.length + 2]: { halign: 'center', fontStyle: 'bold' } // Media
            }
        });

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Página ${i} de ${pageCount} - Gerado em ${new Date().toLocaleDateString('pt-BR')}`, 105, 290, { align: 'center' });
        }

        doc.save(`notas_unidade_${selectedUnit}_${activeSeries?.name}_${selectedSection}.pdf`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-${theme.primaryColor}-600`}></div>
            </div>
        );
    }

    const currentConfig = UNIT_CONFIGS[selectedUnit as keyof typeof UNIT_CONFIGS];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Controls */}
            <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    {Object.keys(UNIT_CONFIGS).map((unit) => (
                        <button
                            key={unit}
                            onClick={() => setSelectedUnit(unit)}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all duration-200 ${selectedUnit === unit
                                ? `bg-${theme.primaryColor}-600 dark:bg-${theme.primaryColor}-500 text-white shadow-md transform scale-105`
                                : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                                }`}
                        >
                            {unit}ª Unidade
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
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
                        onClick={exportPDF}
                        className={`flex items-center space-x-2 px-4 py-2 bg-${theme.primaryColor}-500 hover:bg-${theme.primaryColor}-600 text-white rounded-lg transition-colors shadow-md shadow-${theme.primaryColor}/20`}
                    >
                        <span className="material-symbols-outlined text-lg">download</span>
                        <span>Exportar PDF</span>
                    </button>
                </div>
            </div>

            {/* Grades Table */}
            <div className="glass-panel rounded-xl overflow-hidden shadow-lg border border-slate-200/60 dark:border-slate-700/60">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className={`bg-${theme.primaryColor}-50 dark:bg-slate-800 border-b border-${theme.primaryColor}-100 dark:border-slate-700`}>
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-16">
                                    Nº
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Nome
                                </th>
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
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-24 bg-slate-50/50 dark:bg-slate-800/50">
                                    Média
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {students.map((student) => (
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
                                    {currentConfig?.columns.map((col) => (
                                        <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="number"
                                                min="0"
                                                max={col.max}
                                                step="0.1"
                                                className={`w-full text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-${theme.primaryColor}-500 focus:border-transparent transition-all font-mono text-sm`}
                                                value={getGrade(student, col.key)}
                                                onChange={(e) => handleGradeChange(student.id, col.key, e.target.value)}
                                                placeholder="-"
                                            />
                                        </td>
                                    ))}
                                    <td className="px-6 py-4 whitespace-nowrap text-center bg-slate-50/30 dark:bg-slate-800/30">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${calculateTotal(student) >= 6
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                                            }`}>
                                            {calculateTotal(student).toFixed(1)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {students.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-slate-500 dark:text-slate-400">Nenhum aluno encontrado nesta turma.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};