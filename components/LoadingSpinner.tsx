import React from 'react';

export const LoadingSpinner: React.FC = () => (
    <div className="flex items-center gap-2 text-slate-400 animate-pulse">
        <div className="size-4 rounded-full border-2 border-slate-200 border-t-slate-400 animate-spin"></div>
        <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando...</span>
    </div>
);
