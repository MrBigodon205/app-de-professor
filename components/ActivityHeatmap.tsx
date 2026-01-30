import React from 'react';
import { useTheme } from '../hooks/useTheme';

interface ActivityPoint {
    date: string;
    count: number;
    types: string[];
}

interface ActivityHeatmapProps {
    data: ActivityPoint[];
    loading?: boolean;
}

const ActivityHeatmapComponent: React.FC<ActivityHeatmapProps> = ({ data, loading }) => {
    const theme = useTheme();
    const today = new Date();
    const currentMonth = today.toLocaleString('pt-BR', { month: 'long' });
    const capitalizedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);

    // GitHub Style Heatmap (Current Month Only): Rows = 7 (Days), Cols = Weeks
    const heatmapData = React.useMemo(() => {
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const result = [];

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateStr = date.toLocaleDateString('sv-SE');
            const dayData = data.find(d => d.date === dateStr);

            result.push({
                date: dateStr,
                count: dayData?.count || 0,
            });
        }
        return result;
    }, [data, currentMonth]);

    const getIntensityClass = (count: number): string => {
        if (count === 0) return 'bg-slate-200 dark:bg-white/10 opacity-50 dark:opacity-20';
        if (count <= 5) return 'bg-emerald-300 dark:bg-emerald-500/50';
        if (count <= 15) return 'bg-emerald-400 dark:bg-emerald-500/70';
        if (count <= 30) return 'bg-emerald-500 dark:bg-emerald-500/90';
        return 'bg-emerald-600 dark:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'; // Added glow for max level
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                    <span className="text-sm font-black text-text-muted uppercase tracking-widest">Carregando...</span>
                </div>
                <div className="grid grid-cols-7 gap-1 md:gap-2 w-full max-w-[200px] md:max-w-[320px] animate-pulse">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={`h-${i}`} className="h-4 w-full bg-transparent flex justify-center"><div className="size-2 rounded-full bg-surface-subtle"></div></div>
                    ))}
                    {Array.from({ length: 30 }).map((_, i) => (
                        <div key={i} className="aspect-square w-full rounded-md bg-surface-subtle"></div>
                    ))}
                </div>
            </div>
        );
    }

    // Group into weeks logic for GitHub Style (Column = Week)
    // We need to pad the start to align Day 1 to its weekday so rows align nicely (Sunday=Row 0)

    const startDayOfWeek = new Date(today.getFullYear(), today.getMonth(), 1).getDay(); // 0-6
    const paddedData = Array(startDayOfWeek).fill({ date: null, count: 0 }).concat(heatmapData);

    const weeks: any[][] = [];
    for (let i = 0; i < paddedData.length; i += 7) {
        // Pad end of last week if needed
        let week = paddedData.slice(i, i + 7);
        if (week.length < 7) {
            const extra = Array(7 - week.length).fill({ date: null, count: 0 });
            week = week.concat(extra);
        }
        weeks.push(week);
    }

    return (
        <div className="flex flex-col gap-3 pb-2">
            <div className="flex items-center justify-between px-1">
                <span className="text-sm font-black text-text-primary uppercase tracking-widest">{capitalizedMonth}</span>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Atividades</span>
            </div>

            {/* Standard Calendar Grid (7 Cols) */}
            <div className="grid grid-cols-7 gap-1.5 w-full max-w-[280px]">
                {/* Weekday Headers */}
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                    <div key={`${d}-${i}`} className="text-[10px] font-bold text-text-muted text-center py-1">{d}</div>
                ))}

                {paddedData.map((day, index) => (
                    <div key={index} className="flex items-center justify-center aspect-square">
                        {day.date ? (
                            <div
                                className={`w-full h-full rounded-[4px] transition-all hover:scale-110 relative group ${getIntensityClass(day.count)}`}
                                title={`${new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR')}: ${day.count} atividades`}
                            >
                            </div>
                        ) : (
                            <div className="w-full h-full"></div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-2 justify-end text-[9px] text-slate-400 font-medium px-1">
                <span>Menos</span>
                <div className="flex gap-[2px]">
                    <div className="size-2.5 rounded-[2px] bg-slate-200 dark:bg-white/10 opacity-50 dark:opacity-20"></div>
                    <div className="size-2.5 rounded-[2px] bg-emerald-300 dark:bg-emerald-500/50"></div>
                    <div className="size-2.5 rounded-[2px] bg-emerald-400 dark:bg-emerald-500/70"></div>
                    <div className="size-2.5 rounded-[2px] bg-emerald-500 dark:bg-emerald-500/90"></div>
                    <div className="size-2.5 rounded-[2px] bg-emerald-600 dark:bg-emerald-500"></div>
                </div>
                <span>Mais</span>
            </div>
        </div>
    );
};

export const ActivityHeatmap = React.memo(ActivityHeatmapComponent);
