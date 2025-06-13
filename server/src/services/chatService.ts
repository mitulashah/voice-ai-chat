import { TemplateManager } from '../prompts/templateManager';
import OpenAI from 'openai';
import { config } from '../config/env';

let openai: OpenAI | null = null;
if (config.azureOpenAiEndpoint && config.azureOpenAiKey) {
  openai = new OpenAI({
    apiKey: config.azureOpenAiKey,
    baseURL: `${config.azureOpenAiEndpoint}/openai/deployments/${config.azureOpenAiDeployment}`,
    defaultQuery: { 'api-version': '2023-05-15' },
    defaultHeaders: { 'api-key': config.azureOpenAiKey },
  });
}

export async function getChatCompletion(messages: any[]) {
  if (!openai) throw new Error('OpenAI client not initialized');
  try {
    const { systemMessage, configuration } = TemplateManager.getContextualPrompt(messages);
    const messagesWithSystem = [
      { role: 'system', content: systemMessage },
      ...messages
    ];
    const completion = await openai.chat.completions.create({
      model: config.azureOpenAiModel,
      messages: messagesWithSystem,
      max_tokens: configuration.max_tokens || 800,
      temperature: configuration.temperature || 0.7,
      top_p: configuration.top_p || 0.95,
      frequency_penalty: configuration.frequency_penalty || 0,
      presence_penalty: configuration.presence_penalty || 0
    });
    return completion.choices[0].message;
  } catch (promptError) {
    // Fallback to original behavior without template
    const completion = await openai.chat.completions.create({
      model: config.azureOpenAiModel,
      messages: messages,
    });
    return completion.choices[0].message;
  }
}
