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
// Removed invalid SDK type import; using local types instead
const env_1 = require("../config/env");
const statsService_1 = __importDefault(require("./statsService"));
let openai = null;
if (env_1.config.azureOpenAiEndpoint && env_1.config.azureOpenAiKey) {
    openai = new openai_1.default({
        apiKey: env_1.config.azureOpenAiKey,
        baseURL: `${env_1.config.azureOpenAiEndpoint}/openai/deployments/${env_1.config.azureOpenAiDeployment}`,
        defaultQuery: { 'api-version': '2023-05-15' },
        defaultHeaders: { 'api-key': env_1.config.azureOpenAiKey },
    });
}
function getChatCompletion(messages_1) {
    return __awaiter(this, arguments, void 0, function* (messages, statsSvc = statsService_1.default) {
        var _a, _b;
        if (!openai)
            throw new Error('OpenAI client not initialized');
        // Separate client-supplied system prompts and non-system messages
        const systemMessagesRaw = messages.filter(m => m.role === 'system');
        const nonSystemMessagesRaw = messages.filter(m => m.role !== 'system');
        const windowedNonSystemRaw = nonSystemMessagesRaw.slice(-env_1.config.messageWindowSize);
        // Map to SDK message param type
        // Map to local typed payloads
        const systemMessages = systemMessagesRaw.map(m => ({ role: m.role, content: m.content }));
        const windowedNonSystem = windowedNonSystemRaw.map(m => ({ role: m.role, content: m.content }));
        // Build the final messages array for OpenAI, preferring client system prompts
        // Build final array of messages, using our local type
        let messagesForOpenAi;
        if (systemMessages.length > 0) {
            messagesForOpenAi = [...systemMessages, ...windowedNonSystem];
        }
        else {
            // Fallback to server-side template selection if none provided
            const { systemMessage, configuration } = templateManager_1.TemplateManager.getContextualPrompt(messages);
            const fallbackSystemMsg = { role: 'system', content: systemMessage };
            messagesForOpenAi = [fallbackSystemMsg, ...windowedNonSystem];
        }
        try {
            // Cast at API boundary to satisfy SDK types
            const completion = yield openai.chat.completions.create({
                model: env_1.config.azureOpenAiModel,
                messages: messagesForOpenAi,
            });
            // Record token usage
            if ((_a = completion.usage) === null || _a === void 0 ? void 0 : _a.total_tokens) {
                statsSvc.recordTokens(completion.usage.total_tokens);
            }
            return Object.assign(Object.assign({}, completion.choices[0].message), { usage: completion.usage });
        }
        catch (error) {
            const retryCompletion = yield openai.chat.completions.create({
                model: env_1.config.azureOpenAiModel,
                messages: messagesForOpenAi,
            });
            if ((_b = retryCompletion.usage) === null || _b === void 0 ? void 0 : _b.total_tokens) {
                statsSvc.recordTokens(retryCompletion.usage.total_tokens);
            }
            return Object.assign(Object.assign({}, retryCompletion.choices[0].message), { usage: retryCompletion.usage });
        }
    });
}
