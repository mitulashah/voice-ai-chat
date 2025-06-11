import React, { useState, useRef, useEffect } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useAzureSpeechRecognition } from '../hooks/useAzureSpeechRecognition';
import { useRetry } from '../hooks/useRetry';
import {
  Container,
  Paper,
  useTheme,
  Alert,
  Snackbar
} from '@mui/material';
import ChatHeader from './ChatHeader';
import axios from 'axios';
import { useTemplate } from '../context/TemplateContext';
import MessageList from './MessageList';
import VoiceInputBar from './VoiceInputBar';
import ExportDialog from './ExportDialog';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [exportJson, setExportJson] = useState<string | null>(null);
  const { currentTemplate } = useTemplate();

  // Reset chat history when a new template is selected
  useEffect(() => {
    // Initialize or reset chat history with selected template's system message
    if (currentTemplate) {
      setMessages([{ role: 'system', content: currentTemplate.prompt, timestamp: Date.now() }]);
    } else {
      setMessages([]);
    }
  }, [currentTemplate]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const { playAudio, isPlaying, currentPlayingId } = useAudioPlayer();
  const { executeWithRetry } = useRetry({ maxAttempts: 3, delayMs: 1000 });

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
  };

  const handleVoiceInput = async (transcript: string) => {
    if (!transcript.trim()) return;

    const userMessage: Message = { role: 'user', content: transcript, timestamp: Date.now() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await executeWithRetry(
        () => axios.post('http://localhost:5000/api/chat', {
          messages: updatedMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
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

  return (
    <Container maxWidth="md" sx={{ height: '100vh', display: 'flex', flexDirection: 'column', py: 2 }}>
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
          handleEndConversation={handleEndConversation}
        />
      </Paper>

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
