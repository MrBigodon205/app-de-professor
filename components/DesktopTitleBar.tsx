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

    const handleDoubleClick = () => {
        window.electronAPI?.maximize();
    };

    return (
        <div
            className="fixed top-0 left-0 right-0 h-10 bg-[#0f172a] border-b border-white/10 flex items-center justify-between px-4 z-[999] select-none shadow-md overflow-hidden"
            style={{ WebkitAppRegion: 'drag' } as any}
            onDoubleClick={handleDoubleClick}
        >
            <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Logo" className="size-5 object-contain" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80 font-mono">
                    Prof. Acerta+ <span className="text-primary-hover">Core 3.1</span>
                </span>
            </div>

            <div className="flex items-center h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
                <button
                    onClick={() => window.electronAPI?.minimize()}
                    className="h-full px-4 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                    title="Minimizar"
                >
                    <span className="material-symbols-outlined text-[18px]">minimize</span>
                </button>
                <button
                    onClick={() => window.electronAPI?.maximize()}
                    className="h-full px-4 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                    title="Maximizar/Restaurar"
                >
                    <span className="material-symbols-outlined text-[18px]">crop_square</span>
                </button>
                <button
                    onClick={() => window.electronAPI?.close()}
                    className="h-full px-4 hover:bg-red-500 text-white/80 hover:text-white transition-colors"
                    title="Fechar"
                >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
            </div>
        </div>
    );
};
