"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatCompletion = getChatCompletion;
const templateManager_1 = require("../prompts/templateManager");
const openai_1 = __importDefault(require("openai"));
const env_1 = require("../config/env");
let openai = null;
if (env_1.config.azureOpenAiEndpoint && env_1.config.azureOpenAiKey) {
    openai = new openai_1.default({
        apiKey: env_1.config.azureOpenAiKey,
        baseURL: `${env_1.config.azureOpenAiEndpoint}/openai/deployments/${env_1.config.azureOpenAiDeployment}`,
        defaultQuery: { 'api-version': '2023-05-15' },
        defaultHeaders: { 'api-key': env_1.config.azureOpenAiKey },
    });
}
function getChatCompletion(messages) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!openai)
            throw new Error('OpenAI client not initialized');
        console.log('Chat service received messages:', messages.length, 'messages');
        console.log('System messages:', messages.filter(m => m.role === 'system').length);
        console.log('User messages:', messages.filter(m => m.role === 'user').length);
        console.log('Assistant messages:', messages.filter(m => m.role === 'assistant').length);
        // Preserve conversation context by not applying aggressive windowing
        // Only apply windowing if we have too many messages (e.g., >50) to prevent token limits
        const shouldApplyWindowing = messages.length > 50;
        let processedMessages = messages;
        if (shouldApplyWindowing) {
            console.log('Applying message windowing due to', messages.length, 'messages');
            // Keep system messages and recent conversation history
            const systemMessages = messages.filter(m => m.role === 'system');
            const nonSystemMessages = messages.filter(m => m.role !== 'system');
            const windowedNonSystemMessages = nonSystemMessages.slice(-env_1.config.messageWindowSize);
            processedMessages = [...systemMessages, ...windowedNonSystemMessages];
        }
        try {
            // Check if we already have a system message from the frontend
            const hasSystemMessage = processedMessages.some(m => m.role === 'system');
            console.log('Has system message from frontend:', hasSystemMessage);
            if (hasSystemMessage) {
                console.log('Using messages from frontend with system prompt');
                // Use the messages as-is since frontend already has system prompt
                const completion = yield openai.chat.completions.create({
                    model: env_1.config.azureOpenAiModel,
                    messages: processedMessages,
                    max_tokens: 800,
                    temperature: 0.7,
                    top_p: 0.95,
                    frequency_penalty: 0,
                    presence_penalty: 0
                });
                return Object.assign(Object.assign({}, completion.choices[0].message), { usage: completion.usage });
            }
            else {
                console.log('No system message from frontend, using template manager');
                // Fallback: use template manager if no system message from frontend
                const { systemMessage, configuration } = templateManager_1.TemplateManager.getContextualPrompt(processedMessages);
                const messagesWithSystem = [
                    { role: 'system', content: systemMessage },
                    ...processedMessages.filter(m => m.role !== 'system')
                ];
                const completion = yield openai.chat.completions.create({
                    model: env_1.config.azureOpenAiModel,
                    messages: messagesWithSystem,
                    max_tokens: configuration.max_tokens || 800,
                    temperature: configuration.temperature || 0.7,
                    top_p: configuration.top_p || 0.95,
                    frequency_penalty: configuration.frequency_penalty || 0,
                    presence_penalty: configuration.presence_penalty || 0
                });
                return Object.assign(Object.assign({}, completion.choices[0].message), { usage: completion.usage });
            }
        }
        catch (error) {
            console.error('Error in chat completion:', error);
            // Fallback to simple completion with original messages
            const completion = yield openai.chat.completions.create({
                model: env_1.config.azureOpenAiModel,
                messages: processedMessages,
            });
            return Object.assign(Object.assign({}, completion.choices[0].message), { usage: completion.usage });
        }
    });
}
