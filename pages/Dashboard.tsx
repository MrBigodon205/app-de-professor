import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useClass } from '../contexts/ClassContext';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../contexts/AuthContext';
import { Student, AttendanceRecord, Occurrence, Activity } from '../types';
import { supabase } from '../lib/supabase';

import { LoadingSpinner } from '../components/LoadingSpinner';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardBanner } from '../components/DashboardBanner';

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
    if (currentUser) {
      // Trigger fetches independently to avoid blocking UI
      fetchCounts();
      fetchStats();
      fetchOccurrences();
      fetchActivities();
      fetchPlans();
    }
  }, [currentUser, selectedSeriesId, selectedSection, activeSubject]);

  const refreshAll = (silent = true) => {
    fetchCounts(silent);
    fetchStats(silent);
    fetchOccurrences(silent);
    fetchPlans(silent);
    fetchActivities(silent);
  };

  // --- REALTIME SUBSCRIPTION ---
  useEffect(() => {
    if (!currentUser) return;

    // Polling Fallback (Every 10s)
    const interval = setInterval(() => {
      refreshAll(true);
    }, 10000);

    console.log("Setting up Realtime for Dashboard...");

    // Listen to everything relevant for the dashboard
    const channel = supabase.channel(`dashboard_sync_${currentUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => refreshAll(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'occurrences' }, () => refreshAll(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => refreshAll(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => refreshAll(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, () => refreshAll(true))
      .subscribe();

    return () => {
      console.log("Cleaning up Dashboard Realtime...");
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [currentUser, selectedSeriesId, activeSubject]);

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
      let studentsQuery = supabase.from('students').select('units, id').eq('user_id', currentUser.id);
      if (selectedSeriesId) studentsQuery = studentsQuery.eq('series_id', selectedSeriesId);
      if (selectedSection) studentsQuery = studentsQuery.eq('section', selectedSection);

      const { data: studentsData } = await studentsQuery;
      const relevantIds = (studentsData || []).map(s => s.id);

      // Average calculation (Keep logic but efficient if possible)
      let totalSum = 0;
      let totalCount = 0;
      (studentsData || []).forEach(s => {
        if (s.units) {
          Object.values(s.units).forEach((unit: any) => {
            let uSum = 0;
            Object.values(unit).forEach((val: any) => {
              if (typeof val === 'number') uSum += val;
            });
            const uAvg = uSum / 2; // Assuming 2 assessments? Logic preserved.
            if (uAvg > 0) {
              totalSum += uAvg;
              totalCount++;
            }
          });
        }
      });

      // Attendance Today
      const today = new Date().toISOString().split('T')[0];
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
        gradeAverage: totalCount > 0 ? (totalSum / totalCount) : 0
      }));
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
        // Occurrences don't have subject column usually, they are linked to student.
        // We might want to filter by students in active classes.
        .order('date', { ascending: false });

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
      const today = new Date().toISOString().split('T')[0];
      let query = supabase.from('plans')
        .select('*')
        .eq('user_id', currentUser.id)
        // .eq('subject', activeSubject) // Plans use series_id which is filtered below 
        // We need to verify if plans table has subject. 
        // We migrated classes to have subject.
        // Plans link to series_id.
        // So we filter by series that are in this subject.
        .order('start_date', { ascending: false });

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
        // Activities link to series_id too.
        .order('date', { ascending: false });

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

  const isContextSelected = !!selectedSeriesId;
  const displayCount = isContextSelected ? classCount : globalCount;
  const contextName = (classes.find(c => c.id === selectedSeriesId)?.name || `Série ${selectedSeriesId}`) + (selectedSection ? ` - Turma ${selectedSection}` : '');

  return (
    <div className="max-w-7xl w-full mx-auto flex flex-col gap-8 animate-in fade-in pb-10">
      <DashboardHeader
        currentUser={currentUser}
        theme={theme}
        loading={loadingCounts} // Use counts loading for header spinner if needed, or false
        isContextSelected={isContextSelected}
        contextName={contextName}
      />

      <DashboardBanner theme={theme} currentUser={currentUser} />

      {/* PLAN OF THE DAY BANNER */}
      {
        loadingPlans ? (
          <div className="h-40 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
        ) : todaysPlan && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
            {/* ... Plan content ... */}
            <div className="absolute right-0 top-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-[150px]">calendar_month</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 text-blue-100 font-bold uppercase text-xs tracking-wider">
                <span className="bg-white/20 px-2 py-0.5 rounded">Atividade do Dia</span>
                <span>•</span>
                <span>{new Date().toLocaleDateString('pt-BR')}</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">{todaysPlan.title}</h2>
              <p className="text-blue-100 max-w-2xl line-clamp-2">{todaysPlan.description}</p>

              <div className="flex items-center gap-4 mt-6">
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
        )
      }

      {/* Main KPI Grid - Bento Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Total Students (Large Card) */}
        <div className="md:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[32px] p-8 shadow-sm border border-white/20 dark:border-slate-800 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
          <div className="absolute top-0 right-0 p-40 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700"></div>

          <div className="relative flex flex-col h-full justify-between">
            <div className="flex items-start justify-between">
              <div className={`size-16 rounded-2xl bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white flex items-center justify-center shadow-lg shadow-${theme.primaryColor}/25 group-hover:rotate-6 transition-transform duration-300`}>
                <span className="material-symbols-outlined text-3xl">groups</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/10">
                  <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Ativos
                </span>
              </div>
            </div>

            <div className="mt-6">
              {loadingCounts ? (
                <div className="h-16 w-32 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse"></div>
              ) : (
                <span className="block text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{displayCount}</span>
              )}
              <h2 className="text-lg font-bold text-slate-500 dark:text-slate-400 mt-2">Alunos Matriculados</h2>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">{isContextSelected ? 'Nesta Turma' : 'Total Geral'}</p>
            </div>
          </div>
        </div>

        {/* Secondary Cards Grid */}


        {/* Grades */}
        {/* Grades (Small Card) */}
        <Link to="/grades" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-[32px] shadow-sm border border-white/20 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className={`size-12 rounded-xl bg-${theme.primaryColor}/10 text-${theme.primaryColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined">grade</span>
            </div>
            <span className="material-symbols-outlined text-slate-300">arrow_outward</span>
          </div>
          <div>
            <h3 className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Média da Turma</h3>
            {loadingStats ? (
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1"></div>
            ) : (
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.gradeAverage.toFixed(1)}</span>
                <span className="text-xs font-bold text-slate-400">/ 10</span>
              </div>
            )}
          </div>
        </Link>

        {/* Attendance */}
        {/* Attendance (Small Card) */}
        <Link to="/attendance" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-[32px] shadow-sm border border-white/20 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="size-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">event_available</span>
            </div>
            <span className="material-symbols-outlined text-slate-300">arrow_outward</span>
          </div>
          <div>
            <h3 className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Presença Hoje</h3>
            {loadingStats ? (
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1"></div>
            ) : (
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.presentToday}</span>
                <span className="text-xs font-bold text-slate-400">/ {displayCount}</span>
              </div>
            )}
          </div>
        </Link>

        {/* Observations */}
        {/* Observations (Small Card) */}
        <Link to="/observations" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-[32px] shadow-sm border border-white/20 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="size-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">notification_important</span>
            </div>
            <span className="material-symbols-outlined text-slate-300">arrow_outward</span>
          </div>
          <div>
            <h3 className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Ocorrências</h3>
            {loadingOccurrences ? (
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1"></div>
            ) : (
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.newObservations}</span>
                <span className="text-xs font-bold text-slate-400">Novas</span>
              </div>
            )}
          </div>
        </Link>

      </div>



      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activities and Plans */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[32px] p-8 shadow-sm border border-white/20 dark:border-slate-800 flex flex-col h-full">
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
                    <div key={act.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-emerald-500">task_alt</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{act.title}</span>
                      </div>
                      <span className="text-xs text-slate-400">{new Date(act.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
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
                    <div key={plan.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-${theme.primaryColor}`}>calendar_today</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{plan.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase">{new Date(plan.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Ocurrences */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[32px] p-8 shadow-sm border border-white/20 dark:border-slate-800 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400">history</span>
              Ocorrências Recentes
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
        </div>
      </div>
    </div >
  );
};