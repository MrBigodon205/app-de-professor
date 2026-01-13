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

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data, loading }) => {
    const theme = useTheme();

    // Generate last 112 days (16 weeks * 7 days) to fit a nice grid
    const days = 112;
    const today = new Date();
    const heatmapData = Array.from({ length: days }).map((_, i) => {
        const date = new Date();
        date.setDate(today.getDate() - (days - 1 - i));
        const dateStr = date.toISOString().split('T')[0];
        const dayData = data.find(d => d.date === dateStr);
        return {
            date: dateStr,
            count: dayData?.count || 0,
            types: dayData?.types || []
        };
    });

    const getColor = (count: number) => {
        if (count === 0) return 'bg-slate-100 dark:bg-slate-800/50';
        if (count === 1) return `bg-${theme.primaryColor}/20`;
        if (count === 2) return `bg-${theme.primaryColor}/40`;
        if (count <= 4) return `bg-${theme.primaryColor}/70`;
        return `bg-${theme.primaryColor}`;
    };

    const getMonthLabel = (dateStr: string, index: number) => {
        const date = new Date(dateStr);
        if (date.getDate() <= 7 && index % 7 === 0) {
            return date.toLocaleDateString('pt-BR', { month: 'short' });
        }
        return null;
    };

    if (loading) {
        return (
            <div className="grid grid-flow-col grid-rows-7 gap-1.5 animate-pulse">
                {Array.from({ length: days }).map((_, i) => (
                    <div key={i} className="size-3 rounded-sm bg-slate-100 dark:bg-slate-800"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 overflow-x-auto pb-2 no-scrollbar">
            <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-max">
                {heatmapData.map((day, i) => (
                    <div
                        key={day.date}
                        className={`size-3 rounded-sm transition-all duration-500 hover:scale-150 hover:z-10 cursor-pointer ${getColor(day.count)}`}
                        title={`${day.date}: ${day.count} ocorrência(s)`}
                    >
                    </div>
                ))}
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                <span>Há 4 meses</span>
                <span>Hoje</span>
            </div>
        </div>
    );
};
