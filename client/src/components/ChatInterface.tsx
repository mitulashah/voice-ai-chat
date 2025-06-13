import React, { useEffect, useState } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useAzureSpeechRecognition } from '../hooks/useAzureSpeechRecognition';
import { useRetry } from '../hooks/useRetry';
import {
  Container,
  Paper,
  useTheme,
  Alert,
  Snackbar,
  Box,
  Button
} from '@mui/material';
import MenuBar from './MenuBar';
import ChatHeader from './ChatHeader';
import axios from 'axios';
import MessageList from './MessageList';
import VoiceInputBar from './VoiceInputBar';
import ExportDialog from './ExportDialog';
import { useTemplate } from '../context/TemplateContext';
import { useChat } from '../context/ChatContext';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const ChatInterface: React.FC = () => {
  const { currentTemplate } = useTemplate();
  const { messages, setMessages, totalTokens, setTotalTokens } = useChat();
  
  const [exportJson, setExportJson] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const messagesRef = React.useRef<Message[]>(messages);
  const theme = useTheme();
  const { playAudio, isPlaying, currentPlayingId } = useAudioPlayer();
  const { executeWithRetry } = useRetry({ maxAttempts: 3, delayMs: 1000 });
  // Keep messagesRef in sync and persist to storage
  useEffect(() => {
    messagesRef.current = messages;
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    localStorage.setItem('totalTokens', totalTokens.toString());
  }, [messages, totalTokens]);  // Seed the system prompt only on initial mount
  useEffect(() => {
    if (messages.length === 0 && currentTemplate) {
      setMessages([{ role: 'system', content: currentTemplate.prompt, timestamp: Date.now() }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Reset conversation when the selected scenario/template changes
  useEffect(() => {
    if (!currentTemplate) return;
    const sysMsg: Message = { role: 'system', content: currentTemplate.prompt, timestamp: Date.now() };
    // Reset messages to only the new system prompt
    setMessages([sysMsg]);
    // Reset token count
    setTotalTokens(0);
    // Persist the reset state
    localStorage.setItem('chatMessages', JSON.stringify([sysMsg]));
    localStorage.removeItem('totalTokens');
  }, [currentTemplate?.id]);  // Track timestamps and end conversation
  const handleEndConversation = () => {
    if (messages.length === 0) return;
    const endTime = Date.now();
    
    // Find the first user message to start the timer from
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    const startTime = firstUserMessage ? firstUserMessage.timestamp : endTime;
    const durationMs = endTime - startTime;
    
    const exportData = {
      messages: messages.map(msg => ({ 
        role: msg.role, 
        content: msg.content, 
        timestamp: msg.timestamp,
        usage: msg.usage 
      })),
      totalDurationMs: durationMs,
      totalTokensUsed: totalTokens,
      messageCount: messages.filter(m => m.role !== 'system').length
    };
    const jsonString = JSON.stringify(exportData, null, 2);
    setExportJson(jsonString);
    // Reset to only the initial system prompt and clear token count
    if (currentTemplate) {
      setMessages([{ role: 'system', content: currentTemplate.prompt, timestamp: Date.now() }]);
      setTotalTokens(0);
      localStorage.removeItem('totalTokens');
    } else {
      setMessages([]);
      setTotalTokens(0);
      localStorage.removeItem('totalTokens');
    }
  };  // Clear chat but keep only the system prompt
  const handleClearChat = () => {
    if (currentTemplate) {
      setMessages([{ role: 'system', content: currentTemplate.prompt, timestamp: Date.now() }]);
      setTotalTokens(0);
      localStorage.removeItem('totalTokens');
    } else {
      setMessages([]);
      setTotalTokens(0);
      localStorage.removeItem('totalTokens');
    }
  };

  const handleVoiceInput = async (transcript: string) => {
    if (!transcript.trim()) return;

    const userMessage: Message = { role: 'user', content: transcript, timestamp: Date.now() };
    // Compute updatedMessages to include the new user message and update state
    let updatedMessages: Message[] = [];
    setMessages(prev => {
      updatedMessages = [...prev, userMessage];
      return updatedMessages;
    });
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await executeWithRetry(
        () => axios.post('http://localhost:5000/api/chat', {
          // Send the full messages thread for context
          messages: updatedMessages.map(({ role, content }) => ({ role, content }))
        }),
        (error, attempt) => {
          console.error(`Attempt ${attempt} failed:`, error);
          if (error instanceof Error) {
            setErrorMessage(
              `Network error (attempt ${attempt}/3). Retrying...`
            );
          }
        }
      );

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.content,
        timestamp: Date.now(),
        usage: response.data.usage
      };
      
      // Update total token count if usage data is available
      if (response.data.usage) {
        setTotalTokens(prev => prev + response.data.usage.total_tokens);
      }
      
      // Append assistant message
      setMessages(prev => [...prev, assistantMessage]);
      
      try {
        // Derive voice gender from avatarUrl for TTS playback
        const voiceGender = avatarUrl.includes('/men/') ? 'male' : 'female';
        await executeWithRetry(
          () => playAudio(assistantMessage.content, `msg-${messages.length + 1}`, voiceGender),
          (error, attempt) => {
            console.error(`Audio playback attempt ${attempt} failed:`, error);
          }
        );
      } catch (audioError) {
        console.error('Audio playback failed after retries:', audioError);
        setErrorMessage('Failed to play audio response. Please try again.');
      }
      
    } catch (error) {
      console.error('Error sending message after retries:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered a network error. Please check your connection and try again.',
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const { isListening, error, startListening, stopListening } = useAzureSpeechRecognition(handleVoiceInput);

  // Update error message when speech recognition error occurs
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
    }
  }, [error]);

  const toggleListening = async () => {
    if (isListening) {
      stopListening();
    } else {
      await startListening();
    }
  };

  const [avatarUrl, setAvatarUrl] = useState<string>('');
  
  // Generate a random avatar URL when component mounts
  useEffect(() => {
     const genderKey = Math.random() > 0.5 ? 'men' : 'women';
     const userId = Math.floor(Math.random() * 100);
     setAvatarUrl(`https://randomuser.me/api/portraits/${genderKey}/${userId}.jpg`);
   }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Track which system messages are expanded
  const [expandedSystemIndexes, setExpandedSystemIndexes] = useState<Set<number>>(new Set());
  // Render the expandable menu bar and chat header with Spectrum styling
  return (
    <Container maxWidth="lg" sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      py: 2,
      background: 'transparent'
    }}>
      <MenuBar />
      <ChatHeader 
        name="Training Agent"
        avatarUrl={avatarUrl}
      />
       <Paper
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 3,
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          backgroundColor: theme.palette.background.paper,
          border: '1px solid',
          borderColor: 'grey.200',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          width: '100%',
          maxWidth: 'none',
          mx: 0,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.16)',
          }
        }}
      >
        {/* Messages container */}
        <MessageList
          messages={messages}
          expandedSystemIndexes={expandedSystemIndexes}
          setExpandedSystemIndexes={setExpandedSystemIndexes}
          avatarUrl={avatarUrl}
          playAudio={playAudio}
          isPlaying={isPlaying}
          currentPlayingId={currentPlayingId}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
        />
        {/* Voice input controls */}
        <VoiceInputBar
          isListening={isListening}
          toggleListening={toggleListening}
        />
      </Paper>      {/* Button bar for conversation controls with Spectrum styling */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, mb: 1, gap: 2 }}>        <Button
          variant="outlined"
          color="inherit"
          onClick={handleClearChat}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '.9rem',
            borderRadius: 2,
            px: 3,
            py: 1.5,
            color: 'grey.700',
            borderColor: 'grey.300',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: theme.palette.primary.main,
              backgroundColor: 'rgba(0, 102, 204, 0.04)',
              color: theme.palette.primary.main,
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0, 102, 204, 0.15)',
            },
          }}
        >
          Clear Chat
        </Button>
        <Button
          variant="contained"
          onClick={handleEndConversation}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '.9rem',
            borderRadius: 2,
            px: 3,
            py: 1.5,
            background: 'linear-gradient(135deg, #ff6b35 0%, #cc4a1a 100%)',
            transition: 'all 0.3s ease',
            '&:hover': { 
              background: 'linear-gradient(135deg, #cc4a1a 0%, #994d1f 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
            }
          }}
        >
          Evaluate Conversation
        </Button>
      </Box>     <Snackbar
       open={Boolean(errorMessage)}
       autoHideDuration={6000}
       onClose={() => setErrorMessage(null)}
       anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
       disableWindowBlurListener={true}
     >
       <Alert
         onClose={() => setErrorMessage(null)}
         severity="error"
         sx={{ width: '100%' }}
       >
         {errorMessage}
       </Alert>
     </Snackbar>

     {/* Export JSON Dialog */}
     <ExportDialog
       exportJson={exportJson}
       onClose={() => setExportJson(null)}
       onDownload={(json) => {
         const blob = new Blob([json], { type: 'application/json' });
         const url = URL.createObjectURL(blob);
         const link = document.createElement('a');
         link.href = url;
         link.download = 'conversation.json';
         link.click();
         URL.revokeObjectURL(url);
         setExportJson(null);
       }}
     />
    </Container>
  );
};

export default ChatInterface;
