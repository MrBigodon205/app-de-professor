import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import { useTheme } from '../hooks/useTheme';
import { Activity, Plan } from '../types';
import { supabase } from '../lib/supabase';

interface NotificationItem {
    id: string;
    title: string;
    description: string;
    type: 'activity' | 'plan' | 'reminder';
    link: string;
    color: string;
}

export const NotificationCenter: React.FC = () => {
    const { currentUser } = useAuth();
    const { selectedSeriesId, selectedSection, activeSeries } = useClass();
    const theme = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (currentUser) {
            fetchNotifications();
        }

        const handleRefresh = () => {
            console.log('Refreshing notifications due to delete event');
            fetchNotifications();
        };

        window.addEventListener('refresh-notifications', handleRefresh);
        return () => window.removeEventListener('refresh-notifications', handleRefresh);
    }, [currentUser, selectedSeriesId, selectedSection]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        if (!currentUser) return;
        try {
            const today = new Date().toISOString().split('T')[0];
            const items: NotificationItem[] = [];

            // 1. Check Attendance Reminder (Mon-Fri)
            const dayOfWeek = new Date().getDay();
            const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

            if (isWeekday && selectedSeriesId && selectedSection) {
                // Check if attendance marked today for this class
                const { data: allAtt, error: attError } = await supabase
                    .from('attendance')
                    .select('student_id')
                    .eq('user_id', currentUser.id)
                    .eq('date', today);

                if (attError) throw attError;

                // Fetch students of the current class
                const { data: currentClassStudents, error: studentsError } = await supabase
                    .from('students')
                    .select('id')
                    .eq('series_id', selectedSeriesId)
                    .eq('section', selectedSection)
                    .eq('user_id', currentUser.id);

                if (studentsError) throw studentsError;

                const studentIds = new Set((currentClassStudents || []).map(s => s.id.toString()));
                const markedForToday = (allAtt || []).some(a => a.student_id && studentIds.has(a.student_id.toString()));

                if (!markedForToday) {
                    items.push({
                        id: 'att-reminder',
                        title: 'Lembrete de Chamada',
                        description: `A presença ainda não foi registrada para a turma ${activeSeries?.name} ${selectedSection}.`,
                        type: 'reminder',
                        link: '/attendance',
                        color: 'rose'
                    });
                }
            }

            // 2. Fetch Activities for Today
            const { data: activities, error: activitiesError } = await supabase
                .from('activities')
                .select('*')
                .eq('user_id', currentUser.id);

            if (activitiesError) throw activitiesError;

            const filteredActivities = (activities || []).filter(a => {
                const matchesDate = a.start_date === today;
                const matchesClass = !selectedSeriesId || a.series_id.toString() === selectedSeriesId;
                return matchesDate && matchesClass;
            });

            filteredActivities.forEach(a => {
                items.push({
                    id: `act-${a.id}`,
                    title: 'Atividade Hoje',
                    description: `Você tem a atividade "${a.title}" programada para hoje.`,
                    type: 'activity',
                    link: '/activities',
                    color: (theme.primaryColor || 'blue-600').split('-')[0]
                });
            });

            // 3. Fetch Plans for Today
            const { data: plans, error: plansError } = await supabase
                .from('plans')
                .select('*')
                .eq('user_id', currentUser.id);

            if (plansError) throw plansError;

            const filteredPlans = (plans || []).filter(p => {
                const matchesDate = today >= p.start_date && today <= p.end_date;
                const matchesClass = !selectedSeriesId || p.series_id.toString() === selectedSeriesId;
                return matchesDate && matchesClass;
            });

            filteredPlans.forEach(p => {
                items.push({
                    id: `plan-${p.id}`,
                    title: 'Planejamento Ativo',
                    description: `O planejamento "${p.title}" está em vigor hoje.`,
                    type: 'plan',
                    link: '/planning',
                    color: (theme.secondaryColor || 'blue-700').split('-')[0]
                });
            });

            setNotifications(items);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2.5 rounded-xl transition-all duration-300 group ${isOpen ? `bg-${theme.primaryColor}/10 text-${theme.primaryColor}` : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary'}`}
            >
                <span className={`material-symbols-outlined ${isOpen ? 'icon-filled animate-none' : 'group-hover:animate-pulse'}`}>notifications</span>
                {notifications.length > 0 && (
                    <span className="absolute top-2 right-2 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white dark:border-surface-dark text-[8px] text-white items-center justify-center font-bold">
                            {notifications.length}
                        </span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-3 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-[100] animate-in slide-in-from-top-4 duration-300 origin-top-right">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className={`size-10 rounded-2xl bg-${theme.primaryColor}/10 text-${theme.primaryColor} flex items-center justify-center`}>
                                <span className="material-symbols-outlined text-xl">notifications_active</span>
                            </div>
                            <h3 className="font-black text-slate-900 dark:text-white">Central de Alertas</h3>
                        </div>
                        {notifications.length > 0 && (
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-${theme.primaryColor}/10 text-${theme.primaryColor}`}>
                                {notifications.length} Novos
                            </span>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center group">
                                <div className={`size-20 rounded-full bg-${theme.primaryColor}/5 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500`}>
                                    <span className={`material-symbols-outlined text-4xl text-${theme.primaryColor}/30 dark:text-slate-600`}>
                                        {new Date().getDay() === 0 || new Date().getDay() === 6 ? 'weekend' : 'eco'}
                                    </span>
                                </div>
                                <p className="text-slate-400 font-bold">
                                    {new Date().getDay() === 0 || new Date().getDay() === 6
                                        ? 'Aproveite seu descanso!'
                                        : 'Nenhum alerta para hoje!'}
                                </p>
                                <p className="text-slate-500 text-xs mt-1">
                                    {new Date().getDay() === 0 || new Date().getDay() === 6
                                        ? 'Recarregue as energias para a próxima semana.'
                                        : 'Tudo em dia com seus planejamentos e aulas.'}
                                </p>
                            </div>
                        ) : (
                            <div className="p-2 space-y-1">
                                {notifications.map((n) => (
                                    <Link
                                        key={n.id}
                                        to={n.link}
                                        onClick={() => setIsOpen(false)}
                                        className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                                    >
                                        <div className={`size-12 rounded-2xl bg-${n.color === 'rose' ? 'rose-500' : theme.primaryColor}/10 text-${n.color === 'rose' ? 'rose-500' : theme.primaryColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                            <span className="material-symbols-outlined">
                                                {n.type === 'activity' ? 'assignment' : n.type === 'plan' ? 'menu_book' : 'warning'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <p className="font-bold text-slate-900 dark:text-white leading-tight">{n.title}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{n.description}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-[10px] font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase tracking-widest transition-colors"
                        >
                            Fechar Painel de Notificações
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
