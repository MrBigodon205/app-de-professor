import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useClass } from '../../contexts/ClassContext';
import { useThemeContext } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { GlassCard } from '../../components/ui/GlassCard';
import { BackgroundPattern } from '../../components/ui/BackgroundPattern';
import { Activity, Student } from '../../types';
import { BookOpen, Calendar, CheckSquare, Square, Users, Star, FileText } from 'lucide-react-native';

export default function ActivitiesScreen() {
    const { currentUser, activeSubject } = useAuth();
    const { selectedSeriesId, selectedSection } = useClass();
    const theme = useThemeContext();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [loading, setLoading] = useState(true);
    const [unit, setUnit] = useState<string>('1');

    const fetchData = useCallback(async () => {
        if (!currentUser || !selectedSeriesId) return;
        setLoading(true);
        try {
            // Fetch Activities
            const { data: actData } = await supabase
                .from('activities')
                .select('*')
                .eq('series_id', selectedSeriesId)
                .eq('subject', activeSubject)
                .order('date', { ascending: false });

            if (actData) setActivities(actData as any);

            // Fetch Students for completion tracking
            const { data: stdData } = await supabase
                .from('students')
                .select('*')
                .eq('series_id', selectedSeriesId)
                .eq('section', selectedSection || '')
                .eq('user_id', currentUser.id)
                .order('name');

            if (stdData) setStudents(stdData as any);
        } finally {
            setLoading(false);
        }
    }, [currentUser, selectedSeriesId, selectedSection, activeSubject]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const toggleCompletion = async (studentId: string) => {
        if (!selectedActivity) return;

        const currentCompletions = selectedActivity.completions || [];
        const isCompleted = currentCompletions.includes(studentId);

        const newCompletions = isCompleted
            ? currentCompletions.filter(id => id !== studentId)
            : [...currentCompletions, studentId];

        // Optimistic Update
        setActivities(prev => prev.map(a =>
            a.id === selectedActivity.id ? { ...a, completions: newCompletions } : a
        ));
        setSelectedActivity(prev => prev ? { ...prev, completions: newCompletions } : null);

        await supabase
            .from('activities')
            .update({ completions: newCompletions })
            .eq('id', selectedActivity.id);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'Prova': return <FileText size={20} color={theme.primaryColorHex} />;
            case 'Trabalho': return <BookOpen size={20} color={theme.primaryColorHex} />;
            default: return <Star size={20} color={theme.primaryColorHex} />;
        }
    };

    if (selectedActivity) {
        return (
            <View style={styles.container}>
                <BackgroundPattern />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setSelectedActivity(null)} style={styles.backButton}>
                        <Text style={[styles.backText, { color: theme.primaryColorHex }]}>Voltar</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>{selectedActivity.title}</Text>
                    <Text style={styles.subtitle}>{selectedActivity.type} • {selectedActivity.completions?.length || 0}/{students.length}</Text>
                </View>

                <FlatList
                    data={students}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.studentList}
                    renderItem={({ item }) => {
                        const isDone = selectedActivity.completions?.includes(item.id);
                        return (
                            <TouchableOpacity onPress={() => toggleCompletion(item.id)}>
                                <GlassCard style={[styles.studentItem, isDone && styles.studentItemDone]}>
                                    <View style={styles.studentInfo}>
                                        <Text style={styles.studentNumber}>{item.number}</Text>
                                        <Text style={[styles.studentName, isDone && styles.textMuted]}>{item.name}</Text>
                                    </View>
                                    {isDone ? (
                                        <CheckSquare size={24} color={theme.primaryColorHex} />
                                    ) : (
                                        <Square size={24} color="#cbd5e1" />
                                    )}
                                </GlassCard>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <BackgroundPattern />
            <View style={styles.header}>
                <Text style={styles.title}>Atividades</Text>
                <Text style={styles.subtitle}>{activeSubject}</Text>
            </View>

            <FlatList
                data={activities}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => setSelectedActivity(item)}>
                        <GlassCard style={styles.actCard}>
                            <View style={styles.actHeader}>
                                <View style={[styles.iconBox, { backgroundColor: `${theme.primaryColorHex}15` }]}>
                                    {getIcon(item.type)}
                                </View>
                                <View style={styles.actMain}>
                                    <Text style={styles.actTitle}>{item.title}</Text>
                                    <Text style={styles.actMeta}>
                                        {new Date(item.date).toLocaleDateString('pt-BR')} • {item.type}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.progressContainer}>
                                <View style={styles.progressTop}>
                                    <Users size={14} color="#94a3b8" />
                                    <Text style={styles.progressText}>
                                        {item.completions?.length || 0} de {students.length} concluíram
                                    </Text>
                                </View>
                                <View style={styles.progressBar}>
                                    <View
                                        style={[
                                            styles.progressFill,
                                            {
                                                width: `${((item.completions?.length || 0) / students.length) * 100}%`,
                                                backgroundColor: theme.primaryColorHex
                                            }
                                        ]}
                                    />
                                </View>
                            </View>
                        </GlassCard>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        {loading ? <ActivityIndicator color={theme.primaryColorHex} /> : <Text style={styles.emptyText}>Nenhuma atividade registrada.</Text>}
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        padding: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        gap: 4
    },
    title: { fontSize: 28, fontWeight: '900', color: '#0f172a', letterSpacing: -1 },
    subtitle: { fontSize: 13, color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    backButton: { marginBottom: 8 },
    backText: { fontWeight: '900', fontSize: 13, textTransform: 'uppercase' },
    list: { padding: 24, paddingTop: 0, paddingBottom: 100 },
    studentList: { padding: 24, paddingTop: 0 },
    actCard: { padding: 20, marginBottom: 16 },
    actHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
    iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    actMain: { flex: 1 },
    actTitle: { fontSize: 17, fontWeight: '900', color: '#1e293b', marginBottom: 2 },
    actMeta: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
    progressContainer: { gap: 8 },
    progressTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    progressText: { fontSize: 11, fontWeight: '800', color: '#94a3b8' },
    progressBar: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%' },
    studentItem: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.7)' },
    studentItemDone: { opacity: 0.8 },
    studentInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    studentNumber: { fontSize: 12, fontWeight: '900', color: '#94a3b8', width: 24 },
    studentName: { fontSize: 15, fontWeight: '900', color: '#1e293b' },
    textMuted: { color: '#94a3b8', textDecorationLine: 'line-through' },
    empty: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' }
});
