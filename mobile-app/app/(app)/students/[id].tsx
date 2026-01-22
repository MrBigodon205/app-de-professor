import { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, User, Phone, Mail, MapPin, GraduationCap, ClipboardList, Calendar } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { GlassCard } from '../../../components/ui/GlassCard';
import { BackgroundPattern } from '../../../components/ui/BackgroundPattern';
import { Student, Grades } from '../../../types';
import { calculateUnitTotal, getStatusResult, calculateAnnualSummary } from '../../../utils/gradeCalculations';
import { Platform } from 'react-native';

export default function StudentProfileScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { currentUser, activeSubject } = useAuth();
    const [student, setStudent] = useState<Student | null>(null);
    const [grades, setGrades] = useState<Grades | null>(null);
    const [loading, setLoading] = useState(true);
    const [occCount, setOccCount] = useState(0);
    const [attendanceStats, setAttendanceStats] = useState({ presence: 0, total: 0 });

    const fetchData = useCallback(async () => {
        if (!id || !currentUser) return;
        setLoading(true);
        try {
            // Fetch student info
            const { data: sData } = await supabase
                .from('students')
                .select('*')
                .eq('id', id)
                .single();

            if (sData) setStudent(sData as any);

            // Fetch grades for the current subject
            const { data: gData } = await supabase
                .from('grades')
                .select('*')
                .eq('student_id', id)
                .eq('subject', activeSubject);

            if (gData) setGrades(gData as any);

            // Fetch occurrences
            const { count: oCount } = await supabase
                .from('occurrences')
                .select('*', { count: 'exact', head: true })
                .eq('student_id', id);
            setOccCount(oCount || 0);

            // Fetch attendance stats
            const { data: aData } = await supabase
                .from('attendance')
                .select('status')
                .eq('student_id', id)
                .eq('subject', activeSubject);

            if (aData) {
                const presence = aData.filter(r => r.status === 'P').length;
                setAttendanceStats({ presence, total: aData.length });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [id, currentUser, activeSubject]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    if (!student) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text>Estudante não encontrado.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <BackgroundPattern />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color="#1e293b" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Perfil do Aluno</Text>
            </View>

            <View style={styles.profileCard}>
                <View style={styles.avatarLarge}>
                    {student.photo_url ? (
                        <Image source={{ uri: student.photo_url }} style={styles.avatarImg} />
                    ) : (
                        <User size={40} color="#4f46e5" />
                    )}
                </View>
                <Text style={styles.name}>{student.name}</Text>
                <Text style={styles.subtitle}>Nº {student.number} • Turma {student.section}</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.sectionTitle}>Desempenho Acadêmico</Text>
                <View style={styles.gradesGrid}>
                    {['1', '2', '3', 'final', 'recovery'].map((unit) => {
                        const res = getStatusResult(student, unit);
                        const total = calculateUnitTotal(student, unit);
                        if (unit === 'final' || unit === 'recovery') {
                            const { baseTotal } = calculateAnnualSummary(student);
                            if (unit === 'final' && (baseTotal < 8.0 || baseTotal >= 18.0)) return null;
                            if (unit === 'recovery' && res.val !== 'recuperacao' && !student.units?.[unit]) return null;
                        }

                        return (
                            <GlassCard key={unit} style={styles.unitCard}>
                                <Text style={styles.unitLabel}>{unit === 'final' ? 'Final' : unit === 'recovery' ? 'Rec.' : `${unit}ª Un.`}</Text>
                                <Text style={[styles.unitValue, { color: total >= 6 ? '#10b981' : '#f43f5e' }]}>
                                    {total.toFixed(1)}
                                </Text>
                            </GlassCard>
                        );
                    })}
                </View>

                <Text style={styles.sectionTitle}>Resumo</Text>
                <GlassCard style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Calendar size={20} color="#64748b" />
                        <Text style={styles.statLabel}>Frequência:</Text>
                        <Text style={styles.statValue}>
                            {attendanceStats.total > 0
                                ? `${((attendanceStats.presence / attendanceStats.total) * 100).toFixed(0)}%`
                                : '--'
                            }
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <ClipboardList size={20} color="#64748b" />
                        <Text style={styles.statLabel}>Ocorrências:</Text>
                        <Text style={[styles.statValue, { color: occCount > 0 ? '#f43f5e' : '#10b981' }]}>{occCount}</Text>
                    </View>
                </GlassCard>

                <Text style={styles.sectionTitle}>Informações</Text>
                <GlassCard style={styles.infoList}>
                    {student.phone && (
                        <View style={styles.infoItem}>
                            <Phone size={18} color="#94a3b8" />
                            <Text style={styles.infoText}>{student.phone}</Text>
                        </View>
                    )}
                    {student.email && (
                        <View style={styles.infoItem}>
                            <Mail size={18} color="#94a3b8" />
                            <Text style={styles.infoText}>{student.email}</Text>
                        </View>
                    )}
                    <View style={styles.infoItem}>
                        <GraduationCap size={18} color="#94a3b8" />
                        <Text style={styles.infoText}>{student.series_id} (Turma {student.section})</Text>
                    </View>
                </GlassCard>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    centered: { justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    headerTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
    profileCard: {
        alignItems: 'center',
        padding: 32,
        marginHorizontal: 24,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        marginBottom: 24,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    avatarLarge: {
        width: 100,
        height: 100,
        borderRadius: 32,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    avatarImg: { width: '100%', height: '100%' },
    name: { fontSize: 26, fontWeight: '900', color: '#0f172a', letterSpacing: -0.8 },
    subtitle: { fontSize: 14, color: '#64748b', marginTop: 6, fontWeight: '800', letterSpacing: 0.2 },
    content: { paddingHorizontal: 24, gap: 20, paddingBottom: 140 },
    sectionTitle: { fontSize: 14, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5 },
    gradesGrid: { flexDirection: 'row', gap: 12 },
    unitCard: {
        flex: 1,
        paddingVertical: 20,
        paddingHorizontal: 12,
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.65)',
    },
    unitLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase' },
    unitValue: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    statsCard: {
        padding: 24,
        gap: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.65)',
    },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    statLabel: { flex: 1, fontSize: 15, fontWeight: '800', color: '#1e293b' },
    statValue: { fontSize: 17, fontWeight: '900', color: '#4f46e5' },
    infoList: {
        padding: 24,
        gap: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.65)',
    },
    infoItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    infoText: { fontSize: 15, color: '#1e293b', fontWeight: '700' }
});
