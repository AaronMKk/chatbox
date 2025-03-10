/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import os from 'os'
import path from 'path'
import { app, BrowserWindow, shell, ipcMain, nativeTheme, session, dialog, desktopCapturer, screen } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import MenuBuilder from './menu'
import { resolveHtmlPath } from './util'
import Locale from './locales'
import { store, getConfig, getSettings } from './store-node'
import * as proxy from './proxy'
import * as fs from 'fs-extra'
import * as analystic from './analystic-node'
import sanitizeFilename from 'sanitize-filename'
import sharp from 'sharp'

if (process.platform === 'win32') {
    app.setAppUserModelId(app.name)
}

class AppUpdater {
    constructor() {
        log.transports.file.level = 'info'
        const locale = new Locale()

        autoUpdater.logger = log
        autoUpdater.setFeedURL('https://chatboxai.app/api/auto_upgrade/open-source')
        autoUpdater.checkForUpdatesAndNotify()
        autoUpdater.once('update-downloaded', (event) => {
            dialog
                .showMessageBox({
                    type: 'info',
                    buttons: [locale.t('Restart'), locale.t('Later')],
                    title: locale.t('App_Update'),
                    message: event.releaseName || locale.t('New_Version'),
                    detail: locale.t('New_Version_Downloaded'),
                })
                .then((returnValue) => {
                    if (returnValue.response === 0) autoUpdater.quitAndInstall()
                })
        })
    }
}

let mainWindow: BrowserWindow | null = null
let secondaryWindow: BrowserWindow | null = null;

const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'

