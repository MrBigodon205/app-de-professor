import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { User } from '../types';

interface DashboardHeaderProps {
    currentUser: User | null;
    theme: any;
    loading: boolean;
    isContextSelected: boolean;
    contextName: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    currentUser,
    theme,
    loading,
    isContextSelected,
    contextName
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
                <div className="relative group">
                    {/* Pulsing glow background */}
                    <div
                        className="absolute -inset-1 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse"
                        style={{ background: `linear-gradient(to right, ${theme.primaryColorHex}, ${theme.secondaryColorHex})` }}
                    ></div>

                    <div className="relative size-16 md:size-20 landscape:size-12 rounded-full border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden bg-white dark:bg-slate-900 group-hover:scale-105 transition-transform duration-500">
                        {currentUser?.photoUrl ? (
                            <img
                                src={currentUser.photoUrl}
                                alt={currentUser.name}
                                className="size-full object-cover"
                            />
                        ) : (
                            <div
                                className="size-full flex items-center justify-center text-white font-bold text-2xl"
                                style={{ background: `linear-gradient(to bottom right, ${theme.primaryColorHex}, ${theme.secondaryColorHex})` }}
                            >
                                {currentUser?.name?.substring(0, 2).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400 dark:text-slate-500 text-sm md:text-base font-medium">Olá,</span>
                        <span className={`text-base md:text-lg font-black text-slate-800 dark:text-white flex items-center gap-2`}>
                            {currentUser?.name} <span className="animate-bounce-slow">👋</span>
                        </span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                        <h1 className="text-2xl md:text-4xl landscape:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                            Seu Painel <span
                                className="text-transparent bg-clip-text"
                                style={{ backgroundImage: `linear-gradient(to right, ${theme.primaryColorHex}, ${theme.secondaryColorHex})` }}
                            >
                                {isContextSelected ? contextName : 'Geral'}
                            </span>
                        </h1>
                        {loading && <LoadingSpinner />}
                    </div>
                </div>
            </div>
        </div>
    );
};
