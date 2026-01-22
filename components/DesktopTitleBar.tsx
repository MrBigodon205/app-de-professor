import React from 'react';

declare global {
    interface Window {
        electronAPI?: {
            minimize: () => void;
            maximize: () => void;
            close: () => void;
            isElectron: boolean;
        };
    }
}

export const DesktopTitleBar: React.FC = () => {
    const isElectron = !!window.electronAPI?.isElectron;

    if (!isElectron) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 h-10 bg-slate-900/40 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 z-[9999] select-none"
            style={{ WebkitAppRegion: 'drag' } as any}
        >
            <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Logo" className="size-5 object-contain" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 font-mono">Prof. Acerta+ Core 3.1</span>
            </div>

            <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as any}>
                <button
                    onClick={() => window.electronAPI?.minimize()}
                    className="p-2 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">minimize</span>
                </button>
                <button
                    onClick={() => window.electronAPI?.maximize()}
                    className="p-2 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">square</span>
                </button>
                <button
                    onClick={() => window.electronAPI?.close()}
                    className="p-2 hover:bg-red-500/80 text-white/60 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>
            </div>
        </div>
    );
};
