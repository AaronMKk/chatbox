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
import {
    app,
    BrowserWindow,
    shell,
    ipcMain,
    nativeTheme,
    session,
    dialog,
    desktopCapturer,
    screen,
    clipboard,
} from 'electron'
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
const robotjsPath = path.join(__dirname, '../../release/app/node_modules/robotjs')

const robot = require('robotjs')
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
let secondaryWindow: BrowserWindow | null = null
let effectWindow: BrowserWindow | null = null

const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'

const createWindow = async () => {
    const RESOURCES_PATH = app.isPackaged
        ? path.join(process.resourcesPath, 'assets')
        : path.join(__dirname, '../../assets')

    const getAssetPath = (...paths: string[]): string => {
        return path.join(RESOURCES_PATH, ...paths)
    }
    mainWindow = new BrowserWindow({
        show: false,
        width: 910,
        height: 660,
        titleBarStyle: 'hidden',
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

        mainWindow.webContents.openDevTools()

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
        show: false,
        width: 160,
        height: 80,
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
    })
    const updateSecondaryWindowPosition = () => {
        if (mainWindow && secondaryWindow) {
            const mainWindowBounds = mainWindow.getBounds()

            const targetDisplay = screen.getDisplayNearestPoint({
                x: mainWindowBounds.x,
                y: mainWindowBounds.y,
            }).bounds

            const x = targetDisplay.x + (targetDisplay.width - 360) / 2
            const y = 0

            secondaryWindow.setBounds({ x, y, width: 360, height: 60 })
        }
    }

    setInterval(updateSecondaryWindowPosition, 1000)

    secondaryWindow.loadURL(resolveHtmlPath('secondary.html'))

    secondaryWindow.on('closed', () => {
        secondaryWindow = null
    })
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
function createEffectWindow(id: number) {
    if (effectWindow) return
    const displays = screen.getAllDisplays()
    const display = displays.find((d) => d.id === id)
    let _offsetX = 0
    let _offsetY = 0
    let _width = 1920
    let _height = 1080
    if (display) {
        _offsetX = display.bounds.x
        _offsetY = display.bounds.y
        _width = display.bounds.width
        _height = display.bounds.height
    }

    effectWindow = new BrowserWindow({
        width: _width,
        height: _height,
        x: _offsetX,
        y: _offsetY,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        movable: false,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    })

    effectWindow.loadURL(`data:text/html;charset=UTF-8,
      <html>
        <head>
          <style id="water-flow-animation">
            html::before {
              content: "";
              position: fixed;
              top: 0; right: 0; bottom: 0; left: 0;
              pointer-events: none;
              z-index: 9999;
              background:
                linear-gradient(to right, rgba(30, 144, 255, 0.4), transparent 50%) left,
                linear-gradient(to left, rgba(30, 144, 255, 0.4), transparent 50%) right,
                linear-gradient(to bottom, rgba(30, 144, 255, 0.4), transparent 50%) top,
                linear-gradient(to top, rgba(30, 144, 255, 0.4), transparent 50%) bottom;
              background-repeat: no-repeat;
              background-size: 10% 100%, 10% 100%, 100% 10%, 100% 10%;
              animation: waterflow 5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
              filter: blur(8px);
            }

            @keyframes waterflow {
              0%, 100% {
                background-image:
                  linear-gradient(to right, rgba(30, 144, 255, 0.4), transparent 50%),
                  linear-gradient(to left, rgba(30, 144, 255, 0.4), transparent 50%),
                  linear-gradient(to bottom, rgba(30, 144, 255, 0.4), transparent 50%),
                  linear-gradient(to top, rgba(30, 144, 255, 0.4), transparent 50%);
                transform: scale(1);
              }
              25% {
                background-image:
                  linear-gradient(to right, rgba(30, 144, 255, 0.39), transparent 52%),
                  linear-gradient(to left, rgba(30, 144, 255, 0.39), transparent 52%),
                  linear-gradient(to bottom, rgba(30, 144, 255, 0.39), transparent 52%),
                  linear-gradient(to top, rgba(30, 144, 255, 0.39), transparent 52%);
                transform: scale(1.03);
              }
              50% {
                background-image:
                  linear-gradient(to right, rgba(30, 144, 255, 0.38), transparent 55%),
                  linear-gradient(to left, rgba(30, 144, 255, 0.38), transparent 55%),
                  linear-gradient(to bottom, rgba(30, 144, 255, 0.38), transparent 55%),
                  linear-gradient(to top, rgba(30, 144, 255, 0.38), transparent 55%);
                transform: scale(1.05);
              }
              75% {
                background-image:
                  linear-gradient(to right, rgba(30, 144, 255, 0.39), transparent 52%),
                  linear-gradient(to left, rgba(30, 144, 255, 0.39), transparent 52%),
                  linear-gradient(to bottom, rgba(30, 144, 255, 0.39), transparent 52%),
                  linear-gradient(to top, rgba(30, 144, 255, 0.39), transparent 52%);
                transform: scale(1.03);
              }
            }
          </style>
        </head>
        <body></body>
      </html>
    `)
    setTimeout(() => {
        removeEffectWindow()
    }, 1000)
}

function removeEffectWindow() {
    if (effectWindow) {
        effectWindow.close()
        effectWindow = null
    }
}
ipcMain.handle('send-position', (event, x, y) => {
    if (mainWindow) {
        mainWindow.setBounds({
            x: mainWindow.getBounds().x + x,
            y: mainWindow.getBounds().y + y,
            width: mainWindow.getBounds().width,
            height: mainWindow.getBounds().height,
        })
    }
})
ipcMain.handle('force-stop', async (_, messgae) => {
    mainWindow?.webContents.send('forceStop', messgae)
    return true
})
ipcMain.handle('screenshot-effect-on', async (_, id) => {
    createEffectWindow(id)
    return true
})
ipcMain.handle('screenshot-effect-off', async (_, messgae) => {
    removeEffectWindow()
    return true
})
ipcMain.handle('get-position-by-display-id', async (_, id) => {
    const displays = screen.getAllDisplays()
    const display = displays.find((d) => d.id === id)
    if (display) {
        const x = display.bounds.x
        const y = display.bounds.y
        return { x, y }
    } else {
        return { x: 0, y: 0 }
    }
})
ipcMain.handle('send-message', async (_, messgae) => {
    secondaryWindow?.webContents.send('action', messgae)
    return true
})
ipcMain.handle('send-thumbnail', async (_, messgae) => {
    secondaryWindow?.webContents.send('thumbnail', messgae)
    return true
})
ipcMain.handle('show-optinal-win', async () => {
    const mainWindowBounds = mainWindow?.getBounds()
    if (mainWindowBounds) {
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: {
                width: screen.getPrimaryDisplay().size.width,
                height: screen.getPrimaryDisplay().size.height,
            },
        })

        const screenThumbnails: { [key: string]: string } = {}

        for (const source of sources) {
            const buffer = source.thumbnail.toPNG()
            const jpegBuffer = await sharp(buffer).jpeg().toBuffer()
            screenThumbnails[source.display_id] = jpegBuffer.toString('base64')
        }

        mainWindow?.webContents.send('thumbnails', screenThumbnails)

        return true
    }

    return true
})
ipcMain.handle('finished-optinal-win', async (_, id) => {
    mainWindow?.webContents.send('displayId', id)
    return true
})
ipcMain.handle('close-first-window', async () => {
    mainWindow?.minimize()
    return true
})
ipcMain.handle('exit-program', async () => {
    app.quit()
    return true
})
ipcMain.handle('show-first-window', async () => {
    mainWindow?.show()
    return true
})
ipcMain.handle('close-second-window', async () => {
    secondaryWindow?.hide()
    return true
})
ipcMain.handle('show-second-window', async () => {
    secondaryWindow?.show()
    return true
})
ipcMain.handle('max-first-win', async () => {
    const isMaximized = mainWindow?.isMaximized()
    if (isMaximized) {
        mainWindow?.unmaximize()
    } else {
        mainWindow?.maximize()
    }
    return true
})
ipcMain.handle('screenshot', async (_, id) => {
    const mainWindowBounds = mainWindow?.getBounds()
    if (mainWindowBounds) {
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: {
                width: screen.getPrimaryDisplay().size.width,
                height: screen.getPrimaryDisplay().size.height,
            },
        })

        const selectedDisplay = sources.find((source) => source.display_id === id)

        if (selectedDisplay) {
            const buffer = selectedDisplay.thumbnail.toPNG()
            const jpegBuffer = await sharp(buffer).jpeg().toBuffer()
            return `data:image/jpeg;base64,${jpegBuffer.toString('base64')}`
        }
        return sources
    }
})
ipcMain.handle('get-resolution', async (_, id) => {
    const displays = screen.getAllDisplays()
    const display = displays.find((d) => d.id === id)
    if (display) {
        const width = display.bounds.width
        const height = display.bounds.height
        return { width, height }
    }
    return displays
})
ipcMain.handle('mouse-click', async (_, x, y) => {
    robot.moveMouse(x, y)
    robot.mouseClick()
    return true
})

ipcMain.handle('double-click', async (_, x, y) => {
    robot.moveMouse(x, y)
    robot.mouseClick('left', true)
    return true
})

ipcMain.handle('mouse-scroll-down', async (_, mt) => {
    robot.scrollMouse(0, -mt)
    return true
})

ipcMain.handle('mouse-scroll-up', async (_, mt) => {
    robot.scrollMouse(0, mt)
    return true
})

ipcMain.handle('type-text', async (_, x, y, text) => {
    robot.moveMouse(x, y)
    robot.mouseClick()
    clipboard.writeText(text)
    robot.keyToggle('control', 'down')
    robot.keyTap('v')
    robot.keyToggle('control', 'up')
    return true
})

ipcMain.handle('press-key', async (_, key) => {
    robot.keyTap(key)
    return true
})

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
