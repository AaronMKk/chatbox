import { ElectronIPC } from "src/shared/electron-types"
import { Config, Settings } from "src/shared/types"
import { getOS } from './navigator'
import { parseLocale } from '@/i18n/parser'
import Exporter from './exporter'

export class DesktopPlatform {
    public ipc: ElectronIPC
    constructor(ipc: ElectronIPC) {
        this.ipc = ipc
    }

    public exporter = new Exporter()

    public async getVersion() {
        return this.ipc.invoke('getVersion')
    }
    public async getPlatform() {
        return this.ipc.invoke('getPlatform')
    }
    public async shouldUseDarkColors(): Promise<boolean> {
        return await this.ipc.invoke('shouldUseDarkColors')
    }
    public onSystemThemeChange(callback: () => void): () => void {
        return this.ipc.onSystemThemeChange(callback)
    }
    public onWindowShow(callback: () => void): () => void {
        return this.ipc.onWindowShow(callback)
    }
    public async openLink(url: string): Promise<void> {
        return this.ipc.invoke('openLink', url)
    }
    public async getInstanceName(): Promise<string> {
        const hostname = await this.ipc.invoke('getHostname')
        return `${hostname} / ${getOS()}`
    }
    public async getLocale() {
        const locale = await this.ipc.invoke('getLocale')
        return parseLocale(locale)
    }
    public async ensureShortcutConfig(config: { disableQuickToggleShortcut: boolean }): Promise<void> {
        return this.ipc.invoke('ensureShortcutConfig', JSON.stringify(config))
    }
    public async ensureProxyConfig(config: { proxy?: string }): Promise<void> {
        return this.ipc.invoke('ensureProxy', JSON.stringify(config))
    }
    public async relaunch(): Promise<void> {
        return this.ipc.invoke('relaunch')
    }

    public async getConfig(): Promise<Config> {
        return this.ipc.invoke('getConfig')
    }
    public async getSettings(): Promise<Settings> {
        return this.ipc.invoke('getSettings')
    }

    public async setStoreValue(key: string, value: any) {
        const valueJson = JSON.stringify(value)
        return this.ipc.invoke('setStoreValue', key, valueJson)
    }
    public async getStoreValue(key: string) {
        return this.ipc.invoke('getStoreValue', key)
    }
    public delStoreValue(key: string) {
        return this.ipc.invoke('delStoreValue', key)
    }
    public async getAllStoreValues(): Promise<{ [key: string]: any }> {
        const json = await this.ipc.invoke('getAllStoreValues')
        return JSON.parse(json)
    }
    public async setAllStoreValues(data: { [key: string]: any }) {
        await this.ipc.invoke('setAllStoreValues', JSON.stringify(data))
    }

    public initTracking(): void {
        this.trackingEvent('user_engagement', {})
    }
    public trackingEvent(name: string, params: { [key: string]: string }) {
        const dataJson = JSON.stringify({ name, params })
        this.ipc.invoke('analysticTrackingEvent', dataJson)
    }

    public async shouldShowAboutDialogWhenStartUp(): Promise<boolean> {
        return this.ipc.invoke('shouldShowAboutDialogWhenStartUp')
    }

    public async appLog(level: string, message: string) {
        return this.ipc.invoke('appLog', JSON.stringify({ level, message }))
    }

    // desgined for agent feature
    public async forceStop(id: boolean | null) {
        return this.ipc.invoke('force-stop', id)
    }
    public async screenshot(id: string | null) {
        return this.ipc.invoke('screenshot', id)
    }
    public async effectOn(id: number | null) {
        return this.ipc.invoke('screenshot-effect-on', id)
    }
    public async effectOff() {
        return this.ipc.invoke('screenshot-effect-off')
    }
    public async mouseClick(x: number, y: number) {
        return this.ipc.invoke('mouse-click', x, y)
    }
    public async getResolution(id: number | null) {
        return this.ipc.invoke('get-resolution', id)
    }
    public async getPositionByDisplayId(id: number | null) {
        return this.ipc.invoke('get-position-by-display-id', id)
    }
    public async doubleClick(x: number, y: number) {
        return this.ipc.invoke('double-click', x, y)
    }
    public async mouseScrollDown(step_count: number) {
        return this.ipc.invoke('mouse-scroll-down', step_count)
    }
    public async mouseScrollUp(step_count: number) {
        return this.ipc.invoke('mouse-scroll-up', step_count)
    }
    public async typeText(x: number, y: number, text: string) {
        return this.ipc.invoke('type-text', x, y, text)
    }
    public async pressKey(key: string) {
        return this.ipc.invoke('press-key', key)
    }
    public async sendThumbnail(base64: string) {
        return this.ipc.invoke('send-thumbnail', base64)
    }
    public async sendMessage(message: string) {
        return this.ipc.invoke('send-message', message)
    }
    public async closeFirstWindow() {
        return this.ipc.invoke('close-first-window')
    }
    public async showFirstWindow() {
        return this.ipc.invoke('show-first-window')
    }
    public async exist() {
        return this.ipc.invoke('show-first-window')
    }
    public async exit() {
        return this.ipc.invoke('exit-program')
    }
    public async showSecondWindow() {
        return this.ipc.invoke('show-second-window')
    }
    public async closeSecondWindow() {
        return this.ipc.invoke('close-second-window')
    }
    public async sentPos(x: number, y: number) {
        return this.ipc.invoke('send-position', x, y)
    }
    public async maxmizeFirstWindow() {
        return this.ipc.invoke('max-first-win')
    }
    public async showOptionalWindows() {
        return this.ipc.invoke('show-optinal-win')
    }
    public async finishedOptionalWindows(displayId: string) {
        return this.ipc.invoke('finished-optinal-win', displayId)
    }
    // desgined for agent feature

}

export default new DesktopPlatform(window.electronAPI as any)
