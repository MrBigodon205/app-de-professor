import React, { useEffect, useState } from 'react';
import { useSchool } from '../contexts/SchoolContext';
import { InviteManager } from '../auth/InviteManager';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Users, GraduationCap, Calendar, Clock, MapPin } from 'lucide-react';

interface DashboardMetrics {
    totalTeachers: number;
    activeTeachers: number;
    coordinators: number;
    pendingTeachers: number;
}

export const InstitutionalDashboard: React.FC = () => {
    const { currentSchool, loading, isCoordinator } = useSchool();
    const { currentUser } = useAuth();
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        totalTeachers: 0,
        activeTeachers: 0,
        coordinators: 0,
        pendingTeachers: 0,
    });
    const [metricsLoading, setMetricsLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            if (!currentSchool) return;
            setMetricsLoading(true);
            try {
                const { data: teachers, error } = await supabase
                    .from('institution_teachers')
                    .select('id, role, status')
                    .eq('institution_id', currentSchool.id);

                if (error) throw error;

                const total = teachers?.length || 0;
                const active = teachers?.filter(t => t.status === 'active').length || 0;
                const coords = teachers?.filter(t => t.role === 'admin' || t.role === 'coordinator').length || 0;
                const pending = teachers?.filter(t => t.status === 'pending').length || 0;

                setMetrics({
                    totalTeachers: total,
                    activeTeachers: active,
                    coordinators: coords,
                    pendingTeachers: pending,
                });
            } catch (err) {
                console.error('Error fetching dashboard metrics:', err);
            } finally {
                setMetricsLoading(false);
            }
        };

        fetchMetrics();
    }, [currentSchool]);

    if (loading) {
        return <div className="p-10 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;
    }

    if (!currentSchool) {
        return null;
    }

    // Check for Unassigned Teacher
    const hasSubjects = currentUser?.subjects && currentUser.subjects.length > 0;
    const isUnassignedTeacher = !isCoordinator && !hasSubjects;

    if (isUnassignedTeacher) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6 animate-in fade-in duration-700">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-white/5 max-w-lg w-full relative overflow-hidden group">
                    {/* Decorative Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 z-0"></div>
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-1000"></div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] mb-6 shadow-neon">
                            <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center">
                                {currentUser?.photoUrl ? (
                                    <img src={currentUser.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-purple-600">
                                        {currentUser?.name?.charAt(0)}
                                    </span>
                                )}
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Olá, {currentUser?.name?.split(' ')[0]}!
                        </h2>

                        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-full text-amber-700 dark:text-amber-400 text-sm font-medium mb-6 flex items-center gap-2">
                            <Clock size={16} />
                            <span>Aguardando Atribuição</span>
                        </div>

                        <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                            Você já faz parte da escola <strong>{currentSchool.name}</strong>, mas ainda não possui disciplinas atribuídas.
                            <br /><br />
                            Aguarde o coordenador configurar suas turmas para acessar o painel completo.
                        </p>

                        <button
                            onClick={() => window.location.href = '/dashboard'}
                            className="px-6 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                            Voltar ao Meu Painel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const MetricSkeleton = () => (
        <div className="animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-1"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{currentSchool.name}</h1>
                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                        <MapPin size={16} />
                        Painel da {currentSchool.name} • {isCoordinator ? 'Coordenação' : 'Professor'}
                    </p>
                </div>
                {isCoordinator && (
                    <div className="flex gap-3">
                        {/* Actions like "Edit School" could go here */}
                    </div>
                )}
            </header>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Professores</h3>
                        <Users className="text-indigo-600 dark:text-indigo-400" size={20} />
                    </div>
                    {metricsLoading ? <MetricSkeleton /> : (
                        <>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.totalTeachers}</p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                {metrics.activeTeachers} ativo{metrics.activeTeachers !== 1 ? 's' : ''}
                            </p>
                        </>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Coordenadores</h3>
                        <GraduationCap className="text-purple-600 dark:text-purple-400" size={20} />
                    </div>
                    {metricsLoading ? <MetricSkeleton /> : (
                        <>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.coordinators}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Com acesso total</p>
                        </>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Pendentes</h3>
                        <Clock className="text-amber-600 dark:text-amber-400" size={20} />
                    </div>
                    {metricsLoading ? <MetricSkeleton /> : (
                        <>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.pendingTeachers}</p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Aguardando aprovação</p>
                        </>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Membros</h3>
                        <Calendar className="text-blue-600 dark:text-blue-400" size={20} />
                    </div>
                    {metricsLoading ? <MetricSkeleton /> : (
                        <>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.totalTeachers}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Total na instituição</p>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 min-h-[400px]">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Visão Geral da Escola</h2>
                    <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                        <p>Gráficos de desempenho serão implementados aqui.</p>
                    </div>
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                    {/* Invite Manager - Only for Coordinators */}
                    {isCoordinator && (
                        <InviteManager institutionId={currentSchool.id} />
                    )}

                    {/* Quick Access */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-white/10">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 uppercase tracking-wider">Acesso Rápido</h3>
                        <div className="space-y-2">
                            <button className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-md transition-colors">
                                📅 Grade Horária
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-md transition-colors">
                                👥 Gerenciar Turmas
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-md transition-colors">
                                📋 Relatórios
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
