import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  azureOpenAiEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
  azureOpenAiKey: process.env.AZURE_OPENAI_KEY,
  azureOpenAiDeployment: process.env.AZURE_OPENAI_DEPLOYMENT,
  azureOpenAiModel: process.env.AZURE_OPENAI_MODEL || 'gpt-4',
  azureSpeechKey: process.env.AZURE_SPEECH_KEY || 'your-azure-speech-key',
  azureSpeechRegion: process.env.AZURE_SPEECH_REGION || 'eastus',
};
