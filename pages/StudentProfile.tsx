import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useClass } from '../contexts/ClassContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { Student, Activity, AttendanceRecord, Occurrence, Plan } from '../types';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Grades {
    exam?: number;
    average?: number; // Calculated dynamically
}

export const StudentProfile: React.FC = () => {
    const { selectedSeriesId, selectedSection, activeSeries } = useClass();
    const { currentUser } = useAuth();
    const theme = useTheme();

    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [selectedUnit, setSelectedUnit] = useState<string>('all');
    const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedSeriesId && selectedSection) {
            fetchData();
        } else {
            setStudents([]);
            setOccurrences([]);
            setLoading(false);
        }
    }, [selectedSeriesId, selectedSection]);

    useEffect(() => {
        if (students.length > 0) {
            const currentInList = students.find(s => s.id === selectedStudentId);
            if (!currentInList) {
                setSelectedStudentId(students[0].id);
            }
        } else {
            setSelectedStudentId('');
        }
    }, [students, selectedStudentId]);

    const fetchData = async (silent = false) => {
        if (!currentUser) return;
        if (!silent) setLoading(true);
        try {
            // Fetch students for the current class/section
            const { data: studentsData, error: studentError } = await supabase
                .from('students')
                .select('*')
                .eq('series_id', selectedSeriesId)
                .eq('section', selectedSection)
                .eq('user_id', currentUser.id);

            if (studentError) throw studentError;

            // Fetch Grades (from new table)
            const studentIds = studentsData.map(s => s.id);
            const { data: gradesData, error: gradesError } = await supabase
                .from('grades')
                .select('*')
                .in('student_id', studentIds)
                .eq('user_id', currentUser.id);

            if (gradesError) throw gradesError;

            const formattedStudents: Student[] = studentsData.map(s => {
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
            formattedStudents.sort((a, b) => parseInt(a.number) - parseInt(b.number));

            // Fetch occurrences, attendance, activities, and plans in parallel
            const [occRes, attRes, actRes, planRes] = await Promise.all([
                supabase.from('occurrences').select('*').eq('user_id', currentUser.id),
                supabase.from('attendance').select('*').eq('user_id', currentUser.id),
                supabase.from('activities').select('*').eq('user_id', currentUser.id).eq('series_id', selectedSeriesId).eq('section', selectedSection),
                supabase.from('plans').select('*').eq('user_id', currentUser.id).eq('series_id', selectedSeriesId).eq('section', selectedSection)
            ]);

            const formattedOcc: Occurrence[] = (occRes.data || []).map(o => ({
                id: o.id.toString(),
                studentId: o.student_id.toString(),
                type: o.type,
                description: o.description,
                date: o.date,
                userId: o.user_id
            }));

            const formattedAtt: AttendanceRecord[] = (attRes.data || []).map(a => ({
                id: a.id.toString(),
                studentId: a.student_id.toString(),
                date: a.date,
                status: a.status as any,
                userId: a.user_id
            }));

            const formattedAct: Activity[] = (actRes.data || []).map(a => ({
                id: a.id.toString(),
                title: a.title,
                type: a.type,
                seriesId: a.series_id.toString(),
                section: a.section,
                date: a.date,
                startDate: a.start_date,
                endDate: a.end_date,
                description: a.description,
                files: a.files || [],
                completions: a.completions || [],
                userId: a.user_id
            }));

            const formattedPlans: Plan[] = (planRes.data || []).map(p => ({
                id: p.id.toString(),
                title: p.title,
                seriesId: p.series_id.toString(),
                section: p.section,
                startDate: p.start_date,
                endDate: p.end_date,
                description: p.description,
                files: p.files || [],
                userId: p.user_id
            }));

            setStudents(formattedStudents);
            setOccurrences(formattedOcc);
            setAttendance(formattedAtt);
            setActivities(formattedAct);
            setPlans(formattedPlans);
        } catch (e) {
            console.error(e)
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // --- REALTIME SUBSCRIPTION ---
    useEffect(() => {
        if (!currentUser || !selectedSeriesId) return;

        // Polling Fallback (Every 10s)
        const interval = setInterval(() => {
            fetchData(true);
        }, 10000);

        console.log("Setting up Realtime for StudentProfile...");

        // Listen to changes in related tables
        const channel = supabase.channel(`profile_sync_${selectedSeriesId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => fetchData(true))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'occurrences' }, () => fetchData(true))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => fetchData(true))
            .subscribe();

        return () => {
            console.log("Cleaning up StudentProfile Realtime...");
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, [selectedSeriesId, selectedSection, currentUser]);

    const handleExportPDF = () => {
        if (!student) return;

        const doc = new jsPDF();
        const studentOccurrences = occurrences.filter(o => o.studentId === student.id);
        const studentAttendance = attendance.filter(a => a.studentId === student.id);
        const totalClasses = studentAttendance.length;
        const presentCount = studentAttendance.filter(a => a.status === 'P').length;
        const attendancePercentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(1) : '100';

        // --- MODERN HEADER ---
        doc.setFillColor(63, 81, 181); // Indigo Primary
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('PROF. ACERTA+', 14, 20);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Relatório Individual do Aluno', 14, 30);

        doc.setFontSize(10);
        doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 150, 30);

        // --- STUDENT INFO CARD ---
        doc.setFillColor(248, 250, 252); // Slate 50
        doc.setDrawColor(226, 232, 240); // Slate 200
        doc.roundedRect(14, 50, 182, 35, 3, 3, 'FD');

        doc.setTextColor(71, 85, 105);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('DADOS DO ALUNO', 20, 60);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);

        // Grid Layout
        doc.text(`Nome:`, 20, 70);
        doc.setFont('helvetica', 'bold');
        doc.text(student.name.toUpperCase(), 35, 70);

        doc.setFont('helvetica', 'normal');
        doc.text(`Matrícula:`, 20, 78);
        doc.setFont('helvetica', 'bold');
        doc.text(`#${student.number}`, 40, 78);

        doc.setFont('helvetica', 'normal');
        doc.text(`Turma:`, 110, 70);
        doc.setFont('helvetica', 'bold');
        doc.text(`${activeSeries?.name} - ${selectedSection}`, 125, 70);

        doc.setFont('helvetica', 'normal');
        doc.text(`Disciplina:`, 110, 78);
        doc.setFont('helvetica', 'bold');
        doc.text((currentUser?.subject || 'Geral').toUpperCase(), 132, 78);

        let currentY = 100;

        // --- ATTENDANCE SUMMARY ---
        doc.setFontSize(14);
        doc.setTextColor(63, 81, 181);
        doc.text('Frequência e Engajamento', 14, currentY);

        autoTable(doc, {
            startY: currentY + 5,
            head: [['Total de Aulas', 'Presenças', 'Faltas', 'Frequência %']],
            body: [[
                totalClasses,
                presentCount,
                totalClasses - presentCount,
                `${attendancePercentage}%`
            ]],
            theme: 'grid',
            headStyles: { fillColor: [63, 81, 181], textColor: 255, fontSize: 11, fontStyle: 'bold', halign: 'center' },
            bodyStyles: { fontSize: 11, halign: 'center', textColor: 50 },
            styles: { cellPadding: 6 }
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;

        // --- ACADEMIC RECORD ---
        doc.setFontSize(14);
        doc.setTextColor(63, 81, 181);
        doc.text('Desempenho Acadêmico', 14, currentY);

        const academicRows = ['1', '2', '3'].map(unit => {
            const data = student.units[unit] || {};
            const avg = calculateUnitAverage(data);
            return [
                `${unit}ª Unidade`,
                data.qualitative?.toFixed(1) || '-',
                data.simulado?.toFixed(1) || '-',
                data.test?.toFixed(1) || '-',
                data.exam?.toFixed(1) || '-',
                { content: avg.toFixed(1), styles: { fontStyle: 'bold', textColor: avg >= 6 ? [22, 163, 74] : [220, 38, 38] } }
            ];
        });

        autoTable(doc, {
            startY: currentY + 5,
            head: [['Unidade', 'Qualitativo', 'Simulado', 'Teste', 'Prova', 'Média Final']],
            body: academicRows,
            theme: 'striped',
            headStyles: { fillColor: [63, 81, 181], textColor: 255, fontSize: 10, fontStyle: 'bold' },
            columnStyles: {
                0: { fontStyle: 'bold' },
                5: { fontStyle: 'bold' }
            },
            styles: { cellPadding: 5, halign: 'center' }
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;

        // --- BEHAVIORAL LOG ---
        if (studentOccurrences.length > 0) {
            doc.text('Registro de Ocorrências', 14, currentY);
            autoTable(doc, {
                startY: currentY + 5,
                head: [['Data', 'Tipo', 'Descrição']],
                body: studentOccurrences.map(o => [
                    new Date(o.date + 'T12:00:00').toLocaleDateString('pt-BR'),
                    o.type,
                    o.description
                ]),
                theme: 'grid',
                headStyles: { fillColor: [234, 88, 12], textColor: 255 }, // Orange for alerts
                columnStyles: {
                    0: { cellWidth: 30 },
                    1: { cellWidth: 30, fontStyle: 'bold' },
                    2: { cellWidth: 'auto' }
                },
                styles: { cellPadding: 4, fontSize: 10 }
            });
        }

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Página ${i} de ${pageCount} - Gerado por Prof. Acerta+`, 105, 290, { align: 'center' });
        }

        try {
            const fileName = `Relatorio_${student.name}_${activeSeries?.name || ''}`.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
            doc.save(fileName);
        } catch (error) {
            console.error('Erro ao gerar PDF do aluno:', error);
        }
    };

    const getStudent = () => students.find(s => s.id === selectedStudentId);
    const student = getStudent();

    const calculateUnitAverage = (unitData: any) => {
        if (!unitData) return 0;
        let total = 0;
        Object.keys(unitData).forEach(key => {
            if (key !== 'observation') total += (unitData[key] || 0);
        });
        return parseFloat((total / 2).toFixed(1));
    };

    const getChartData = () => {
        if (!student) return [];
        return ['1', '2', '3'].map(unit => ({
            name: `${unit}ª Unid`,
            nota: calculateUnitAverage(student.units[unit])
        }));
    };

    const getStudentOccurrences = () => occurrences.filter(o => o.studentId === selectedStudentId);

    const getAttendanceStats = () => {
        const studentAtt = attendance.filter(a => a.studentId === selectedStudentId);
        const total = studentAtt.length || 1;
        const present = studentAtt.filter(a => a.status === 'P').length;
        const percentage = ((present / total) * 100).toFixed(0);
        return { present, total, percentage };
    };

    const getStudentActivities = () => {
        return activities.map(act => ({
            ...act,
            done: act.completions?.includes(selectedStudentId) || false
        }));
    };

    const saveObservation = async (unit: string, text: string) => {
        if (!student) return;

        const newUnits = { ...student.units };
        if (!newUnits[unit]) newUnits[unit] = {};
        newUnits[unit].observation = text;

        setStudents(students.map(s => s.id === student.id ? { ...s, units: newUnits } : s));

        try {
            const { error } = await supabase
                .from('students')
                .update({ units: newUnits })
                .eq('id', student.id);

            if (error) throw error;
        } catch (e) { console.error(e) }
    };

    // Helper for Hex Colors
    const getHexColor = (colorClass: string) => {
        const map: Record<string, string> = {
            'indigo-600': '#4f46e5', 'blue-600': '#2563eb', 'emerald-600': '#059669',
            'rose-600': '#e11d48', 'amber-600': '#d97706', 'violet-600': '#7c3aed',
            'cyan-600': '#0891b2', 'pink-600': '#db2677', 'orange-600': '#ea580c'
        };
        return map[colorClass] || '#4f46e5';
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 animate-pulse">
            <div className={`size-12 border-4 border-${theme.primaryColor}/20 border-t-${theme.primaryColor} rounded-full animate-spin mb-4 shadow-lg shadow-${theme.primaryColor}/20`}></div>
            <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Carregando Relatório Analítico...</p>
        </div>
    );

    if (!student) return (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-500">
            <div className={`size-20 rounded-2xl bg-${theme.primaryColor}/10 flex items-center justify-center mb-6`}>
                <span className={`material-symbols-outlined text-4xl text-${theme.primaryColor}`}>{theme.icon}</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Nenhum Aluno Selecionado</h3>
            <p className="text-slate-500 text-center max-w-sm">Escolha uma turma e um aluno para visualizar o desempenho escolar detalhado.</p>
        </div>
    );

    const primaryHex = getHexColor(theme.primaryColor);

    return (
        <div className="max-w-[1400px] mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Selector */}
            <div className={`bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden group`}>
                <div className={`absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-${theme.primaryColor}/10 to-transparent rounded-full -mr-40 -mt-40 blur-3xl group-hover:from-${theme.primaryColor}/15 transition-colors duration-700`}></div>

                <div className="flex items-center gap-6 relative z-10 w-full lg:w-auto">
                    <div className={`size-20 rounded-[28px] bg-gradient-to-br ${student.color || `from-${theme.primaryColor} to-${theme.secondaryColor}`} flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-slate-300 dark:shadow-none ring-8 ring-white dark:ring-slate-900`}>
                        {student.initials}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{student.name}</h1>
                            <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl font-mono font-black text-slate-400 text-sm">#{student.number.padStart(2, '0')}</span>
                        </div>
                        <p className="text-slate-500 font-bold mt-2 flex items-center gap-2">
                            <span className={`size-1.5 rounded-full bg-${theme.primaryColor}`}></span>
                            {activeSeries?.name} • Turma {selectedSection} • <span className={`text-${theme.primaryColor}`}>{currentUser?.subject}</span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto relative z-10 no-print">
                    <div className="flex-1 min-w-[180px]">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-2 block tracking-widest leading-none">Filtrar Período</label>
                        <select
                            value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.target.value)}
                            className={`w-full h-14 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-black text-slate-700 dark:text-slate-200 focus:border-${theme.primaryColor} focus:ring-4 focus:ring-${theme.primaryColor}/10 transition-all cursor-pointer`}
                        >
                            <option value="all">Ciclo Completo</option>
                            <option value="1">1ª Unidade</option>
                            <option value="2">2ª Unidade</option>
                            <option value="3">3ª Unidade</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[240px]">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-2 block tracking-widest leading-none">Trocar Aluno</label>
                        <select
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            className={`w-full h-14 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-black text-slate-700 dark:text-slate-200 focus:border-${theme.primaryColor} focus:ring-4 focus:ring-${theme.primaryColor}/10 transition-all cursor-pointer`}
                        >
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.number.padStart(2, '0')} - {s.name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleExportPDF}
                        className={`h-14 px-8 rounded-2xl bg-${theme.primaryColor} hover:opacity-90 text-white font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-${theme.primaryColor}/20 self-end active:scale-95 uppercase tracking-widest text-xs`}
                    >
                        <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                        Exportar Relatório
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Chart & Unit Reports */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    {/* PERFORMANCE CHART */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-${theme.primaryColor} to-${theme.secondaryColor}`}></div>

                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-black text-xl text-slate-900 dark:text-white flex items-center gap-3">
                                <span className={`size-10 rounded-xl bg-${theme.primaryColor}/10 text-${theme.primaryColor} flex items-center justify-center`}>
                                    <span className="material-symbols-outlined">trending_up</span>
                                </span>
                                Evolução Acadêmica
                            </h3>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <span className={`size-2 rounded-full bg-${theme.primaryColor}`}></span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Média Escolar</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={getChartData()} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                        dy={15}
                                    />
                                    <YAxis
                                        domain={[0, 10]}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', padding: '12px 16px' }}
                                        labelStyle={{ color: '#94a3b8', fontWeight: 'black', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase' }}
                                        itemStyle={{ color: '#fff', fontWeight: 'black', fontSize: '14px' }}
                                        cursor={{ stroke: primaryHex, strokeWidth: 2, strokeDasharray: '4 4' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="nota"
                                        stroke={primaryHex}
                                        strokeWidth={6}
                                        dot={{ r: 8, fill: primaryHex, strokeWidth: 4, stroke: '#fff' }}
                                        activeDot={{ r: 12, strokeWidth: 0 }}
                                        animationDuration={1500}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* UNIT BLOCKS */}
                    <div className="flex flex-col gap-6">
                        {['1', '2', '3']
                            .filter(u => selectedUnit === 'all' || selectedUnit === u)
                            .map(unit => {
                                const unitData = student.units[unit] || {};
                                const avg = calculateUnitAverage(unitData);

                                return (
                                    <div key={unit} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-8 animate-in fade-in slide-in-from-left duration-500 hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                                        <div className={`w-full md:w-48 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 relative overflow-hidden group/unit`}>
                                            <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-${theme.primaryColor}/10 to-transparent rounded-full -mr-8 -mt-8`}></div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{unit}ª Unidade</span>
                                            <div className="relative">
                                                <span className={`text-6xl font-black ${avg >= 6 ? 'text-emerald-500' : 'text-rose-500'} tracking-tighter`}>{avg.toFixed(1)}</span>
                                            </div>
                                            <div className="mt-6 flex flex-col items-center gap-1">
                                                <div className={`h-1.5 w-16 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden`}>
                                                    <div className={`h-full ${avg >= 6 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${avg * 10}%` }}></div>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 mt-2 uppercase">Status: {avg >= 6 ? 'Aprovado' : 'Abaixo'}</span>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-4">
                                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Parecer Pedagógico Analítico</label>
                                                <div className="flex gap-1">
                                                    <span className="material-symbols-outlined text-slate-300 text-sm">edit</span>
                                                </div>
                                            </div>
                                            <textarea
                                                className={`w-full h-40 rounded-[24px] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 resize-none focus:ring-8 focus:ring-${theme.primaryColor}/5 focus:border-${theme.primaryColor} transition-all text-sm font-medium leading-relaxed p-6 custom-scrollbar`}
                                                placeholder={`Descreva aqui a evolução, dificuldades e habilidades desenvolvidas por ${student.name.split(' ')[0]} nesta unidade...`}
                                                defaultValue={unitData.observation || ''}
                                                onBlur={(e) => saveObservation(unit, e.target.value)}
                                            ></textarea>
                                        </div>
                                    </div>
                                )
                            })}
                    </div>
                </div>

                {/* Right Column: Occurrences & Statistics */}
                <div className="flex flex-col gap-8 no-print">
                    {/* OCCURRENCES PANEL */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col h-fit sticky top-6">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-3">
                                <span className={`size-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center`}>
                                    <span className="material-symbols-outlined">warning</span>
                                </span>
                                Pontos de Atenção
                            </h3>
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-black px-3 py-1 rounded-full">{getStudentOccurrences().length}</span>
                        </div>

                        <div className="flex flex-col gap-4 max-h-[320px] overflow-y-auto pr-2 mb-8 custom-scrollbar">
                            {getStudentOccurrences().length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="size-16 rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800">
                                        <span className="material-symbols-outlined text-slate-300 text-3xl">verified</span>
                                    </div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nenhuma ocorrência</p>
                                </div>
                            ) : (
                                getStudentOccurrences().slice().reverse().map(occ => (
                                    <div key={occ.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/50 relative group/occ">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded-lg border-2 ${occ.type === 'Elogio' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10' : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10'}`}>
                                                {occ.type}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">{occ.date}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic line-clamp-3">"{occ.description}"</p>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="space-y-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                            {/* GENERAL REPORT */}
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`material-symbols-outlined text-${theme.primaryColor} text-lg`}>auto_fix_high</span>
                                    <h4 className="font-black text-xs uppercase tracking-widest text-slate-500">Relatório Consolidado Anual</h4>
                                </div>
                                <textarea
                                    className={`w-full h-32 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 resize-none focus:ring-8 focus:ring-${theme.primaryColor}/5 focus:border-${theme.primaryColor} transition-all text-xs font-medium leading-relaxed p-4 custom-scrollbar`}
                                    placeholder="Visão macro sobre o desenvolvimento socioemocional e cognitivo..."
                                    defaultValue={student.units.generalReport || ''}
                                    onBlur={(e) => saveObservation('generalReport', e.target.value)}
                                ></textarea>
                            </div>

                            {/* ATTENDANCE CARD */}
                            <div className={`bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} p-6 rounded-[28px] text-white shadow-xl shadow-${theme.primaryColor}/20 relative overflow-hidden group/att`}>
                                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                    <span className="material-symbols-outlined text-[100px]">how_to_reg</span>
                                </div>
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <h4 className="font-black text-xs uppercase tracking-[0.2em] opacity-80">Frequência Total</h4>
                                    <span className="text-3xl font-black tracking-tighter">{getAttendanceStats().percentage}%</span>
                                </div>
                                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden mb-4 relative z-10">
                                    <div
                                        className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                        style={{ width: `${getAttendanceStats().percentage}%` }}
                                    ></div>
                                </div>
                                <div className="flex items-center justify-between relative z-10">
                                    <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">{getAttendanceStats().present} Dias Presentes</span>
                                    <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">{getAttendanceStats().total} Letivos</span>
                                </div>
                            </div>

                            {/* RECENT ACTIVITIES */}
                            <div className="flex flex-col gap-4">
                                <h4 className="font-black text-xs uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-emerald-500 text-lg">verified</span>
                                    Atividades Realizadas
                                </h4>
                                <div className="flex flex-col gap-2">
                                    {getStudentActivities().length === 0 ? (
                                        <p className="text-[10px] text-zinc-400 italic">Sem registros no momento.</p>
                                    ) : (
                                        getStudentActivities().slice(0, 4).map(act => (
                                            <div key={act.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-[11px]">
                                                <div className="flex flex-col min-w-0 pr-2">
                                                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{act.title}</span>
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{new Date(act.date).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                                {act.done ? (
                                                    <span className="size-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                                        <span className="material-symbols-outlined text-sm">check</span>
                                                    </span>
                                                ) : (
                                                    <span className="size-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                                                        <span className="material-symbols-outlined text-xs">close</span>
                                                    </span>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            className={`mt-8 w-full h-14 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:border-${theme.primaryColor} hover:text-${theme.primaryColor} hover:bg-${theme.primaryColor}/5 transition-all flex items-center justify-center gap-3 no-print active:scale-95`}
                        >
                            <span className="material-symbols-outlined text-lg">add_circle</span>
                            Nova Ocorrência
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};