import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity, Image, Platform, Animated } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useClass } from '../../contexts/ClassContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Star, GraduationCap, ArrowRight, BookOpen, Rocket, CalendarCheck, TrendingUp, ChevronRight, Calendar } from 'lucide-react-native';
import { BackgroundPattern } from '../../components/ui/BackgroundPattern';
import { useThemeContext } from '../../contexts/ThemeContext';
import * as LucideIcons from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function DashboardScreen() {
    const { currentUser, activeSubject, logout } = useAuth();
    const theme = useThemeContext();
    const { classes, loading: classesLoading, selectedSeriesId, selectedSection, setSelectedSeriesId, setSelectedSection } = useClass();
    const [refreshing, setRefreshing] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Animation Values for Entry
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        const pulse = () => {
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 2.2,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ]).start(() => pulse());
        };
        pulse();

        // Entry Animation
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]).start();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        // Add refresh logic here
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    const selectedClass = classes.find(c => c.id === selectedSeriesId);
    const contextName = selectedClass ? `${selectedClass.name}${selectedSection ? ` - ${selectedSection}` : ''}` : 'Visão Geral';

    const [stats, setStats] = useState({
        studentCount: 0,
        averageGrade: 0,
        attendanceRate: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);
    const [todayPlan, setTodayPlan] = useState<any>(null);

    useEffect(() => {
        async function fetchStats() {
            if (!currentUser) return;
            setLoadingStats(true);
            try {
                // Fetch Student Count
                let query = supabase.from('students').select('*', { count: 'exact', head: true })
                    .eq('user_id', currentUser.id);

                if (selectedSeriesId) query = query.eq('series_id', selectedSeriesId);
                if (selectedSection) query = query.eq('section', selectedSection);

                const { count } = await query;

                // Fetch Attendance for today
                const today = new Date().toLocaleDateString('sv-SE');
                const { data: attData } = await supabase.from('attendance')
                    .select('id')
                    .eq('user_id', currentUser.id)
                    .eq('subject', activeSubject)
                    .eq('date', today)
                    .eq('status', 'P');

                setStats({
                    studentCount: count || 0,
                    averageGrade: 8.2, // Placeholder for complex calc
                    attendanceRate: (attData?.length || 0)
                });

                // Fetch Today's Plan
                if (selectedSeriesId) {
                    const { data: planData } = await supabase
                        .from('plans')
                        .select('*')
                        .eq('series_id', selectedSeriesId)
                        .eq('subject', activeSubject)
                        .lte('startDate', today)
                        .gte('endDate', today)
                        .single();
                    setTodayPlan(planData);
                } else {
                    setTodayPlan(null);
                }
            } finally {
                setLoadingStats(false);
            }
        }
        fetchStats();
    }, [selectedSeriesId, selectedSection, currentUser?.id, activeSubject]);

    const ThemeIcon = (LucideIcons as any)[theme.icon] || GraduationCap;

    return (
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <BackgroundPattern />
            <Animated.ScrollView
                style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* PREMIUM HEADER - WEB PARITY */}
                <View style={styles.headerPortal}>
                    <View style={styles.avatarGlowContainer}>
                        <LinearGradient
                            colors={[`${theme.primaryColorHex}40`, `${theme.secondaryColorHex}40`]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.avatarGlow}
                        />
                        <TouchableOpacity style={styles.avatarFrame} onPress={logout}>
                            {currentUser?.photoUrl ? (
                                <Image source={{ uri: currentUser.photoUrl }} style={styles.avatarImage} />
                            ) : (
                                <LinearGradient
                                    colors={[theme.primaryColorHex, theme.secondaryColorHex]}
                                    style={styles.avatarPlaceholder}
                                >
                                    <Text style={styles.avatarLabel}>{currentUser?.name?.substring(0, 2).toUpperCase()}</Text>
                                </LinearGradient>
                            )}
                        </TouchableOpacity>
                    </View>
                    <View style={styles.headerIdentity}>
                        <View style={styles.helloFlex}>
                            <View style={[styles.pulseBadge, { backgroundColor: `${theme.primaryColorHex}15`, borderColor: `${theme.primaryColorHex}30` }]}>
                                <View style={[styles.pulseDot, { backgroundColor: theme.primaryColorHex }]} />
                                <Animated.View
                                    style={[
                                        styles.pulseDot,
                                        styles.pulseDotOuter,
                                        {
                                            backgroundColor: theme.primaryColorHex,
                                            transform: [{ scale: pulseAnim }],
                                            opacity: pulseAnim.interpolate({
                                                inputRange: [1, 2.2],
                                                outputRange: [0.6, 0]
                                            })
                                        }
                                    ]}
                                />
                                <Text style={[styles.pulseBadgeText, { color: theme.primaryColorHex }]}>Intelligence v3.1</Text>
                            </View>
                        </View>
                        <View style={styles.greetingRow}>
                            <Text style={styles.helloPre}>Olá, </Text>
                            <Text style={styles.helloUser}>{currentUser?.name?.split(' ')[0]} 👋</Text>
                        </View>
                        <View style={styles.panelTitleContainer}>
                            <Text style={styles.panelTitleText}>Seu Painel </Text>
                            <LinearGradient
                                colors={[theme.primaryColorHex, theme.secondaryColorHex]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.panelTitleGradientBox}
                            >
                                <Text style={[styles.panelTitleBold, { color: 'white' }]}>
                                    {selectedClass ? contextName : 'Geral'}
                                </Text>
                            </LinearGradient>
                        </View>
                    </View>
                </View>

                <View style={styles.dashboardSection}>
                    {/* HELP BANNER */}
                    <TouchableOpacity style={styles.proBannerWrapper}>
                        <LinearGradient
                            colors={[theme.primaryColorHex, theme.accentColor || theme.secondaryColorHex]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.proBanner}
                        >
                            <View style={styles.proIconBox}>
                                <Rocket color="#fff" size={24} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.proTitle}>Domine o Prof. Acerta+</Text>
                                <Text style={styles.proSubtitle}>Confira o manual passo-a-passo.</Text>
                            </View>
                            <ArrowRight color="#fff" size={20} />
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* KPI GRIDS - WEB PARITY */}
                    <View style={styles.kpiGrid}>
                        {/* LARGE CARD: TOTAL STUDENTS */}
                        <GlassCard style={styles.largeKpiCard}>
                            <View style={styles.largeKpiHeader}>
                                <View style={[styles.bentoIcon, { backgroundColor: `${theme.primaryColorHex}15`, width: 48, height: 48, borderRadius: 14 }]}>
                                    <Users size={24} color={theme.primaryColorHex} />
                                </View>
                                <View style={[styles.activityFlowBadge, { backgroundColor: `${theme.primaryColorHex}10` }]}>
                                    <View style={[styles.activityDot, { backgroundColor: theme.primaryColorHex }]} />
                                    <Text style={[styles.activityFlowText, { color: theme.primaryColorHex }]}>FLUXO DE ATIVIDADE</Text>
                                </View>
                            </View>
                            <View style={styles.largeKpiContent}>
                                <View>
                                    {loadingStats ? (
                                        <View style={[styles.skeletonSmall, { width: 80, height: 40 }]} />
                                    ) : (
                                        <Text style={styles.largeKpiValue}>{stats.studentCount}</Text>
                                    )}
                                    <Text style={styles.bentoLabel}>{selectedClass ? 'Alunos na Turma' : 'Total de Alunos'}</Text>
                                </View>
                                {/* Decorative Mini Heatmap Mockup */}
                                <View style={styles.miniHeatmap}>
                                    {[...Array(15)].map((_, i) => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.heatmapDot,
                                                { opacity: 0.2 + (Math.random() * 0.8), backgroundColor: theme.primaryColorHex }
                                            ]}
                                        />
                                    ))}
                                </View>
                            </View>
                        </GlassCard>

                        <View style={styles.smallKpiRow}>
                            <GlassCard style={styles.bentoCard}>
                                <View style={[styles.bentoIcon, { backgroundColor: `${theme.secondaryColorHex}15` }]}>
                                    <TrendingUp size={20} color={theme.secondaryColorHex} />
                                </View>
                                <View>
                                    {loadingStats ? (
                                        <View style={styles.skeletonSmall} />
                                    ) : (
                                        <View style={styles.statsValueRow}>
                                            <Text style={[styles.bentoValue, { color: stats.averageGrade >= 7 ? '#10b981' : '#f43f5e' }]}>
                                                {stats.averageGrade.toFixed(1)}
                                            </Text>
                                            <Text style={styles.statsSmallText}>/10</Text>
                                        </View>
                                    )}
                                    <Text style={styles.bentoLabel}>Média Geral</Text>
                                </View>
                            </GlassCard>

                            <GlassCard style={styles.bentoCard}>
                                <View style={[styles.bentoIcon, { backgroundColor: `${theme.primaryColorHex}15` }]}>
                                    <CalendarCheck size={20} color={theme.primaryColorHex} />
                                </View>
                                <View>
                                    {loadingStats ? (
                                        <View style={styles.skeletonSmall} />
                                    ) : (
                                        <View style={styles.statsValueRow}>
                                            <Text style={styles.bentoValue}>{stats.attendanceRate}</Text>
                                            <Text style={styles.statsSmallText}>/ {stats.studentCount}</Text>
                                        </View>
                                    )}
                                    <Text style={styles.bentoLabel}>Presença</Text>
                                </View>
                            </GlassCard>
                        </View>
                    </View>

                    <View style={styles.sectionHeading}>
                        <Text style={styles.sectionHeadingText}>Aula de Hoje</Text>
                        <View style={styles.pulseIndicator}>
                            <View style={styles.pulseInner} />
                            <Text style={styles.pulseText}>AO VIVO</Text>
                        </View>
                    </View>

                    {/* HOLOGRAPHIC PLAN CARD */}
                    <View style={styles.hologramCardWrapper}>
                        <LinearGradient
                            colors={theme.bgGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.hologramCard}
                        >
                            {/* Decorative Background Elements */}
                            <View style={[styles.bgOrb, { top: -40, right: -40, width: 140, height: 140, backgroundColor: 'rgba(255,255,255,0.15)' }]} />
                            <View style={[styles.bgOrb, { bottom: -60, left: -20, width: 120, height: 120, backgroundColor: 'rgba(255,255,255,0.1)' }]} />
                            <View style={[styles.bgOrb, { top: '40%', left: '30%', width: 200, height: 200, backgroundColor: 'rgba(255,255,255,0.05)' }]} />

                            {/* Decorative Watermark */}
                            <View style={styles.watermarkContainer}>
                                <ThemeIcon size={160} color="rgba(255,255,255,0.1)" strokeWidth={0.5} />
                            </View>

                            <View style={styles.hologramHeader}>
                                <View style={styles.todayBadge}>
                                    <View style={styles.pingDotContainer}>
                                        <View style={styles.pingDot} />
                                        <View style={[styles.pingDot, styles.pingDotPing]} />
                                    </View>
                                    <Text style={styles.todayBadgeText}>Aula de Hoje</Text>
                                </View>
                                <Text style={styles.hologramDate}>
                                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </Text>
                            </View>

                            <View style={styles.hologramContent}>
                                <View style={styles.hologramCourseRow}>
                                    <GraduationCap size={14} color="rgba(255,255,255,0.8)" />
                                    <Text style={styles.hologramCourse}>
                                        {selectedClass ? `${selectedClass.name} ${selectedSection ? `• ${selectedSection}` : ''}` : 'Série Geral'}
                                    </Text>
                                </View>
                                <Text style={styles.hologramTitle}>
                                    {todayPlan ? todayPlan.title : (selectedClass ? 'Nenhum plano para hoje' : 'Selecione uma turma para ver o plano')}
                                </Text>

                                <View style={styles.descBox}>
                                    <Text style={styles.hologramDesc}>
                                        {todayPlan ? todayPlan.description : (selectedClass ? 'Aproveite o dia para planejar novas atividades no portal web ou aqui pelo app.' : 'Comece selecionando sua turma para visualizar o roteiro pedagógico completo e atualizado.')}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.hologramFooter}>
                                <TouchableOpacity style={styles.hologramButtonGlass}>
                                    <Text style={styles.hologramButtonText}>Acessar Roteiro</Text>
                                    <ChevronRight size={18} color="#0f172a" />
                                </TouchableOpacity>

                                <View style={styles.metaInfoBox}>
                                    <View style={styles.metaItem}>
                                        <Calendar size={14} color="rgba(255,255,255,0.6)" />
                                        <Text style={styles.metaText}>Início: <Text style={styles.metaBold}>Hoje</Text></Text>
                                    </View>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>

                    <Text style={styles.sectionTitle}>Minhas Turmas</Text>
                    {classes.length === 0 ? (
                        <View style={styles.emptyState}>
                            <BookOpen size={48} color="#cbd5e1" />
                            <Text style={styles.emptyText}>Nenhuma turma cadastrada</Text>
                        </View>
                    ) : (
                        classes.map((cls) => (
                            <TouchableOpacity
                                key={cls.id}
                                style={styles.classItem}
                                onPress={() => {
                                    setSelectedSeriesId(cls.id);
                                    if (cls.sections.length > 0) setSelectedSection(cls.sections[0]);
                                }}
                            >
                                <GlassCard style={[
                                    styles.classCard,
                                    selectedSeriesId === cls.id && { borderColor: '#4f46e5', borderWidth: 2 }
                                ]}>
                                    <View style={styles.classIcon}>
                                        <GraduationCap color="#4f46e5" size={24} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.className}>{cls.name}</Text>
                                        <Text style={styles.classSections}>
                                            {cls.sections.length > 0 ? `Turmas: ${cls.sections.join(', ')}` : 'Sem turmas'}
                                        </Text>
                                    </View>
                                    {selectedSeriesId === cls.id && (
                                        <View style={styles.selectedIndicator}>
                                            <ArrowRight size={16} color="#4f46e5" />
                                        </View>
                                    )}
                                </GlassCard>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerPortal: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 24,
        paddingBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatarGlowContainer: {
        position: 'relative',
        width: 64,
        height: 64,
    },
    avatarGlow: {
        position: 'absolute',
        inset: -6,
        borderRadius: 32,
        backgroundColor: 'rgba(79, 70, 229, 0.15)',
    },
    avatarFrame: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'white',
        borderWidth: 3,
        borderColor: 'white',
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarLabel: {
        color: 'white',
        fontSize: 20,
        fontWeight: '900',
    },
    headerIdentity: {
        flex: 1,
        gap: 2,
    },
    helloFlex: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    pulseBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(7, 182, 212, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 100,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(7, 182, 212, 0.2)',
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#06b6d4',
    },
    pulseDotOuter: {
        position: 'absolute',
        top: 4,
        left: 8,
        opacity: 0.4,
        transform: [{ scale: 1.5 }],
    },
    pulseBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#06b6d4',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    greetingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    helloPre: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
    },
    helloUser: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '900',
    },
    panelTitleContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginTop: 2,
    },
    panelTitleText: {
        fontSize: 26,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: -1,
    },
    panelTitleBold: {
        fontSize: 26,
        fontWeight: '900',
    },
    statsValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    statsSmallText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#94a3b8',
    },
    skeletonSmall: {
        width: 40,
        height: 20,
        backgroundColor: '#e2e8f0',
        borderRadius: 4,
    },
    dashboardSection: {
        paddingHorizontal: 24,
        gap: 32,
    },
    proBannerWrapper: {
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
    },
    proBanner: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    proIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    proTitle: {
        color: 'white',
        fontSize: 15,
        fontWeight: '900',
        letterSpacing: -0.2,
    },
    proSubtitle: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 1,
    },
    bentoGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    bentoCard: {
        flex: 1,
        padding: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        minHeight: 110,
        justifyContent: 'space-between',
    },
    bentoIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    bentoValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1e293b',
        letterSpacing: -0.5,
    },
    bentoLabel: {
        fontSize: 9,
        color: '#94a3b8',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 2,
    },
    sectionHeading: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionHeadingText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1e293b',
        letterSpacing: -0.5,
    },
    pulseIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(79, 70, 229, 0.08)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    pulseInner: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4f46e5',
    },
    pulseText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#4f46e5',
        letterSpacing: 1,
    },
    hologramCardWrapper: {
        borderRadius: 32,
        overflow: 'hidden',
        elevation: 12,
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.35,
        shadowRadius: 25,
    },
    hologramCard: {
        padding: 32,
        minHeight: 280,
        position: 'relative',
        overflow: 'hidden',
    },
    bgOrb: {
        position: 'absolute',
        borderRadius: 1000,
    },
    watermarkContainer: {
        position: 'absolute',
        top: -20,
        right: -30,
        opacity: 0.4,
    },
    hologramHeader: {
        marginBottom: 20,
    },
    dateBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0.25)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    dateText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'capitalize',
        opacity: 0.8,
    },
    hologramContent: {
        gap: 8,
        flex: 1,
    },
    hologramCourse: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    hologramTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: '900',
        lineHeight: 30,
        letterSpacing: -0.5,
    },
    hologramDivider: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        marginVertical: 4,
    },
    hologramDesc: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '500',
    },
    hologramButtonGlass: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255, 255, 255, 1)',
        alignSelf: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    hologramButtonText: {
        color: '#0f172a',
        fontSize: 14,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    hologramDate: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 6,
    },
    todayBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignSelf: 'flex-start',
    },
    todayBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    pingDotContainer: {
        width: 8,
        height: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'white',
    },
    pingDotPing: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'white',
        opacity: 0.5,
    },
    descBox: {
        backgroundColor: 'rgba(0,0,0,0.25)',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginTop: 12,
    },
    hologramCourseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    hologramFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 24,
    },
    metaInfoBox: {
        backgroundColor: 'rgba(0,0,0,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        fontWeight: '600',
    },
    metaBold: {
        color: 'white',
        fontWeight: '900',
    },
    kpiGrid: {
        gap: 12,
    },
    largeKpiCard: {
        padding: 24,
        borderRadius: 28,
        minHeight: 180,
    },
    largeKpiHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    activityFlowBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(79, 70, 229, 0.08)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    activityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4f46e5',
    },
    activityFlowText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#4f46e5',
        letterSpacing: 1,
    },
    largeKpiContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 20,
    },
    largeKpiValue: {
        fontSize: 48,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: -2,
    },
    miniHeatmap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: 100,
        gap: 4,
        justifyContent: 'flex-end',
    },
    heatmapDot: {
        width: 8,
        height: 8,
        borderRadius: 2,
    },
    smallKpiRow: {
        flexDirection: 'row',
        gap: 12,
    },
    panelTitleGradientBox: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
    },
    className: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1e293b',
        letterSpacing: -0.5,
    },
    classSections: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '600',
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1e293b',
        letterSpacing: -0.5,
        marginTop: 8,
    },
    classItem: {
        marginBottom: 12,
    },
    classCard: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        backgroundColor: 'rgba(255,255,255,0.6)',
    },
    classIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    selectedIndicator: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        gap: 16,
    },
    emptyText: {
        color: '#64748b',
        fontWeight: '700',
        fontSize: 16,
    }
});
