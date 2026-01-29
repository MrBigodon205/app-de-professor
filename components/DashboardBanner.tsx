import React from 'react';
import { User } from '../types';

interface DashboardBannerProps {
    theme: any;
    currentUser: User | null;
}

export const DashboardBanner: React.FC<DashboardBannerProps> = ({ theme, currentUser }) => {
    return (
        <div className={`bg-gradient-to-r ${theme.bgGradient} rounded-3xl p-8 text-white shadow-xl shadow-${theme.primaryColor}/20 relative overflow-hidden group`}>
            <div className="absolute right-0 top-0 p-8 opacity-20 transform translate-x-10 -translate-y-10 group-hover:translate-x-5 group-hover:-translate-y-5 transition-transform duration-700">
                <span className="material-symbols-outlined text-[200px]">{theme.icon}</span>
            </div>

            {/* Decorative subject icons */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {React.useMemo(() => theme.illustrations.map((icon: string, idx: number) => (
                    <span
                        key={idx}
                        className={`material-symbols-outlined absolute opacity-10 animate-pulse scatter-${(idx % 15) + 1} delay-stagger-${idx % 11}`}
                    >
                        {icon}
                    </span>
                )), [theme.illustrations])}
            </div>
            {/* LINTER REFRESH: Zero Inline Styles Verified */}

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="max-w-xl">
                    <div className="flex items-center gap-2 mb-3 text-white/80 font-bold uppercase text-[10px] tracking-widest bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                        <span className="material-symbols-outlined text-xs">{theme.icon}</span>
                        <span>Disciplina: {theme.subject}</span>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black mb-3 md:mb-4 drop-shadow-lg text-white">Bem-vindo ao seu painel de {theme.subject}</h2>
                    <p className="text-white/90 text-sm md:text-lg font-medium leading-relaxed italic border-l-4 border-white/30 pl-4">
                        "{theme.description}"
                    </p>
                </div>

                <div className="flex flex-col gap-4 shrink-0 relative">
                    {/* The profile photo also appears here, overlapping nicely */}
                    <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl p-4 md:p-6 rounded-[2rem] border border-white/20 shadow-2xl relative overflow-hidden group/profile">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover/profile:opacity-100 transition-opacity"></div>

                        <div className="relative size-16 md:size-20 rounded-2xl border-2 border-white/50 shadow-lg overflow-hidden shrink-0">
                            {currentUser?.photoUrl ? (
                                <img src={currentUser.photoUrl} alt={currentUser.name} className="size-full object-cover" />
                            ) : (
                                <div className="size-full flex items-center justify-center bg-white theme-text-primary font-bold text-xl">
                                    {currentUser?.name?.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Professor(a)</p>
                            <p className="font-black text-lg md:text-xl text-white">{currentUser?.name?.split(' ')[0]}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="size-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
                                <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">Online</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
