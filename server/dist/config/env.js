"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: process.env.PORT || 5000,
    azureOpenAiEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
    azureOpenAiKey: process.env.AZURE_OPENAI_KEY,
    azureOpenAiDeployment: process.env.AZURE_OPENAI_DEPLOYMENT,
    azureOpenAiModel: process.env.AZURE_OPENAI_MODEL || 'gpt-4',
    azureSpeechKey: process.env.AZURE_SPEECH_KEY || 'your-azure-speech-key',
    azureSpeechRegion: process.env.AZURE_SPEECH_REGION || 'eastus', // Azure AI Agent Service configuration
    azureAiProjectConnectionString: process.env.AZURE_AI_PROJECT_CONNECTION_STRING,
    azureAiFoundryProjectEndpoint: process.env.AZURE_AI_FOUNDRY_PROJECT_ENDPOINT,
    azureEvaluationAgentId: process.env.AZURE_EVALUATION_AGENT_ID,
    // Message window configuration
    // Ensure messageWindowSize is at least 20, parsing in base 10
    messageWindowSize: Math.max(parseInt(process.env.MESSAGE_WINDOW_SIZE || '20', 10), 20),
};
