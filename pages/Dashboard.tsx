import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { VARIANTS } from '../constants/motion';
import { AnimatedCard } from '../components/ui/AnimatedCard';
import { useClass } from '../contexts/ClassContext';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../contexts/AuthContext';
import { Occurrence, Activity, Plan, User } from '../types';
import { supabase } from '../lib/supabase';
import { stripHtml } from '../utils/text';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardBanner } from '../components/DashboardBanner';
import { ActivityHeatmap } from '../components/ActivityHeatmap';
import { DashboardPlan } from '../components/dashboard/DashboardPlan';
import { DashboardOccurrences } from '../components/dashboard/DashboardOccurrences';
import { DashboardActivities } from '../components/dashboard/DashboardActivities';
import { DashboardHelpBanner } from '../components/dashboard/DashboardHelpBanner';
import { calculateUnitTotal } from '../utils/gradeCalculations';


export const Dashboard: React.FC = () => {
  const { selectedSeriesId, selectedSection, classes } = useClass();
  const theme = useTheme();
  const { currentUser, activeSubject } = useAuth();

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const [loadingCounts, setLoadingCounts] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingOccurrences, setLoadingOccurrences] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);

  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!currentUser || isRedirecting) return;

    const checkRedirect = async () => {
      const isInstitutionalOnly = currentUser.account_type === 'institutional' && classes.length === 0;

      if (isInstitutionalOnly) {
        setIsRedirecting(true);
        try {
          const { data: schools } = await supabase
            .from('institution_teachers')
            .select('institution_id')
            .eq('user_id', currentUser.id)
            .limit(1);

          if (schools && schools.length > 0) {
            navigate(`/institution/${schools[0].institution_id}/dashboard`, { replace: true });
          }
        } catch (err) {
          console.error("Redirect check failed", err);
          setIsRedirecting(false);
        }
      }
    };

    const timer = setTimeout(checkRedirect, 500);
    return () => clearTimeout(timer);
  }, [currentUser, classes.length, isRedirecting, navigate]);

  const [globalCount, setGlobalCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [stats, setStats] = useState({
    presentToday: 0,
    gradeAverage: 0,
    newObservations: 0
  });
  const [recentOccurrences, setRecentOccurrences] = useState<Occurrence[]>([]);
  const [todaysPlans, setTodaysPlans] = useState<Plan[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<Activity[]>([]);
  const [classPlans, setClassPlans] = useState<Plan[]>([]);


  useEffect(() => {
    if (!currentUser?.id) return;
    const cacheKey = `dashboard_cache_${currentUser.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        setGlobalCount(data.globalCount || 0);
        setClassCount(data.classCount || 0);
        setStats(data.stats || { presentToday: 0, gradeAverage: 0, newObservations: 0 });
        setLoadingCounts(false);
        setLoadingStats(false);
        setLoadingOccurrences(false);
        setLoadingPlans(false);
        setLoadingActivities(false);
      } catch (e) {
        console.warn("Failed to load dashboard cache", e);
      }
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const cacheKey = `dashboard_cache_${currentUser.id}`;
    const dataToCache = {
      globalCount,
      classCount,
      stats,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
  }, [globalCount, classCount, stats, currentUser?.id]);

  const fetchCounts = useCallback(async (silent = false) => {
    if (!currentUser) return;
    if (!silent && globalCount === 0 && mountedRef.current) setLoadingCounts(true);

    try {
      const pGlobal = supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id);

      let pClass;

      if (selectedSeriesId) {
        let query = supabase.from('students').select('*', { count: 'exact', head: true })
          .eq('user_id', currentUser.id)
          .eq('series_id', selectedSeriesId);
        if (selectedSection) query = query.eq('section', selectedSection);
        pClass = query;
      } else {
        const { data: subjectClasses } = await supabase
          .from('classes')
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('subject', activeSubject);

        const classIds = (subjectClasses || []).map(c => c.id);

        if (classIds.length > 0) {
          pClass = supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', currentUser.id)
            .in('series_id', classIds);
        }
      }

      const [resGlobal, resClass] = await Promise.all([pGlobal, pClass]);

      if (mountedRef.current) {
        setGlobalCount(resGlobal?.count || 0);
        setClassCount(resClass?.count || 0);
      }

    } catch (e) {
      console.error("Error fetching counts:", e);
    } finally {
      if (!silent && mountedRef.current) setLoadingCounts(false);
    }
  }, [currentUser, selectedSeriesId, selectedSection, activeSubject, globalCount]);

  const fetchStats = useCallback(async (silent = false, prefetchedStudentIds?: string[]) => {
    if (!currentUser) return;
    if (!silent && stats.gradeAverage === 0 && stats.presentToday === 0) setLoadingStats(true);
    try {
      let relevantIds: string[] = [];

      if (prefetchedStudentIds) {
        relevantIds = prefetchedStudentIds;
      } else {
        let studentsQuery = supabase.from('students').select('id').eq('user_id', currentUser.id);
        if (selectedSeriesId) studentsQuery = studentsQuery.eq('series_id', selectedSeriesId);
        if (selectedSection) studentsQuery = studentsQuery.eq('section', selectedSection);
        const { data: studentsData } = await studentsQuery;
        relevantIds = (studentsData || []).map(s => s.id);
      }

      if (relevantIds.length > 0) {
        const { data: gradesData } = await supabase
          .from('grades')
          .select('student_id, unit, data')
          .in('student_id', relevantIds)
          .eq('subject', activeSubject)
          .eq('user_id', currentUser.id);

        const gradesMap = new Map();
        (gradesData || []).forEach((g: any) => {
          if (!gradesMap.has(g.student_id)) gradesMap.set(g.student_id, []);
          gradesMap.get(g.student_id).push(g);
        });

        let totalAvgSum = 0;
        let studentsWithGradesCount = 0;

        relevantIds.forEach(studentId => {
          const sGrades = gradesMap.get(studentId) || [];
          if (sGrades.length === 0) return;

          const mockStudent: any = { units: {} };
          sGrades.forEach((g: any) => { mockStudent.units[g.unit] = g.data || {}; });

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

        if (mountedRef.current) {
          setStats(prev => ({
            ...prev,
            presentToday,
            gradeAverage: finalAvg
          }));
        }

      } else {
        if (mountedRef.current) setStats(prev => ({ ...prev, presentToday: 0, gradeAverage: 0 }));
      }

    } catch (e) {
      console.error("Error fetching stats:", e);
    } finally {
      if (!silent && mountedRef.current) setLoadingStats(false);
    }
  }, [currentUser, selectedSeriesId, selectedSection, activeSubject, stats]);

  const fetchOccurrences = useCallback(async (silent = false, prefetchedStudentIds?: string[]) => {
    if (!currentUser) return;
    if (!silent && recentOccurrences.length === 0) setLoadingOccurrences(true);
    try {
      const today = new Date().toLocaleDateString('sv-SE');

      let query = supabase.from('occurrences')
        .select(`
          id, student_id, type, date, description, unit, user_id, created_at,
          student:students ( name )
        `)
        .eq('user_id', currentUser.id)
        .eq('subject', activeSubject)
        .eq('date', today)
        .order('created_at', { ascending: false });

      if (prefetchedStudentIds) {
        if (prefetchedStudentIds.length === 0) {
          if (mountedRef.current) {
            setRecentOccurrences([]);
            setStats(prev => ({ ...prev, newObservations: 0 }));
            setLoadingOccurrences(false);
          }
          return;
        }
        query = query.in('student_id', prefetchedStudentIds);
      } else {
        if (selectedSeriesId) {
          const { data: sData } = await supabase.from('students').select('id').eq('series_id', selectedSeriesId).eq('user_id', currentUser.id);
          const sIds = (sData || []).map(s => s.id);
          if (sIds.length > 0) {
            query = query.in('student_id', sIds);
          } else {
            if (mountedRef.current) {
              setRecentOccurrences([]);
              setStats(prev => ({ ...prev, newObservations: 0 }));
              setLoadingOccurrences(false);
            }
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
      }

      const { data, error } = await query;
      if (error) throw error;

      const formatted = (data || []).slice(0, 5).map(o => ({
        id: o.id.toString(),
        studentId: o.student_id.toString(),
        student_name: (o.student as any)?.name || 'Estudante',
        date: o.date,
        type: o.type as any,
        description: o.description,
        unit: o.unit,
        userId: o.user_id
      }));

      if (mountedRef.current) {
        setRecentOccurrences(formatted);
        setStats(prev => ({ ...prev, newObservations: (data || []).length }));
      }

    } catch (e) {
      console.error("Error fetching occurrences (online):", e);
    } finally {
      if (!silent && mountedRef.current) setLoadingOccurrences(false);
    }
  }, [currentUser, selectedSeriesId, activeSubject, selectedSection, recentOccurrences]);

  const fetchPlans = useCallback(async (silent = false) => {
    if (!currentUser) return;
    if (!silent && todaysPlans.length === 0) setLoadingPlans(true);
    try {
      const today = new Date().toLocaleDateString('sv-SE');
      let query = supabase.from('plans')
        .select('id, title, description, start_date, end_date, series_id, section, files, user_id, subject')
        .eq('user_id', currentUser.id);

      if (activeSubject) {
        query = query.eq('subject', activeSubject);
      }

      if (selectedSeriesId) {
        query = query.eq('series_id', selectedSeriesId);
        if (selectedSection) {
          query = query.or(`section.eq.${selectedSection},section.is.null,section.eq.Todas as Turmas,section.eq.Todas,section.eq.Única`);
        }
      }

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

      const activePlans = formatted.filter(p => today >= p.startDate && today <= p.endDate);
      setTodaysPlans(activePlans);
      setClassPlans(formatted.slice(0, 10));

    } catch (e) {
      console.error("Error fetching plans (online):", e);
    } finally {
      if (!silent) setLoadingPlans(false);
    }
  }, [currentUser, selectedSeriesId, selectedSection, activeSubject]);

  const fetchActivities = useCallback(async (silent = false) => {
    if (!currentUser) return;
    if (!silent && upcomingActivities.length === 0) setLoadingActivities(true);
    try {
      const today = new Date().toLocaleDateString('sv-SE');
      let query = supabase.from('activities')
        .select('id, title, type, series_id, section, date, start_date, end_date, description, files, user_id, subject')
        .eq('user_id', currentUser.id)
        .eq('subject', activeSubject)
        .or(`date.gte.${today},and(start_date.lte.${today},end_date.gte.${today})`)
        .order('date', { ascending: true })
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

      const { data } = await query.limit(50);

      const formattedActivities = (data || []).map(a => ({
        id: a.id.toString(),
        title: a.title,
        type: a.type,
        seriesId: a.series_id.toString(),
        section: a.section,
        date: a.date,
        startDate: a.start_date,
        endDate: a.end_date,
        description: a.description,
        files: a.files || [],
        userId: a.user_id,
        subject: a.subject
      }));

      setUpcomingActivities(formattedActivities);

    } catch (e) {
      console.error("Error fetching activities (online):", e);
    } finally {
      if (!silent) setLoadingActivities(false);
    }
  }, [currentUser, selectedSeriesId, selectedSection, activeSubject, upcomingActivities]);

  const [heatmapPoints, setHeatmapPoints] = useState<{ date: string; count: number; types: string[] }[]>([]);

  const fetchHeatmapData = useCallback(async (silent = false) => {
    if (!currentUser) return;
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const startDate = new Date(year, month, 1).toLocaleDateString('sv-SE');
      const endDate = new Date(year, month + 1, 0).toLocaleDateString('sv-SE');

      const pAttendance = supabase
        .from('attendance')
        .select('date')
        .eq('user_id', currentUser.id)
        .gte('date', startDate)
        .lte('date', endDate);

      const pPlans = supabase
        .from('plans')
        .select('start_date')
        .eq('user_id', currentUser.id)
        .gte('start_date', startDate)
        .lte('start_date', endDate);

      const pActivities = supabase
        .from('activities')
        .select('date')
        .eq('user_id', currentUser.id)
        .gte('date', startDate)
        .lte('date', endDate);

      const pOccurrences = supabase
        .from('occurrences')
        .select('date')
        .eq('user_id', currentUser.id)
        .gte('date', startDate)
        .lte('date', endDate);

      const [resAtt, resPlans, resAct, resOcc] = await Promise.all([pAttendance, pPlans, pActivities, pOccurrences]);

      const pointsMap = new Map<string, number>();

      (resAtt.data || []).forEach((row: any) => {
        const d = row.date;
        pointsMap.set(d, (pointsMap.get(d) || 0) + 1);
      });

      (resPlans.data || []).forEach((row: any) => {
        const d = row.start_date;
        pointsMap.set(d, (pointsMap.get(d) || 0) + 5);
      });

      (resAct.data || []).forEach((row: any) => {
        const d = row.date;
        pointsMap.set(d, (pointsMap.get(d) || 0) + 5);
      });

      (resOcc.data || []).forEach((row: any) => {
        const d = row.date;
        pointsMap.set(d, (pointsMap.get(d) || 0) + 3);
      });

      const pointsArray = Array.from(pointsMap.entries()).map(([date, count]) => ({
        date,
        count,
        types: []
      }));

      if (mountedRef.current) setHeatmapPoints(pointsArray);

    } catch (e) {
      console.error("Error fetching heatmap data", e);
    }
  }, [currentUser]);

  const refreshAll = useCallback(async (silent = true) => {
    let studentIds: string[] = [];
    try {
      if (selectedSeriesId) {
        let query = supabase.from('students').select('id').eq('series_id', selectedSeriesId).eq('user_id', currentUser?.id);
        if (selectedSection) query = query.eq('section', selectedSection);
        const { data } = await query;
        studentIds = (data || []).map(s => s.id);
      } else {
        const { data: subjectClasses } = await supabase
          .from('classes')
          .select('id')
          .eq('user_id', currentUser?.id)
          .eq('subject', activeSubject);
        const classIds = (subjectClasses || []).map(c => c.id);
        if (classIds.length > 0) {
          const { data } = await supabase.from('students').select('id').in('series_id', classIds);
          studentIds = (data || []).map(s => s.id);
        }
      }
    } catch (e) {
      console.error("Failed fetching context student IDs", e);
    }

    await Promise.all([
      fetchCounts(silent),
      fetchStats(silent, studentIds),
      fetchOccurrences(silent, studentIds),
      fetchPlans(silent),
      fetchActivities(silent),
      fetchHeatmapData(silent)
    ]);
  }, [fetchCounts, fetchStats, fetchOccurrences, fetchPlans, fetchActivities, fetchHeatmapData, selectedSeriesId, selectedSection, activeSubject, currentUser]);

  const refreshRef = useRef(refreshAll);
  const debounceTimeout = useRef<any>(null);

  useEffect(() => {
    refreshRef.current = refreshAll;
  });

  const debouncedRefresh = useCallback(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      refreshRef.current(true);
    }, 2000);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      refreshRef.current(true);
    }, 300000);

    const channel = supabase.channel(`dashboard_sync_${currentUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'occurrences' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grades' }, debouncedRefresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [currentUser?.id, debouncedRefresh]);

  const isContextSelected = !!selectedSeriesId;
  const displayCount = isContextSelected ? classCount : globalCount;
  const contextName = (classes.find(c => c.id === selectedSeriesId)?.name || `Série ${selectedSeriesId}`) + (selectedSection ? ` - Turma ${selectedSection}` : '');

  return (
    <div
      className="w-full fluid-p-m fluid-gap-m flex flex-col pb-6 lg:pb-12 landscape:fluid-p-s landscape:fluid-gap-s landscape:pb-10 theme-transition relative"
    >
      {/* HEADER SECTION */}
      <div className="relative z-10" data-tour="dashboard-kpi">
        <DashboardHeader
          currentUser={currentUser}
          theme={theme}
          loading={loadingCounts}
          isContextSelected={isContextSelected}
          contextName={contextName}
        />
      </div>

      <div className="relative z-10">
        <DashboardBanner theme={theme} currentUser={currentUser} />
      </div>

      <DashboardPlan
        loading={loadingPlans}
        plans={todaysPlans}
      />

      <DashboardHelpBanner isDarkMode={theme.isDarkMode} />

      {/* QUICK ACTIONS GRID */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] md:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 lg:gap-6">
        {[
          { icon: 'design_services', label: 'Planejar', path: '/planning', color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { icon: 'playlist_add_check', label: 'Chamada', path: '/attendance', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { icon: 'hotel_class', label: 'Notas', path: '/grades', color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { icon: 'person_add', label: 'Alunos', path: '/students', color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((action, i) => (
          <Link to={action.path} key={i} className="group relative">
            <AnimatedCard
              className="h-24 lg:h-32 flex flex-col items-center justify-center gap-2 lg:gap-3 hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden"
              hoverEffect={true}
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-transparent to-primary/5`} />
              <div className={`p-3 rounded-xl ${action.bg} group-hover:scale-110 transition-transform duration-300`}>
                <span className={`material-symbols-outlined text-xl md:text-2xl font-black ${action.color}`}>{action.icon}</span>
              </div>
              <span className="font-bold text-sm lg:text-base text-text-primary">{action.label}</span>
            </AnimatedCard>
          </Link>
        ))}
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-6 relative z-10">
        <AnimatedCard className="col-span-1 md:col-span-full xl:col-span-2 glass-card-premium p-8 relative overflow-hidden group transition-all duration-500 flex flex-col justify-between h-auto min-h-[300px]" hoverEffect={false}>
          <div className="absolute -top-20 -right-20 w-[400px] h-[400px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none theme-radial-primary"></div>
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none theme-radial-secondary"></div>
          <div className="relative flex flex-col md:flex-row items-start justify-between h-full gap-6 md:gap-0">
            <div className="flex flex-col justify-between h-full">
              <div className="w-16 h-16 rounded-2xl bg-surface-subtle border border-border-subtle flex items-center justify-center transition-all duration-500 group-hover:scale-110 theme-text-primary theme-glow-primary">
                <span className="material-symbols-outlined text-3xl">groups</span>
              </div>
              <div>
                {loadingCounts ? (
                  <div className="h-16 w-32 bg-surface-subtle rounded-2xl animate-pulse"></div>
                ) : (
                  <span className="block text-5xl md:text-5xl lg:text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-text-primary to-text-secondary tracking-tighter leading-none shadow-xl drop-shadow-sm">{displayCount}</span>
                )}
                <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest mt-2">{isContextSelected ? 'Alunos na Turma' : 'Total de Alunos'}</h2>
              </div>
            </div>
            <div className="flex-1 w-full md:w-auto flex flex-col items-end h-full justify-between">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mb-6 theme-text-primary theme-bg-surface-subtle theme-border-subtle">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_10px_currentColor] theme-bg-primary"></span>
                Fluxo de Atividade
              </span>
              <div className="w-full lg:w-max max-w-full glass-card-soft p-3 rounded-2xl bg-surface-subtle/50 border theme-border-opaco">
                <ActivityHeatmap data={heatmapPoints} loading={loadingOccurrences} />
              </div>
            </div>
          </div>
        </AnimatedCard>

        <Link to="/grades">
          <AnimatedCard className="h-full glass-card-soft p-6 hover:bg-white/10 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between min-h-[180px] hover:shadow-lg border-transparent hover:border-primary/50">
            <div className="flex justify-between items-start relative z-10">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform theme-icon-secondary-transparent">
                <span className="material-symbols-outlined text-2xl">grade</span>
              </div>
              <span className="material-symbols-outlined theme-text-primary opacity-40 group-hover:opacity-100 transition-all">arrow_outward</span>
            </div>
            <div className="relative z-10">
              <h3 className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-1">Média Geral</h3>
              {loadingStats ? (
                <div className="h-10 w-24 bg-surface-subtle rounded-lg animate-pulse"></div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl md:text-3xl lg:text-4xl font-display font-black tracking-tight theme-text-primary">{stats.gradeAverage.toFixed(1)}</span>
                  <span className="text-xs font-bold text-text-muted">/ 10</span>
                </div>
              )}
            </div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 opacity-10 group-hover:opacity-20 transition-colors pointer-events-none theme-radial-secondary"></div>
          </AnimatedCard>
        </Link>

        <Link to="/attendance">
          <AnimatedCard className="h-full glass-card-soft p-6 hover:bg-white/10 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between min-h-[180px] hover:shadow-lg">
            <div className="flex justify-between items-start relative z-10">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform theme-icon-primary-transparent">
                <span className="material-symbols-outlined text-2xl">event_available</span>
              </div>
              <span className="material-symbols-outlined theme-text-primary opacity-40 group-hover:opacity-100 transition-all">arrow_outward</span>
            </div>
            <div className="relative z-10">
              <h3 className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-1">Presença Hoje</h3>
              {loadingStats ? (
                <div className="h-10 w-24 bg-surface-subtle rounded-lg animate-pulse"></div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl md:text-3xl lg:text-4xl font-display font-black text-text-primary tracking-tight">{stats.presentToday}</span>
                  <span className="text-xs font-bold text-text-muted">/ {displayCount}</span>
                </div>
              )}
            </div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 opacity-10 group-hover:opacity-20 transition-colors pointer-events-none theme-radial-primary"></div>
          </AnimatedCard>
        </Link>

      <DashboardActivities
        loading={loadingActivities}
        upcomingActivities={upcomingActivities}
        recentPlans={classPlans}
      />

      <DashboardOccurrences
        loading={loadingOccurrences}
        occurrences={recentOccurrences}
        newCount={stats.newObservations}
      />
      </div>
    </div>
  );
};