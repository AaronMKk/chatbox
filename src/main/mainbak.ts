export const createWindow = async () => {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      await installExtensions();
    }
    let x, y;
    const currentWindow = BrowserWindow.getFocusedWindow();
    if (currentWindow) {
      const [currentWindowX, currentWindowY] = currentWindow.getPosition();
      x = currentWindowX + 24;
      y = currentWindowY + 24;
    }
    let newWindow = new BrowserWindow({
      show: false,
      width: 1200,
      height: 812,
      x,
      y,
      webPreferences: {
        nodeIntegration: true
      }
    });
    newWindow.loadURL(`file://${__dirname}/app.html`);
    newWindow.webContents.on('did-finish-load', () => {
      if (!newWindow) {
        throw new Error('"newWindow" is not defined');
      }
      if (process.env.START_MINIMIZED) {
        newWindow.minimize();
      } else {
        newWindow.show();
        newWindow.focus();
      }
    });
    newWindow.on('closed', () => {
      windows.delete(newWindow);
      newWindow = null;
    });
    newWindow.on('focus', () => {
      const menuBuilder = new MenuBuilder(newWindow);
      menuBuilder.buildMenu();
    });
    windows.add(newWindow);
    return newWindow;
  };