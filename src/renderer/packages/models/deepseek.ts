import { Message } from 'src/shared/types'
import { ApiError, ChatboxAIAPIError } from './errors'
import Base, { onResultChange } from './base'
import platform from '@/packages/platform'

interface Options {
    deepseekKey: string
    deepseekapiHost: string
    deepseekModel: deepseekModel | 'custom-model'
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

    public options: Options
    constructor(options: Options) {
        super()
        this.options = options
        if (this.options.deepseekapiHost && this.options.deepseekapiHost.trim().length === 0) {
            this.options.deepseekapiHost = 'http://127.0.0.1:5000'
        }
        if (!this.options.deepseekapiHost) {
            this.options.deepseekapiHost = 'http://127.0.0.1:5000'
        }
        if (!this.options.deepseekModel) {
            this.options.deepseekModel = 'KingsWare 通用领域大模型'
        }
    }
    async callChatCompletion(rawMessages: Message[], signal?: AbortSignal, onResultChange?: onResultChange): Promise<string> {
        try {
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
        let image_url: any = await platform.screenshot()
        return this.requestChatCompletionsNotStream({ model, messages, image_url, conversation_id }, signal, onResultChange)
    }
    async requestChatCompletionsNotStream(requestBody: Record<string, any>, signal?: AbortSignal, onResultChange?: onResultChange): Promise<string> {
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
            // platform.resize(1, '');
            return 'task should be fished'
        }
        if (json.data.content.type === 'exec') {
            if (onResultChange) {
                onResultChange(json.data.content.message)
            }
            this.excuteAction(json, json.data.content.message)
            await sleep(1000)
            let image_url: any = await platform.screenshot()
            requestBody.image_url = image_url
            this.requestChatCompletionsNotStream(requestBody, signal, onResultChange)
        }
        
        return json.data.content.message
    }

    getHeaders() {
        const headers: Record<string, string> = {
            Authorization: `Bearer ${this.options.deepseekKey}`,
            'Content-Type': 'application/json',
        }
        if (this.options.deepseekapiHost.includes('openrouter.ai')) {
            headers['HTTP-Referer'] = 'https://chatboxai.app'
            headers['X-Title'] = 'Chatbox AI'
        }
        return headers
    }
    
    async excuteAction(json: any, message: String) {
        console.warn(`>>>>>>>>>>>>>>>>>action: ${message}`);
        // platform.resize(0, message);
        const resolution = await platform.getResolution();
        const scaleX = resolution.width / 1000;
        const scaleY = resolution.height / 1000;

        // Updated mapping: functions now accept parameters
        const actionMap: { [key: string]: (...params: any[]) => Promise<any> } = {
            'screenshot': async () => await platform.screenshot(),
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
                        params = [x * scaleX, y * scaleY];
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
                        params = [x * scaleX, y * scaleY, input.text];
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
