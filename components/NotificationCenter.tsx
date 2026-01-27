import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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

// ... imports

interface NotificationCenterProps {
    isMobile?: boolean;
    isOpen?: boolean; // Controlled state for mobile
    onClose?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isMobile, isOpen: controlledIsOpen, onClose }) => {
    const { currentUser } = useAuth();
    const { selectedSeriesId, selectedSection, activeSeries } = useClass();
    const theme = useTheme();

    // Internal state for Desktop Popover
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const notificationsRef = useRef<HTMLDivElement>(null);

    // Internal Mobile Detection
    const [isMobileWidth, setIsMobileWidth] = useState(window.innerWidth < 1024); // lg breakpoint

    useEffect(() => {
        const handleResize = () => setIsMobileWidth(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Merge prop with internal detection
    const effectiveIsMobile = isMobile ?? isMobileWidth;

    // Check for landscape orientation

    const [isLandscape, setIsLandscape] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkOrientation = () => {
            setIsLandscape(window.matchMedia("(orientation: landscape) and (max-height: 500px)").matches);
        };

        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        return () => window.removeEventListener('resize', checkOrientation);
    }, []);

    // Derived state - specific handling for unmanaged mobile instances
    const show = (effectiveIsMobile && controlledIsOpen !== undefined) ? controlledIsOpen : internalIsOpen;
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    useEffect(() => {
        if (currentUser) {
            fetchNotifications();
        }

        const handleRefresh = () => {
            fetchNotifications();
        };

        window.addEventListener('refresh-notifications', handleRefresh);
        return () => window.removeEventListener('refresh-notifications', handleRefresh);
    }, [currentUser, selectedSeriesId, selectedSection]);

    // Close on click outside (Desktop only)
    useEffect(() => {
        if (isMobile) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setInternalIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobile]);

    const fetchNotifications = async () => {
        // ... (Keep existing fetch logic) ...
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
                const colorBase = theme.primaryColor && typeof theme.primaryColor === 'string' ? theme.primaryColor.split('-')[0] : 'blue';
                items.push({
                    id: `act-${a.id}`,
                    title: 'Atividade Hoje',
                    description: `Você tem a atividade "${a.title}" programada para hoje.`,
                    type: 'activity',
                    link: '/activities',
                    color: colorBase
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
                const colorBase = theme.secondaryColor && typeof theme.secondaryColor === 'string' ? theme.secondaryColor.split('-')[0] : 'indigo';
                items.push({
                    id: `plan-${p.id}`,
                    title: 'Planejamento Ativo',
                    description: `O planejamento "${p.title}" está em vigor hoje.`,
                    type: 'plan',
                    link: '/planning',
                    color: colorBase
                });
            });

            setNotifications(items);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleClose = () => {
        if (isMobile && onClose) {
            onClose();
        } else {
            setInternalIsOpen(false);
        }
    }



    // Render as Modal/Overlay for Mobile Portrait ONLY
    const isPortraitMobile = effectiveIsMobile && !isLandscape;

    return (
        <div className="relative" ref={notificationsRef}>
            <button
                onClick={() => (effectiveIsMobile && onClose) ? onClose() : setInternalIsOpen(!internalIsOpen)}
                className={`relative w-9 h-9 shrink-0 rounded-full transition-all duration-300 group flex items-center justify-center ${internalIsOpen || (effectiveIsMobile && controlledIsOpen) ? `bg-${theme.primaryColor}/10 text-${theme.primaryColor}` : 'bg-surface-card hover:bg-surface-subtle text-text-muted hover:text-text-primary border border-border-default dark:border-border-subtle shadow-sm'} ${effectiveIsMobile && controlledIsOpen ? 'ring-2 ring-primary/20' : ''}`}
            >
                <span className={`material-symbols-outlined text-xl ${internalIsOpen ? 'icon-filled animate-none' : 'group-hover:animate-pulse'}`}>notifications</span>
                {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white dark:border-surface-dark text-[8px] text-white items-center justify-center font-bold">
                            {notifications.length}
                        </span>
                    </span>
                )}
            </button>

            {/* Mobile Portrait Bottom Sheet (Portal to break out of stacking context) */}
            {mounted && isPortraitMobile && show && typeof document !== 'undefined' && document.body && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={handleClose}>
                    <div
                        className="w-full bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-3xl shadow-[0_-8px_30px_-5px_rgba(0,0,0,0.3)] overflow-hidden animate-in slide-in-from-bottom duration-500 border-t border-white/20 dark:border-slate-700 max-h-[85dvh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drag Handle Area */}
                        <div className="w-full flex justify-center pt-3 pb-1" onTouchStart={handleClose}>
                            <div className="w-16 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700/50 mb-2"></div>
                        </div>

                        {/* Header */}
                        <div className="px-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`size-10 rounded-2xl bg-${theme.primaryColor}/10 text-${theme.primaryColor} flex items-center justify-center shrink-0`}>
                                    <span className="material-symbols-outlined text-xl">notifications_active</span>
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight">Notificações</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Central de Alertas</p>
                                </div>
                            </div>
                            <button onClick={handleClose} className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 active:scale-90 transition-transform">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 touch-auto overscroll-contain pb-safe-area-bottom min-h-[50vh]">
                            {renderNotificationList(notifications, theme, handleClose)}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Desktop/Landscape Popover */}
            {!isPortraitMobile && show && (
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

                    <div className="max-h-[400px] landscape:max-h-[40dvh] overflow-y-auto custom-scrollbar touch-auto overscroll-y-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                        {renderNotificationList(notifications, theme, () => setInternalIsOpen(false))}
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
                        <button
                            onClick={() => setInternalIsOpen(false)}
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

// Helper to render the list (Shared)
const renderNotificationList = (notifications: NotificationItem[], theme: any, onClose: () => void) => {
    if (notifications.length === 0) {
        return (
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
            </div>
        );
    }

    return (
        <div className="p-2 space-y-1">
            {notifications.map((n) => (
                <Link
                    key={n.id}
                    to={n.link}
                    onClick={onClose}
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
    );
}
