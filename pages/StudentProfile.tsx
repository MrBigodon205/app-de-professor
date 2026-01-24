import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useClass } from '../contexts/ClassContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { Student, Activity, AttendanceRecord, Occurrence, Plan } from '../types';
import { supabase } from '../lib/supabase';
import { calculateUnitTotal, calculateAnnualSummary, getStatusResult } from '../utils/gradeCalculations';
import { TransferStudentModal } from '../components/TransferStudentModal';
import { DynamicSelect } from '../components/DynamicSelect';


interface Grades {
    exam?: number;
    average?: number; // Calculated dynamically
}

export const StudentProfile: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { selectedSeriesId, selectedSection, activeSeries, classes, selectSeries, selectSection } = useClass();
    const { currentUser, activeSubject } = useAuth();
    const theme = useTheme();

    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [selectedUnit, setSelectedUnit] = useState<string>('all');
    const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

    const fetchData = useCallback(async (silent = false) => {
        if (!currentUser) return;
        if (!silent) setLoading(true);
        try {
            // Parallel Fetching Optimization: Start all independent requests at once
            const studentsPromise = supabase
                .from('students')
                .select('*')
                .eq('series_id', selectedSeriesId)
                .eq('section', selectedSection)
                .eq('user_id', currentUser.id);

            const independentPromises = Promise.all([
                supabase.from('occurrences').select('*').eq('user_id', currentUser.id).order('date', { ascending: false }),
                supabase.from('attendance').select('*').eq('user_id', currentUser.id),
                supabase.from('activities').select('*').eq('user_id', currentUser.id).eq('series_id', selectedSeriesId).or(`section.eq.${selectedSection},section.is.null,section.eq.,section.eq.Todas as Turmas`),
                supabase.from('plans').select('*').eq('user_id', currentUser.id).eq('series_id', selectedSeriesId).eq('section', selectedSection)
            ]);

            const [studentsRes, [occRes, attRes, actRes, planRes]] = await Promise.all([
                studentsPromise,
                independentPromises
            ]);

            if (studentsRes.error) throw studentsRes.error;
            const studentsData = studentsRes.data || [];

            // Now we need grades, which depends on student IDs. 
            // We can only fetch this after we have students.
            const studentIds = studentsData.map(s => s.id);
            let gradesData: any[] = [];

            if (studentIds.length > 0) {
                const { data, error } = await supabase
                    .from('grades')
                    .select('*')
                    .in('student_id', studentIds)
                    .eq('subject', activeSubject)
                    .eq('user_id', currentUser.id);
                if (!error && data) gradesData = data;
            }

            const formattedStudents: Student[] = studentsData.map(s => {
                const sGrades = gradesData.filter(g => g.student_id === s.id);
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

            const formattedOcc: Occurrence[] = (occRes.data || []).map(o => ({
                id: o.id.toString(),
                studentId: o.student_id.toString(),
                type: o.type,
                description: o.description,
                date: o.date,
                unit: o.unit,
                userId: o.user_id
            }));

            const formattedAtt: AttendanceRecord[] = (attRes.data || []).map(a => ({
                id: a.id.toString(),
                studentId: a.student_id.toString(),
                date: a.date,
                status: a.status as any,
                unit: a.unit,
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
    }, [currentUser, selectedSeriesId, selectedSection, activeSubject]);

    useEffect(() => {
        if (selectedSeriesId && selectedSection) {
            fetchData();
        } else {
            setStudents([]);
            setOccurrences([]);
            setLoading(false);
        }
    }, [selectedSeriesId, selectedSection, activeSubject, fetchData]);

    useEffect(() => {
        if (students.length > 0) {
            if (id) {
                // If URL has an ID, use it
                const found = students.find(s => s.id === id);
                if (found) setSelectedStudentId(id);
            } else {
                // Desktop: Auto-select first if none. Mobile: Keep empty to show list.
                const isMobile = window.innerWidth < 1024; // lg breakpoint
                if (!isMobile && !selectedStudentId) {
                    setSelectedStudentId(students[0].id);
                }
            }
        }
    }, [students, selectedStudentId, id]);

    // --- REALTIME SUBSCRIPTION ---
    useEffect(() => {
        if (!currentUser || !selectedSeriesId) return;

        // Polling Fallback (Every 10s)
        const interval = setInterval(() => {
            fetchData(true);
        }, 10000);


        // Listen to changes in related tables
        const channel = supabase.channel(`profile_sync_${selectedSeriesId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => fetchData(true))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'occurrences' }, () => fetchData(true))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => fetchData(true))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'grades' }, () => fetchData(true))
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, [selectedSeriesId, selectedSection, currentUser, activeSubject, fetchData]);

    const handleExportPDF = async () => {
        if (!student) return;

        try {
            // Dynamic Import for Performance
            const jsPDF = (await import('jspdf')).default;
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF();
            const studentOccurrences = occurrences.filter(o => o.studentId === student.id);
            const studentAttendance = attendance.filter(a => a.studentId === student.id && a.status !== 'S');
            const totalClasses = studentAttendance.length;
            const presentCount = studentAttendance.filter(a => a.status === 'P').length;
            const attendancePercentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(0) : '100';
            const totalOccurrences = studentOccurrences.length;
            const activeAlerts = studentOccurrences.filter(o => o.type !== 'Elogio').length;

            // --- HELPER: Draw Premium Header ---
            const drawHeader = () => {
                // Background
                doc.setFillColor(63, 81, 181); // Primary Indigo
                doc.rect(0, 0, 210, 50, 'F');

                // Decorative Circles (Glass effect simulated with opacity)
                doc.setFillColor(255, 255, 255);
                doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
                doc.circle(190, 10, 40, 'F');
                doc.circle(20, 50, 30, 'F');
                doc.setGState(new (doc as any).GState({ opacity: 1 }));

                // Brand Text
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(24);
                doc.text('PROF. ACERTA+', 14, 25);

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text('Sistema de Gestão Escolar Inteligente', 14, 32);

                // Report Title Badge
                doc.setFillColor(255, 255, 255);
                doc.roundedRect(150, 15, 46, 20, 3, 3, 'F');
                doc.setTextColor(63, 81, 181);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.text('RELATÓRIO DO ALUNO', 173, 22, { align: 'center' });
                doc.setFontSize(6);
                doc.text(new Date().toLocaleDateString('pt-BR'), 173, 28, { align: 'center' });
            };

            // --- HELPER: Draw Stat Card ---
            const drawStatCard = (x: number, y: number, label: string, value: string, subtext: string, color: [number, number, number]) => {
                // Shadow simulation
                doc.setFillColor(240, 240, 240);
                doc.roundedRect(x + 1, y + 1, 55, 25, 3, 3, 'F');

                // Card BG
                doc.setFillColor(255, 255, 255);
                doc.setDrawColor(230, 230, 230);
                doc.roundedRect(x, y, 55, 25, 3, 3, 'FD');

                // Accent Line
                doc.setFillColor(...color);
                doc.rect(x + 3, y + 5, 2, 15, 'F');

                // Text
                doc.setTextColor(100, 116, 139); // Slate 500
                doc.setFontSize(7);
                doc.setFont('helvetica', 'bold');
                doc.text(label.toUpperCase(), x + 8, y + 8);

                doc.setTextColor(30, 41, 59); // Slate 800
                doc.setFontSize(11); // Slightly smaller to fit long status text if needed
                doc.text(value, x + 8, y + 16);

                doc.setTextColor(148, 163, 184); // Slate 400
                doc.setFontSize(6);
                doc.text(subtext, x + 8, y + 21);
            };

            // Invoke Header
            drawHeader();

            // --- STUDENT INFO CONTEXT ---
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.setTextColor(30, 41, 59);
            doc.text(student.name.toUpperCase(), 14, 70);

            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text(`${activeSeries?.name} • Turma ${selectedSection} • Matrícula #${student.number}`, 14, 76);

            // --- STATS ROW ---
            drawStatCard(14, 85, 'Frequência Global', `${attendancePercentage}%`, `${presentCount} presenças em ${totalClasses} aulas`, [34, 197, 94] /* Green */);
            drawStatCard(76, 85, 'Total Ocorrências', totalOccurrences.toString(), `${activeAlerts} alertas registrados`, [249, 115, 22] /* Orange */);

            // Calculate Global Grade Average using Shared Logic
            const { annualTotal, status: annualStatus, baseTotal, finalNeeded } = calculateAnnualSummary(student);

            // Determine Color based on status
            const statusColor = annualStatus === 'APPROVED' ? [34, 197, 94] // Green
                : (annualStatus === 'RECOVERY' || (annualStatus as string) === 'FAILED') ? [239, 68, 68] // Red
                    : [249, 115, 22]; // Orange (Final)

            // Label text - Updated to be explicit as requested
            const statusText = annualStatus === 'APPROVED' ? 'APROVADO'
                : annualStatus === 'RECOVERY' ? 'RECUPERAÇÃO'
                    : annualStatus === 'FINAL' ? 'PROVA FINAL'
                        : 'REPROVADO';

            const statusSubtext = annualStatus === 'APPROVED' ? `Média Final: ${(annualTotal / 3).toFixed(1)}` : `Total Atual: ${annualTotal.toFixed(1)}`;

            drawStatCard(138, 85, 'Situação Final', statusText, statusSubtext, statusColor as any);

            let startY = 125;
            let maxFinalY = startY;

            // Define columns: dynamic based on selection
            const columnWidth = selectedUnit === 'all' ? 58 : 180;
            const columnGap = 4;
            const availableUnits = selectedUnit === 'all' ? ['1', '2', '3'] : [selectedUnit];

            const columns = availableUnits.map((unit, index) => ({
                unit,
                x: selectedUnit === 'all' ? 14 + (index * (columnWidth + columnGap)) : 14
            }));

            // --- CYCLE THROUGH UNITS (SIDE BY SIDE) ---
            columns.forEach((col) => {
                let currentY = startY;
                const unit = col.unit;

                // Unit Header
                doc.setFillColor(241, 245, 249); // Slate 100
                doc.rect(col.x, currentY, columnWidth, 8, 'F');
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(30, 41, 59);
                doc.text(`${unit}ª UNIDADE`, col.x + 4, currentY + 5.5);

                const unitData = student.units[unit] || {};
                const avg = calculateUnitTotal(student, unit);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.text(`Média: ${avg.toFixed(1)}`, col.x + columnWidth - 4, currentY + 5.5, { align: 'right' });

                currentY += 12;

                // 1. GRADES TABLE
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(71, 85, 105);
                doc.text('Avaliações', col.x, currentY);
                currentY += 3;

                const gradeRows: any[] = [];
                Object.entries(unitData).forEach(([key, value]) => {
                    if (key !== 'observation' && typeof value === 'number') {
                        // Shorten keys for compact layout if needed
                        let label = key.charAt(0).toUpperCase() + key.slice(1);
                        if (label === 'Qualitative') label = 'Qualit.';

                        gradeRows.push([label, value.toFixed(1)]);
                    }
                });

                if (gradeRows.length > 0) {
                    autoTable(doc, {
                        startY: currentY,
                        head: [['Atividade', 'Nota']],
                        body: gradeRows,
                        theme: 'grid',
                        headStyles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontSize: 7, fontStyle: 'bold', lineColor: [226, 232, 240], lineWidth: 0.1 },
                        bodyStyles: { fontSize: 7, textColor: [51, 65, 85], lineColor: [226, 232, 240] },
                        styles: { cellPadding: 1.5, halign: 'left', overflow: 'ellipsize' },
                        columnStyles: { 1: { halign: 'center', fontStyle: 'bold', cellWidth: 12 } },
                        margin: { left: col.x },
                        tableWidth: columnWidth
                    });
                    currentY = (doc as any).lastAutoTable.finalY + 8;
                } else {
                    doc.setFont('helvetica', 'italic');
                    doc.setFontSize(7);
                    doc.setTextColor(148, 163, 184);
                    doc.text('Sem notas.', col.x, currentY + 3);
                    currentY += 10;
                }

                // 2. OCCURRENCES
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(71, 85, 105);
                doc.text('Ocorrências', col.x, currentY);
                currentY += 3;

                const unitOccurrences = studentOccurrences.filter(o => o.unit === unit);

                if (unitOccurrences.length > 0) {
                    // Use simple text for occurrences to save space and control layout better than table in narrow col
                    unitOccurrences.forEach(occ => {
                        const date = new Date(occ.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

                        // Small dot
                        doc.setFillColor(occ.type === 'Elogio' ? 34 : 249, occ.type === 'Elogio' ? 197 : 115, occ.type === 'Elogio' ? 94 : 22);
                        doc.circle(col.x + 2, currentY + 3, 1.5, 'F');

                        doc.setFontSize(7);
                        doc.setFont('helvetica', 'bold');
                        doc.setTextColor(51, 65, 85);
                        doc.text(`${date} - ${occ.type}`, col.x + 6, currentY + 4);

                        currentY += 4; // Spacing

                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(6.5);
                        doc.setTextColor(100, 116, 139);
                        const splitDesc = doc.splitTextToSize(occ.description, columnWidth - 6);
                        doc.text(splitDesc, col.x + 6, currentY + 2);

                        currentY += (splitDesc.length * 3) + 3;
                    });

                } else {
                    doc.setFont('helvetica', 'italic');
                    doc.setFontSize(7);
                    doc.setTextColor(148, 163, 184);
                    doc.text('Sem ocorrências.', col.x, currentY + 3);
                    currentY += 6;
                }

                if (currentY > maxFinalY) maxFinalY = currentY;
            });

            // --- ACTIVITIES & TASKS SECTION ---
            let actY = maxFinalY + 5;

            // Check page break for Activities
            if (actY > 250) {
                doc.addPage();
                actY = 20;
            }

            // Filter activities for this student (already filtered by class/section in fetch, but let's sort by date)
            const studentActivities = activities
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            if (studentActivities.length > 0) {
                doc.setFillColor(241, 245, 249); // Slate 100
                doc.rect(14, actY, 182, 8, 'F');
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(30, 41, 59);
                doc.text('ATIVIDADES & TAREFAS', 18, actY + 5.5);

                // Stats
                const totalActs = studentActivities.length;
                const doneActs = studentActivities.filter(a => a.completions?.includes(student.id)).length;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.text(`Entregues: ${doneActs} de ${totalActs}`, 190, actY + 5.5, { align: 'right' });

                actY += 10;

                const actBody = studentActivities.map(act => {
                    const isDone = act.completions?.includes(student.id);
                    const date = new Date(act.date + 'T12:00:00').toLocaleDateString('pt-BR');
                    return [date, act.title, act.type, isDone ? 'CONCLUÍDO' : 'PENDENTE'];
                });

                autoTable(doc, {
                    startY: actY,
                    head: [['Data', 'Atividade', 'Tipo', 'Status']],
                    body: actBody,
                    theme: 'grid',
                    styles: {
                        fontSize: 8,
                        cellPadding: 2,
                        valign: 'middle',
                        lineColor: [241, 245, 249],
                        lineWidth: 0.1,
                        textColor: [51, 65, 85]
                    },
                    headStyles: {
                        fillColor: [248, 250, 252],
                        textColor: [71, 85, 105],
                        fontStyle: 'bold',
                        lineWidth: 0,
                    },
                    columnStyles: {
                        0: { cellWidth: 25, halign: 'center' },
                        1: { cellWidth: 'auto' },
                        2: { cellWidth: 30, halign: 'center' },
                        3: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }
                    },
                    margin: { left: 14, right: 14 },
                    didParseCell: (data) => {
                        if (data.section === 'body' && data.column.index === 3) {
                            const val = data.cell.raw;
                            if (val === 'CONCLUÍDO') {
                                data.cell.styles.textColor = [22, 163, 74]; // Green
                            } else {
                                data.cell.styles.textColor = [239, 68, 68]; // Red
                            }
                        }
                    }
                });

                maxFinalY = (doc as any).lastAutoTable.finalY;
            } else {
                // No activities found
            }

            // --- PEDAGOGICAL ANALYSIS (AUTOMATED) ---

            // Logic to generate the analysis text
            const generateAnalysis = () => {
                const parts: string[] = [];
                const firstName = student.name.split(' ')[0];

                // 1. ACADEMIC ANALYSIS
                // Calculate average (0-10 scale approximation based on annual total / 3 units)
                const approximateAverage = (annualTotal / 3);

                if (annualStatus === 'APPROVED') {
                    if (approximateAverage >= 9.0) {
                        parts.push(`${firstName} apresenta um desempenho acadêmico excepcional, mantendo médias elevadas e demonstrando domínio completo dos conteúdos.`);
                    } else if (approximateAverage >= 8.0) {
                        parts.push(`${firstName} tem um desempenho acadêmico muito bom, alcançando consistentemente os objetivos de aprendizagem propostos.`);
                    } else {
                        parts.push(`${firstName} apresenta um desempenho satisfatório, atingindo a média necessária para aprovação no ciclo.`);
                    }
                } else if (annualStatus === 'FINAL') {
                    const pointsNeeded = finalNeeded.toFixed(1);
                    if (finalNeeded <= 3.0) {
                        parts.push(`O desempenho acadêmico requer atenção. O aluno está em Prova Final por uma pequena diferença, necessitando de apenas ${pointsNeeded} pontos para aprovação.`);
                    } else {
                        parts.push(`O desempenho acadêmico inspira cuidados. O aluno está em Prova Final e precisará de dedicação para alcançar os ${pointsNeeded} pontos necessários.`);
                    }
                } else if (annualStatus === 'RECOVERY') {
                    // Check if it was close to Final (8.0 total needed for Final)
                    if (baseTotal >= 5.0) {
                        parts.push(`O desempenho está abaixo do esperado. O aluno não atingiu a média para Prova Final e está em Recuperação. É fundamental intensificar os estudos nos conteúdos básicos.`);
                    } else {
                        parts.push(`O quadro acadêmico é preocupante. Com médias baixas durante o ano, o aluno está em Recuperação e necessitará de um plano de estudos rigoroso para reverter o quadro.`);
                    }
                } else {
                    parts.push(`O desempenho acadêmico foi insatisfatório, não atingindo os critérios mínimos de aprovação estabelecidos.`);
                }

                // 2. ATTENDANCE ANALYSIS
                const attPct = parseInt(attendancePercentage);
                if (attPct >= 90) {
                    parts.push("Sua frequência às aulas é excelente, o que contribui positivamente para seu aproveitamento.");
                } else if (attPct >= 75) {
                    parts.push("A frequência é regular, mas faltas pontuais devem ser evitadas para não prejudicar a sequência do aprendizado.");
                } else if (attPct >= 45) {
                    parts.push("ALERT: A frequência apresenta instabilidade. O número de faltas está alto e pode comprometer a aprovação se não houver melhora imediata.");
                } else {
                    parts.push("CRÍTICO: A frequência está extremamente baixa (abaixo de 45%), colocando o aluno em sério risco de reprovação por faltas. Requer intervenção imediata da gestão.");
                }

                // 3. BEHAVIORAL ANALYSIS
                const negativeOccurrences = studentOccurrences.filter(o => o.type !== 'Elogio');
                const praises = studentOccurrences.filter(o => o.type === 'Elogio');

                if (negativeOccurrences.length > 0) {
                    // Count types to find the most frequent issue
                    const typeCounts: Record<string, number> = {};
                    negativeOccurrences.forEach(o => {
                        typeCounts[o.type] = (typeCounts[o.type] || 0) + 1;
                    });

                    const mostFrequentType = Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b);
                    const count = typeCounts[mostFrequentType];

                    if (mostFrequentType.toLowerCase().includes('celular')) {
                        parts.push(`Comportamentalmente, observa-se o uso recorrente do celular em sala (${count} registros), o que tem dispersado a atenção e pode estar impactando o rendimento.`);
                    } else if (mostFrequentType.toLowerCase().includes('indisciplina') || mostFrequentType.toLowerCase().includes('conversa')) {
                        parts.push(`No aspecto disciplinar, há registros frequentes de ${mostFrequentType.toLowerCase()}, interferindo na dinâmica da aula e no aproveitamento do próprio aluno.`);
                    } else if (mostFrequentType.toLowerCase().includes('material')) {
                        parts.push(`Nota-se a falta constante de material didático, o que dificulta a realização das atividades propostas em sala.`);
                    } else {
                        parts.push(`Há registros de ocorrências comportamentais (${mostFrequentType.toLowerCase()}) que requerem orientação para garantir um ambiente propício ao aprendizado.`);
                    }
                } else {
                    parts.push("A conduta disciplinar é exemplar, não havendo registros negativos que desabonem seu comportamento em sala.");
                }

                // Add Praise if available
                if (praises.length > 0) {
                    const lastPraise = praises[praises.length - 1]; // Use the most recent praise
                    // Truncate description if too long
                    let praiseDesc = lastPraise.description;
                    if (praiseDesc.length > 100) praiseDesc = praiseDesc.substring(0, 100) + '...';

                    parts.push(`Vale destacar o elogio registrado recentemente: "${praiseDesc}"`);
                }

                return parts.join(' ');
            };

            const analysisText = generateAnalysis();
            // Reduced width from 174 to 160 to prevent text cutoff and add better padding
            const splitAnalysis = doc.splitTextToSize(analysisText, 160);
            const lineHeight = 4; // mm
            const textHeight = splitAnalysis.length * lineHeight;
            const boxPadding = 16; // 8top + 8bottom
            const boxHeight = textHeight + boxPadding + 10; // +10 for title space

            let finalY = maxFinalY + 5; // Reduced spacing to 5

            // Check Page Break - Increased threshold to 285 (approx 12mm margin bottom)
            if (finalY + boxHeight > 285) {
                doc.addPage();
                finalY = 20; // Reset to top
            }

            doc.setFillColor(248, 250, 252);
            doc.roundedRect(14, finalY, 182, boxHeight, 3, 3, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105);
            doc.text('PONTO DE ATENÇÃO / ANÁLISE PEDAGÓGICA (Automático)', 18, finalY + 8);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(51, 65, 85);
            doc.text(splitAnalysis, 18, finalY + 14, { lineHeightFactor: 1.5 });

            // --- FOOTER ---
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.text(`Página ${i} de ${pageCount} • Gerado por Prof. Acerta+`, 105, 290, { align: 'center' });
            }

            const reportType = selectedUnit === 'all' ? 'Completo' : `${selectedUnit}a_Unidade`;
            const fileName = `Relatorio_${student.name}_${reportType}`.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
            doc.save(fileName);

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao carregar módulo de PDF. Tente novamente.');
        }
    };

    const getStudent = () => students.find(s => s.id === selectedStudentId);
    const student = getStudent();

    // calculateUnitAverage removed (imported from utils)

    const getChartData = () => {
        if (!student) return [];
        const units = selectedUnit === 'all' ? ['1', '2', '3'] : [selectedUnit];
        return units.map(unit => ({
            name: `${unit}ª Unid`,
            nota: calculateUnitTotal(student, unit)
        }));
    };

    const getStudentOccurrences = () => occurrences.filter(o => o.studentId === selectedStudentId);

    const getAttendanceStats = () => {
        const studentAtt = attendance.filter(a => a.studentId === selectedStudentId && a.status !== 'S');
        const total = studentAtt.length;
        const present = studentAtt.filter(a => a.status === 'P').length;
        const percentage = total === 0 ? '100' : ((present / total) * 100).toFixed(0);
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

    // Optimized: No blocking loader. We let the UI skeleton render immediately.
    // if (loading) return (...) <- REMOVED

    const primaryHex = getHexColor(theme.primaryColor);

    // --- SKELETON HELPERS ---
    const SkeletonCard = () => (
        <div className="bg-surface-card p-8 rounded-[32px] border border-border-default shadow-sm animate-pulse h-48">
            <div className={`h-8 w-32 bg-surface-subtle rounded-lg mb-4`}></div>
            <div className={`h-12 w-16 bg-surface-subtle rounded-lg`}></div>
        </div>
    );
    const SkeletonHeader = () => (
        <div className={`bg-surface-card p-8 rounded-[32px] border border-border-default shadow-sm animate-pulse h-40 flex items-center gap-6`}>
            <div className="size-20 rounded-[28px] bg-surface-subtle shrink-0"></div>
            <div className="flex flex-col gap-3 w-full">
                <div className="h-8 w-64 bg-surface-subtle rounded-xl"></div>
                <div className="h-4 w-48 bg-surface-subtle rounded-xl"></div>
            </div>
        </div>
    );


    return (
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-6rem)] overflow-hidden">

            {/* LEFT SIDEBAR: Student List */}
            {/* Desktop: Always distinct. Mobile: Visible only when NO student selected */}
            <div className={`${selectedStudentId ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 shrink-0 gap-4 h-full`}>
                <div className="bg-surface-card p-6 rounded-[2rem] border border-border-default shadow-xl h-full flex flex-col">
                    {/* Mobile Portrait Only Selectors */}
                    <div className="flex portrait:flex landscape:hidden lg:hidden flex-col gap-2 mb-4">
                        <DynamicSelect
                            value={selectedSeriesId}
                            onChange={selectSeries}
                            options={classes.map(c => ({
                                value: c.id,
                                label: c.name,
                                icon: 'school'
                            }))}
                            placeholder="Selecione a Série"
                            compact
                            className="w-full"
                        />
                        <DynamicSelect
                            value={selectedSection}
                            onChange={selectSection}
                            options={activeSeries?.sections.map(s => ({
                                value: s,
                                label: `Turma ${s}`,
                                icon: 'group'
                            })) || []}
                            placeholder="Selecione a Turma"
                            compact
                            className="w-full"
                        />
                    </div>

                    {/* Desktop / Landscape Header */}
                    <h3 className="hidden landscape:flex lg:flex font-bold text-text-primary mb-4 items-center gap-2">
                        <span className="material-symbols-outlined text-primary">groups</span>
                        Turma {activeSeries?.name}
                    </h3>

                    <div className="relative mb-4 group/search">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within/search:text-primary transition-colors">search</span>
                        <input
                            type="text"
                            placeholder="Buscar aluno..."
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-subtle border border-border-default focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-1">
                        {students.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedStudentId(s.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${selectedStudentId === s.id
                                    ? `bg-${theme.primaryColor}/10 border border-${theme.primaryColor}/20`
                                    : 'hover:bg-surface-subtle border border-transparent hover:border-border-default'}`}
                            >
                                <div className={`student-avatar student-avatar-sm bg-gradient-to-br ${s.color || `from-indigo-600 to-indigo-800`}`}>
                                    {s.initials}
                                </div>
                                <div className="min-w-0">
                                    <p className={`text-sm font-bold truncate ${selectedStudentId === s.id ? `text-${theme.primaryColor}` : 'text-slate-700 dark:text-slate-300'}`}>{s.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">#{s.number}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            {/* Desktop: Always visible. Mobile: Visible only when student IS selected */}
            <div className={`${!selectedStudentId ? 'hidden lg:flex' : 'flex'} flex-1 flex-col gap-8 h-full overflow-y-auto custom-scrollbar lg:pr-2 pb-20 lg:pb-0`}>
                {!student && !loading ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 h-full animate-in fade-in zoom-in duration-500">
                        <div className={`size-24 rounded-3xl bg-${theme.primaryColor}/10 flex items-center justify-center mb-6`}>
                            <span className={`material-symbols-outlined text-5xl text-${theme.primaryColor}`}>{theme.icon}</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 text-center">Nenhum Aluno Selecionado</h3>
                        <p className="text-slate-500 text-center max-w-sm">Escolha um aluno na lista ao lado para visualizar o relatório completo e gerenciar o desempenho escolar.</p>
                    </div>
                ) : (
                    <>
                        {/* Header / Selector */}
                        {loading ? <SkeletonHeader /> : (
                            <div className={`shrink-0 bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col items-center p-8 relative overflow-hidden group`}>
                                <div className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-${theme.primaryColor}/20 to-${theme.secondaryColor}/20`}></div>
                                <div className={`absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-${theme.primaryColor}/10 to-transparent rounded-full -mr-40 -mt-40 blur-3xl group-hover:from-${theme.primaryColor}/15 transition-colors duration-700`}></div>

                                {/* Back Button - Mobile Only - Clears Selection */}
                                <div className="w-full flex justify-start px-0 mb-4 md:mb-0 md:absolute md:top-6 md:left-6 z-20 no-print lg:hidden">
                                    <button
                                        onClick={() => setSelectedStudentId('')}
                                        className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-md"
                                    >
                                        <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
                                        <span className="text-sm font-bold">Voltar</span>
                                    </button>
                                </div>

                                <div className="relative z-10 -mt-4 flex flex-col items-center">
                                    <div className={`student-avatar student-avatar-lg bg-gradient-to-br ${student?.color || `from-indigo-600 to-indigo-800`}`}>
                                        {student?.initials}
                                    </div>

                                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-4 text-center">{student?.name}</h1>

                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl font-mono font-bold text-slate-500 text-xs">#{student?.number.padStart(2, '0')}</span>
                                        <span className="text-slate-400 font-bold text-sm">•</span>
                                        <span className="text-slate-500 font-bold text-sm">{activeSeries?.name} - {selectedSection}</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-center gap-4 w-full mt-8 relative z-10 no-print">
                                    <div className="w-full max-w-xs">
                                        <DynamicSelect
                                            label="Filtrar Período"
                                            value={selectedUnit}
                                            onChange={setSelectedUnit}
                                            options={[
                                                { value: 'all', label: 'Ciclo Completo', icon: 'restart_alt' },
                                                { value: '1', label: '1ª Unidade', icon: 'looks_one' },
                                                { value: '2', label: '2ª Unidade', icon: 'looks_two' },
                                                { value: '3', label: '3ª Unidade', icon: 'looks_3' }
                                            ]}
                                        />
                                    </div>
                                    <div className="w-full max-w-xs">
                                        {/* Student Switcher Removed as per request */}
                                    </div>

                                    <div className="flex gap-2 w-full sm:w-auto sm:self-end">
                                        <button
                                            onClick={handleExportPDF}
                                            data-tour="reports-export-btn"
                                            className={`h-14 px-8 rounded-2xl text-white font-black flex items-center justify-center gap-3 transition-all active:scale-95 uppercase tracking-widest text-xs shadow-xl hover:opacity-90 w-full sm:w-auto`}
                                            style={{ backgroundColor: theme.primaryColorHex, boxShadow: `0 10px 20px -5px ${theme.primaryColorHex}40` }}
                                        >
                                            <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                                            Exportar PDF
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {student && (
                            <TransferStudentModal
                                isOpen={isTransferModalOpen}
                                onClose={() => setIsTransferModalOpen(false)}
                                student={student}
                            />
                        )}

                        {loading ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 flex flex-col gap-8">
                                    <div className="h-72 w-full bg-white dark:bg-slate-900 rounded-[32px] animate-pulse"></div>
                                    <div className="flex flex-col gap-6">
                                        <SkeletonCard />
                                        <SkeletonCard />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-8">
                                    <SkeletonCard />
                                    <SkeletonCard />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 fluid-gap-m">
                                {/* Left Column: Chart & Unit Reports */}
                                <div className="lg:col-span-2 flex flex-col fluid-gap-m">
                                    {/* PERFORMANCE CHART */}
                                    <div className="bg-white dark:bg-slate-900 fluid-p-m rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden landscape:min-h-[300px]" data-tour="reports-chart">
                                        <div className="absolute top-0 left-0 w-1 h-full" style={{ background: `linear-gradient(to bottom, ${theme.primaryColorHex}, ${theme.secondaryColorHex})` }}></div>

                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="font-black text-xl text-slate-900 dark:text-white flex items-center gap-3">
                                                <span className={`size-10 rounded-xl flex items-center justify-center`} style={{ backgroundColor: `${theme.primaryColorHex}1A`, color: theme.primaryColorHex }}>
                                                    <span className="material-symbols-outlined">trending_up</span>
                                                </span>
                                                Evolução Acadêmica
                                            </h3>
                                            <div className="flex gap-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`size-2 rounded-full`} style={{ backgroundColor: theme.primaryColorHex }}></span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Desempenho por Unidade</span>
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
                                    <div className="flex flex-col fluid-gap-s">
                                        {['1', '2', '3']
                                            .filter(u => selectedUnit === 'all' || selectedUnit === u)
                                            .map(unit => (
                                                <div key={unit} className="bg-white dark:bg-slate-900 fluid-p-m rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 group/unit hover:border-primary/20 transition-all duration-500">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="size-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover/unit:bg-primary/10 transition-colors">
                                                                <span className="material-symbols-outlined text-slate-400 group-hover/unit:text-primary">{unit === '1' ? 'looks_one' : unit === '2' ? 'looks_two' : 'looks_3'}</span>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-black text-slate-900 dark:text-white text-lg">{unit}ª Unidade</h4>
                                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Relatório de Desempenho</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700">
                                                            <div className="px-4 py-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Média Final</p>
                                                                <p className="text-xl font-black text-slate-800 dark:text-white leading-none">
                                                                    {calculateUnitTotal(student, unit).toFixed(1)}
                                                                </p>
                                                            </div>
                                                            <div className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest ${calculateUnitTotal(student, unit) >= 6 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                                                                {calculateUnitTotal(student, unit) >= 6 ? 'Acima da Média' : 'Abaixo da Média'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                                        {Object.entries(student.units[unit] || {}).map(([key, value]) => {
                                                            if (key === 'observation' || typeof value !== 'number') return null;
                                                            return (
                                                                <div key={key} className="bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100/50 dark:border-slate-700/50 flex flex-col gap-1 transition-all hover:translate-y-[-2px] hover:shadow-lg hover:shadow-slate-200/20 dark:hover:shadow-none">
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{key}</p>
                                                                    <p className="text-xl font-black text-slate-800 dark:text-white">{(value as number).toFixed(1)}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    <div className="relative mt-4">
                                                        <span className="material-symbols-outlined absolute left-4 top-4 text-slate-400 text-lg">edit_note</span>
                                                        <textarea
                                                            placeholder="Adicione uma observação pedagógica para esta unidade..."
                                                            className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 pl-12 h-32 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all outline-none resize-none font-medium dark:text-slate-200"
                                                            value={student.units[unit]?.observation || ''}
                                                            onChange={(e) => saveObservation(unit, e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                {/* Right Column: Sidebar Stats */}
                                <div className="flex flex-col fluid-gap-m">
                                    {/* EXAM STATUS CARD */}
                                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 text-slate-800 dark:text-white relative overflow-hidden group shadow-xl border border-slate-100 dark:border-slate-800">
                                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-${theme.primaryColor}/20 to-transparent rounded-full -mr-16 -mt-16 blur-2xl group-hover:blur-3xl transition-all duration-700`}></div>


                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg text-primary">analytics</span>
                                            Resumo Anual
                                        </h4>

                                        {(() => {
                                            const { annualTotal, status, baseTotal } = calculateAnnualSummary(student);
                                            const score = status === 'APPROVED' ? (annualTotal / 3) : annualTotal;

                                            return (
                                                <div className="flex flex-col gap-8">
                                                    <div className="flex items-end gap-3">
                                                        <p className="text-6xl font-black tracking-tighter leading-none">{score.toFixed(1)}</p>
                                                        <div className="flex flex-col mb-1">
                                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{status === 'APPROVED' ? 'Média Final' : 'Pontos Totais'}</p>
                                                            <div className="h-1.5 w-12 bg-primary rounded-full mt-1"></div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex items-center justify-between text-xs font-bold px-1">
                                                            <span className="text-slate-400 uppercase tracking-widest">Status do Aluno</span>
                                                            <span className={status === 'APPROVED' ? 'text-emerald-400' : 'text-amber-400'}>
                                                                {status === 'APPROVED' ? 'Aprovado' : status === 'FINAL' ? 'Prova Final' : status === 'RECOVERY' ? 'Recuperação' : 'Reprovado'}
                                                            </span>
                                                        </div>
                                                        <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-slate-700/50">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-1000 ${status === 'APPROVED' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'}`}
                                                                style={{ width: `${Math.min((annualTotal / 18) * 100, 100)}%` }}
                                                            ></div>
                                                        </div>

                                                        <p className="text-[10px] text-slate-500 font-bold text-center italic mt-1">
                                                            {status === 'APPROVED' ? 'Parabéns! Requisitos mínimos atingidos.' : `Faltam ${(18 - annualTotal).toFixed(1)} pontos para aprovação.`}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* QUICK STATS GRID */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                                            <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
                                                <span className="material-symbols-outlined">event_available</span>
                                            </div>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Presença</p>
                                            <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{getAttendanceStats().percentage}%</p>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                                            <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
                                                <span className="material-symbols-outlined">warning</span>
                                            </div>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Ocorrências</p>
                                            <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{getStudentOccurrences().length}</p>
                                        </div>
                                    </div>

                                    {/* RECENT OCCURRENCES */}
                                    <div className="bg-white dark:bg-slate-900 fluid-p-m rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden h-96 flex flex-col">
                                        <h4 className="font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3">
                                            <span className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                <span className="material-symbols-outlined text-lg">history</span>
                                            </span>
                                            Histórico Recente
                                        </h4>
                                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-4">
                                            {getStudentOccurrences().length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-full opacity-40 grayscale">
                                                    <span className="material-symbols-outlined text-4xl mb-2">folder_open</span>
                                                    <p className="text-xs font-bold uppercase tracking-widest">Sem Registros</p>
                                                </div>
                                            ) : (
                                                getStudentOccurrences().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(occ => (
                                                    <div key={occ.id} className="group/occ relative pl-6 pb-6 border-l-2 border-slate-100 dark:border-slate-800 last:pb-0">
                                                        <div className={`absolute -left-[9px] top-0 size-4 rounded-full border-4 border-white dark:border-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 ${occ.type === 'Elogio' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}></div>
                                                        <div className="bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-2xl transition-all group-hover/occ:bg-slate-100 dark:group-hover/occ:bg-slate-800">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(occ.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                                                <span className={`text-[10px] font-black uppercase tracking-widest ${occ.type === 'Elogio' ? 'text-emerald-600' : 'text-rose-600'}`}>{occ.type}</span>
                                                            </div>
                                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{occ.description}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* ASSIGNED ACTIVITIES */}
                                    <div className="bg-white dark:bg-slate-900 fluid-p-m rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden h-96 flex flex-col">
                                        <h4 className="font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3">
                                            <span className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                <span className="material-symbols-outlined text-lg">assignment</span>
                                            </span>
                                            Atividades da Turma
                                        </h4>
                                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-3">
                                            {getStudentActivities().length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-full opacity-40 grayscale">
                                                    <span className="material-symbols-outlined text-4xl mb-2">task</span>
                                                    <p className="text-xs font-bold uppercase tracking-widest">Nenhuma Atividade</p>
                                                </div>
                                            ) : (
                                                getStudentActivities().map(act => (
                                                    <div key={act.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100/50 dark:border-slate-700/50">
                                                        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${act.done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                                                            <span className="material-symbols-outlined text-xl">{act.done ? 'check_circle' : 'pending_actions'}</span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-black text-slate-800 dark:text-white truncate">{act.title}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{act.done ? 'Concluída' : 'Pendente'}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* MANAGEMENT ACTIONS */}
                                    <div className="flex flex-col fluid-gap-s no-print">
                                        <button
                                            onClick={() => setIsTransferModalOpen(true)}
                                            className="w-full h-16 rounded-[2rem] bg-slate-800 hover:bg-slate-950 text-white font-black flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-slate-900/20 group"
                                        >
                                            <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">move_group</span>
                                            Mudar Turma do Aluno
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};