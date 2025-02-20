import { Message } from 'src/shared/types'
import { ApiError, ChatboxAIAPIError } from './errors'
import Base, { onResultChange } from './base'
import platform from '@/packages/platform'

interface Options {
    deepseekKey: string
    deepseekapiHost: string
    deepseekModel: deepseekModel | 'custom-model'
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
        return this.requestChatCompletionsNotStream({ model, messages, image_url, conversation_id}, signal, onResultChange)
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
        if (onResultChange) {
            onResultChange(json.choices[0].message.content)
        }
        return json.choices[0].message.content
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
