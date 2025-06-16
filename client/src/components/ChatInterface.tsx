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
import { useVoice } from '../context/VoiceContext';
import { fetchSubstitutedSystemPrompt } from '../utils/speechApi';
import { usePersonaScenario } from '../context/PersonaScenarioContext';
import { useMood } from '../context/MoodContext';
import type { ScenarioParameters, ChatRequest } from '../context/scenario-parameters';

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
  const { selectedVoice, setSelectedVoice } = useVoice();
  const { selectedPersona, selectedScenario, generatedName, setSelectedPersona, setSelectedScenario } = usePersonaScenario();
  const { selectedMood, setSelectedMood } = useMood();
  
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
  }, [messages, totalTokens]);
  // Seed the system prompt only on initial mount
  useEffect(() => {
    if (messages.length === 0 && currentTemplate) {
      setMessages([{ role: 'system', content: currentTemplate.prompt, timestamp: Date.now() }]);
    }
  }, [messages.length, currentTemplate, setMessages]);
  // Reset conversation when the selected scenario/template changes
  useEffect(() => {
    if (!currentTemplate) return;
    const sysMsg: Message = { role: 'system', content: currentTemplate.prompt, timestamp: Date.now() };
    setMessages([sysMsg]);
    setTotalTokens(0);
    localStorage.setItem('chatMessages', JSON.stringify([sysMsg]));    localStorage.removeItem('totalTokens');
  }, [currentTemplate, setMessages, setTotalTokens]);

  // Fetch and update system prompt from backend when scenario parameters change
  useEffect(() => {
    // Only run if persona, mood, or voice is set
    if (!selectedPersona && !selectedMood && !selectedVoice) return;    const parameters: ScenarioParameters = {
      persona: selectedPersona?.id || '',
      mood: selectedMood?.mood || '',
      name: generatedName?.full || selectedPersona?.name || '',
      gender: generatedName?.gender,
      voice: selectedVoice || '',
      templateName: currentTemplate?.name || '',
      scenarioId: selectedScenario?.id || '',
    };

    console.log('Frontend: Calling fetchSubstitutedSystemPrompt with:', parameters);
    
    fetchSubstitutedSystemPrompt(parameters)
      .then(systemPrompt => {
        console.log('Frontend: Received systemPrompt:', systemPrompt);
        setMessages([{ role: 'system', content: systemPrompt, timestamp: Date.now() }]);
        setTotalTokens(0);
        localStorage.setItem('chatMessages', JSON.stringify([{ role: 'system', content: systemPrompt, timestamp: Date.now() }]));
        localStorage.removeItem('totalTokens');
      })
      .catch(error => {
        console.error('Frontend: Failed to fetch substituted system prompt:', error);
        // fallback to template if backend fails
        if (currentTemplate) {
          setMessages([{ role: 'system', content: currentTemplate.prompt, timestamp: Date.now() }]);
        }
        setTotalTokens(0);
        localStorage.removeItem('totalTokens');
      });
  }, [selectedPersona, selectedScenario, selectedMood, selectedVoice, generatedName, currentTemplate, setMessages, setTotalTokens]);  // Track timestamps and end conversation
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
    
    // Reset all context states
    setSelectedPersona(null);
    setSelectedScenario(null);
    setSelectedMood(null);
    setSelectedVoice(null);
    
    // Reset chat messages and token count
    if (currentTemplate) {
      setMessages([{ role: 'system', content: currentTemplate.prompt, timestamp: Date.now() }]);
      setTotalTokens(0);
      localStorage.removeItem('totalTokens');
    } else {
      setMessages([]);
      setTotalTokens(0);
      localStorage.removeItem('totalTokens');
    }
  };// Clear chat but keep only the system prompt
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
    setErrorMessage(null);    // Collect scenario parameters from context
    const parameters: ScenarioParameters = {
      persona: selectedPersona?.id || '',
      mood: selectedMood?.mood || '',
      name: generatedName?.full || selectedPersona?.name || '',
      gender: generatedName?.gender,
      voice: selectedVoice || '',
      templateName: currentTemplate?.name || '',
      scenarioId: selectedScenario?.id || '',
    };

    try {
      const response = await executeWithRetry(
        () => axios.post('http://localhost:5000/api/chat', {
          // Send the full messages thread for context
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
          parameters,
        } as ChatRequest),
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
      
      try {        // Use selectedVoice if set, otherwise fall back to generated name's gender
        let voiceNameOrGender: string | undefined = selectedVoice || undefined;
        if (!voiceNameOrGender && generatedName) {
          voiceNameOrGender = generatedName.gender;
        } else if (!voiceNameOrGender) {
          // Fallback to avatar URL parsing if no generated name
          voiceNameOrGender = avatarUrl.includes('/men/') ? 'male' : 'female';
        }
        await executeWithRetry(
          () => playAudio(assistantMessage.content, `msg-${messages.length + 1}`, voiceNameOrGender),
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
  
  // Generate avatar URL based on generated name's gender or random if no name
  useEffect(() => {
    const genderKey = generatedName?.gender === 'male' ? 'men' : 
                     generatedName?.gender === 'female' ? 'women' : 
                     Math.random() > 0.5 ? 'men' : 'women';
    const userId = Math.floor(Math.random() * 100);
    setAvatarUrl(`https://randomuser.me/api/portraits/${genderKey}/${userId}.jpg`);
  }, [generatedName]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Track which system messages are expanded
  const [expandedSystemIndexes, setExpandedSystemIndexes] = useState<Set<number>>(new Set());  // Render the expandable menu bar and chat header with Spectrum styling
  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'flex-start', 
        p: 2, 
        bgcolor: theme.palette.background.default,
        overflow: 'hidden' // Prevent the main container from overflowing
      }}
    >
      <Paper 
        elevation={0} 
        sx={{ 
          boxShadow: 'none', 
          background: 'none', 
          border: 'none', 
          p: 0, 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          flex: 1,
          minHeight: 0 // Allow flex shrinking
        }}
      >
        <MenuBar />
        <ChatHeader 
          avatarUrl={avatarUrl} 
          name={currentTemplate?.name && generatedName ? 
            `${currentTemplate.name} with ${generatedName.full}` : 
            currentTemplate?.name || 'Voice AI Chat'} 
        />
        <Paper
          elevation={3}
          sx={{
            p: 3,
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            border: '1px solid',
            borderColor: 'grey.200',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            width: '100%',
            maxWidth: 'none',
            mx: 0,
            minHeight: 0, // Allow flex shrinking
            overflow: 'hidden', // Prevent container overflow
          }}
        >
          {/* Messages container with proper scrolling */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: 0, // Allow flex shrinking
            overflow: 'hidden' // Ensure MessageList handles its own scrolling
          }}>
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
          </Box>
          {/* Voice input controls - fixed at bottom */}
          <Box sx={{ flexShrink: 0, mt: 1 }}>
            <VoiceInputBar
              isListening={isListening}
              toggleListening={toggleListening}
            />
          </Box>        </Paper>
        
        {/* Button bar - fixed at bottom of the main container */}
        <Box
          sx={{
            mt: 2,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 2,
            width: '100%',
            flexShrink: 0, // Prevent buttons from shrinking
          }}
        >
          <Button
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
              background: 'rgba(255,255,255,0.7)',
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
              boxShadow: '0 2px 8px rgba(255, 107, 53, 0.10)',
              '&:hover': { 
                background: 'linear-gradient(135deg, #cc4a1a 0%, #994d1f 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
              }
            }}
          >
            Evaluate Conversation
          </Button>
        </Box>
      </Paper>
      <Snackbar
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
        onClose={async () => {
          setExportJson(null);
          try {
            await fetch('http://localhost:5000/api/stats/reset', { method: 'POST' });
          } catch (e) {
            // Optionally handle error
            console.error('Failed to reset stats:', e);
          }
        }}
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
