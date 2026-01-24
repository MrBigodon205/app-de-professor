const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

// ⚠️ MODO ESPELHO (WEBVIEW)
// Coloque o link do seu site aqui (ex: 'https://seu-site.vercel.app')
// Se deixar como null, o app continuará carregando os arquivos locais do PC.
const WEB_APP_URL = 'https://www.profacerta.com.br';

function createWindow() {
    const win = new BrowserWindow({
        width: 1360,
        height: 900,
        backgroundColor: '#0f172a',
        show: false,
        frame: false,
        titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
            preload: path.join(__dirname, 'preload.cjs')
        },
        icon: path.join(__dirname, 'public/logo.png'),
        title: "Prof. Acerta+"
    });

    if (WEB_APP_URL) {
        // Carrega o site diretamente (Modo Espelho)
        win.loadURL(WEB_APP_URL);
    } else {
        // Carrega os arquivos locais gerados (Modo Offline/Tradicional)
        win.loadFile(path.join(__dirname, 'dist/index.html'));
    }

    // Handle external links to open in system browser
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:') || url.startsWith('http:') || url.startsWith('mailto:') || url.startsWith('tel:')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    win.once('ready-to-show', () => {
        win.show();
    });

    win.setMenuBarVisibility(false);
}

// IPC Handlers for window controls
ipcMain.on('window-minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize();
});

ipcMain.on('window-maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    }
});

ipcMain.on('window-close', () => {
    BrowserWindow.getFocusedWindow()?.close();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
