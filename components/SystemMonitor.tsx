import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

export const SystemMonitor: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [fps, setFps] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const location = useLocation();
    const { isDarkMode } = useTheme();

    // 1. FPS Counter
    useEffect(() => {
        let frameCount = 0;
        let lastTime = performance.now();
        let animationFrameId: number;

        const loop = (time: number) => {
            frameCount++;
            const delta = time - lastTime;
            if (delta >= 1000) {
                setFps(Math.round((frameCount * 1000) / delta));
                frameCount = 0;
                lastTime = time;
            }
            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    // 2. Navigation Logger
    useEffect(() => {
        addLog(`Navigate: ${location.pathname}`);
    }, [location.pathname]);

    // 3. Error Trap (Global)
    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            addLog(`ERROR: ${event.message}`);
        };
        window.addEventListener('error', handleError);
        return () => window.removeEventListener('error', handleError);
    }, []);

    const addLog = (msg: string) => {
        const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });
        setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-[9999] bg-black/80 text-green-400 font-mono text-xs px-2 py-1 rounded shadow-lg border border-green-500/30 hover:bg-black transition-all opacity-50 hover:opacity-100 flex items-center gap-2"
                title="Abrir Monitor de Sistema"
            >
                <div className={`w-2 h-2 rounded-full ${fps > 50 ? 'bg-green-500' : fps > 30 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                {fps} FPS
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-[9999] w-80 bg-slate-950/95 text-green-400 font-mono text-xs rounded-lg shadow-2xl border border-green-500/30 backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-green-900/10 border-b border-green-500/20">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">terminal</span>
                    <span className="font-bold">SYSTEM STATUS</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="hover:text-white">✕</button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-px bg-green-500/20">
                <div className="bg-slate-950/80 p-2 flex flex-col items-center">
                    <span className="text-[10px] text-green-600 uppercase">Performance</span>
                    <span className={`text-xl font-bold ${fps < 30 ? 'text-red-500' : 'text-green-400'}`}>{fps} <span className="text-xs font-normal">FPS</span></span>
                </div>
                <div className="bg-slate-950/80 p-2 flex flex-col items-center">
                    <span className="text-[10px] text-green-600 uppercase">Theme</span>
                    <span className="text-xl font-bold">{isDarkMode ? 'DARK' : 'LIGHT'}</span>
                </div>
            </div>

            {/* Logs Window */}
            <div className="h-48 overflow-y-auto p-2 space-y-1 custom-scrollbar scroll-smooth">
                {logs.length === 0 && <span className="text-slate-600 italic">System ready...</span>}
                {logs.map((log, i) => (
                    <div key={i} className="whitespace-nowrap overflow-hidden text-ellipsis hover:text-white transition-colors border-l-2 border-transparent hover:border-green-500 pl-1">
                        {log}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="px-2 py-1 bg-green-900/10 border-t border-green-500/10 text-[10px] text-center text-green-600/60">
                Prof. Acerta+ Diagnostic Tool
            </div>
        </div>
    );
};
