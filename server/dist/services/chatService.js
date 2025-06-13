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
        try {
            const { systemMessage, configuration } = templateManager_1.TemplateManager.getContextualPrompt(messages);
            const messagesWithSystem = [
                { role: 'system', content: systemMessage },
                ...messages
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
            return completion.choices[0].message;
        }
        catch (promptError) {
            // Fallback to original behavior without template
            const completion = yield openai.chat.completions.create({
                model: env_1.config.azureOpenAiModel,
                messages: messages,
            });
            return completion.choices[0].message;
        }
    });
}
