import React from 'react';
import { useTheme } from '../hooks/useTheme';

export const SkeletonLayout = () => {
    const theme = useTheme();

    return (
        <div className="flex h-screen w-full bg-background-light dark:bg-background-dark overflow-hidden">
            {/* Sidebar Skeleton */}
            <aside className="hidden lg:flex flex-col w-[280px] h-full bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark p-6 gap-8">
                {/* Logo Skeleton */}
                <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>

                {/* User Profile Skeleton */}
                <div className="flex flex-col items-center gap-4 py-6 border-b border-dashed border-slate-200 dark:border-slate-800">
                    <div className="size-24 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                    <div className="flex flex-col items-center gap-2 w-full">
                        <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                        <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                    </div>
                </div>

                {/* Nav Items Skeleton */}
                <div className="flex flex-col gap-3 flex-1">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-12 w-full bg-slate-100 dark:bg-slate-900 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full relative overflow-hidden">
                {/* Header Skeleton */}
                <header className="h-20 w-full border-b border-border-light dark:border-border-dark bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-xl px-8 flex items-center justify-between">
                    <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                    <div className="flex gap-4">
                        <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                        <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                    </div>
                </header>

                {/* Content Body Skeleton */}
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <div className="w-full h-full rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-center">
                        <div className={`size-12 rounded-full border-4 border-${theme.primaryColor} border-t-transparent animate-spin opacity-50`}></div>
                    </div>
                </div>
            </main>
        </div>
    );
};