const createWindow = async () => {
    const RESOURCES_PATH = app.isPackaged
        ? path.join(process.resourcesPath, 'assets')
        : path.join(__dirname, '../../assets')

    const getAssetPath = (...paths: string[]): string => {
        return path.join(RESOURCES_PATH, ...paths)
    }

    // mainWindow = new BrowserWindow({
    //     frame: false,
    //     show: false,
    //     width: 650,
    //     height: screen.getPrimaryDisplay().size.height,
    //     icon: getAssetPath('icon.png'),
    //     alwaysOnTop: true,
    //     x: screen.getPrimaryDisplay().size.width - 650,
    //     skipTaskbar: true,
    //     webPreferences: {
    //         spellcheck: true,
    //         webSecurity: false,
    //         allowRunningInsecureContent: false,
    //         preload: app.isPackaged
    //             ? path.join(__dirname, 'preload.js')
    //             : path.join(__dirname, '../../.erb/dll/preload.js'),
    //     },
    // })

    // mainWindow.loadURL(resolveHtmlPath('index.html'))

    // mainWindow.on('ready-to-show', () => {
    //     if (!mainWindow) {
    //         throw new Error('"mainWindow" is not defined')
    //     }
    //     if (process.env.START_MINIMIZED) {
    //         mainWindow.minimize()
    //     } else {
    //         mainWindow.show()
    //     }
    // })

    // mainWindow.on('closed', () => {
    //     mainWindow = null
    // })

    // const menuBuilder = new MenuBuilder(mainWindow)
    // menuBuilder.buildMenu()

    // mainWindow.setMenuBarVisibility(false)

    // let hidePosition = screen.getPrimaryDisplay().size.width - 0;
    // let showPosition = screen.getPrimaryDisplay().size.width - 650;
    // let transitionSpeed = 15;

    // const monitorWindowPosition = () => {
    //     if (!mainWindow) return;

    //     const windowPos = mainWindow.getBounds();
    //     const mousePos = screen.getCursorScreenPoint();
    //     // show
    //     if (mousePos.x > screen.getPrimaryDisplay().size.width - 10) {
    //         animateWindowSlide(windowPos, showPosition);
    //     }
    //     // hide 
    //     if (mousePos.x < screen.getPrimaryDisplay().size.width - 650) {
    //         animateWindowSlide(windowPos, hidePosition);
    //     }
    // }

    // const animateWindowSlide = (windowPos: any, targetPosition: number) => {
    //     let currentX = windowPos.x;
    //     let step = targetPosition < currentX ? -1 : 1;

    //     const interval = setInterval(() => {
    //         currentX += step * transitionSpeed;

    //         if ((step === 1 && currentX >= targetPosition) || (step === -1 && currentX <= targetPosition)) {
    //             currentX = targetPosition;
    //             clearInterval(interval);
    //         }

    //         mainWindow?.setBounds({ ...windowPos, x: currentX });
    //     }, 3);
    // }

    // setInterval(monitorWindowPosition, 500);
    mainWindow = new BrowserWindow({
        show: false,
        width: 1000,
        height: 950,
        icon: getAssetPath('icon.png'),
        webPreferences: {
            spellcheck: true,
            webSecurity: false,
            allowRunningInsecureContent: false,
            preload: app.isPackaged
                ? path.join(__dirname, 'preload.js')
                : path.join(__dirname, '../../.erb/dll/preload.js'),
        },
    })

    mainWindow.loadURL(resolveHtmlPath('index.html'))

    mainWindow.on('ready-to-show', () => {
        if (!mainWindow) {
            throw new Error('"mainWindow" is not defined')
        }
        if (process.env.START_MINIMIZED) {
            mainWindow.minimize()
        } else {
            mainWindow.show()
        }
    })

    mainWindow.on('closed', () => {
        mainWindow = null
    })

    const menuBuilder = new MenuBuilder(mainWindow)
    menuBuilder.buildMenu()

    // Open urls in the user's browser
    mainWindow.webContents.setWindowOpenHandler((edata) => {
        shell.openExternal(edata.url)
        return { action: 'deny' }
    })

    // https://www.computerhope.com/jargon/m/menubar.htm
    mainWindow.setMenuBarVisibility(false)
    // second
    secondaryWindow = new BrowserWindow({
        // show: false,
        width: 160,
        height: 45,
        parent: mainWindow,
        modal: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        movable: true,
        frame: false,
        webPreferences: {
            spellcheck: true,
            webSecurity: false,
            allowRunningInsecureContent: false,
            preload: app.isPackaged
                ? path.join(__dirname, 'preload.js')
                : path.join(__dirname, '../../.erb/dll/preload.js'),
        },
    });
    const { width: screenWidth } = screen.getPrimaryDisplay().bounds;
    const windowWidth = 360;
    const x = Math.floor((screenWidth - windowWidth) / 2);
    const y = 0;
    
    // Set the window position 
    secondaryWindow.setBounds({ x, y, width: windowWidth, height: 48 });
    secondaryWindow.loadURL(resolveHtmlPath('secondary.html'));

    secondaryWindow.on('closed', () => {
        secondaryWindow = null;
    });
    // secondaryWindow.webContents.toggleDevTools()

    new AppUpdater()

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
            },
        })
    })

    nativeTheme.on('updated', () => {
        mainWindow?.webContents.send('system-theme-updated')
    })
}


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.whenReady()
    .then(() => {
        createWindow()
        app.on('activate', () => {
            if (mainWindow === null) createWindow()
        })
    })
    .catch(console.log)

ipcMain.handle('send-message', async (_, messgae) => {
    secondaryWindow?.webContents.send('action', messgae)
    return true;
});   
ipcMain.handle('send-thumbnail', async (_, messgae) => {
    secondaryWindow?.webContents.send('thumbnail', messgae)
    return true;
});
ipcMain.handle('close-first-window', async () => {
    mainWindow?.hide()
    return true;
});
ipcMain.handle('show-first-window', async () => {
    mainWindow?.show()
    return true;
});
ipcMain.handle('close-second-window', async () => {
    secondaryWindow?.hide()
    return true;
});
ipcMain.handle('show-second-window', async () => {
    secondaryWindow?.show()
    return true;
});

