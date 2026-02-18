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
                        className="absolute -inset-1 rounded-full blur-sm opacity-25 group-hover:opacity-50 transition-opacity duration-300 animate-pulse theme-gradient-to-r"
                    ></div>

                    <div className="relative size-16 md:size-20 landscape:size-12 rounded-full border-4 border-surface-card shadow-2xl overflow-hidden bg-surface-card group-hover:scale-105 transition-transform duration-500">
                        {currentUser?.photoUrl ? (
                            <img
                                src={currentUser.photoUrl}
                                alt={currentUser.name}
                                className="size-full object-cover"
                            />
                        ) : (
                            <div
                                className="size-full flex items-center justify-center text-white font-bold text-2xl theme-gradient-to-br"
                            >
                                {currentUser?.name?.substring(0, 2).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-text-secondary text-sm md:text-base font-medium">Olá,</span>
                        <span className={`text-base md:text-lg font-black text-text-primary flex items-center gap-2`}>
                            {currentUser?.name} <span className="animate-bounce-slow">👋</span>
                        </span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                        <h1 className="text-2xl md:text-4xl landscape:text-xl font-black tracking-tight text-text-primary">
                            Seu Painel <span
                                className="theme-text-gradient"
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
