import React, { useRef, useState, useEffect } from 'react';
import { useTemplate } from './TemplateContext';
import type { Message } from './chat-types';
import { ChatContext } from './chat-context';

interface ChatProviderProps { children: React.ReactNode }

const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
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

export default ChatProvider;