ipcMain.handle('screenshot', async () => {
    const primaryDisplayId = screen.getPrimaryDisplay().id;
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: screen.getPrimaryDisplay().size.width, height: screen.getPrimaryDisplay().size.height } });

    const primaryDisplay = sources.find(source => parseInt(source.display_id, 10) === primaryDisplayId);

    if (primaryDisplay) {
        const buffer = primaryDisplay.thumbnail.toPNG();
        const jpegBuffer = await sharp(buffer).jpeg().toBuffer();
        return `data:image/jpeg;base64,${jpegBuffer.toString('base64')}`;
    }
    return null;
});
ipcMain.handle('get-resolution', async () => {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size;
    return { width, height };
});
ipcMain.handle('mouse-click', async (_, x, y) => {
    await mouse.setPosition(new Point(x, y));
    await mouse.leftClick();
    return true;
});
ipcMain.handle('double-click', async (_, x, y) => {
    await mouse.setPosition(new Point(x, y));
    await mouse.doubleClick(0);
    return true;
});
ipcMain.handle('mouse-scroll-down', async (_, mt) => {
    await mouse.scrollDown(mt);
    return true;
});
ipcMain.handle('mouse-scroll-up', async (_, mt) => {
    await mouse.scrollUp(mt);
    return true;
});
ipcMain.handle('type-text', async (_, x, y, text) => {
    await mouse.setPosition(new Point(x, y));
    await mouse.leftClick();
    // await keyboard.type(text);
    clipboard.setContent(text);
    await keyboard.pressKey(Key.LeftControl);
    await keyboard.pressKey(Key.V);
    await keyboard.releaseKey(Key.LeftControl);
    await keyboard.releaseKey(Key.V);
    return true;
});
ipcMain.handle('press-key', async (_, key) => {
    await keyboard.pressKey(key);
    return true;
});
//////////////// desgined for agent feature //////////////////

ipcMain.handle('getStoreValue', (event, key) => {
    return store.get(key)
})
ipcMain.handle('setStoreValue', (event, key, dataJson) => {
    const data = JSON.parse(dataJson)
    return store.set(key, data)
})
ipcMain.handle('delStoreValue', (event, key) => {
    return store.delete(key)
})
ipcMain.handle('getAllStoreValues', (event) => {
    return JSON.stringify(store.store)
})
ipcMain.handle('setAllStoreValues', (event, dataJson) => {
    const data = JSON.parse(dataJson)
    store.store = data
})

ipcMain.handle('getVersion', () => {
    return app.getVersion()
})
ipcMain.handle('getPlatform', () => {
    return process.platform
})
ipcMain.handle('getHostname', () => {
    return os.hostname()
})
ipcMain.handle('getLocale', () => {
    try {
        return app.getLocale()
    } catch (e: any) {
        return ''
    }
})
ipcMain.handle('openLink', (event, link) => {
    return shell.openExternal(link)
})

ipcMain.handle('shouldUseDarkColors', () => nativeTheme.shouldUseDarkColors)

ipcMain.handle('ensureProxy', (event, json) => {
    const config: { proxy?: string } = JSON.parse(json)
    proxy.ensure(config.proxy)
})

ipcMain.handle('relaunch', () => {
    app.relaunch()
    app.quit()
})

ipcMain.handle('analysticTrackingEvent', (event, dataJson) => {
    const data = JSON.parse(dataJson)
    analystic.event(data.name, data.params).catch((e) => {
        log.error('analystic_tracking_event', e)
    })
})

ipcMain.handle('getConfig', (event) => {
    return getConfig()
})

ipcMain.handle('getSettings', (event) => {
    return getSettings()
})

ipcMain.handle('shouldShowAboutDialogWhenStartUp', (event) => {
    const currentVersion = app.getVersion()
    if (store.get('lastShownAboutDialogVersion', '') === currentVersion) {
        return false
    }
    store.set('lastShownAboutDialogVersion', currentVersion)
    return true
})

ipcMain.handle('appLog', (event, dataJson) => {
    const data: { level: string; message: string } = JSON.parse(dataJson)
    data.message = 'APP_LOG: ' + data.message
    switch (data.level) {
        case 'info':
            log.info(data.message)
            break
        case 'error':
            log.error(data.message)
            break
        default:
            log.info(data.message)
    }
})
