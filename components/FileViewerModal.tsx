import React, { useEffect, useState } from 'react';
import { useTheme } from '../hooks/useTheme';

interface FileViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: { name: string; url: string; type?: string } | null;
}

export default function FileViewerModal({ isOpen, onClose, file }: FileViewerModalProps) {
    const { theme } = useTheme();
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);

    // Reset zoom/rotation when file changes
    useEffect(() => {
        setScale(1);
        setRotation(0);
    }, [file]);

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !file) return null;

    const isImage = file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) || file.url.startsWith('data:image');
    const isPDF = file.name.match(/\.pdf$/i) || file.url.startsWith('data:application/pdf');

    const isOffice = file.name.match(/\.(doc|docx|ppt|pptx|xls|xlsx)$/i);

    // Office Viewer URL (Microsoft Office Online)
    // Only works if file.url is PUBLIC (which it is now via Supabase Storage)
    const officeViewerUrl = isOffice ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}` : '';

    const handleDownload = () => {
        const a = document.createElement('a');
        a.href = file.url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Header/Controls */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
                <div className="flex items-center gap-3 pointer-events-auto">
                    <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h2 className="text-white font-bold drop-shadow-md truncate max-w-md">{file.name}</h2>
                    {/* DEBUG INFO */}
                    <span className="text-[10px] text-white/50 hidden lg:block">{file.url.substring(0, 30)}...</span>
                </div>

                <div className="flex gap-2 pointer-events-auto">
                    {/* Close Button */}
                    <button onClick={onClose} className="lg:hidden p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all" title="Fechar">
                        <span className="material-symbols-outlined">close</span>
                    </button>

                    {isImage && (
                        <>
                            <button onClick={() => setRotation(r => r - 90)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all" title="Girar Esquerda">
                                <span className="material-symbols-outlined">rotate_left</span>
                            </button>
                            <button onClick={() => setRotation(r => r + 90)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all" title="Girar Direita">
                                <span className="material-symbols-outlined">rotate_right</span>
                            </button>
                            <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all" title="Diminuir Zoom">
                                <span className="material-symbols-outlined">remove</span>
                            </button>
                            <button onClick={() => setScale(s => Math.min(3, s + 0.25))} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all" title="Aumentar Zoom">
                                <span className="material-symbols-outlined">add</span>
                            </button>
                        </>
                    )}
                    <button onClick={handleDownload} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all" title="Baixar Arquivo">
                        <span className="material-symbols-outlined">download</span>
                    </button>
                    <button onClick={onClose} className="hidden lg:flex p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all" title="Fechar">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="w-full h-full flex items-center justify-center p-4 sm:p-8 overflow-hidden">
                {isImage && (
                    <img
                        src={file.url}
                        alt={file.name}
                        className="max-w-full max-h-full object-contain transition-transform duration-200 ease-out shadow-2xl"
                        style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}
                    />
                )}

                {isPDF && (
                    <iframe
                        src={file.url}
                        className="w-full h-full rounded-xl shadow-2xl bg-white"
                        title="PDF Viewer"
                    />
                )}

                {isOffice && (
                    <iframe
                        src={officeViewerUrl}
                        className="w-full h-full rounded-xl shadow-2xl bg-white"
                        title="Office Viewer"
                    />
                )}

                {!isImage && !isPDF && !isOffice && (
                    <div className="text-white text-center">
                        <span className="material-symbols-outlined text-4xl mb-2">error</span>
                        <p>Formato não suportado: {file.name.split('.').pop()}</p>
                        <p className="text-sm text-white/50">Apenas Imagens, PDF e Office são suportados.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
