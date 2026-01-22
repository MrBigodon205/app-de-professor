import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Platform, Animated } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useClass } from '../../contexts/ClassContext';
import { useThemeContext } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { GlassCard } from '../../components/ui/GlassCard';
import { BackgroundPattern } from '../../components/ui/BackgroundPattern';
import { UNIT_CONFIGS, calculateUnitTotal, calculateAnnualSummary, getStatusResult } from '../../utils/gradeCalculations';
import { Student } from '../../types';
import { CheckCircle, CloudUpload, ChevronRight, AlertCircle } from 'lucide-react-native';

export default function GradesScreen() {
    const { currentUser, activeSubject } = useAuth();
    const { selectedSeriesId, selectedSection, activeSeries } = useClass();
    const theme = useThemeContext();
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedUnit, setSelectedUnit] = useState<string>('1');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Track pending changes to avoid race conditions
    const saveTimeoutRefs = useRef<{ [key: string]: any }>({});
    const studentsRef = useRef(students);
    useEffect(() => { studentsRef.current = students; }, [students]);

    const fetchData = useCallback(async (silent = false) => {
        if (!currentUser || !selectedSeriesId || !selectedSection) return;
        if (!silent) setLoading(true);
        try {
            const { data: studentsData } = await supabase
                .from('students')
                .select('*')
                .eq('series_id', selectedSeriesId)
                .eq('section', selectedSection)
                .eq('user_id', currentUser.id)
                .order('number', { ascending: true });

            if (!studentsData) return;

            const studentIds = studentsData.map(s => s.id);
            const { data: gradesData } = await supabase
                .from('grades')
                .select('*')
                .in('student_id', studentIds)
                .eq('subject', activeSubject);

            const formatted: Student[] = studentsData.map(s => {
                const sGrades = gradesData?.filter(g => g.student_id === s.id) || [];
                const unitsMap: any = {};
                sGrades.forEach(g => { unitsMap[g.unit] = g.data || {}; });

                return {
                    ...s,
                    id: s.id.toString(),
                    units: unitsMap
                } as any;
            });

            setStudents(formatted);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [currentUser, selectedSeriesId, selectedSection, activeSubject]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleGradeChange = (studentId: string, field: string, value: string) => {
        const numericValue = value === '' ? 0 : parseFloat(value.replace(',', '.'));
        if (isNaN(numericValue) && value !== '') return;

        // 1. Optimistic Update
        setStudents(prev => prev.map(s => {
            if (s.id === studentId) {
                const newUnits = { ...s.units } as any;
                if (!newUnits[selectedUnit]) newUnits[selectedUnit] = {};

                const col = UNIT_CONFIGS[selectedUnit]?.columns.find((c: any) => c.key === field);
                let currentMax = col ? col.max : 10;

                // Talent Show Rule (Parity with Web)
                if (selectedUnit === '3' && field === 'exam') {
                    const talentShowVal = Number(newUnits['3']?.['talentShow']) || 0;
                    if (talentShowVal > 0) currentMax = 8.0;
                }

                let finalVal = numericValue;
                if (finalVal > currentMax) finalVal = currentMax;

                newUnits[selectedUnit] = {
                    ...newUnits[selectedUnit],
                    [field]: value === '' ? '' : finalVal
                };

                return { ...s, units: newUnits };
            }
            return s;
        }));

        // 2. Debounced Save
        setIsSaving(true);
        if (saveTimeoutRefs.current[studentId]) clearTimeout(saveTimeoutRefs.current[studentId]);

        saveTimeoutRefs.current[studentId] = setTimeout(async () => {
            const student = studentsRef.current.find(s => s.id === studentId);
            if (!student) return;

            const unitData = (student.units as any)[selectedUnit] || {};

            await supabase
                .from('grades')
                .upsert({
                    student_id: parseInt(studentId),
                    unit: selectedUnit,
                    data: unitData,
                    user_id: currentUser!.id,
                    series_id: parseInt(selectedSeriesId!),
                    section: selectedSection,
                    subject: activeSubject
                }, { onConflict: 'student_id, unit, subject' });

            delete saveTimeoutRefs.current[studentId];
            if (Object.keys(saveTimeoutRefs.current).length === 0) setIsSaving(false);
        }, 1500);
    };

    const currentConfig = UNIT_CONFIGS[selectedUnit];
    const visibleStudents = students.filter(s => {
        if (['1', '2', '3', 'results'].includes(selectedUnit)) return true;
        const { baseTotal, status } = calculateAnnualSummary(s);
        if (selectedUnit === 'final') return baseTotal >= 8.0 && baseTotal < 18.0;
        if (selectedUnit === 'recovery') return status === 'RECOVERY';
        return true;
    });

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={theme.primaryColorHex} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <BackgroundPattern />
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.title}>Notas</Text>
                    {isSaving ? (
                        <View style={styles.saveBadge}>
                            <CloudUpload size={14} color="#f59e0b" />
                            <Text style={[styles.saveText, { color: '#f59e0b' }]}>Salvando...</Text>
                        </View>
                    ) : (
                        <View style={styles.saveBadge}>
                            <CheckCircle size={14} color="#10b981" />
                            <Text style={[styles.saveText, { color: '#10b981' }]}>Salvo</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.subtitle}>{activeSeries?.name} • {selectedSection}</Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitTabs}>
                    {['1', '2', '3', 'final', 'recovery', 'results'].map((unit) => (
                        <TouchableOpacity
                            key={unit}
                            onPress={() => setSelectedUnit(unit)}
                            style={[
                                styles.unitTab,
                                selectedUnit === unit && { backgroundColor: theme.primaryColorHex }
                            ]}
                        >
                            <Text style={[
                                styles.unitTabText,
                                selectedUnit === unit && { color: 'white' }
                            ]}>
                                {unit === 'final' ? 'P. Final' : unit === 'recovery' ? 'Recup.' : unit === 'results' ? 'Total' : `${unit}ª Un.`}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.list}>
                {visibleStudents.map((student) => {
                    const total = calculateUnitTotal(student, selectedUnit);
                    const res = getStatusResult(student, selectedUnit);
                    const isResults = selectedUnit === 'results';

                    return (
                        <GlassCard key={student.id} style={styles.studentCard}>
                            <View style={styles.cardInfo}>
                                <Text style={styles.studentNumber}>{student.number}</Text>
                                <Text style={styles.studentName} numberOfLines={1}>{student.name}</Text>
                            </View>

                            {isResults ? (
                                <View style={styles.resultsRow}>
                                    <View style={styles.resultItem}>
                                        <Text style={styles.resultLabel}>Anual</Text>
                                        <Text style={styles.resultValue}>{calculateAnnualSummary(student).annualTotal.toFixed(1)}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: `${res.color}15` }]}>
                                        <Text style={[styles.statusText, { color: res.color }]}>{res.text}</Text>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.inputsRow}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.inputsScroll}>
                                        {currentConfig.columns.map((col: any) => (
                                            <View key={col.key} style={styles.inputBox}>
                                                <Text style={styles.columnLabel}>{col.label}</Text>
                                                <TextInput
                                                    style={styles.input}
                                                    keyboardType="decimal-pad"
                                                    value={((student.units as any)?.[selectedUnit]?.[col.key] ?? '').toString()}
                                                    onChangeText={(val) => handleGradeChange(student.id, col.key, val)}
                                                    placeholder="-"
                                                />
                                            </View>
                                        ))}
                                    </ScrollView>
                                    <View style={styles.divider} />
                                    <View style={styles.totalBox}>
                                        <Text style={styles.columnLabel}>Total</Text>
                                        <Text style={[styles.totalValue, { color: total >= 6 ? '#10b981' : '#f43f5e' }]}>
                                            {total.toFixed(1)}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </GlassCard>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    centered: { justifyContent: 'center', alignItems: 'center' },
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
    unitTabs: { marginTop: 16, flexDirection: 'row' },
    unitTab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: '#f1f5f9', marginRight: 8 },
    unitTabText: { fontSize: 13, fontWeight: '900', color: '#64748b' },
    list: { padding: 24, paddingBottom: 100 },
    studentCard: { padding: 18, marginBottom: 12, gap: 16 },
    cardInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    studentNumber: { fontSize: 13, fontWeight: '900', color: '#94a3b8', width: 24 },
    studentName: { fontSize: 16, fontWeight: '900', color: '#1e293b', flex: 1 },
    inputsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    inputsScroll: { flex: 1 },
    inputBox: { alignItems: 'center', gap: 6, marginRight: 16 },
    columnLabel: { fontSize: 9, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' },
    input: { width: 50, height: 40, backgroundColor: 'white', borderRadius: 10, textAlign: 'center', fontWeight: '900', color: '#1e293b', fontSize: 15, borderWidth: 1, borderColor: '#e2e8f0' },
    divider: { width: 1, height: 30, backgroundColor: '#e2e8f0' },
    totalBox: { alignItems: 'center', gap: 6, width: 45 },
    totalValue: { fontSize: 18, fontWeight: '900' },
    resultsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    resultItem: { alignItems: 'center', gap: 4 },
    resultLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' },
    resultValue: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
    statusText: { fontSize: 12, fontWeight: '900' }
});
