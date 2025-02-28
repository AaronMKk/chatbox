import { Message } from 'src/shared/types'
import { ApiError, ChatboxAIAPIError } from './errors'
import Base, { onResultChange } from './base'
import platform from '@/packages/platform'

interface Options {
    deepseekKey: string
    deepseekapiHost: string
    deepseekModel: deepseekModel | 'custom-model'
    temperature: number
    topP: number
    repetition_penalty: number
}
interface ActionInput {
    action: string;
    coordinate?: [number, number];
    step_count?: number;
    text?: string;
    key?: string;
}
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default class DeepSeek extends Base {
    public name = 'DeepSeek'
    private selectedDisplayId: number | null = null;
    private forceStop: boolean | null = null;
    private continureWork: boolean | null = null;
    private regularChat: boolean | null = true;
    public options: Options
    constructor(options: Options) {
        super()
        this.options = options
        if (!this.options.deepseekapiHost) {
            this.options.deepseekapiHost = 'http://127.0.0.1:5000'
        }
        if (!this.options.deepseekModel) {
            this.options.deepseekModel = 'KingsWare 通用领域大模型'
        }
        this.initDisplayId();
        this.listenToStopSign();
    }
    async initDisplayId() {
        return new Promise<void>((resolve) => {
            const storedDisplayId = localStorage.getItem('selectedDisplayId');

            if (storedDisplayId) {
                this.selectedDisplayId = Number(storedDisplayId);
                resolve();
            } else {
                const handleDisplayId = (id: string) => {
                    this.selectedDisplayId = Number(id);
                    localStorage.setItem('selectedDisplayId', id);
                    resolve();
                };

                window.electronAPI?.onFinishSelectDisplayId(handleDisplayId);
            }
        });
    }
    async showFirstWin() {
        platform.closeSecondWindow();
        platform.showFirstWindow();
    }
    async showSecondWin() {
        platform.closeSecondWindow();
        platform.showFirstWindow();
    }
    async listenToStopSign() {
        return new Promise<void>((resolve) => {
            const handleFroceStop = (id: boolean) => {
                this.forceStop = id;
                resolve();
            };

            window.electronAPI?.onForceStop(handleFroceStop);
        });
    }
    async waitForDisplayId() {
        while (this.selectedDisplayId === null) {
            await sleep(1000);
        }
    }

    async callChatCompletion(rawMessages: Message[], signal?: AbortSignal, onResultChange?: onResultChange): Promise<string> {
        try {
            if (!this.selectedDisplayId) {
                platform.showOptionalWindows()
                await this.waitForDisplayId()
            }

            return await this._callChatCompletion(rawMessages, signal, onResultChange)
        } catch (e) {
            if (e instanceof ApiError && e.message.includes('Invalid content type. image_url is only supported by certain models.')) {
                throw ChatboxAIAPIError.fromCodeName('model_not_support_image', 'model_not_support_image')
            }
            throw e
        }
    }

    async _callChatCompletion(rawMessages: Message[], signal?: AbortSignal, onResultChange?: onResultChange): Promise<string> {
        const model = this.options.deepseekModel

        rawMessages = injectModelSystemPrompt(model, rawMessages)
        const conversation_id = rawMessages[1].id

        const messages = await populateGPTMessage(rawMessages)

        // take first screenshoot silently
        let image_url = ''
        if (this.selectedDisplayId) {
            image_url = await platform.screenshot(String(this.selectedDisplayId))
        }

        return this.requestChatCompletionsNotStream({
            model,
            messages,
            image_url,
            conversation_id,
            temperature: this.options.temperature,
            top_p: this.options.topP,
            repetition_penalty: this.options.repetition_penalty,
        }, signal, onResultChange)
    }
    async requestChatCompletionsNotStream(requestBody: Record<string, any>, signal?: AbortSignal, onResultChange?: onResultChange): Promise<string> {
        if (this.forceStop) {
            this.continureWork = false
            if (onResultChange) {
                onResultChange('froce stopped agent')
            }
            return ''
        }
        platform.sendThumbnail(requestBody.image_url)
        const apiPath = this.options.deepseekapiHost + '/v1/chat/completions'
        const response = await this.post(
            `${apiPath}`,
            this.getHeaders(),
            requestBody,
            signal
        )
        const json = await response.json()
        if (json.error) {
            throw new ApiError(`Error from DeepSeek: ${JSON.stringify(json)}`)
        }
        if (json.data.content.message.includes('END()')) {
            this.continureWork = false

            if (onResultChange) {
                onResultChange('task should be fished')
            }
            return ''
        }
        if (json.data.content.type === 'exec') {
            this.continureWork = true
            if (onResultChange) {
                onResultChange(json.data.content.message)
            }
            platform.sendMessage(json.data.content.message)
            this.excuteAction(json)
        }
        if (json.data.content.plan_response) {
            if (onResultChange) {
                onResultChange(json.data.content.plan_response.message)
            }
        }
        if (this.continureWork) {
            if (this.selectedDisplayId) {
                // upcoming screenshoot
                let _ = await platform.effectOn(this.selectedDisplayId)
                await sleep(1000)
                requestBody.image_url = await platform.screenshot(String(this.selectedDisplayId))
            }
            this.requestChatCompletionsNotStream(requestBody, signal, onResultChange)
        }
        if (this.regularChat && !json.data.content.plan_response) {
            if (onResultChange) {
                onResultChange(json.data.content.message)
            }
        }
        return ''
    }

    getHeaders() {
        const headers: Record<string, string> = {
            Authorization: `Bearer ${this.options.deepseekKey}`,
            'Content-Type': 'application/json',
        }
        return headers
    }

    async excuteAction(json: any) {
        platform.closeFirstWindow();
        platform.showSecondWindow();
        const resolution = await platform.getResolution(this.selectedDisplayId);
        let offsetX = 0, offsetY = 0;
        if (this.selectedDisplayId) {
            const { x, y } = await platform.getPositionByDisplayId(this.selectedDisplayId);
            offsetX = x;
            offsetY = y;
        }

        const scaleX = resolution.width / 1000;
        const scaleY = resolution.height / 1000;

        // Updated mapping: functions now accept parameters
        const actionMap: { [key: string]: (...params: any[]) => Promise<any> } = {
            'CLICK': async (x: number, y: number) => await platform.mouseClick(x, y),
            'DOUBLE_CLICK': async (x: number, y: number) => await platform.mouseClick(x, y),
            'SCROLL_DOWN': async (mt: number) => await platform.mouseScrollDown(mt),
            'SCROLL_UP': async (mt: number) => await platform.mouseScrollUp(mt),
            'TYPE': async (x: number, y: number, text: string) => await platform.typeText(x, y, text),
            'KEY_PRESS': async (key: string) => await platform.pressKey(key)
        };

        // Process actions from backend response
        const actions = json.data.content.actions;
        actions.forEach((actionObj: { input: ActionInput }) => {
            const input = actionObj.input;
            const key = input.action;
            let params: any[] = [];

            // Map input fields to function parameters
            switch (key) {
                case 'CLICK':
                case 'DOUBLE_CLICK':
                    if (input.coordinate) {
                        const [x, y] = input.coordinate;
                        params = [x * scaleX + offsetX, y * scaleY + offsetY];
                    }
                    break;
                case 'SCROLL_DOWN':
                    if (typeof input.step_count === 'number') params = [input.step_count];
                    break;
                case 'SCROLL_UP':
                    if (typeof input.step_count === 'number') params = [input.step_count];
                    break;
                case 'TYPE':
                    if (input.coordinate && input.text) {
                        const [x, y] = input.coordinate;
                        params = [x * scaleX + offsetX, y * scaleY + offsetY, input.text];
                    }
                    break;
                case 'KEY_PRESS':
                    if (input.key) params = [input.key];
                    break;
            }

            if (actionMap[key]) {
                actionMap[key](...params);
            } else {
                console.warn(`No handler for action: ${key}`);
            }
        });
    }
}


