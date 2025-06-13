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
    azureSpeechRegion: process.env.AZURE_SPEECH_REGION || 'eastus',
};
