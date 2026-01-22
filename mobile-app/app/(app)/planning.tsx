import { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Modal, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useClass } from '../../contexts/ClassContext';
import { useThemeContext } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { GlassCard } from '../../components/ui/GlassCard';
import { BackgroundPattern } from '../../components/ui/BackgroundPattern';
import { BookOpen, Calendar, ChevronRight, X, ListCheck, Target, Lightbulb, Package } from 'lucide-react-native';
import { Plan } from '../../types';

export default function PlanningScreen() {
    const { currentUser, activeSubject } = useAuth();
    const { selectedSeriesId } = useClass();
    const theme = useThemeContext();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

    const fetchPlans = useCallback(async () => {
        if (!currentUser || !selectedSeriesId) return;
        setLoading(true);
        const { data } = await supabase
            .from('plans')
            .select('*')
            .eq('series_id', selectedSeriesId)
            .eq('subject', activeSubject)
            .order('startDate', { ascending: false });

        if (data) setPlans(data as any);
        setLoading(false);
    }, [currentUser, selectedSeriesId, activeSubject]);

    useEffect(() => { fetchPlans(); }, [fetchPlans]);

    const renderDetailItem = (icon: any, label: string, value: string | undefined) => {
        if (!value) return null;
        return (
            <View style={styles.detailItem}>
                <View style={styles.detailLabelRow}>
                    {icon}
                    <Text style={styles.detailLabel}>{label}</Text>
                </View>
                <Text style={styles.detailValue}>{value}</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <BackgroundPattern />
            <View style={styles.header}>
                <Text style={styles.title}>Planejamento</Text>
                <Text style={styles.subtitle}>{activeSubject}</Text>
            </View>

            <FlatList
                data={plans}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => setSelectedPlan(item)}>
                        <GlassCard style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.dateBadge}>
                                    <Calendar size={14} color={theme.primaryColorHex} />
                                    <Text style={[styles.dateText, { color: theme.primaryColorHex }]}>
                                        {new Date(item.startDate).toLocaleDateString('pt-BR')}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.content}>
                                <View style={[styles.iconBox, { backgroundColor: `${theme.primaryColorHex}15` }]}>
                                    <BookOpen size={20} color={theme.primaryColorHex} />
                                </View>
                                <View style={styles.mainInfo}>
                                    <Text style={styles.topic}>{item.title}</Text>
                                    <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                                </View>
                                <ChevronRight size={20} color="#cbd5e1" />
                            </View>
                        </GlassCard>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        {loading ? <ActivityIndicator color={theme.primaryColorHex} /> : <Text style={styles.emptyText}>Nenhum plano para esta série.</Text>}
                    </View>
                }
            />

            <Modal visible={!!selectedPlan} animationType="slide" transparent>
                <View style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderTitle}>
                                <Text style={styles.modalTitle}>Detalhes do Plano</Text>
                                <Text style={styles.modalSubtitle}>{selectedPlan?.title}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedPlan(null)} style={styles.closeBtn}>
                                <X size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalBody}>
                            {renderDetailItem(<ListCheck size={18} color={theme.primaryColorHex} />, "Objetivos", selectedPlan?.objectives)}
                            {renderDetailItem(<Target size={18} color={theme.primaryColorHex} />, "BNCC", selectedPlan?.bncc_codes)}
                            {renderDetailItem(<Lightbulb size={18} color={theme.primaryColorHex} />, "Metodologia", selectedPlan?.methodology)}
                            {renderDetailItem(<Package size={18} color={theme.primaryColorHex} />, "Recursos", selectedPlan?.resources)}
                            {renderDetailItem(<BookOpen size={18} color={theme.primaryColorHex} />, "Avaliação", selectedPlan?.assessment)}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { padding: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40, gap: 4 },
    title: { fontSize: 28, fontWeight: '900', color: '#0f172a', letterSpacing: -1 },
    subtitle: { fontSize: 13, color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    list: { padding: 24, paddingTop: 0, paddingBottom: 100 },
    card: { padding: 20, marginBottom: 16, backgroundColor: 'rgba(255, 255, 255, 0.7)' },
    cardHeader: { marginBottom: 16 },
    dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, elevation: 1 },
    dateText: { fontSize: 13, fontWeight: '800' },
    content: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    mainInfo: { flex: 1 },
    topic: { fontSize: 17, fontWeight: '900', color: '#1e293b', marginBottom: 4 },
    description: { fontSize: 14, color: '#64748b', fontWeight: '500' },
    empty: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '80%', paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalHeaderTitle: { flex: 1 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
    modalSubtitle: { fontSize: 14, color: '#64748b', fontWeight: '700', marginTop: 2 },
    closeBtn: { padding: 8 },
    modalScroll: { flex: 1 },
    modalBody: { padding: 24, gap: 24 },
    detailItem: { gap: 8 },
    detailLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    detailLabel: { fontSize: 12, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 },
    detailValue: { fontSize: 15, color: '#1e293b', lineHeight: 22, fontWeight: '500' }
});
