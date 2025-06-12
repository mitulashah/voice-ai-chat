import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useTemplate } from './TemplateContext';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface ChatContextType {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps { children: React.ReactNode }

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { currentTemplate } = useTemplate();
  const initRef = useRef(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // Seed initial system prompt once when template is first available
  useEffect(() => {
    if (!currentTemplate || initRef.current) return;
    setMessages([{ role: 'system', content: currentTemplate.prompt, timestamp: Date.now() }]);
    initRef.current = true;
  }, [currentTemplate]);

  return (
    <ChatContext.Provider value={{ messages, setMessages }}>
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
