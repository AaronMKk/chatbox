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
    onThumbnailsMessage: (callback: (message: { [key: string]: string }) => void) => {
        ipcRenderer.on('thumbnails', (event, message) => {
            callback(message);
        });
        return () => ipcRenderer.off('thumbnails', callback);
    },
    onFinishSelectDisplayId: (callback: (message: string) => void) => {
        ipcRenderer.on('displayId', (event, message) => {
            callback(message);
        });
        return () => ipcRenderer.off('thumbnails', callback);
    },
    onForceStop: (callback: (message: boolean) => void) => {
        ipcRenderer.on('forceStop', (event, message) => {
            callback(message);
        });
        return () => ipcRenderer.off('forceStop', callback);
    },
}

contextBridge.exposeInMainWorld('electronAPI', electronHandler)
