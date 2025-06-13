import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useTemplate } from './TemplateContext';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ChatContextType {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  totalTokens: number;
  setTotalTokens: React.Dispatch<React.SetStateAction<number>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps { children: React.ReactNode }

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { currentTemplate } = useTemplate();
  const initRef = useRef(false);
  
  // Load persisted messages and token count or start fresh
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('chatMessages');
    return saved ? (JSON.parse(saved) as Message[]) : [];
  });
  
  const [totalTokens, setTotalTokens] = useState<number>(() => {
    const savedTokens = localStorage.getItem('totalTokens');
    return savedTokens ? parseInt(savedTokens, 10) : 0;
  });

  // Seed initial system prompt once when template is first available
  useEffect(() => {
    if (!currentTemplate || initRef.current) return;
    if (messages.length === 0) {
      setMessages([{ role: 'system', content: currentTemplate.prompt, timestamp: Date.now() }]);
    }
    initRef.current = true;
  }, [currentTemplate, messages.length]);

  return (
    <ChatContext.Provider value={{ messages, setMessages, totalTokens, setTotalTokens }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
