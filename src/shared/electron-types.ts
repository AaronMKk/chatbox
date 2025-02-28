export interface ElectronIPC {
    invoke: (channel: string, ...args: any[]) => Promise<any>
    onSystemThemeChange: (callback: () => void) => () => Electron.IpcRenderer
    onWindowShow: (callback: () => void) => () => Electron.IpcRenderer
    onActionMessage: (callback: (message: string) => void) => () => Electron.IpcRenderer;
    onThumbnailMessage: (callback: (message: string) => void) => () => Electron.IpcRenderer;
    onThumbnailsMessage: (callback: (message: { [key: string]: string }) => void) => () => Electron.IpcRenderer;
    onFinishSelectDisplayId: (callback: (message: string) => void) => () => Electron.IpcRenderer;
    onForceStop: (callback: (message: boolean) => void) => () => Electron.IpcRenderer;
}
