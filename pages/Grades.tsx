import React, { useState, useEffect } from 'react';
import { useClass } from '../contexts/ClassContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { Student } from '../types';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
            { key: 'exam', label: 'Prova', max: 10.0 }, // max becomes 8.0 if talentShow > 0
        ],
    },
};

export const Grades: React.FC = () => {
    const { selectedSeriesId, selectedSection, activeSeries } = useClass();
    const { currentUser } = useAuth();
    const theme = useTheme();
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedUnit, setSelectedUnit] = useState<string>('1');
    const [loading, setLoading] = useState(true);

    const [isSyncing, setIsSyncing] = useState(false);
    const saveTimeoutRefs = React.useRef<{ [key: string]: NodeJS.Timeout }>({});

    useEffect(() => {
        if (selectedSeriesId && selectedSection) {
            fetchStudents();
            // Polling Fallback: re-fetch every 10 seconds to ensure sync even if Realtime fails
            const interval = setInterval(() => {
                // Only fetch if we are NOT currently typing/saving to avoid overwriting user input
                if (!isSyncing && Object.keys(saveTimeoutRefs.current).length === 0) {
                    // We could implement a nicer silent fetch, but for now simple fetch is safer
                    // Actually, silent fetch is better: don't set loading=true
                    fetchStudents(true);
                }
            }, 10000);
            return () => clearInterval(interval);
        } else {
            setStudents([]);
            setLoading(false);
        }
    }, [selectedSeriesId, selectedSection]);

    const fetchStudents = async (silent = false) => {
        if (!currentUser || !selectedSeriesId || !selectedSection) return;
        if (!silent) setLoading(true);
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('series_id', selectedSeriesId)
                .eq('section', selectedSection)
                .eq('user_id', currentUser.id);

            if (error) throw error;

            const formatted: Student[] = data.map(s => ({
                id: s.id.toString(),
                name: s.name,
                number: s.number,
                initials: s.initials || '',
                color: s.color || '',
                classId: s.series_id.toString(),
                section: s.section,
                userId: s.user_id,
                units: s.units || {}
            }));
            formatted.sort((a, b) => parseInt(a.number) - parseInt(b.number));
            setStudents(formatted);
        } catch (error) {
            console.error('Erro ao buscar alunos:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // --- REALTIME SUBSCRIPTION FOR GRADES ---
    useEffect(() => {
        if (!currentUser || !selectedSeriesId || !selectedSection) return;

        console.log("Setting up Realtime for Grades...");

        const channel = supabase.channel(`grades_sync_${selectedSeriesId}_${selectedSection}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'students',
                    filter: `series_id=eq.${selectedSeriesId}`
                },
                (payload) => {
                    const newRecord = payload.new as any;
                    // Only update if we are not the one triggering the save (optimistic UI handles ours)
                    // But determining "my" save vs "other tab" save is hard without a clientID.
                    // For now, we trust the debounce buffers.
                    // If we receive an update while NOT typing, we accept it.
                    if (Object.keys(saveTimeoutRefs.current).length === 0) {
                        if (newRecord && newRecord.section === selectedSection && newRecord.user_id === currentUser.id) {
                            console.log("Realtime Grades Update Received!", payload);
                            fetchStudents(true);
                        } else if (payload.eventType === 'DELETE') {
                            fetchStudents(true);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedSeriesId, selectedSection, currentUser]);
    // ----------------------------------------

    const calculateAverage = (student: Student, unit: string) => {
        const grades = student.units[unit];
        if (!grades) return 0;

        let total = 0;
        Object.values(grades).forEach(val => {
            if (typeof val === 'number') total += val;
        });

        const average = total / 2;
        return parseFloat(average.toFixed(1));
    };

    const handleGradeChange = (studentId: string, field: string, value: string) => {
        const numericValue = value === '' ? 0 : parseFloat(value);
        if (isNaN(numericValue)) return;

        let finalStudent: Student | undefined;

        // 1. Optimistic Update (Immediate Feedback)
        setStudents(prevStudents => {
            return prevStudents.map(student => {
                if (student.id === studentId) {
                    const newUnits = { ...student.units };
                    if (!newUnits[selectedUnit]) newUnits[selectedUnit] = {};

                    const currentGrades = { ...newUnits[selectedUnit] };
                    let finalValue = numericValue;

                    // Determine max for this field
                    const col = UNIT_CONFIGS[selectedUnit].columns.find((c: any) => c.key === field);
                    let max = col ? col.max : 10;

                    // Special rule for Unit 3 Prova
                    if (selectedUnit === '3') {
                        const talentShowGrade = field === 'talentShow' ? numericValue : (currentGrades.talentShow || 0);
                        if (field === 'exam') {
                            if (talentShowGrade > 0) max = 8.0;
                        }
                    }

                    if (finalValue > max) finalValue = max;
                    if (finalValue < 0) finalValue = 0;

                    newUnits[selectedUnit] = {
                        ...currentGrades,
                        [field]: finalValue
                    };

                    // Correction rule
                    if (selectedUnit === '3' && field === 'talentShow' && finalValue > 0) {
                        if ((newUnits[selectedUnit].exam || 0) > 8) {
                            newUnits[selectedUnit].exam = 8;
                        }
                    }

                    finalStudent = { ...student, units: newUnits };
                    return finalStudent;
                }
                return student;
            });
        });

        // 2. Debounced Save (Network)
        if (finalStudent) {
            // Clear existing timeout for this student
            if (saveTimeoutRefs.current[studentId]) {
                clearTimeout(saveTimeoutRefs.current[studentId]);
            }

            setIsSyncing(true);

            // Set new timeout (1 second wait)
            saveTimeoutRefs.current[studentId] = setTimeout(async () => {
                try {
                    console.log(`Saving grades for student ${studentId}...`);
                    if (finalStudent) {
                        const { error } = await supabase
                            .from('students')
                            .update({ units: finalStudent.units })
                            .eq('id', studentId)
                            .select(); // Add select to get data/count

                        if (error) throw error;
                        // if (data.length === 0) throw new Error("Permissão negada (RLS) ou Aluno não encontrado.");
                        // Actually standard update returns status 204 often if no select.
                        // But we added select().
                        if (!data || data.length === 0) {
                            throw new Error("Salvo com sucesso, mas o banco não retornou dados. Verifique permissões (RLS).");
                        }
                    }
                    console.log("Saved successfully.");
                } catch (error: any) {
                    console.error('Erro ao salvar nota:', error);
                    alert(`Falha ao salvar nota: ${error.message || 'Erro de conexão'}`);
                } finally {
                    delete saveTimeoutRefs.current[studentId];
                    if (Object.keys(saveTimeoutRefs.current).length === 0) {
                        setIsSyncing(false);
                    }
                }
            }, 1000);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 animate-pulse">
            <div className={`size-12 border-4 border-${theme.primaryColor}/20 border-t-${theme.primaryColor} rounded-full animate-spin mb-4`}></div>
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Acessando Diário de Classe...</p>
        </div>
    );

    const currentColumns = UNIT_CONFIGS[selectedUnit]?.columns || [];

    const generatePDF = () => {
        const doc = new jsPDF();
        const currentYear = new Date().getFullYear();

        // Title
        doc.setFontSize(24);
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text('PROF. ACERTA+', 14, 20);

        doc.setFontSize(14);
        doc.setTextColor(71, 85, 105); // slate-600
        doc.text('Diário de Avaliações', 14, 28);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Professor: ${currentUser?.name || ''}`, 14, 38);
        doc.text(`Disciplina: ${theme.subject}`, 14, 43);
        doc.text(`Turma: ${activeSeries?.name} ${selectedSection}`, 14, 48);
        doc.text(`Unidade: ${selectedUnit}ª Unidade`, 14, 53);
        doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 14, 58);

        // Table Data
        const tableColumn = ["Nº", "Aluno", ...currentColumns.map((c: any) => c.label), "Média"];
        const tableRows = students.map(s => {
            const grades = s.units[selectedUnit] || {};
            const rowData = [
                s.number,
                s.name,
                ...currentColumns.map((c: any) => (grades as any)[c.key]?.toFixed(1) || '0.0'),
                calculateAverage(s, selectedUnit).toFixed(1)
            ];
            return rowData;
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 68,
            theme: 'grid',
            headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 50 },
            }
        });

        try {
            const fileName = `Avaliacoes_${activeSeries?.name}_${selectedSection}_Unid${selectedUnit}`.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';

            // Generate PDF as blob for more robust download
            const blob = doc.output('blob');
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log('PDF exportado com sucesso:', fileName);
        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            alert('Erro ao gerar PDF. Por favor, tente novamente.');
        }
    };

    if (!selectedSeriesId || !selectedSection) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-500">
                <div className={`size-20 rounded-2xl bg-${theme.primaryColor}/10 flex items-center justify-center mb-6`}>
                    <span className={`material-symbols-outlined text-4xl text-${theme.primaryColor}`}>{theme.icon}</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Selecione uma Turma</h3>
                <p className="text-slate-500 text-center max-w-sm">Escolha uma turma no menu superior para gerenciar as notas dos alunos.</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Content */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className={`size-12 md:size-16 rounded-[18px] md:rounded-[22px] bg-${theme.primaryColor} text-white flex items-center justify-center shadow-lg shadow-${theme.primaryColor}/30`}>
                        <span className="material-symbols-outlined text-2xl md:text-3xl">edit_square</span>
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Diário de Avaliações</h1>
                        <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">
                            {activeSeries?.name} {selectedSection} • <span className={`text-${theme.primaryColor}`}>{currentUser?.subject}</span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 no-print">
                    <button
                        onClick={generatePDF}
                        className={`h-11 px-4 flex items-center gap-2 border border-slate-200 dark:border-slate-800 hover:border-${theme.primaryColor} hover:text-${theme.primaryColor} text-slate-600 dark:text-slate-400 rounded-2xl transition-all shadow-sm active:scale-95 bg-white dark:bg-slate-900 font-bold text-[10px] uppercase tracking-widest group order-2 lg:order-1`}
                        title="Exportar Diário em PDF"
                    >
                        <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">description</span>
                        <span className="hidden sm:inline">Exportar PDF</span>
                    </button>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden lg:block order-1.5"></div>

                    <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex overflow-x-auto w-full lg:w-auto order-1 lg:order-2">
                        {['1', '2', '3'].map(unit => (
                            <button
                                key={unit}
                                onClick={() => setSelectedUnit(unit)}
                                className={`flex-1 lg:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all transform active:scale-95 whitespace-nowrap ${selectedUnit === unit
                                    ? `bg-${theme.primaryColor} text-white shadow-lg shadow-${theme.primaryColor}/20`
                                    : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {unit}ª Unit.
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Premium Multi-Step Grid Holder */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden flex flex-col relative group">
                {/* Column Indicator */}
                <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-${theme.primaryColor} to-${theme.secondaryColor} opacity-50`}></div>

                <div className="overflow-x-auto w-full relative custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-8 py-6 min-w-[300px] sticky left-0 bg-slate-50 dark:bg-slate-950 z-30 transition-colors group-hover:bg-white dark:group-hover:bg-slate-900">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Lista de Alunos</span>
                                </th>
                                {currentColumns.map((col: any) => (
                                    <th key={col.key} className="px-4 py-6 text-center min-w-[120px]">
                                        <div className="flex flex-col gap-1 items-center">
                                            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-300 tracking-wider whitespace-nowrap">{col.label}</span>
                                            <span className={`text-[9px] font-black text-white px-2 py-0.5 rounded-full bg-slate-300 dark:bg-slate-700 tracking-widest`}>
                                                MÁX {selectedUnit === '3' && col.key === 'exam' ? '8/10' : col.max.toFixed(1)}
                                            </span>
                                        </div>
                                    </th>
                                ))}
                                <th className="px-6 py-6 text-center min-w-[120px] bg-slate-50 dark:bg-slate-950/80">
                                    <div className="flex flex-col gap-1 items-center">
                                        <span className={`text-[10px] font-black uppercase text-${theme.primaryColor} tracking-widest`}>Nota Unidade</span>
                                        <span className={`text-[8px] font-black text-${theme.primaryColor}/60 uppercase`}>Result. Final</span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/80">
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan={currentColumns.length + 2} className="px-8 py-20 text-center">
                                        <p className="font-bold text-slate-400">Nenhum aluno cadastrado nesta turma.</p>
                                    </td>
                                </tr>
                            ) : (
                                students.map((student) => {
                                    const average = calculateAverage(student, selectedUnit);
                                    const isApproved = average >= 6;

                                    return (
                                        <tr key={student.id} className="group/row hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-all duration-200">
                                            <td className="px-8 py-4 sticky left-0 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50 dark:group-hover/row:bg-slate-800 z-20 transition-colors border-r border-slate-50 dark:border-slate-800">
                                                <div className="flex items-center gap-4">
                                                    <div className={`size-10 rounded-2xl bg-gradient-to-br ${student.color || `from-${theme.primaryColor} to-${theme.secondaryColor}`} flex items-center justify-center text-xs font-black text-white shadow-lg shadow-slate-200 dark:shadow-none`}>
                                                        {student.initials}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-800 dark:text-white group-hover/row:text-primary transition-colors pr-4">{student.name}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Matrícula: #{student.number.padStart(2, '0')}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            {currentColumns.map((col: any) => {
                                                const value = (student.units[selectedUnit] as any)?.[col.key] ?? 0;
                                                let dynamicMax = col.max;
                                                if (selectedUnit === '3' && col.key === 'exam') {
                                                    if (((student.units[selectedUnit] as any)?.talentShow || 0) > 0) {
                                                        dynamicMax = 8.0;
                                                    }
                                                }

                                                return (
                                                    <td key={col.key} className="px-4 py-4 text-center">
                                                        <div className="relative inline-block group/input">
                                                            <input
                                                                type="number"
                                                                value={value === 0 ? '' : value}
                                                                onChange={(e) => handleGradeChange(student.id, col.key, e.target.value)}
                                                                placeholder="0.0"
                                                                step="0.1"
                                                                min="0"
                                                                max={dynamicMax}
                                                                className={`w-16 h-11 text-center font-black bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl focus:ring-8 focus:ring-${theme.primaryColor}/5 focus:border-${theme.primaryColor} focus:bg-white dark:focus:bg-black outline-none transition-all shadow-sm focus:scale-110 relative z-10`}
                                                            />
                                                            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-${theme.primaryColor} rounded-full opacity-0 group-focus-within/input:opacity-100 transition-opacity blur-sm`}></div>
                                                        </div>
                                                    </td>
                                                )
                                            })}
                                            <td className="px-6 py-4 text-center bg-slate-50/20 dark:bg-slate-950/20">
                                                <div className="flex flex-col items-center">
                                                    <span className={`text-xl font-black ${isApproved ? 'text-emerald-500' : 'text-rose-500'} tracking-tighter`}>
                                                        {average.toFixed(1)}
                                                    </span>
                                                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] transform -translate-y-1 ${isApproved ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
                                                        {isApproved ? 'Aprovado' : 'Abaixo'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center no-print">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">
                        Regras de cálculo aplicadas dinamicamente
                    </span>
                    <div className="flex items-center gap-4 pr-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Total: <span className={`text-${theme.primaryColor}`}>{students.length}</span> Diários
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};