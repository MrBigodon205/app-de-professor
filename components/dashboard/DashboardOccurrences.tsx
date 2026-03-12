import React from 'react';
import { Link } from 'react-router-dom';
import { Occurrence } from '../../types';

interface DashboardOccurrencesProps {
  loading: boolean;
  occurrences: Occurrence[];
  newCount: number;
}

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

export const DashboardOccurrences: React.FC<DashboardOccurrencesProps> = ({
  loading,
  occurrences,
  newCount
}) => {
  return (
    <div className="col-span-1 xl:col-span-2 glass-card-soft p-8 flex flex-col h-full border border-white/10" data-tour="dashboard-occurrences">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4 md:gap-0">
        <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-500">history</span>
          Ocorrências
          {newCount > 0 && (
            <span className="bg-amber-500/20 text-amber-500 text-[9px] px-2 py-0.5 rounded-full border border-amber-500/30 font-black uppercase tracking-wide ml-2 whitespace-nowrap">
              +{newCount} Novas
            </span>
          )}
        </h3>
        <Link to="/observations" className="text-xs font-bold uppercase tracking-wider hover:underline flex items-center gap-1 self-end md:self-auto theme-text-primary">
          Ver Todas
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>
      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-800/10 rounded-2xl animate-pulse"></div>)
        ) : occurrences.length === 0 ? (
          <div className="p-8 text-center bg-black/5 dark:bg-black/20 rounded-2xl border border-dashed border-white/10">
            <span className="material-symbols-outlined text-3xl theme-text-primary opacity-20 mb-2">check_circle</span>
            <p className="text-slate-500 font-medium text-sm">Nenhuma ocorrência registrada.</p>
          </div>
        ) : (
          occurrences.map(occ => (
            <div key={occ.id} className="flex items-center gap-4 p-4 bg-black/5 dark:bg-black/20 hover:bg-white/5 rounded-2xl transition-all border border-transparent border-white/5 hover:border-white/10 hover:shadow-lg group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 ${occ.type === 'Elogio' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-500/20' : 'bg-gradient-to-br from-rose-500 to-rose-700 shadow-rose-500/20'}`}>
                <span className="material-symbols-outlined text-lg">{getOccurrenceIcon(occ.type)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-1 md:mb-0.5 gap-1">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate">
                    {occ.student_name || 'Estudante'} • {occ.type}
                  </p>
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-black/10 dark:bg-black/30 px-2 py-0.5 rounded border border-white/5 w-fit whitespace-nowrap">{new Date(occ.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1 group-hover:text-slate-500 transition-colors font-medium">"{occ.description}"</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
