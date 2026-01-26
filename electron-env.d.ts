export { };

interface ElectronAPI {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    saveBackup: (data: string) => Promise<{ success: boolean; path?: string; error?: string }>;
    loadBackup: () => Promise<{ success: boolean; data?: string; error?: string }>;
    isElectron: boolean;
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}
