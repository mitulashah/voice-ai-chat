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

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

const ChatInterface: React.FC = () => {
  const { currentTemplate } = useTemplate();
  // Load persisted messages or start with system prompt
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('chatMessages');
    return saved ? (JSON.parse(saved) as Message[]) : [];
  });
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
  }, [messages]);

  // Seed the system prompt only on initial mount
  useEffect(() => {
    if (messages.length === 0 && currentTemplate) {
      setMessages([{ role: 'system', content: currentTemplate.prompt, timestamp: Date.now() }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Update system prompt when the selected scenario/template changes
  useEffect(() => {
    if (!currentTemplate) return;
    setMessages(prev => {
      if (prev.length > 0 && prev[0].role === 'system') {
        // Update existing system prompt content
        return [{ role: 'system', content: currentTemplate.prompt, timestamp: prev[0].timestamp }, ...prev.slice(1)];
      }
      // Prepend system prompt if missing
      return [{ role: 'system', content: currentTemplate.prompt, timestamp: Date.now() }, ...prev];
    });
  }, [currentTemplate?.id]);

  // Track timestamps and end conversation
  const handleEndConversation = () => {
    if (messages.length === 0) return;
    const endTime = Date.now();
    const startTime = messages[0].timestamp;
    const durationMs = endTime - startTime;
    const exportData = {
      messages: messages.map(msg => ({ role: msg.role, content: msg.content, timestamp: msg.timestamp })),
      totalDurationMs: durationMs
    };
    const jsonString = JSON.stringify(exportData, null, 2);
    setExportJson(jsonString);
    // Reset to only the initial system prompt
    if (currentTemplate) {
      setMessages([{ role: 'system', content: currentTemplate.prompt, timestamp: Date.now() }]);
    } else {
      setMessages([]);
    }
  };
  // Clear chat but keep only the system prompt
  const handleClearChat = () => {
    if (currentTemplate) {
      setMessages([{ role: 'system', content: currentTemplate.prompt, timestamp: Date.now() }]);
    } else {
      setMessages([]);
    }
  };

  const handleVoiceInput = async (transcript: string) => {
    if (!transcript.trim()) return;

    const userMessage: Message = { role: 'user', content: transcript, timestamp: Date.now() };
    // Append user message
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await executeWithRetry(
        () => axios.post('http://localhost:5000/api/chat', {
          messages: [...messages, userMessage].map(({ role, content }) => ({ role, content }))
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
        timestamp: Date.now()
      };
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

  // Render the expandable menu bar and chat header
  return (
    <Container maxWidth="md" sx={{ height: '100vh', display: 'flex', flexDirection: 'column', py: 2 }}>
      <MenuBar />
      <ChatHeader 
        name="Training Agent"
        avatarUrl={avatarUrl}
      />
       <Paper
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 1,
          borderRadius: 3,
          boxShadow: 2,
          backgroundColor: theme.palette.background.paper,
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          width: '100%',
          maxWidth: 'none',
          mx: 0,
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
      </Paper>
      {/* Button bar for conversation controls (outside chat panel) */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 1 }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={handleClearChat}
          sx={{
            textTransform: 'none',
            mr: 1,
            color: 'grey.700',
            borderColor: 'grey.400',
            '&:hover': {
              borderColor: 'grey.600',
              backgroundColor: 'grey.100',
              color: 'grey.900',
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
            backgroundColor: '#FF7F50', // coral/peach
            '&:hover': { backgroundColor: '#E06C47' }
          }}
        >
          Evaluate Conversation
        </Button>
      </Box>

     <Snackbar
       open={Boolean(errorMessage)}
       autoHideDuration={6000}
       onClose={() => setErrorMessage(null)}
       anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
