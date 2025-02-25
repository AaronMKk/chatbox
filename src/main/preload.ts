import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { ElectronIPC } from 'src/shared/electron-types'

const electronHandler: ElectronIPC = {
    invoke: ipcRenderer.invoke,
    onSystemThemeChange: (callback: () => void) => {
        ipcRenderer.on('system-theme-updated', callback)
        return () => ipcRenderer.off('system-theme-updated', callback)
    },
    onWindowShow: (callback: () => void) => {
        ipcRenderer.on('window-show', callback)
        return () => ipcRenderer.off('window-show', callback)
    },
    onActionMessage: (callback: (message: string) => void) => {
        ipcRenderer.on('action', (event, message) => {
            callback(message);
        });
        return () => ipcRenderer.off('action', callback);
    },
    onThumbnailMessage: (callback: (message: string) => void) => {
        ipcRenderer.on('thumbnail', (event, message) => {
            callback(message);
        });
        return () => ipcRenderer.off('thumbnail', callback);
    },
    windowControls: {
        minimize: () => ipcRenderer.invoke('window-minimize'),
        maximize: () => ipcRenderer.invoke('window-maximize'),
        close: () => ipcRenderer.invoke('window-close'),
        isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
    }
}

contextBridge.exposeInMainWorld('electronAPI', electronHandler)
