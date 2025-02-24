export interface ElectronIPC {
    invoke: (channel: string, ...args: any[]) => Promise<any>
    onSystemThemeChange: (callback: () => void) => () => Electron.IpcRenderer
    onWindowShow: (callback: () => void) => () => Electron.IpcRenderer
    onActionMessage: (callback: (message: string) => void) => () => Electron.IpcRenderer;
}
