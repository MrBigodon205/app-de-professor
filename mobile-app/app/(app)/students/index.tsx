import { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, User, ChevronRight } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { useClass } from '../../../contexts/ClassContext';
import { GlassCard } from '../../../components/ui/GlassCard';
import { BackgroundPattern } from '../../../components/ui/BackgroundPattern';
import { Student } from '../../../types';

export default function StudentsScreen() {
    const router = useRouter();
    const { currentUser } = useAuth();
    const { selectedSeriesId, selectedSection } = useClass();
    const [students, setStudents] = useState<Student[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchStudents = useCallback(async () => {
        if (!currentUser || !selectedSeriesId) return;
        setLoading(true);
        let query = supabase
            .from('students')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('series_id', selectedSeriesId);

        if (selectedSection) {
            query = query.eq('section', selectedSection);
        }

        const { data } = await query.order('name');
        if (data) setStudents(data as any);
        setLoading(false);
    }, [currentUser, selectedSeriesId, selectedSection]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.number?.includes(search)
    );

    return (
        <View style={styles.container}>
            <BackgroundPattern />
            <View style={styles.header}>
                <Text style={styles.title}>Estudantes</Text>
                <View style={styles.searchBar}>
                    <Search size={20} color="#94a3b8" />
                    <TextInput
                        placeholder="Buscar por nome ou número..."
                        style={styles.searchInput}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            <FlatList
                data={filteredStudents}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => router.push(`/students/${item.id}` as any)}
                        style={styles.studentItem}
                    >
                        <GlassCard style={styles.studentCard}>
                            <View style={styles.avatar}>
                                {item.photo_url ? (
                                    <Image source={{ uri: item.photo_url }} style={styles.avatarImg} />
                                ) : (
                                    <User size={20} color="#4f46e5" />
                                )}
                            </View>
                            <View style={styles.info}>
                                <Text style={styles.name}>{item.name}</Text>
                                <Text style={styles.details}>
                                    Nº {item.number} • Turma {item.section}
                                </Text>
                            </View>
                            <ChevronRight size={20} color="#cbd5e1" />
                        </GlassCard>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>
                            {loading ? 'Carregando...' : 'Nenhum estudante encontrado.'}
                        </Text>
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
        gap: 20
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: -1
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        paddingHorizontal: 16,
        borderRadius: 16,
        height: 56,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '600'
    },
    list: { padding: 24, paddingTop: 0, paddingBottom: 120 },
    studentItem: { marginBottom: 12 },
    studentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 18,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    avatarImg: { width: '100%', height: '100%' },
    info: { flex: 1, marginLeft: 16 },
    name: { fontSize: 17, fontWeight: '900', color: '#1e293b', letterSpacing: -0.3 },
    details: { fontSize: 13, color: '#64748b', fontWeight: '600', marginTop: 2 },
    empty: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#94a3b8', fontSize: 14 }
});
