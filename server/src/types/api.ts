// Shared API types for server

export interface Persona {
  id: string;
  name: string;
  demographics?: Record<string, any>;
  behavior?: string;
  needs?: string;
  painpoints?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
}

export interface ChatResponse {
  role: 'assistant';
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
