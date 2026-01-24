const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        backgroundColor: '#ffffff',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false
        },
        icon: path.join(__dirname, 'assets/images/icon.png'),
        title: "Prof. Acerta+",
    });

    // In Electron, the file protocol doesn't support SPA routing well.
    // We point to index.html and let the bootstrap script handle the rest.
    const indexPath = path.join(__dirname, 'dist/index.html');

    // Inject hash routing fix before loading
    win.webContents.on('dom-ready', () => {
        win.webContents.executeJavaScript(`
            if (window.location.pathname.length > 5 && !window.location.hash) {
                console.log("Fixing routing...");
                window.location.hash = '#/';
            }
        `);
    });

    win.loadFile(indexPath).catch(err => console.error("Erro ao carregar:", err));

    // Mostra ferramentas se houver erro
    win.webContents.on('did-fail-load', () => {
        win.webContents.openDevTools();
    });

    win.setMenuBarVisibility(false);
}

// Fix for white screen: ensure file:// protocol handles paths correctly
app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
