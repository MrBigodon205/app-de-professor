import { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { GlassCard } from '../../components/ui/GlassCard';
import { BackgroundPattern } from '../../components/ui/BackgroundPattern';
import { Occurrence } from '../../types';
import { AlertCircle, MessageSquare, Clock, Star, ShieldAlert } from 'lucide-react-native';
import { Platform } from 'react-native';

export default function ObservationsScreen() {
    const { currentUser, activeSubject } = useAuth();
    const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOccurrences = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        const { data } = await supabase
            .from('occurrences')
            .select(`
        *,
        student:students (name)
      `)
            .eq('user_id', currentUser.id)
            .eq('subject', activeSubject)
            .order('date', { ascending: false })
            .limit(50);

        if (data) {
            setOccurrences(data.map((o: any) => ({
                ...o,
                student_name: o.student?.name || 'Estudante'
            })));
        }
        setLoading(false);
    }, [currentUser, activeSubject]);

    useEffect(() => {
        fetchOccurrences();
    }, [fetchOccurrences]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'Elogio': return <Star size={20} color="#f59e0b" />;
            case 'Indisciplina': return <AlertCircle size={20} color="#f43f5e" />;
            case 'Atraso': return <Clock size={20} color="#6366f1" />;
            default: return <MessageSquare size={20} color="#64748b" />;
        }
    };

    return (
        <View style={styles.container}>
            <BackgroundPattern />
            <View style={styles.header}>
                <Text style={styles.title}>Histórico de Ocorrências</Text>
                <Text style={styles.subtitle}>{activeSubject}</Text>
            </View>

            <FlatList
                data={occurrences}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <GlassCard style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.typeBadge}>
                                {getIcon(item.type)}
                                <Text style={styles.typeText}>{item.type}</Text>
                            </View>
                            <Text style={styles.date}>{new Date(item.date).toLocaleDateString('pt-BR')}</Text>
                        </View>
                        <Text style={styles.studentName}>{item.student_name}</Text>
                        <Text style={styles.description}>{item.description}</Text>
                    </GlassCard>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        {loading ? <ActivityIndicator color="#4f46e5" /> : <Text style={styles.emptyText}>Nenhuma ocorrência registrada.</Text>}
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
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: -1
    },
    subtitle: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    list: { padding: 24, paddingTop: 0, paddingBottom: 120 },
    card: {
        padding: 20,
        marginBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'white',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    typeText: { fontSize: 13, fontWeight: '900', color: '#1e293b' },
    date: { fontSize: 13, color: '#94a3b8', fontWeight: '800' },
    studentName: { fontSize: 17, fontWeight: '900', color: '#1e293b', marginBottom: 6, letterSpacing: -0.3 },
    description: { fontSize: 15, color: '#64748b', lineHeight: 22, fontWeight: '500' },
    empty: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' }
});
