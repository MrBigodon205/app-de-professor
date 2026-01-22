import { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useClass } from '../../contexts/ClassContext';
import { useThemeContext } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { GlassCard } from '../../components/ui/GlassCard';
import { BackgroundPattern } from '../../components/ui/BackgroundPattern';
import { CheckCircle, Cloud, Calendar as CalIcon, Users, Trash2, RotateCcw } from 'lucide-react-native';
import { Student } from '../../types';

export default function AttendanceScreen() {
    const { currentUser, activeSubject } = useAuth();
    const { selectedSeriesId, selectedSection, activeSeries } = useClass();
    const theme = useThemeContext();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState<string>('1');
    const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    const fetchData = useCallback(async (silent = false) => {
        if (!currentUser || !selectedSeriesId || !selectedSection) return;
        if (!silent) setLoading(true);
        try {
            // Fetch students
            const { data: stdData } = await supabase
                .from('students')
                .select('*')
                .eq('series_id', selectedSeriesId)
                .eq('section', selectedSection)
                .eq('user_id', currentUser.id)
                .order('name');

            if (stdData) {
                setStudents(stdData as any);

                // Fetch today's records
                const { data: attData } = await supabase
                    .from('attendance')
                    .select('*')
                    .eq('date', today)
                    .eq('subject', activeSubject)
                    .eq('unit', selectedUnit)
                    .in('student_id', stdData.map(s => s.id));

                const map: any = {};
                stdData.forEach(s => {
                    const rec = attData?.find(r => r.student_id === s.id);
                    map[s.id] = rec ? rec.status : '';
                });
                setAttendanceMap(map);
            }
        } finally {
            if (!silent) setLoading(false);
        }
    }, [currentUser, selectedSeriesId, selectedSection, selectedUnit, activeSubject, today]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const updateRecord = async (studentId: string, status: string) => {
        if (!currentUser) return;
        setIsSaving(true);
        setAttendanceMap(prev => ({ ...prev, [studentId]: status }));

        try {
            if (status === '') {
                await supabase
                    .from('attendance')
                    .delete()
                    .eq('student_id', studentId)
                    .eq('date', today)
                    .eq('subject', activeSubject)
                    .eq('unit', selectedUnit);
            } else {
                await supabase
                    .from('attendance')
                    .upsert({
                        student_id: parseInt(studentId),
                        date: today,
                        status: status,
                        series_id: parseInt(selectedSeriesId!),
                        section: selectedSection,
                        user_id: currentUser.id,
                        subject: activeSubject,
                        unit: selectedUnit
                    }, { onConflict: 'student_id, date, user_id, subject, unit' });
            }
        } finally {
            setIsSaving(false);
        }
    };

    const markAll = async (status: string) => {
        if (!currentUser || students.length === 0) return;
        setIsSaving(true);
        const newMap = { ...attendanceMap };
        students.forEach(s => newMap[s.id] = status);
        setAttendanceMap(newMap);

        try {
            const promises = students.map(s => {
                if (status === '') {
                    return supabase.from('attendance')
                        .delete()
                        .eq('student_id', s.id)
                        .eq('date', today)
                        .eq('subject', activeSubject)
                        .eq('unit', selectedUnit);
                } else {
                    return supabase.from('attendance')
                        .upsert({
                            student_id: parseInt(s.id),
                            date: today,
                            status: status,
                            series_id: parseInt(selectedSeriesId!),
                            section: selectedSection,
                            user_id: currentUser.id,
                            subject: activeSubject,
                            unit: selectedUnit
                        }, { onConflict: 'student_id, date, user_id, subject, unit' });
                }
            });
            await Promise.all(promises);
        } finally {
            setIsSaving(false);
        }
    };

    if (!selectedSeriesId) {
        return (
            <View style={[styles.container, styles.centered]}>
                <BackgroundPattern />
                <Users size={64} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>Selecione uma turma</Text>
                <Text style={styles.emptyText}>Escolha no Dashboard para iniciar a chamada.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <BackgroundPattern />

            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.title}>Frequência</Text>
                    {isSaving ? (
                        <View style={styles.saveBadge}>
                            <ActivityIndicator size="small" color="#f59e0b" />
                            <Text style={[styles.saveText, { color: '#f59e0b' }]}>Sinc...</Text>
                        </View>
                    ) : (
                        <View style={styles.saveBadge}>
                            <Cloud size={14} color="#10b981" />
                            <Text style={[styles.saveText, { color: '#10b981' }]}>Salvo</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.subtitle}>{activeSeries?.name} • {selectedSection}</Text>

                <View style={styles.unitSelector}>
                    {['1', '2', '3'].map((u) => (
                        <TouchableOpacity
                            key={u}
                            onPress={() => setSelectedUnit(u)}
                            style={[styles.unitBtn, selectedUnit === u && { backgroundColor: theme.primaryColorHex }]}
                        >
                            <Text style={[styles.unitBtnText, selectedUnit === u && { color: 'white' }]}>{u}ª Unidade</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.quickActions}>
                <TouchableOpacity onPress={() => markAll('P')} style={[styles.actionBtn, { backgroundColor: '#10b981' }]}>
                    <CheckCircle size={16} color="white" />
                    <Text style={styles.actionText}>Tudo P</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => markAll('F')} style={[styles.actionBtn, { backgroundColor: '#f43f5e' }]}>
                    <RotateCcw size={16} color="white" />
                    <Text style={styles.actionText}>Tudo F</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => markAll('')} style={[styles.actionBtn, { backgroundColor: '#94a3b8' }]}>
                    <Trash2 size={16} color="white" />
                    <Text style={styles.actionText}>Limpar</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={students}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <GlassCard style={styles.studentCard}>
                        <View style={styles.info}>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.number}>Nº {item.number}</Text>
                        </View>
                        <View style={styles.btnGroup}>
                            {[
                                { status: 'P', label: 'P', color: '#10b981' },
                                { status: 'F', label: 'F', color: '#f43f5e' },
                                { status: 'J', label: 'J', color: '#f59e0b' },
                                { status: 'S', label: 'S', color: '#94a3b8' },
                            ].map(btn => (
                                <TouchableOpacity
                                    key={btn.status}
                                    onPress={() => updateRecord(item.id, attendanceMap[item.id] === btn.status ? '' : btn.status)}
                                    style={[
                                        styles.statusBtn,
                                        attendanceMap[item.id] === btn.status && { backgroundColor: btn.color }
                                    ]}
                                >
                                    <Text style={[
                                        styles.statusBtnText,
                                        attendanceMap[item.id] === btn.status && { color: 'white' }
                                    ]}>{btn.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </GlassCard>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        {loading ? <ActivityIndicator color={theme.primaryColorHex} /> : <Text style={styles.emptyText}>Nenhum aluno encontrado.</Text>}
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    centered: { justifyContent: 'center', alignItems: 'center', padding: 40 },
    header: {
        padding: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        backgroundColor: 'white',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 10,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    title: { fontSize: 28, fontWeight: '900', color: '#0f172a', letterSpacing: -1 },
    saveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    saveText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
    subtitle: { fontSize: 14, color: '#64748b', fontWeight: '800' },
    unitSelector: { flexDirection: 'row', gap: 8, marginTop: 16 },
    unitBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
    unitBtnText: { fontSize: 12, fontWeight: '900', color: '#64748b' },
    quickActions: { flexDirection: 'row', padding: 24, paddingBottom: 0, gap: 12 },
    actionBtn: { flex: 1, flexDirection: 'row', height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    actionText: { color: 'white', fontWeight: '900', fontSize: 13 },
    list: { padding: 24, paddingBottom: 100 },
    studentCard: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.7)' },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '900', color: '#1e293b', marginBottom: 2 },
    number: { fontSize: 12, color: '#94a3b8', fontWeight: '800' },
    btnGroup: { flexDirection: 'row', gap: 6 },
    statusBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
    statusBtnText: { fontSize: 14, fontWeight: '900', color: '#64748b' },
    emptyTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b', marginTop: 16 },
    emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 8, fontWeight: '600' },
    empty: { padding: 40, alignItems: 'center' }
});
