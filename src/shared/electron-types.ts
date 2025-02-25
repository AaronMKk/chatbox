export interface ElectronIPC {
    invoke: typeof ipcRenderer.invoke;
    onSystemThemeChange: (callback: () => void) => () => void;
    onWindowShow: (callback: () => void) => () => void;
    onActionMessage: (callback: (message: string) => void) => () => void;
    onThumbnailMessage: (callback: (message: string) => void) => () => void;
    windowControls: {
        minimize: () => Promise<boolean>;
        maximize: () => Promise<boolean>;
        close: () => Promise<boolean>;
        isMaximized: () => Promise<boolean>;
    };
}
