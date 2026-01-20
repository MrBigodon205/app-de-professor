
import React, { useRef } from 'react';
import { useTheme } from '../hooks/useTheme';

interface FileImporterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFileSelect: (files: FileList | null) => void;
    accept?: string;
    multiple?: boolean;
}

export const FileImporterModal: React.FC<FileImporterModalProps> = ({
    isOpen,
    onClose,
    onFileSelect,
    accept = "*",
    multiple = false
}) => {
    const theme = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // If generic file (File Manager, Drive, Dropbox, etc.)
    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    // For specific types like Images, we could potentially change the 'accept' constraint dynamically,
    // but for now, we'll map all "cloud" buttons to the same system picker as discussed.

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-sm bg-[#1e1e1e] text-white rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 zoom-in-95 duration-300 border border-white/10">

                {/* Header */}
                <div className="flex items-center gap-4 p-4 border-b border-white/5">
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-white">arrow_back</span>
                    </button>
                    <h3 className="text-lg font-medium text-white">Importar arquivos</h3>
                </div>

                <div className="p-4">
                    <p className="text-xs text-gray-400 mb-6 px-1">Compatível com arquivos PDF, PPT, Word, Excel, Imagens</p>

                    <div className="flex flex-col gap-2">
                        {/* 1. Gerenciador de Arquivos (Main Action) */}
                        <button
                            onClick={triggerFileSelect}
                            className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors text-left group"
                        >
                            <div className="size-10 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                                <span className="material-symbols-outlined">smartphone</span>
                            </div>
                            <span className="text-sm font-medium text-gray-200 group-hover:text-white">Gerenciador de arquivos</span>
                        </button>

                        {/* 2. Imagens */}
                        <button
                            onClick={triggerFileSelect} // Simply opens native picker, let user filter visually or we could force accept="image/*"
                            className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors text-left group"
                        >
                            <div className="size-10 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/20 group-hover:scale-105 transition-transform">
                                <span className="material-symbols-outlined">image</span>
                            </div>
                            <span className="text-sm font-medium text-gray-200 group-hover:text-white">Imagens</span>
                        </button>

                        {/* 3. Meus Arquivos (Generic) */}
                        <button
                            onClick={triggerFileSelect}
                            className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors text-left group"
                        >
                            <div className="size-10 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:scale-105 transition-transform">
                                <span className="material-symbols-outlined">folder</span>
                            </div>
                            <span className="text-sm font-medium text-gray-200 group-hover:text-white">Meus arquivos</span>
                        </button>

                        {/* 4. OneDrive */}
                        <button
                            onClick={triggerFileSelect}
                            className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors text-left group"
                        >
                            <div className="size-10 rounded-lg bg-sky-600/20 text-sky-500 flex items-center justify-center shrink-0 border border-sky-600/20 group-hover:scale-105 transition-transform">
                                <span className="material-symbols-outlined">cloud</span>
                            </div>
                            <span className="text-sm font-medium text-gray-200 group-hover:text-white">OneDrive</span>
                        </button>

                        {/* 5. Google Drive */}
                        <button
                            onClick={triggerFileSelect}
                            className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors text-left group"
                        >
                            <div className="size-10 rounded-lg bg-green-600/20 text-green-500 flex items-center justify-center shrink-0 border border-green-600/20 group-hover:scale-105 transition-transform">
                                <span className="material-symbols-outlined">add_to_drive</span>
                            </div>
                            <span className="text-sm font-medium text-gray-200 group-hover:text-white">Google Drive</span>
                        </button>

                        {/* 6. Dropbox */}
                        <button
                            onClick={triggerFileSelect}
                            className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors text-left group"
                        >
                            <div className="size-10 rounded-lg bg-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                                <span className="material-symbols-outlined">backup</span>
                            </div>
                            <span className="text-sm font-medium text-gray-200 group-hover:text-white">Dropbox</span>
                        </button>

                    </div>
                </div>

                {/* Hidden Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept={accept}
                    multiple={multiple}
                    onChange={(e) => {
                        onFileSelect(e.target.files);
                        onClose();
                    }}
                />
            </div>
        </div>
    );
};
