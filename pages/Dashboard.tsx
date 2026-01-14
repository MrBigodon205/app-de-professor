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
const MotionLink = motion(Link);

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

  const refreshAll = (silent = true) => {
    fetchCounts(silent);
    fetchStats(silent);
    fetchOccurrences(silent);
    fetchPlans(silent);
    fetchActivities(silent);
  };

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

    console.log("Setting up Realtime for Dashboard...");

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
      console.log("Cleaning up Dashboard Realtime...");
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
    // ONLY Depend on currentUser.id (and activeSubject if strictly needed for channel segregation, but typically user_id is enough)
    // We REMOVE selectedSeriesId from dependencies to prevent "freezing" due to channel recreation
  }, [currentUser?.id]);

  const fetchCounts = async (silent = false) => {
    if (!currentUser) return;
    if (!silent) setLoadingCounts(true);
    try {
      const { count: gCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id); // Students are global usually, but if we want to filter count by subject context we might need joins.
      // For now, global count remains global.
      setGlobalCount(gCount || 0);

      if (selectedSeriesId) {
        let query = supabase.from('students').select('*', { count: 'exact', head: true })
          .eq('user_id', currentUser.id)
          .eq('series_id', selectedSeriesId);
        if (selectedSection) query = query.eq('section', selectedSection);
        const { count: sCount } = await query;
        setClassCount(sCount || 0);
      } else {
        // If no series selected, maybe filter by Active Subject?
        // Classes are filtered by activeSubject in Context.
        // If we want "Students in my Math Classes", we need to filter by series IDs that belong to Math.
        // For dashboard simplicity, if no series selected, we can show total students in active subject classes.
        // FETCH ALL CLASSES FOR THIS SUBJECT
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
          // Fallback to global if no classes, or 0? 0 makes more sense for "Math Students"
          setClassCount(0);
        }
      }
    } catch (e) {
      console.error("Error fetching counts:", e);
    } finally {
      if (!silent) setLoadingCounts(false);
    }
  };

  const fetchStats = async (silent = false) => {
    if (!currentUser) return;
    if (!silent) setLoadingStats(true);
    try {
      // 1. Fetch Students IDs relevant to current filter
      let studentsQuery = supabase.from('students').select('id').eq('user_id', currentUser.id);
      if (selectedSeriesId) studentsQuery = studentsQuery.eq('series_id', selectedSeriesId);
      if (selectedSection) studentsQuery = studentsQuery.eq('section', selectedSection);

      const { data: studentsData } = await studentsQuery;
      const relevantIds = (studentsData || []).map(s => s.id);

      if (relevantIds.length > 0) {
        // 2. Fetch Grades for these students & activeSubject
        const { data: gradesData } = await supabase
          .from('grades')
          .select('*')
          .in('student_id', relevantIds)
          .eq('subject', activeSubject)
          .eq('user_id', currentUser.id);

        let totalAvgSum = 0;
        let studentsWithGradesCount = 0;

        // Group by student to calculate their individual average first
        relevantIds.forEach(studentId => {
          const sGrades = (gradesData || []).filter(g => g.student_id === studentId);
          if (sGrades.length === 0) return;

          // Reconstruct minimal student object for the utility
          const mockStudent: any = { units: {} };
          sGrades.forEach(g => { mockStudent.units[g.unit] = g.data || {}; });

          // Calculate average of units 1, 2, 3 (ignoring final/recovery for class average usually)
          let sSum = 0;
          let sCount = 0;
          ['1', '2', '3'].forEach(u => {
            if (mockStudent.units[u]) {
              const uTotal = calculateUnitTotal(mockStudent, u);
              if (uTotal > 0) { // Only count units that have distinct grades? Or just count strict?
                // If uTotal is 0 it might be empty. Let's check if the object has keys.
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

        // 3. Attendance Today (Preserved)
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
  };

  const fetchOccurrences = async (silent = false) => {
    if (!currentUser) return;
    if (!silent) setLoadingOccurrences(true);
    try {
      let query = supabase.from('occurrences')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('subject', activeSubject)
        .gte('date', new Date().toLocaleDateString('sv-SE')) // Strict date filtering: Only today/future
        .order('date', { ascending: true }); // Show closest first? Or recent added? Usually future events are ascending.

      if (selectedSeriesId) {
        // Optimization: If we can filter by student_id better, great.
        // For now preserving logic but handling missing data gracefully
        const { data: sData } = await supabase.from('students').select('id').eq('series_id', selectedSeriesId).eq('user_id', currentUser.id);
        const sIds = (sData || []).map(s => s.id);
        if (sIds.length > 0) {
          query = query.in('student_id', sIds);
        } else {
          // If no students in series, no occurrences to show for this filter
          setRecentOccurrences([]);
          setStats(prev => ({ ...prev, newObservations: 0 }));
          setLoadingOccurrences(false);
          return;
        }
      } else {
        // Filter by Active Subject Classes if no series selected
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


      const { data, error } = await query.limit(5);
      if (error) throw error;

      setRecentOccurrences((data || []).map(o => ({
        id: o.id.toString(),
        studentId: o.student_id.toString(),
        date: o.date,
        type: o.type as any,
        description: o.description,
        unit: o.unit,
        userId: o.user_id
      })));

      setStats(prev => ({ ...prev, newObservations: data?.length || 0 }));
    } catch (e) {
      console.error("Error fetching occurrences:", e);
    } finally {
      if (!silent) setLoadingOccurrences(false);
    }
  };

  const fetchPlans = async (silent = false) => {
    if (!currentUser) return;
    if (!silent) setLoadingPlans(true);
    try {
      const today = new Date().toLocaleDateString('sv-SE');
      let query = supabase.from('plans')
        .select('*')
        .eq('user_id', currentUser.id)
        .gte('end_date', today) // Strict date filtering: Only plans that end today or in the future
        .order('start_date', { ascending: true }); // Closest starting plans first

      // Update: Removed subject filter to prevent plans from disappearing (Dashboard should show global overview)
      /* if (activeSubject) {
        query = query.eq('subject', activeSubject);
      } */

      /* if (selectedSeriesId) {
        query = query.eq('series_id', selectedSeriesId);
        if (selectedSection) {
          query = query.or(`section.eq.${selectedSection},section.is.null`);
        }
      } */
      // Removed redundant 'classIds' lookup. If we filter by subject, we trust the subject column on the plan.
      // This matches Planning.tsx behavior.

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
  };

  const fetchActivities = async (silent = false) => {
    if (!currentUser) return;
    if (!silent) setLoadingActivities(true);
    try {
      let query = supabase.from('activities')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('subject', activeSubject)
        .gte('date', new Date().toLocaleDateString('sv-SE')) // Strict date filtering: Only today/future
        .order('date', { ascending: true }); // Closest upcoming activities FIRST

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
        else query = query.in('series_id', [-1]); // Empty
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
  };

  const activityPoints = recentOccurrences.reduce((acc: any[], occ) => {
    const existing = acc.find(p => p.date === occ.date);
    if (existing) {
      existing.count++;
      existing.types.push(occ.type);
    } else {
      acc.push({ date: occ.date, count: 1, types: [occ.type] });
    }
    return acc;
  }, []);

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
      className="p-8 max-w-[1600px] mx-auto space-y-8"
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

      {/* PLAN OF THE DAY BANNER */}
      <motion.div variants={itemVariants} className="min-h-[160px]">
        {
          loadingPlans ? (
            <div className="h-[160px] rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
          ) : todaysPlan ? (
            <div className="h-[160px] bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden flex flex-col justify-center">
              {/* ... Plan content ... */}
              <div className="absolute right-0 top-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-[150px]">calendar_month</span>
              </div>
              <div className="relative z-10 w-full">
                <div className="flex items-center gap-2 mb-2 text-blue-100 font-bold uppercase text-xs tracking-wider">
                  <span className="bg-white/20 px-2 py-0.5 rounded">Atividade do Dia</span>
                  <span>•</span>
                  <span>{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
                <h2 className="text-2xl font-bold mb-2 truncate">{todaysPlan.title}</h2>
                <p className="text-blue-100 max-w-2xl line-clamp-1">{todaysPlan.description}</p>

                <div className="flex items-center gap-4 mt-4">
                  <Link to="/planning" className={`bg-white text-${theme.primaryColor} px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors`}>
                    Ver Detalhes
                  </Link>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined">schedule</span>
                    Termina em {new Date(todaysPlan.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[160px] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">event_busy</span>
              <span className="text-sm font-medium">Nenhum planejamento para hoje</span>
            </div>
          )
        }
      </motion.div>

      {/* Main KPI Grid - Bento Style */}
      <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Total Students (Large Card) */}
        <motion.div variants={itemVariants} className="col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[32px] p-8 shadow-sm border border-white/20 dark:border-slate-800 relative overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col justify-between h-auto min-h-[380px] md:min-h-[240px]">
          <div className="absolute top-0 right-0 p-40 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700"></div>

          <div className="relative flex flex-col md:flex-row items-start justify-between h-auto md:h-full gap-6 md:gap-0">
            <div className="flex flex-col justify-between h-full w-full md:w-auto">
              <div className={`size-16 rounded-2xl bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white flex items-center justify-center shadow-lg shadow-${theme.primaryColor}/25 group-hover:rotate-6 transition-transform duration-300`}>
                <span className="material-symbols-outlined text-3xl">groups</span>
              </div>
              <div className="mt-4">
                {loadingCounts ? (
                  <div className="h-[60px] w-24 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse"></div>
                ) : (
                  <span className="block text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{displayCount}</span>
                )}
                <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">Alunos Matriculados</h2>
              </div>
            </div>

            <div className="flex-1 w-full md:w-auto flex flex-col items-start md:items-end pt-2 h-full justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/10 mb-6 max-w-full whitespace-nowrap overflow-hidden text-ellipsis">
                <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Atividade Recente
              </span>

              {/* GITHUB HEATMAP INTEGRATION */}
              <div className="w-full max-w-full md:max-w-[280px]">
                <ActivityHeatmap data={activityPoints} loading={loadingOccurrences} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Grades (Small Card) */}
        <MotionLink variants={itemVariants} to="/grades" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-[32px] shadow-sm border border-white/20 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between min-h-[160px] md:min-h-[180px]">
          <div className="flex justify-between items-start">
            <div className={`size-12 rounded-xl bg-${theme.primaryColor}/10 text-${theme.primaryColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined">grade</span>
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
        <MotionLink variants={itemVariants} to="/attendance" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-[32px] shadow-sm border border-white/20 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between min-h-[160px] md:min-h-[180px]">
          <div className="flex justify-between items-start">
            <div className="size-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">event_available</span>
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
        <motion.div variants={itemVariants} className="col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[32px] p-8 shadow-sm border border-white/20 dark:border-slate-800 flex flex-col h-full" data-tour="dashboard-activities">
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
        <motion.div variants={itemVariants} className="col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[32px] p-8 shadow-sm border border-white/20 dark:border-slate-800 flex flex-col h-full" data-tour="dashboard-occurrences">
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