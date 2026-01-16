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
      const today = new Date();
      const fourMonthsAgo = new Date();
      fourMonthsAgo.setDate(today.getDate() - 120);

      let query = supabase.from('occurrences')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('subject', activeSubject)
        .gte('date', fourMonthsAgo.toLocaleDateString('sv-SE'))
        .order('date', { ascending: false });

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

      setRecentOccurrences((recentData || []).map(o => ({
        id: o.id.toString(),
        studentId: o.student_id.toString(),
        date: o.date,
        type: o.type as any,
        description: o.description,
        unit: o.unit,
        userId: o.user_id
      })));

      setStats(prev => ({ ...prev, newObservations: (data || []).filter(o => o.date >= new Date().toLocaleDateString('sv-SE')).length }));
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
        .eq('user_id', currentUser.id)
        .gte('end_date', today)
        .order('start_date', { ascending: true });

      const { data } = await query.limit(5);

      const formatted = (data || []).map(p => ({
        id: p.id.toString(),
        title: p.title,
        description: p.description,
        startDate: p.start_date,
        endDate: p.end_date,
        seriesId: p.series_id.toString(),
        section: p.section,
        files: p.files || [],
        userId: p.user_id
      }));

      setClassPlans(formatted.slice(0, 3));

      const activePlan = formatted.find(p => today >= p.startDate && today <= p.endDate);
      setTodaysPlan(activePlan || null);
    } catch (e) {
      console.error("Error fetching plans:", e);
    } finally {
      if (!silent) setLoadingPlans(false);
    }
  }, [currentUser]);

  const fetchActivities = React.useCallback(async (silent = false) => {
    if (!currentUser) return;
    if (!silent) setLoadingActivities(true);
    try {
      let query = supabase.from('activities')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('subject', activeSubject)
        .gte('date', new Date().toLocaleDateString('sv-SE'))
        .order('date', { ascending: true });

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

      const { data } = await query.limit(5);

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
      })).slice(0, 3));
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
      className="h-full overflow-y-auto overflow-x-hidden fluid-p-m fluid-gap-m flex flex-col custom-scrollbar pb-32 lg:pb-12 landscape:fluid-p-s landscape:fluid-gap-s landscape:pb-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} data-tour="dashboard-kpi">
        <DashboardHeader
          currentUser={currentUser}
          theme={theme}
          loading={loadingCounts} // Use counts loading for header spinner if needed, or false
          isContextSelected={isContextSelected}
          contextName={contextName}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <DashboardBanner theme={theme} currentUser={currentUser} />
      </motion.div>

      {/* PLAN OF THE DAY BANNER - Overhauled for Premium Visibility */}
      <motion.div variants={itemVariants} className="min-h-[240px] lg:min-h-[280px] landscape:min-h-[180px]">
        {
          loadingPlans ? (
            <div className="h-[240px] lg:h-[280px] landscape:h-[180px] rounded-[2.5rem] bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
          ) : todaysPlan ? (
            <div className={`relative h-full min-h-[240px] lg:min-h-[280px] landscape:min-h-[180px] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-[2.5rem] p-8 lg:p-12 landscape:p-6 text-white shadow-2xl shadow-blue-500/30 overflow-hidden flex flex-col justify-center group`}>
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                <span className="material-symbols-outlined text-[300px] lg:text-[400px] landscape:text-[200px]">calendar_month</span>
              </div>
              <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-white/5 blur-[100px] rounded-full"></div>

              <div className="relative z-10 w-full">
                <div className="flex items-center gap-3 mb-6 landscape:mb-4 text-blue-100/90 font-black uppercase text-[10px] sm:text-xs tracking-[0.2em] bg-white/10 w-fit px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                  <span className="size-2 bg-blue-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.8)]"></span>
                  Aula de Hoje
                  <span className="opacity-50">•</span>
                  <span>{new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</span>
                </div>

                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 lg:mb-6 tracking-tighter leading-tight drop-shadow-lg max-w-4xl">
                  {todaysPlan.title}
                </h2>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 landscape:gap-4">
                  <div className="max-w-3xl">
                    <p className="text-blue-50/90 text-lg md:text-xl lg:text-2xl font-medium line-clamp-2 leading-relaxed italic opacity-95 group-hover:opacity-100 transition-opacity border-l-4 border-white/20 pl-6 mb-2">
                      "{todaysPlan.description.replace(/<[^>]*>/g, '')}"
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 shrink-0">
                    <Link
                      to="/planning"
                      className="group/btn relative px-8 py-4 landscape:py-3 bg-white text-blue-700 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl shadow-black/10 hover:shadow-white/20 hover:-translate-y-1 transition-all active:scale-95"
                    >
                      <span>Ver Aula Completa</span>
                      <span className="material-symbols-outlined text-xl group-hover/btn:translate-x-1 transition-transform">arrow_right_alt</span>
                    </Link>

                    <div className="flex items-center gap-3 text-sm font-bold text-blue-100/80 bg-black/10 px-5 py-4 landscape:py-3 rounded-2xl backdrop-blur-sm border border-white/5">
                      <span className="material-symbols-outlined text-2xl">event_upcoming</span>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-wider opacity-60">Prazo de Entrega</span>
                        <span>{new Date(todaysPlan.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[240px] lg:h-[280px] landscape:h-[180px] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 group hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-500">
              <div className="size-20 lg:size-24 rounded-[2rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all">
                <span className="material-symbols-outlined text-5xl lg:text-6xl opacity-30">event_busy</span>
              </div>
              <h3 className="text-lg lg:text-xl font-black uppercase tracking-[0.2em] opacity-60">Planejamento em Aberto</h3>
              <p className="text-xs lg:text-sm font-bold opacity-40 mt-2">Toque em "Planejamento" para organizar sua aula de hoje.</p>
            </div>
          )
        }
      </motion.div>

      {/* Main KPI Grid - Bento Style */}
      <div className="grid grid-cols-1 landscape:grid-cols-2 md:grid-cols-2 xl:grid-cols-4 fluid-gap-s landscape:fluid-gap-xs">

        {/* Total Students (Large Card) */}
        <motion.div variants={itemVariants} className="col-span-1 landscape:col-span-2 md:col-span-2 xl:col-span-2 glass-card-premium p-6 sm:p-8 relative overflow-hidden group transition-all duration-500 flex flex-col justify-between h-auto min-h-[380px] md:min-h-[240px] landscape:min-h-[200px]">
          <div className="absolute top-0 right-0 p-40 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700"></div>

          <div className="relative flex flex-col md:flex-row items-start justify-between h-auto md:h-full gap-6 md:gap-0 landscape:flex-row landscape:gap-4">
            <div className="flex flex-col justify-between h-full w-full md:w-auto landscape:w-auto">
              <div className={`size-16 rounded-2xl bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white flex items-center justify-center shadow-lg shadow-${theme.primaryColor}/25 group-hover:rotate-6 transition-transform duration-300 landscape:size-12`}>
                <span className="material-symbols-outlined text-3xl landscape:text-xl">groups</span>
              </div>
              <div className="mt-4 landscape:mt-2">
                {loadingCounts ? (
                  <div className="h-[60px] w-24 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse"></div>
                ) : (
                  <span className="block text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none landscape:text-4xl">{displayCount}</span>
                )}
                <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">Alunos Matriculados</h2>
              </div>
            </div>

            <div className="flex-1 w-full md:w-auto flex flex-col items-start md:items-end pt-2 h-full justify-between landscape:items-end">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/10 mb-6 max-w-full whitespace-nowrap overflow-hidden text-ellipsis landscape:mb-1">
                <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Atividade Recente
              </span>

              {/* GITHUB HEATMAP INTEGRATION */}
              <div className="w-full max-w-full md:max-w-[280px] landscape:max-w-[200px]">
                <ActivityHeatmap data={activityPoints} loading={loadingOccurrences} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Grades (Small Card) */}
        <MotionLink variants={itemVariants} to="/grades" className="card p-6 hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 group relative overflow-hidden flex flex-col justify-between min-h-[160px] md:min-h-[180px]">
          <div className="flex justify-between items-start">
            <div className={`size-12 rounded-xl bg-${theme.primaryColor}/10 text-${theme.primaryColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined text-2xl">grade</span>
            </div>
            <span className="material-symbols-outlined text-slate-300">arrow_outward</span>
          </div>
          <div>
            <h3 className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Média da Turma</h3>
            {loadingStats ? (
              <div className="h-9 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1"></div>
            ) : (
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.gradeAverage.toFixed(1)}</span>
                <span className="text-xs font-bold text-slate-400">/ 10</span>
              </div>
            )}
          </div>
        </MotionLink>

        {/* Attendance (Small Card) */}
        <MotionLink variants={itemVariants} to="/attendance" className="card p-6 hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 group relative overflow-hidden flex flex-col justify-between min-h-[160px] md:min-h-[180px]">
          <div className="flex justify-between items-start">
            <div className="size-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">event_available</span>
            </div>
            <span className="material-symbols-outlined text-slate-300">arrow_outward</span>
          </div>
          <div>
            <h3 className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Presença Hoje</h3>
            {loadingStats ? (
              <div className="h-9 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1"></div>
            ) : (
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.presentToday}</span>
                <span className="text-xs font-bold text-slate-400">/ {displayCount}</span>
              </div>
            )}
          </div>
        </MotionLink>

        {/* Removed Independent Observations Card */}

        {/* Activities and Plans (Wide Card) */}
        <motion.div variants={itemVariants} className="col-span-1 xl:col-span-2 card p-6 sm:p-8 flex flex-col h-full" data-tour="dashboard-activities">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
              <span className={`material-symbols-outlined text-${theme.primaryColor}`}>assignment_turned_in</span>
              Atividades e Planejamento
            </h3>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Atividades Avaliativas</h4>
              <div className="space-y-2">
                {loadingActivities ? (
                  [1, 2].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>)
                ) : upcomingActivities.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">Nenhuma atividade recente.</p>
                ) : (
                  upcomingActivities.map(act => (
                    <div key={act.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all duration-300 group cursor-default">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="material-symbols-outlined text-emerald-500 group-hover:scale-110 transition-transform duration-300 shrink-0">task_alt</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{act.title}</span>
                      </div>
                      <span className="text-xs text-slate-400 group-hover:text-slate-500 transition-colors shrink-0 ml-2">{new Date(act.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Últimos Planejamentos</h4>
              <div className="space-y-2">
                {loadingPlans ? (
                  [1, 2].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>)
                ) : classPlans.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">Nenhum planejamento recente.</p>
                ) : (
                  classPlans.map(plan => (
                    <div key={plan.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all duration-300 group cursor-default">
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-${theme.primaryColor} group-hover:rotate-6 transition-transform duration-300`}>calendar_today</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{plan.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase group-hover:text-slate-500 transition-colors">{new Date(plan.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Ocurrences (Wide Card) */}
        <motion.div variants={itemVariants} className="col-span-1 xl:col-span-2 card p-6 sm:p-8 flex flex-col h-full" data-tour="dashboard-occurrences">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400">history</span>
              Ocorrências Recentes
              {stats.newObservations > 0 && (
                <span className="bg-amber-100 text-amber-600 text-[10px] px-2 py-0.5 rounded-full border border-amber-200 font-bold uppercase tracking-wide">
                  {stats.newObservations} Novas
                </span>
              )}
            </h3>
            <Link to="/observations" className={`text-${theme.primaryColor} font-bold text-sm hover:underline`}>Ver Todas</Link>
          </div>

          <div className="space-y-3">
            {loadingOccurrences ? (
              [1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>)
            ) : recentOccurrences.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-slate-400 font-medium">Nenhuma ocorrência registrada.</p>
              </div>
            ) : (
              recentOccurrences.map(occ => (
                <div key={occ.id} className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-white dark:bg-slate-900/50 dark:hover:bg-slate-800/80 rounded-2xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700 hover:shadow-sm group">
                  <div className={`size-10 rounded-xl flex items-center justify-center text-white shadow-sm ${occ.type === 'Elogio' ? 'bg-gradient-to-br from-green-400 to-emerald-600' : 'bg-gradient-to-br from-red-400 to-rose-600'}`}>
                    <span className="material-symbols-outlined text-lg">{occ.type === 'Elogio' ? 'thumb_up' : 'warning'}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{occ.type}</p>
                      <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800">{new Date(occ.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1">{occ.description}</p>
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