import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Plan } from '../../types';

interface DashboardActivitiesProps {
  loading: boolean;
  upcomingActivities: Activity[];
  recentPlans: Plan[];
}

export const DashboardActivities: React.FC<DashboardActivitiesProps> = ({
  loading,
  upcomingActivities,
  recentPlans
}) => {
  return (
    <>
      {/* Próximas Atividades */}
      <div className="glass-card-soft p-8 border border-white/10" data-tour="dashboard-activities">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined theme-text-primary">event_note</span>
            Atividades
          </h3>
          <Link to="/activities" className="text-xs font-bold uppercase tracking-wider hover:underline flex items-center gap-1 theme-text-primary">
            Acessar
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
        <div className="space-y-4">
          {loading ? (
            [1, 2].map(i => <div key={i} className="h-16 bg-slate-800/10 rounded-2xl animate-pulse"></div>)
          ) : upcomingActivities.length === 0 ? (
            <div className="p-6 text-center bg-black/5 dark:bg-black/20 rounded-2xl border border-dashed border-white/10">
              <p className="text-slate-500 text-sm font-medium">Tudo em dia por aqui!</p>
            </div>
          ) : (
            upcomingActivities.map(activity => (
              <div key={activity.id} className="p-4 bg-black/5 dark:bg-black/20 rounded-2xl border border-transparent hover:border-white/10 hover:bg-white/5 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center theme-text-primary text-sm font-black">
                    {activity.type === 'activity' ? 'AT' : 'AV'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{activity.title}</p>
                    <p className="text-[10px] theme-text-primary font-bold">{activity.seriesId}{activity.section ? ` • ${activity.section}` : ''}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Planos Recentes */}
      <div className="glass-card-soft p-8 border border-white/10" data-tour="dashboard-recent-plans">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-500">assignment</span>
            Planos Recentes
          </h3>
          <Link to="/plans" className="text-xs font-bold uppercase tracking-wider hover:underline flex items-center gap-1 theme-text-primary">
            Biblioteca
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            [1, 2].map(i => <div key={i} className="h-20 bg-slate-800/10 rounded-2xl animate-pulse"></div>)
          ) : recentPlans.length === 0 ? (
            <div className="p-6 text-center bg-black/5 dark:bg-black/20 rounded-2xl border border-dashed border-white/10">
              <p className="text-slate-500 text-sm font-medium">Crie seu primeiro plano de aula.</p>
            </div>
          ) : (
            recentPlans.map(plan => (
              <Link key={plan.id} to={`/plans?id=${plan.id}`} className="p-4 bg-black/5 dark:bg-black/20 rounded-2xl border border-transparent hover:border-white/10 hover:bg-white/5 transition-all group">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1 group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate">{plan.title}</p>
                <p className="text-[10px] text-slate-500 font-mono font-bold">{new Date(plan.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  );
};
