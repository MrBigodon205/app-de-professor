import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion'; // Import motion
import { useClass } from '../contexts/ClassContext';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../contexts/AuthContext';
import { Student, AttendanceRecord, Occurrence, Activity } from '../types';
import { supabase } from '../lib/supabase';

import { LoadingSpinner } from '../components/LoadingSpinner';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardBanner } from '../components/DashboardBanner';
import { ActivityHeatmap } from '../components/ActivityHeatmap';
import { calculateUnitTotal } from '../utils/gradeCalculations';

const getOccurrenceIcon = (type: string) => {
  switch (type) {
    case 'Elogio': return 'star';
    case 'Indisciplina': return 'gavel';
    case 'Atraso': return 'schedule';
    case 'Não Fez Tarefa': return 'assignment_late';
    case 'Falta de Material': return 'inventory_2';
    case 'Uso de Celular': return 'smartphone';
    case 'Alerta': return 'priority_high';
    default: return 'warning';
  }
};

// Create MotionLink for animated router links
const MotionLink = motion.create(Link);

export const Dashboard: React.FC = () => {
  const { selectedSeriesId, selectedSection, classes } = useClass();
  const theme = useTheme();
  const { currentUser, activeSubject } = useAuth();
  // Granular loading states
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingOccurrences, setLoadingOccurrences] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // Separate states for clarity
  const [globalCount, setGlobalCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [stats, setStats] = useState({
    presentToday: 0,
    gradeAverage: 0,
    newObservations: 0
  });
  const [recentOccurrences, setRecentOccurrences] = useState<Occurrence[]>([]);
  const [todaysPlan, setTodaysPlan] = useState<any | null>(null);
  const [upcomingActivities, setUpcomingActivities] = useState<Activity[]>([]);
  const [classPlans, setClassPlans] = useState<any[]>([]);

  const totalSelected = 0; // Placeholder to avoid breaking other parts if any

  useEffect(() => {
    if (currentUser?.id) {
      // Trigger fetches independently to avoid blocking UI
      // Use currentUser.id to avoid re-triggering when name/photo updates
      refreshAll(false);
    }
  }, [currentUser?.id, selectedSeriesId, selectedSection, activeSubject]);

  const fetchCounts = React.useCallback(async (silent = false) => {
    if (!currentUser) return;
    if (!silent) setLoadingCounts(true);
    try {
      const { count: gCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id);
      setGlobalCount(gCount || 0);

      if (selectedSeriesId) {
        let query = supabase.from('students').select('*', { count: 'exact', head: true })
          .eq('user_id', currentUser.id)
          .eq('series_id', selectedSeriesId);
        if (selectedSection) query = query.eq('section', selectedSection);
        const { count: sCount } = await query;
        setClassCount(sCount || 0);
      } else {
        const { data: subjectClasses } = await supabase
          .from('classes')
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('subject', activeSubject);

        const classIds = (subjectClasses || []).map(c => c.id);

        if (classIds.length > 0) {
          const { count: subjCount } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', currentUser.id)
            .in('series_id', classIds);
          setClassCount(subjCount || 0);
        } else {
          setClassCount(0);
        }
      }
    } catch (e) {
      console.error("Error fetching counts:", e);
    } finally {
      if (!silent) setLoadingCounts(false);
    }
  }, [currentUser, selectedSeriesId, selectedSection, activeSubject]);

  const fetchStats = React.useCallback(async (silent = false) => {
    if (!currentUser) return;
    if (!silent) setLoadingStats(true);
    try {
      let studentsQuery = supabase.from('students').select('id').eq('user_id', currentUser.id);
      if (selectedSeriesId) studentsQuery = studentsQuery.eq('series_id', selectedSeriesId);
      if (selectedSection) studentsQuery = studentsQuery.eq('section', selectedSection);

      const { data: studentsData } = await studentsQuery;
      const relevantIds = (studentsData || []).map(s => s.id);

      if (relevantIds.length > 0) {
        // Group students by ID for faster lookup later
        const { data: gradesData } = await supabase
          .from('grades')
          .select('student_id, unit, data')
          .in('student_id', relevantIds)
          .eq('subject', activeSubject)
          .eq('user_id', currentUser.id);

        // Pre-group grades by student_id to avoid repeated filtering
        const gradesMap = new Map();
        (gradesData || []).forEach(g => {
          if (!gradesMap.has(g.student_id)) gradesMap.set(g.student_id, []);
          gradesMap.get(g.student_id).push(g);
        });

        let totalAvgSum = 0;
        let studentsWithGradesCount = 0;

        relevantIds.forEach(studentId => {
          const sGrades = gradesMap.get(studentId) || [];
          if (sGrades.length === 0) return;

          const mockStudent: any = { units: {} };
          sGrades.forEach(g => { mockStudent.units[g.unit] = g.data || {}; });

          let sSum = 0;
          let sCount = 0;
          ['1', '2', '3'].forEach(u => {
            if (mockStudent.units[u]) {
              const uTotal = calculateUnitTotal(mockStudent, u);
              if (uTotal > 0) {
                if (Object.keys(mockStudent.units[u]).length > 0) {
                  sSum += uTotal;
                  sCount++;
                }
              }
            }
          });

          if (sCount > 0) {
            totalAvgSum += (sSum / sCount);
            studentsWithGradesCount++;
          }
        });

        const finalAvg = studentsWithGradesCount > 0 ? (totalAvgSum / studentsWithGradesCount) : 0;

        const today = new Date().toLocaleDateString('sv-SE');
        const { data: attData } = await supabase.from('attendance')
          .select('student_id')
          .eq('user_id', currentUser.id)
          .eq('subject', activeSubject)
          .eq('date', today)
          .eq('status', 'P');

        const presentToday = (attData || []).filter(a => relevantIds.includes(a.student_id)).length;

        setStats(prev => ({
          ...prev,
          presentToday,
          gradeAverage: finalAvg
        }));

      } else {
        setStats(prev => ({ ...prev, presentToday: 0, gradeAverage: 0 }));
      }

    } catch (e) {
      console.error("Error fetching stats:", e);
    } finally {
      if (!silent) setLoadingStats(false);
    }
  }, [currentUser, selectedSeriesId, selectedSection, activeSubject]);

  const fetchOccurrences = React.useCallback(async (silent = false) => {
    if (!currentUser) return;
    if (!silent) setLoadingOccurrences(true);
    try {
      const today = new Date().toLocaleDateString('sv-SE');
      let query = supabase.from('occurrences')
        .select(`
          *,
          student:students (
            name
          )
        `)
        .eq('user_id', currentUser.id)
        .eq('subject', activeSubject)
        .eq('date', today)
        .order('created_at', { ascending: false });

      if (selectedSeriesId) {
        const { data: sData } = await supabase.from('students').select('id').eq('series_id', selectedSeriesId).eq('user_id', currentUser.id);
        const sIds = (sData || []).map(s => s.id);
        if (sIds.length > 0) {
          query = query.in('student_id', sIds);
        } else {
          setRecentOccurrences([]);
          setStats(prev => ({ ...prev, newObservations: 0 }));
          setLoadingOccurrences(false);
          return;
        }
      } else {
        const { data: subjectClasses } = await supabase
          .from('classes')
          .select('id')
          .eq('user_id', currentUser.id)
          .or(`subject.eq.${activeSubject},subject.is.null`);
        const sIds = (subjectClasses || []).map(c => c.id);
        if (sIds.length > 0) {
          const { data: students } = await supabase.from('students').select('id').in('series_id', sIds);
          const studIds = (students || []).map(s => s.id);
          if (studIds.length > 0) query = query.in('student_id', studIds);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // For the recent list, we take the top 5
      const recentData = (data || []).slice(0, 5);

      setRecentOccurrences((data || []).map(o => ({
        id: o.id.toString(),
        studentId: o.student_id.toString(),
        student_name: (o.student as any)?.name || 'Estudante',
        date: o.date,
        type: o.type as any,
        description: o.description,
        unit: o.unit,
        userId: o.user_id
      })));

      setStats(prev => ({ ...prev, newObservations: (data || []).length }));
    } catch (e) {
      console.error("Error fetching occurrences:", e);
    } finally {
      if (!silent) setLoadingOccurrences(false);
    }
  }, [currentUser, selectedSeriesId, activeSubject, selectedSection]);

  const fetchPlans = React.useCallback(async (silent = false) => {
    if (!currentUser) return;
    if (!silent) setLoadingPlans(true);
    try {
      const today = new Date().toLocaleDateString('sv-SE');
      let query = supabase.from('plans')
        .select('*')
        .eq('user_id', currentUser.id);

      // Add subject filter to ensure plans from other subjects don't appear
      if (activeSubject) {
        query = query.eq('subject', activeSubject);
      }

      if (selectedSeriesId) {
        query = query.eq('series_id', selectedSeriesId);
        if (selectedSection) {
          // If a section is selected, show plans for that section, NULL sections, 
          // or special identifiers like "Todas as Turmas"
          query = query.or(`section.eq.${selectedSection},section.is.null,section.eq.Todas as Turmas,section.eq.Todas,section.eq.Única`);
        }
      } else {
        // If NO series is selected (Global view), we can either show everything or nothing.
        // User said "as séries respectivas", so we follow the selection.
      }

      // Fetch all plans that haven't ended yet to find the active one
      // We don't limit(5) here because the active one might be further down the list 
      // of upcoming plans if there are many future ones.
      query = query.gte('end_date', today).order('start_date', { ascending: true });

      const { data } = await query;

      const formatted = (data || []).map(p => ({
        id: p.id.toString(),
        title: p.title,
        description: p.description,
        startDate: p.start_date,
        endDate: p.end_date,
        seriesId: p.series_id.toString(),
        section: p.section,
        files: p.files || [],
        userId: p.user_id,
        subject: p.subject
      }));

      const activePlan = formatted.find(p => today >= p.startDate && today <= p.endDate);
      setTodaysPlan(activePlan || null);
      // Show up to 10 most recent plans
      setClassPlans(formatted.slice(0, 10));
    } catch (e) {
      console.error("Error fetching plans:", e);
    } finally {
      if (!silent) setLoadingPlans(false);
    }
  }, [currentUser, selectedSeriesId, selectedSection, activeSubject]);

  const fetchActivities = React.useCallback(async (silent = false) => {
    if (!currentUser) return;
    if (!silent) setLoadingActivities(true);
    try {
      const today = new Date().toLocaleDateString('sv-SE');
      let query = supabase.from('activities')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('subject', activeSubject)
        // Show today's, ongoing, and future activities
        .or(`date.gte.${today},and(start_date.lte.${today},end_date.gte.${today})`)
        .order('date', { ascending: true }) // Show soonest first
        .order('created_at', { ascending: false });

      if (selectedSeriesId) {
        query = query.eq('series_id', selectedSeriesId);
        if (selectedSection) {
          query = query.or(`section.eq.${selectedSection},section.is.null`);
        }
      } else {
        const { data: subjectClasses } = await supabase
          .from('classes')
          .select('id')
          .eq('user_id', currentUser.id)
          .or(`subject.eq.${activeSubject},subject.is.null`);
        const classIds = (subjectClasses || []).map(c => c.id);
        if (classIds.length > 0) query = query.in('series_id', classIds);
        else query = query.in('series_id', [-1]);
      }

      // Show up to 50 items (effectively "all" for the dashboard widget)
      const { data } = await query.limit(50);

      setUpcomingActivities((data || []).map(a => ({
        id: a.id.toString(),
        title: a.title,
        type: a.type,
        seriesId: a.series_id.toString(),
        section: a.section || '',
        date: a.date,
        startDate: a.start_date,
        endDate: a.end_date,
        description: a.description,
        files: a.files || [],
        completions: a.completions || [],
        userId: a.user_id
      })));
    } catch (e) {
      console.error("Error fetching activities:", e);
    } finally {
      if (!silent) setLoadingActivities(false);
    }
  }, [currentUser, selectedSeriesId, selectedSection, activeSubject]);



  const refreshAll = React.useCallback((silent = true) => {
    fetchCounts(silent);
    fetchStats(silent);
    fetchOccurrences(silent);
    fetchPlans(silent);
    fetchActivities(silent);
  }, [fetchCounts, fetchStats, fetchOccurrences, fetchPlans, fetchActivities]);

  // --- OPTIMIZATION: Stable Reference for Realtime Callback ---
  const refreshRef = React.useRef(refreshAll);

  // Update ref on every render so the subscription always calls the latest closure
  useEffect(() => {
    refreshRef.current = refreshAll;
  });

  // --- REALTIME SUBSCRIPTION ---
  useEffect(() => {
    if (!currentUser) return;

    // Polling Fallback (60s)
    const interval = setInterval(() => {
      refreshRef.current(true);
    }, 60000);

    // Realtime setup setup

    // Listen to everything relevant for the dashboard
    // We bind to 'refreshRef.current' to avoid tearing down the channel when state changes
    const channel = supabase.channel(`dashboard_sync_${currentUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => refreshRef.current(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'occurrences' }, () => refreshRef.current(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => refreshRef.current(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => refreshRef.current(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, () => refreshRef.current(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grades' }, () => refreshRef.current(true))
      .subscribe();

    return () => {
      // Realtime cleanup
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
    // ONLY Depend on currentUser.id (and activeSubject if strictly needed for channel segregation, but typically user_id is enough)
    // We REMOVE selectedSeriesId from dependencies to prevent "freezing" due to channel recreation
  }, [currentUser?.id]);


  const activityPoints = React.useMemo(() => {
    return recentOccurrences.reduce((acc: any[], occ) => {
      const existing = acc.find(p => p.date === occ.date);
      if (existing) {
        existing.count++;
        existing.types.push(occ.type);
      } else {
        acc.push({ date: occ.date, count: 1, types: [occ.type] });
      }
      return acc;
    }, []);
  }, [recentOccurrences]);

  const isContextSelected = !!selectedSeriesId;
  const displayCount = isContextSelected ? classCount : globalCount;
  const contextName = (classes.find(c => c.id === selectedSeriesId)?.name || `Série ${selectedSeriesId}`) + (selectedSection ? ` - Turma ${selectedSection}` : '');

  // ANIMATION VARIANTS
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1, y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <motion.div
      className="h-full overflow-y-auto overflow-x-hidden fluid-p-m fluid-gap-m flex flex-col custom-scrollbar pb-6 lg:pb-12 landscape:fluid-p-s landscape:fluid-gap-s landscape:pb-10 theme-transition relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Dynamic Background Glyphs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-5">
        {theme.illustrations && theme.illustrations.map((icon, i) => (
          <span
            key={i}
            className="material-symbols-outlined absolute text-[20vw]"
            style={{
              color: theme.primaryColorHex || 'var(--theme-primary)',
              top: `${Math.random() * 80}%`,
              left: `${Math.random() * 80}%`,
              transform: `rotate(${Math.random() * 45 - 22.5}deg)`,
              opacity: 0.3
            }}
          >
            {icon}
          </span>
        ))}
      </div>

      <motion.div variants={itemVariants} className="relative z-10" data-tour="dashboard-kpi">
        <DashboardHeader
          currentUser={currentUser}
          theme={theme}
          loading={loadingCounts}
          isContextSelected={isContextSelected}
          contextName={contextName}
        />
      </motion.div>

      <motion.div variants={itemVariants} className="relative z-10">
        <DashboardBanner theme={theme} currentUser={currentUser} />
      </motion.div>

      {/* PLAN OF THE DAY - Holographic Glass Design */}
      <motion.div variants={itemVariants} className="h-auto relative z-10">
        {
          loadingPlans ? (
            <div className="h-[200px] rounded-[2rem] bg-white/5 animate-pulse border border-white/5"></div>
          ) : todaysPlan ? (
            <div
              className={`relative h-auto min-h-[220px] rounded-[2.5rem] p-8 landscape:p-6 overflow-hidden flex flex-col group transition-all duration-500 hover:shadow-lg`}
              style={{ boxShadow: `0 0 20px -5px ${theme.primaryColorHex}40` }}
            >
              {/* Dynamic Background */}
              <div
                className="absolute inset-0 z-0 transition-all duration-1000"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColorHex}E6, ${theme.secondaryColorHex}E6, ${theme.primaryColorHex}F2)` }}
              ></div>

              {/* Pulse Orbs */}
              {/* Pulse Orbs - OPTIMIZED: Using radial-gradient instead of heavy blur filter */}
              <div
                className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full opacity-30 pointer-events-none animate-pulse-slow"
                style={{ background: `radial-gradient(circle, ${theme.accentColor}33 0%, transparent 70%)` }}
              ></div>
              <div
                className="absolute bottom-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full opacity-30 pointer-events-none"
                style={{ background: `radial-gradient(circle, ${theme.secondaryColorHex}33 0%, transparent 70%)` }}
              ></div>

              {/* Decorative Theme Watermark */}
              <div className="absolute top-6 right-6 z-10 opacity-10">
                <span className="material-symbols-outlined text-8xl font-thin text-white">{theme.icon}</span>
              </div>

              <div className="relative z-10 w-full flex flex-col gap-6">
                {/* Header Badge */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-white/10 shadow-inner">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-white"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/90">Aula de Hoje</span>
                  </div>
                  <span className="text-xs font-bold text-white/60 font-mono">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>

                <div className="flex flex-col gap-2">
                  {todaysPlan && (
                    <span className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">school</span>
                      {classes.find(c => c.id === todaysPlan.seriesId)?.name || 'Série Geral'} {todaysPlan.section ? `• Turma ${todaysPlan.section}` : ''}
                    </span>
                  )}
                  <h2 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight leading-none drop-shadow-lg">
                    {todaysPlan.title}
                  </h2>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/70 ml-1">Roteiro do Planejamento</span>
                  <div className="max-w-3xl bg-black/40 border border-white/20 p-4 rounded-xl">
                    <p className="text-white text-sm md:text-base font-medium leading-relaxed font-body line-clamp-2 mix-blend-plus-lighter">
                      "{todaysPlan.description.replace(/<[^>]*>/g, '')}"
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-auto">
                  <Link
                    to="/planning"
                    className="group relative px-6 py-3 bg-white text-slate-900 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center gap-2 shadow-lg hover:-translate-y-1 transition-all active:scale-95 overflow-hidden"
                  >
                    <span className="relative z-10">Acessar Planejamento</span>
                    <span className="material-symbols-outlined text-lg relative z-10 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </Link>

                  <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-6 px-6 py-3 rounded-xl bg-black/20 border border-white/10 text-xs text-white/80 font-mono w-full md:w-auto">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">schedule</span>
                      <span>Início: <span className="text-white font-bold">{new Date(todaysPlan.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span></span>
                    </div>
                    <div className="w-px h-4 bg-white/20 hidden md:block"></div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">event</span>
                      <span>Fim: <span className="text-white font-bold">{new Date(todaysPlan.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="h-[200px] flex flex-col items-center justify-center bg-white/5 dark:bg-slate-900/40 rounded-[2.5rem] border border-dashed border-slate-300 dark:border-slate-800/50 text-slate-400 group hover:border-[var(--theme-primary)] transition-all duration-500 relative overflow-hidden"
              style={{ borderColor: `${theme.primaryColorHex}30` }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(to bottom right, ${theme.primaryColorHex}10, transparent)` }}
              ></div>
              <span className="material-symbols-outlined text-5xl opacity-20 mb-3 group-hover:scale-110 transition-all text-[var(--theme-primary)]">event_busy</span>
              <h3 className="text-sm font-black uppercase tracking-widest opacity-60">Sem planejamento hoje</h3>
              <p className="text-xs opacity-40 mt-1">Aproveite para organizar suas próximas aulas</p>
            </div>
          )
        }
      </motion.div>

      {/* Help Banner - Visible for new users or quick access */}
      <motion.div variants={itemVariants} className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-600 p-[1px] shadow-lg shadow-indigo-500/20 group">
        <div className="relative bg-white dark:bg-slate-900 rounded-[23px] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden">
          {/* Background decoration */}
          {/* Background decoration - OPTIMIZED */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)' }}></div>

          <div className="flex items-center gap-6 relative z-10">
            <div className="size-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
              <span className="material-symbols-outlined text-3xl">rocket_launch</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Domine o Prof. Acerta+
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg leading-relaxed">
                Descubra como lançar notas, controlar frequência e gerar relatórios em segundos.
                <span className="hidden sm:inline"> Confira nosso guia passo-a-passo.</span>
              </p>
            </div>
          </div>

          <div className="flex w-full sm:w-auto gap-3 relative z-10">
            <Link
              to="/instructions"
              className="flex-1 sm:flex-none px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">menu_book</span>
              Ver Manual
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Main KPI Grid - Cyber-Glass Bento */}
      <div className="grid grid-cols-1 landscape:grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-6 relative z-10">

        {/* Total Students (Large Card) */}
        <motion.div variants={itemVariants} className="col-span-1 landscape:col-span-2 md:col-span-2 xl:col-span-2 glass-card-premium p-8 relative overflow-hidden group transition-all duration-500 flex flex-col justify-between h-auto min-h-[380px] md:min-h-[260px] border-white/20">
          {/* Ambient Glows */}
          {/* Ambient Glows - OPTIMIZED */}
          <div
            className="absolute -top-20 -right-20 w-[400px] h-[400px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none"
            style={{ background: `radial-gradient(circle, ${theme.primaryColorHex} 0%, transparent 70%)` }}
          ></div>
          <div
            className="absolute -bottom-20 -left-20 w-[400px] h-[400px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none"
            style={{ background: `radial-gradient(circle, ${theme.secondaryColorHex} 0%, transparent 70%)` }}
          ></div>

          <div className="relative flex flex-col md:flex-row items-start justify-between h-full gap-6 md:gap-0">
            <div className="flex flex-col justify-between h-full">
              <div
                className="size-16 rounded-2xl bg-black/5 dark:bg-slate-900/50 border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-500"
                style={{ color: theme.primaryColorHex, boxShadow: `0 10px 30px -10px ${theme.primaryColorHex}40` }}
              >
                <span className="material-symbols-outlined text-3xl">groups</span>
              </div>
              <div>
                {loadingCounts ? (
                  <div className="h-16 w-32 bg-slate-800/10 rounded-2xl animate-pulse"></div>
                ) : (
                  <span className="block text-6xl lg:text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-500 dark:from-white dark:to-white/50 tracking-tighter leading-none shadow-xl drop-shadow-sm">{displayCount}</span>
                )}
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">{isContextSelected ? 'Alunos na Turma' : 'Total de Alunos'}</h2>
              </div>
            </div>

            <div className="flex-1 w-full md:w-auto flex flex-col items-end h-full justify-between">
              <span
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mb-6"
                style={{
                  color: theme.primaryColorHex,
                  backgroundColor: `${theme.primaryColorHex}15`,
                  borderColor: `${theme.primaryColorHex}30`
                }}
              >
                <span className="size-1.5 rounded-full animate-pulse shadow-[0_0_10px_currentColor]" style={{ backgroundColor: theme.primaryColorHex }}></span>
                Fluxo de Atividade
              </span>

              {/* GITHUB HEATMAP INTEGRATION */}
              <div
                className="w-full lg:w-max max-w-full glass-card-soft p-3 rounded-2xl bg-black/5 dark:bg-black/20 border border-white/5"
                style={{ borderColor: `${theme.primaryColorHex}20` }}
              >
                <ActivityHeatmap data={activityPoints} loading={loadingOccurrences} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Grades (Small Card) */}
        {/* Grades (Small Card) */}
        <MotionLink
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          to="/grades"
          className="glass-card-soft p-6 hover:bg-white/10 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between min-h-[180px] border border-white/10 hover:shadow-lg"
          style={{
            '--hover-border': theme.primaryColorHex,
          } as React.CSSProperties}
        >
          <div className="flex justify-between items-start relative z-10">
            <div
              className="size-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
              style={{
                backgroundColor: `${theme.secondaryColorHex}15`,
                color: theme.secondaryColorHex,
                border: `1px solid ${theme.secondaryColorHex}30`
              }}
            >
              <span className="material-symbols-outlined text-2xl">grade</span>
            </div>
            <span className="material-symbols-outlined text-slate-400 group-hover:text-white transition-colors">arrow_outward</span>
          </div>
          <div className="relative z-10">
            <h3 className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-1">Média Geral</h3>
            {loadingStats ? (
              <div className="h-10 w-24 bg-slate-800/10 rounded-lg animate-pulse"></div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-4xl font-display font-black tracking-tight`}
                  style={{ color: stats.gradeAverage >= 6 ? theme.primaryColorHex : '#fb7185' }}
                >
                  {stats.gradeAverage.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-slate-500">/ 10</span>
              </div>
            )}
          </div>
          {/* Bg decoration */}
          {/* Bg decoration - OPTIMIZED */}
          <div className="absolute -bottom-10 -right-10 size-32 opacity-10 group-hover:opacity-20 transition-colors pointer-events-none" style={{ background: `radial-gradient(circle, ${theme.secondaryColorHex} 0%, transparent 70%)` }}></div>
        </MotionLink>

        {/* Attendance (Small Card) */}
        <MotionLink
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          to="/attendance"
          className="glass-card-soft p-6 hover:bg-white/10 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between min-h-[180px] border border-white/10 hover:shadow-lg"
        >
          <div className="flex justify-between items-start relative z-10">
            <div
              className="size-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
              style={{
                backgroundColor: `${theme.accentColor}20`,
                color: theme.baseColor === 'emerald' ? '#10b981' : theme.primaryColorHex,
                border: `1px solid ${theme.primaryColorHex}30`
              }}
            >
              <span className="material-symbols-outlined text-2xl">event_available</span>
            </div>
            <span className="material-symbols-outlined text-slate-400 group-hover:text-white transition-colors">arrow_outward</span>
          </div>
          <div className="relative z-10">
            <h3 className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-1">Presença Hoje</h3>
            {loadingStats ? (
              <div className="h-10 w-24 bg-slate-800/10 rounded-lg animate-pulse"></div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-display font-black text-slate-900 dark:text-white tracking-tight">{stats.presentToday}</span>
                <span className="text-xs font-bold text-slate-500">/ {displayCount}</span>
              </div>
            )}
          </div>
          {/* Bg decoration */}
          {/* Bg decoration - OPTIMIZED */}
          <div className="absolute -bottom-10 -right-10 size-32 opacity-10 group-hover:opacity-20 transition-colors pointer-events-none" style={{ background: `radial-gradient(circle, ${theme.primaryColorHex} 0%, transparent 70%)` }}></div>
        </MotionLink>

        {/* Activities and Plans (Wide Card) */}
        <motion.div variants={itemVariants} className="col-span-1 xl:col-span-2 glass-card-soft p-8 flex flex-col h-full border border-white/10" data-tour="dashboard-activities">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ color: theme.primaryColorHex }}>assignment_turned_in</span>
              Atividades & Agenda
            </h3>
            <div className="flex gap-2">
            </div>
          </div>

          <div className="space-y-8">
            {/* Upcoming Activities */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r to-transparent" style={{ from: `${theme.primaryColorHex}80`, backgroundImage: `linear-gradient(to right, ${theme.primaryColorHex}80, transparent)` }}></div>
                <h4 className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.primaryColorHex }}>Atividades do Dia</h4>
              </div>
              <div className="space-y-3">
                {loadingActivities ? (
                  [1, 2].map(i => <div key={i} className="h-14 bg-slate-800/10 rounded-xl animate-pulse"></div>)
                ) : upcomingActivities.length === 0 ? (
                  <p className="text-sm text-slate-500 italic text-center py-4 bg-white/5 rounded-xl border border-dashed border-white/5">Nenhuma atividade agendada.</p>
                ) : (
                  upcomingActivities.map(act => (
                    <Link
                      key={act.id}
                      to="/activities"
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-black/5 dark:bg-black/20 hover:bg-white/5 rounded-2xl border border-white/5 transition-all duration-300 group cursor-pointer backdrop-blur-sm gap-3 md:gap-0"
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                    >
                      <div className="flex items-center gap-4 overflow-hidden w-full md:w-auto">
                        <div
                          className="size-10 rounded-xl flex items-center justify-center border transition-all shrink-0"
                          style={{
                            backgroundColor: `${theme.primaryColorHex}15`,
                            color: theme.primaryColorHex,
                            borderColor: `${theme.primaryColorHex}20`
                          }}
                        >
                          <span className="material-symbols-outlined">task_alt</span>
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white truncate transition-colors">{act.title}</span>
                          <span className="text-[10px] font-mono text-slate-500 uppercase truncate">{act.seriesId === '-1' ? 'Todas as Turmas' : 'Série Específica'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-start md:items-end gap-1 shrink-0 ml-0 md:ml-4 w-full md:w-auto">
                        <span className="text-xs font-bold text-slate-400 bg-white/5 px-2 py-1.5 rounded-lg border border-white/5 w-full md:w-28 text-center block">
                          {act.type === 'Conteúdo' && act.startDate && act.endDate
                            ? `${new Date(act.startDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${new Date(act.endDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
                            : new Date(act.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Recent Plans */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r to-transparent" style={{ backgroundImage: `linear-gradient(to right, ${theme.secondaryColorHex}80, transparent)` }}></div>
                <h4 className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.secondaryColorHex }}>Planejamentos</h4>
              </div>
              <div className="space-y-3">
                {loadingPlans ? (
                  [1, 2].map(i => <div key={i} className="h-14 bg-slate-800/10 rounded-xl animate-pulse"></div>)
                ) : classPlans.length === 0 ? (
                  <p className="text-sm text-slate-500 italic text-center py-4 bg-white/5 rounded-xl border border-dashed border-white/5">Nenhum planejamento recente.</p>
                ) : (
                  classPlans.map(plan => (
                    <Link
                      key={plan.id}
                      to="/planning"
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-black/5 dark:bg-black/20 hover:bg-white/5 rounded-2xl border border-white/5 transition-all duration-300 group cursor-pointer backdrop-blur-sm gap-3 md:gap-0"
                    >
                      <div className="flex items-center gap-4 overflow-hidden w-full md:w-auto">
                        <div
                          className="size-10 rounded-xl flex items-center justify-center border transition-all shrink-0"
                          style={{
                            backgroundColor: `${theme.secondaryColorHex}15`,
                            color: theme.secondaryColorHex,
                            borderColor: `${theme.secondaryColorHex}20`
                          }}
                        >
                          <span className="material-symbols-outlined">calendar_today</span>
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white truncate transition-colors">{plan.title}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-start md:items-end gap-1 shrink-0 ml-0 md:ml-4 w-full md:w-auto">
                        <span className="text-xs font-bold text-slate-400 bg-white/5 px-2 py-1.5 rounded-lg border border-white/5 w-full md:w-28 text-center block">{new Date(plan.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                      </div>
                    </Link>
                  ))
                )}

              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Ocurrences (Wide Card) */}
        <motion.div variants={itemVariants} className="col-span-1 xl:col-span-2 glass-card-soft p-8 flex flex-col h-full border border-white/10" data-tour="dashboard-occurrences">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4 md:gap-0">
            <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">history</span>
              Ocorrências
              {stats.newObservations > 0 && (
                <span className="bg-amber-500/20 text-amber-500 text-[9px] px-2 py-0.5 rounded-full border border-amber-500/30 font-black uppercase tracking-wide ml-2 whitespace-nowrap">
                  +{stats.newObservations} Novas
                </span>
              )}
            </h3>
            <Link
              to="/observations"
              className={`text-xs font-bold uppercase tracking-wider hover:underline flex items-center gap-1 self-end md:self-auto`}
              style={{ color: theme.primaryColorHex }}
            >
              Ver Todas
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          <div className="space-y-3">
            {loadingOccurrences ? (
              [1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-800/10 rounded-2xl animate-pulse"></div>)
            ) : recentOccurrences.length === 0 ? (
              <div className="p-8 text-center bg-black/5 dark:bg-black/20 rounded-2xl border border-dashed border-white/10">
                <span className="material-symbols-outlined text-3xl text-slate-400 mb-2">check_circle</span>
                <p className="text-slate-500 font-medium text-sm">Nenhuma ocorrência registrada.</p>
              </div>
            ) : (
              recentOccurrences.map(occ => (
                <div key={occ.id} className="flex items-center gap-4 p-4 bg-black/5 dark:bg-black/20 hover:bg-white/5 rounded-2xl transition-all border border-transparent border-white/5 hover:border-white/10 hover:shadow-lg group">
                  <div className={`size-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 ${occ.type === 'Elogio' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-500/20' : 'bg-gradient-to-br from-rose-500 to-rose-700 shadow-rose-500/20'}`}>
                    <span className="material-symbols-outlined text-lg">{getOccurrenceIcon(occ.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-1 md:mb-0.5 gap-1">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate">
                        {(occ as any).student_name} • {occ.type}
                      </p>
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-black/10 dark:bg-black/30 px-2 py-0.5 rounded border border-white/5 w-fit whitespace-nowrap">{new Date(occ.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1 group-hover:text-slate-500 transition-colors font-medium">"{occ.description}"</p>
                  </div>
                </div>
              ))
            )}

          </div>
        </motion.div>

      </div>
    </motion.div>
  );
};