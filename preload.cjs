const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    saveBackup: (data) => ipcRenderer.invoke('save-backup', data),
    loadBackup: () => ipcRenderer.invoke('load-backup'),
    isElectron: true
});
