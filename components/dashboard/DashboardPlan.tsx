import React, { useState } from 'react';
import { Plan } from '../../types';
import { stripHtml } from '../../utils/text';

interface DashboardPlanProps {
  loading: boolean;
  plans: Plan[];
}

export const DashboardPlan: React.FC<DashboardPlanProps> = ({
  loading,
  plans
}) => {
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0);

  if (loading) {
    return (
      <div className="lg:col-span-2 glass-card-soft p-8 h-80 animate-pulse">
        <div className="h-4 w-1/4 bg-slate-800/10 rounded mb-4"></div>
        <div className="h-40 bg-slate-800/10 rounded"></div>
      </div>
    );
  }

  const currentPlan = plans[currentPlanIndex];

  return (
    <div className="lg:col-span-2 glass-card-soft p-8 flex flex-col h-full border border-white/10" data-tour="dashboard-plan">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 md:gap-0">
        <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined theme-text-primary">auto_awesome</span>
          Plano do Dia
          {plans.length > 1 && (
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/5 font-mono text-slate-400">
              {currentPlanIndex + 1}/{plans.length}
            </span>
          )}
        </h3>
        
        {plans.length > 1 && (
          <div className="flex gap-2 self-end md:self-auto">
            <button 
              onClick={() => setCurrentPlanIndex(prev => Math.max(0, prev - 1))}
              disabled={currentPlanIndex === 0}
              className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 disabled:opacity-30 transition-all"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button 
              onClick={() => setCurrentPlanIndex(prev => Math.min(plans.length - 1, prev + 1))}
              disabled={currentPlanIndex === plans.length - 1}
              className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 disabled:opacity-30 transition-all"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {!currentPlan ? (
          <div className="w-full flex flex-col items-center justify-center py-12 text-center bg-black/5 dark:bg-black/20 rounded-3xl border border-dashed border-white/10">
            <span className="material-symbols-outlined text-4xl theme-text-primary opacity-20 mb-4 animate-bounce">description</span>
            <p className="text-slate-500 font-medium max-w-[250px] leading-relaxed">Nenhum plano para agora. Comece criando um novo planejamento acadêmico!</p>
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest theme-text-primary px-3 py-1 bg-black/20 rounded-full border border-white/5 mb-3 inline-block">Foco Atual</span>
              <h4 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-4 line-clamp-2 leading-tight">
                {currentPlan.title}
              </h4>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-6 font-medium line-clamp-3 text-sm lg:text-base">
                {stripHtml(currentPlan.description)}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 bg-black/10 dark:bg-black/20 px-3 py-1.5 rounded-xl border border-white/5">
                  <span className="material-symbols-outlined text-sm">groups</span>
                  {currentPlan.seriesId}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 bg-black/10 dark:bg-black/20 px-3 py-1.5 rounded-xl border border-white/5">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  Até {new Date(currentPlan.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                </span>
                {currentPlan.files && currentPlan.files.length > 0 && (
                  <span className="flex items-center gap-1.5 text-xs font-bold theme-text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20">
                    <span className="material-symbols-outlined text-sm">attach_file</span>
                    {currentPlan.files.length} Anexos
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
