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

    // Generate Current Month Data
    const heatmapData = React.useMemo(() => {
        const year = today.getFullYear();
        const month = today.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Create a map for O(1) lookup
        const dataMap = new Map();
        data.forEach(d => dataMap.set(d.date, d));

        const result = [];

        // Padding for Empty Days before the 1st
        for (let i = 0; i < startDayOfWeek; i++) {
            result.push({ date: null, count: 0, types: [] });
        }

        // Actual Days
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateStr = date.toLocaleDateString('sv-SE'); // YYYY-MM-DD
            const dayData = dataMap.get(dateStr);
            result.push({
                date: dateStr,
                count: dayData?.count || 0,
                types: dayData?.types || []
            });
        }

        return result;
    }, [data]);

    const getColor = (count: number, isPadding: boolean): React.CSSProperties => {
        if (isPadding) return { backgroundColor: 'transparent', borderColor: 'transparent', boxShadow: 'none' };

        if (count === 0) return {
            backgroundColor: 'rgba(226, 232, 240, 0.3)', // Slate 200 light
            borderColor: 'rgba(226, 232, 240, 0.5)',
            // In dark mode we override this:
            ...(document.documentElement.classList.contains('dark') ? {
                backgroundColor: 'var(--color-surface-subtle)',
                borderColor: 'var(--color-border-subtle)'
            } : {})
        };

        const baseColor = theme?.primaryColorHex || '#06b6d4';

        if (count === 1) return {
            backgroundColor: `${baseColor}4D`, // 30%
            borderColor: `${baseColor}4D`,
            boxShadow: `0 0 5px ${baseColor}33`
        };
        if (count === 2) return {
            backgroundColor: `${baseColor}80`, // 50%
            borderColor: `${baseColor}66`, // 40%
            boxShadow: `0 0 8px ${baseColor}4D`
        };
        if (count <= 4) return {
            backgroundColor: `${baseColor}CC`, // 80%
            borderColor: `${baseColor}80`, // 50%
            boxShadow: `0 0 12px ${baseColor}80`
        };
        return {
            backgroundColor: baseColor,
            borderColor: baseColor,
            boxShadow: `0 0 15px ${baseColor}CC`
        };
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

    return (
        <div className="flex flex-col gap-3 pb-2">
            <div className="flex items-center justify-between px-1">
                <span className="text-sm font-black text-text-primary uppercase tracking-widest">{capitalizedMonth}</span>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Atividades</span>
            </div>

            {/* Standard Calendar Grid (7 Cols) */}
            <div className="grid grid-cols-7 gap-1 md:gap-2 w-full max-w-[200px] md:max-w-[320px]">
                {/* Weekday Headers - Optional but helps structure */}
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                    <div key={d} className="text-[10px] font-bold text-text-muted text-center">{d}</div>
                ))}

                {heatmapData.map((day, i) => (
                    <div
                        key={day.date || `empty-${i}`}
                        className={`aspect-square w-full rounded-md transition-all duration-300 ${day.date ? 'hover:scale-110 hover:shadow-md cursor-pointer' : ''}`}
                        style={getColor(day.count, !day.date)}
                        title={day.date ? `${day.date}: ${day.count} ocorrência(s)` : ''}
                    />
                ))}
            </div>
        </div>
    );
};

export const ActivityHeatmap = React.memo(ActivityHeatmapComponent);
