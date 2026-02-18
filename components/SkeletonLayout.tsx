import React from 'react';
import { useTheme } from '../hooks/useTheme';

interface SkeletonLayoutProps {
    type?: 'default' | 'dashboard' | 'table' | 'profile';
}

export const SkeletonLayout: React.FC<SkeletonLayoutProps> = ({ type = 'default' }) => {
    const theme = useTheme();

    // Default Grid Layout (Dashboard)
    if (type === 'default' || type === 'dashboard') {
        return (
            <div className="w-full h-full flex flex-col gap-6 p-4 md:p-8">
                {/* Header / Title Area Skeleton */}
                <div className="flex items-center justify-between w-full mb-4">
                    <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                    <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                </div>

                {/* Content Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="flex flex-col gap-4 p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                                <div className="flex flex-col gap-2 flex-1">
                                    <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                                    <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                                </div>
                            </div>
                            <div className="h-20 w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse mt-2"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Table Layout
    if (type === 'table') {
        return (
            <div className="w-full h-full flex flex-col gap-6 p-4 md:p-8">
                <div className="flex items-center justify-between w-full mb-4">
                    <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                    <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                </div>
                <div className="w-full bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-6">
                    <div className="flex flex-col gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="flex items-center gap-4 py-2 border-b border-dashed border-slate-100 dark:border-slate-800 last:border-0">
                                <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                                <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                                <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse ml-auto"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return null; // Fallback
};
