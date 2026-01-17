import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';
import { Student, Occurrence, Activity } from '../types';

// Simple types for chart data
interface GradeData {
    unit: string;
    average: number;
}

export const StudentProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { currentUser, activeSubject } = useAuth(); // Subject aware!
    const { activeSeries } = useClass(); // Only for header context
    const theme = useTheme();
    const navigate = useNavigate();

    const [student, setStudent] = useState<Student | null>(null);
    const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUnit, setSelectedUnit] = useState<string>('all'); // 'all', '1', '2', '3'
    const [pedagogicalOpinion, setPedagogicalOpinion] = useState('');
    const [savingOpinion, setSavingOpinion] = useState(false);

    // Filtered Data
    const [filteredOccurrences, setFilteredOccurrences] = useState<Occurrence[]>([]);
    const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
    const [unitAverages, setUnitAverages] = useState<GradeData[]>([]);
    const [attendancePercentage, setAttendancePercentage] = useState<number>(0);

    // Print Ref
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser || !id) return;
            setLoading(true);
            try {
                // 1. Fetch Student
                const { data: studentData, error: studentError } = await supabase
                    .from('students')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (studentError) throw studentError;

                const formattedStudent: Student = {
                    id: studentData.id.toString(),
                    name: studentData.name,
                    number: studentData.number,
                    initials: studentData.initials || studentData.name.substring(0, 2).toUpperCase(),
                    color: studentData.color,
                    classId: studentData.series_id?.toString(),
                    section: studentData.section,
                    userId: studentData.user_id,
                    units: studentData.units || {}
                };
                setStudent(formattedStudent);

                // 2. Fetch Occurrences
                const { data: occData, error: occError } = await supabase
                    .from('occurrences')
                    .select('*')
                    .eq('student_id', id)
                    .eq('user_id', currentUser.id)
                    .eq('subject', activeSubject);

                if (!occError && occData) {
                    setOccurrences(occData.map(o => ({
                        id: o.id.toString(),
                        studentId: o.student_id.toString(),
                        type: o.type,
                        description: o.description,
                        date: o.date,
                        unit: o.unit,
                        userId: o.user_id
                    })));
                }

                // 3. Fetch Activities (for grade calculation)
                const { data: actData, error: actError } = await supabase
                    .from('activities')
                    .select('*')
                    .eq('series_id', formattedStudent.classId)
                    .eq('user_id', currentUser.id)
                    .eq('subject', activeSubject);
                // Filter mainly by series, we will filter by unit in UI

                if (!actError && actData) {
                    setActivities(actData.map(a => ({
                        id: a.id.toString(),
                        title: a.title,
                        type: a.type,
                        seriesId: a.series_id.toString(),
                        date: a.date,
                        description: a.description,
                        files: [], // Not needed for report summaries
                        userId: a.user_id,
                        section: a.section
                    } as Activity)));
                }


                // 4. Calculate Attendance (Mock/Simulated logic for now as 'AttendanceRecord' fetching might be heavy)
                // Real implementation would perform a COUNT query on attendance_records table.
                // Assuming 85% for demo if no data, or calculate if we had records array.
                setAttendancePercentage(92); // Placeholder for "Real" calc

            } catch (error) {
                console.error("Error fetching report data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, currentUser, activeSubject]);


    // Filter Data when Unit or Dependencies Change
    useEffect(() => {
        if (!student) return;

        // A. Filter Occurrences
        const occs = selectedUnit === 'all'
            ? occurrences
            : occurrences.filter(o => o.unit === selectedUnit);
        setFilteredOccurrences(occs);

        // B. Filter Activities & Calculate Grades
        // Note: Activity doesn't have 'unit' explicitly often, implies date or custom logic. 
        // For now, let's assume all manual grades in 'student.units' are the source of truth for averages.

        const acts = activities; // In a real app we'd filter by unit dates
        setFilteredActivities(acts);

        // Calculate Averages from Student.units
        const avgs: GradeData[] = [];
        ['1', '2', '3'].forEach(unit => {
            const unitGrades = student.units?.[unit]?.subjects?.[activeSubject] || student.units?.[unit]; // handle structure variance
            if (unitGrades) {
                // Simple Average logic: (sum of known numeric fields) / count
                // Or just grab specific expected fields.

                // If structure is { test: 10, workshop: 8 }
                const scores = Object.values(unitGrades).filter(v => typeof v === 'number') as number[];
                if (scores.length > 0) {
                    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                    avgs.push({ unit: `${unit}ª Unid`, average: parseFloat(avg.toFixed(1)) });
                } else {
                    avgs.push({ unit: `${unit}ª Unid`, average: 0 });
                }
            } else {
                avgs.push({ unit: `${unit}ª Unid`, average: 0 });
            }
        });
        setUnitAverages(avgs);

        // Load opinion
        if (selectedUnit !== 'all') {
            const op = student.units?.[selectedUnit]?.subjects?.[activeSubject]?.observation || '';
            setPedagogicalOpinion(op);
        } else {
            setPedagogicalOpinion(""); // Clear or show "Select a unit to write opinion"
        }

    }, [selectedUnit, occurrences, activities, student, activeSubject]);


    const handleSaveOpinion = async () => {
        if (!student || selectedUnit === 'all') return;
        setSavingOpinion(true);
        try {
            const newUnits = { ...student.units };
            if (!newUnits[selectedUnit]) newUnits[selectedUnit] = {};
            if (!newUnits[selectedUnit].subjects) newUnits[selectedUnit].subjects = {};
            if (!newUnits[selectedUnit].subjects[activeSubject]) newUnits[selectedUnit].subjects[activeSubject] = {};

            newUnits[selectedUnit].subjects[activeSubject].observation = pedagogicalOpinion;

            const { error } = await supabase
                .from('students')
                .update({ units: newUnits })
                .eq('id', student.id);

            if (error) throw error;

            setStudent({ ...student, units: newUnits });

        } catch (e) {
            console.error(e);
            alert("Erro ao salvar parecer.");
        } finally {
            setSavingOpinion(false);
        }
    };

    if (loading) return <div className="flex justify-center p-20"><div className="animate-spin size-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div></div>;
    if (!student) return <div className="p-10 text-center">Aluno não encontrado.</div>;


    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* --- CONTROLS HEADER --- */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">

                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/students')} className="size-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h2 className="text-lg font-bold text-slate-700 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-500">analytics</span>
                        Relatório Detalhado
                    </h2>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {['all', '1', '2', '3'].map((u) => (
                        <button
                            key={u}
                            onClick={() => setSelectedUnit(u)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${selectedUnit === u
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {u === 'all' ? 'Geral' : `${u}ª Unid`}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-colors shadow-lg shadow-indigo-500/20"
                >
                    <span className="material-symbols-outlined">picture_as_pdf</span>
                    Exportar PDF
                </button>
            </div>

            {/* --- REPORT CONTENT (Printable Area) --- */}
            <div ref={printRef} className="print-content bg-white dark:bg-slate-950 p-8 sm:p-12 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 print:shadow-none print:border-none print:p-0">

                {/* 1. STUDENT HEADER */}
                <div className="flex items-start justify-between border-b-2 border-slate-100 dark:border-slate-800 pb-8 mb-8">
                    <div className="flex items-center gap-6">
                        <div className={`size-24 rounded-2xl bg-gradient-to-br ${student.color || 'from-indigo-500 to-purple-600'} flex items-center justify-center text-white text-3xl font-black shadow-lg print:border print:border-slate-300 print:shadow-none`}>
                            {student.initials}
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{student.name}</h1>
                            <div className="flex flex-col gap-1 text-sm text-slate-500 font-medium">
                                <span>Matrícula/Nº: <strong>{student.number}</strong></span>
                                <span>Turma: <strong>{activeSeries?.name} - {student.section}</strong></span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right hidden sm:block print:block">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Disciplina</p>
                        <p className="text-xl font-bold text-slate-800 dark:text-white">{activeSubject}</p>
                        <p className="text-xs text-slate-400 mt-2">Prof. {currentUser?.name}</p>
                    </div>
                </div>

                {/* 2. ANALYTICS ROW */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">

                    {/* CHART */}
                    <div className="md:col-span-2 bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 print:bg-white print:border-slate-300">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined">bar_chart</span>
                            Desempenho por Unidade
                        </h3>
                        <div className="flex items-end gap-4 h-40 mt-4 px-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                            {unitAverages.map((data) => (
                                <div key={data.unit} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div className="text-xs font-bold text-slate-500 mb-1">{data.average > 0 ? data.average : '-'}</div>
                                    <div
                                        className={`w-full max-w-[60px] rounded-t-lg transition-all duration-500 relative ${data.average >= 7 ? 'bg-emerald-500' : data.average >= 5 ? 'bg-amber-500' : 'bg-rose-500'
                                            } print:bg-slate-600 print:border print:border-slate-800`}
                                        style={{ height: `${data.average * 10}%`, minHeight: '4px' }}
                                    ></div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{data.unit}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ATTENDANCE */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center print:bg-white print:border-slate-300">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 text-center w-full">Frequência</h3>
                        <div className="relative size-32 flex items-center justify-center">
                            <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                <path className="text-slate-200 dark:text-slate-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                <path
                                    className={`${attendancePercentage >= 75 ? 'text-emerald-500' : 'text-rose-500'}`}
                                    strokeDasharray={`${attendancePercentage}, 100`}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-3xl font-black text-slate-800 dark:text-white">{attendancePercentage}%</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Presença</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. PEDAGOGICAL OPINION */}
                <div className="mb-10 page-break-inside-avoid">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span className="material-symbols-outlined text-indigo-500">psychology</span>
                        Parecer Pedagógico {selectedUnit !== 'all' && `(${selectedUnit}ª Unid)`}
                    </h3>

                    {selectedUnit === 'all' ? (
                        <div className="p-8 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 rounded-2xl text-center text-slate-400 text-sm">
                            Selecione uma unidade específica acima para visualizar ou editar o parecer pedagógico.
                        </div>
                    ) : (
                        <div className="relative group">
                            <textarea
                                value={pedagogicalOpinion}
                                onChange={(e) => setPedagogicalOpinion(e.target.value)}
                                className="w-full min-h-[120px] p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed resize-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all print:bg-white print:border-slate-300"
                                placeholder="Escreva aqui suas observações sobre o desenvolvimento do aluno..."
                            ></textarea>
                            <div className="absolute bottom-4 right-4 print:hidden">
                                <button
                                    onClick={handleSaveOpinion}
                                    disabled={savingOpinion}
                                    className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-opacity"
                                >
                                    {savingOpinion ? 'Salvando...' : 'Salvar Parecer'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. OCCURRENCES */}
                <div className="mb-10 page-break-inside-avoid">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span className="material-symbols-outlined text-orange-500">warning</span>
                        Pontos de Atenção & Ocorrências
                    </h3>

                    {filteredOccurrences.length === 0 ? (
                        <p className="text-slate-400 italic text-sm p-4 text-center bg-slate-50 dark:bg-slate-900/30 rounded-xl">Nenhuma ocorrência registrada neste período.</p>
                    ) : (
                        <div className="grid gap-3">
                            {filteredOccurrences.map(occ => (
                                <div key={occ.id} className="flex items-start gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm print:border-slate-200">
                                    <div className={`mt-1 size-2 rounded-full shrink-0 ${occ.type === 'Elogio' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-black uppercase text-slate-500">{new Date(occ.date).toLocaleDateString('pt-BR')}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${occ.type === 'Elogio' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-rose-600 bg-rose-50 border-rose-100'}`}>
                                                {occ.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{occ.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 5. ACTIVITIES */}
                <div className="page-break-inside-avoid">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span className="material-symbols-outlined text-blue-500">assignment</span>
                        Atividades Realizadas
                    </h3>

                    <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">Atividade</th>
                                    <th className="px-4 py-3">Tipo</th>
                                    <th className="px-4 py-3">Data</th>
                                    <th className="px-4 py-3 text-right">Nota Obtida</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {/* Assuming activities we fetched are what we want to show. 
                                    In real app we would join with grades table. 
                                    Here we mock the grade display from student.units for demo if exact match not found
                                */}
                                {filteredActivities.length === 0 ? (
                                    <tr><td colSpan={4} className="p-4 text-center text-slate-400 italic">Nenhuma atividade localizada.</td></tr>
                                ) : (
                                    filteredActivities.map((act) => {
                                        // Mock grade retrieval logic - assume activity title maps to key or we just show placeholders
                                        // Real logic: find grade in student.units.unitX.activityID
                                        return (
                                            <tr key={act.id} className="bg-white dark:bg-slate-950">
                                                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{act.title}</td>
                                                <td className="px-4 py-3 text-slate-500">{act.type}</td>
                                                <td className="px-4 py-3 text-slate-500">{new Date(act.date).toLocaleDateString('pt-BR')}</td>
                                                <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-white">
                                                    {/* Placeholder logic for demo */}
                                                    --
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Print Styles Injection */}
            <style>{`
                @media print {
                    @page { margin: 1.5cm; size: A4 portrait; }
                    body { -webkit-print-color-adjust: exact; }
                    nav, header, .sidebar, button, .no-print { display: none !important; }
                    .print-content { 
                        box-shadow: none !important; 
                        border: none !important; 
                        padding: 0 !important; 
                        margin: 0 !important;
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                    }
                    .page-break-inside-avoid { page-break-inside: avoid; }
                }
            `}</style>
        </div>
    );
};