export const DeepSeekModelConfigs = {
    'KingsWare 通用领域大模型': {
        maxTokens: 4096,
        maxContextTokens: 16_385,
    },
    'KingsWare 金融证券领域大模型': {
        maxTokens: 4096,
        maxContextTokens: 16_385,
    },
    'KingsWare 企业微信领域大模型': {
        maxTokens: 4096,
        maxContextTokens: 16_385,
    },
}

export type deepseekModel = keyof typeof DeepSeekModelConfigs
export const models = Array.from(Object.keys(DeepSeekModelConfigs)).sort() as deepseekModel[]

export async function populateGPTMessage(rawMessages: Message[]): Promise<DeepSeekMessage[]> {
    const messages: DeepSeekMessage[] = rawMessages.map((m) => ({
        role: m.role,
        content: m.content,
    }))
    return messages
}

export function injectModelSystemPrompt(model: string, messages: Message[]) {
    const metadataPrompt = `
Current model: ${model}
Current date: ${new Date().toISOString()}

`
    let hasInjected = false
    return messages.map((m) => {
        if (m.role === 'system' && !hasInjected) {
            m = { ...m }
            m.content = metadataPrompt + m.content
            hasInjected = true
        }
        return m
    })
}

export interface DeepSeekMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
    name?: string
}
