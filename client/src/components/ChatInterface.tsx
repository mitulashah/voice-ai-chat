import React, { useState, useRef, useEffect } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { 
  Container, 
  Box, 
  Paper, 
  IconButton, 
  CircularProgress,
  useTheme,
  Typography,
  styled,
  keyframes,
  Avatar
} from '@mui/material';
import ChatHeader from './ChatHeader';
import { 
  Mic as MicIcon, 
  MicOff as MicOffIcon,
  VolumeUp as VolumeUpIcon
} from '@mui/icons-material';

import axios from 'axios';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

// Animation for typing indicator
const bounce = keyframes`
  0%, 80%, 100% { 
    transform: scale(0);
    opacity: 0.5;
  }  
  40% { 
    transform: scale(1);
    opacity: 1;
  }
`;

// Styled component for message bubbles
const MessageBubble = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isUser'
})<{ isUser: boolean }>(({ theme, isUser }) => ({
  position: 'relative',
  maxWidth: '70%',
  padding: '12px 16px',
  borderRadius: isUser 
    ? '18px 18px 4px 18px' 
    : '18px 18px 18px 4px',
  backgroundColor: isUser 
    ? theme.palette.primary.main 
    : theme.palette.grey[100],
  color: isUser 
    ? theme.palette.primary.contrastText 
    : theme.palette.text.primary,
  marginBottom: '8px',
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  boxShadow: theme.shadows[1],
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    [isUser ? 'right' : 'left']: '-8px',
    width: 0,
    height: 0,
    border: '8px solid transparent',
    borderTopColor: isUser 
      ? theme.palette.primary.main 
      : theme.palette.grey[100],
    borderBottom: 0,
    borderRight: isUser ? 'none' : '8px solid transparent',
    borderLeft: isUser ? '8px solid transparent' : 'none',
    transform: isUser 
      ? 'translateX(8px) translateY(8px) rotate(45deg)'
      : 'translateX(-8px) translateY(8px) rotate(-45deg)'
  }
}));

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! Click the microphone to start speaking. I\'m here to help!' }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const recognitionRef = useRef<any>(null);
  const { playAudio, isPlaying, currentPlayingId } = useAudioPlayer();

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I had trouble understanding. Please try speaking again.'
        }]);
      };
    } else {
      console.error('Speech recognition not supported');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Speech recognition is not supported in your browser. Please use Chrome or Edge.'
      }]);
    }
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Error accessing microphone. Please ensure you\'ve granted microphone permissions.'
        }]);
      }
    }
  };

  const handleVoiceInput = async (transcript: string) => {
    if (!transcript.trim()) return;

    const userMessage: Message = { role: 'user', content: transcript };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/chat', {
        messages: updatedMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.content
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Play the audio response
      await playAudio(assistantMessage.content, `msg-${messages.length + 1}`);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const [avatarUrl, setAvatarUrl] = useState<string>('');
  
  // Generate a random avatar URL when component mounts
  useEffect(() => {
    const gender = Math.random() > 0.5 ? 'men' : 'women';
    const userId = Math.floor(Math.random() * 100);
    setAvatarUrl(`https://randomuser.me/api/portraits/${gender}/${userId}.jpg`);
  }, []);

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
          p: 2,
          borderRadius: 4,
          boxShadow: 3,
          backgroundColor: theme.palette.background.paper,
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* Messages container */}
        <Box sx={{ flex: 1, overflowY: 'auto', mb: 2, pr: 1 }}>
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  maxWidth: '90%',
                }}
              >
                {message.role === 'assistant' && (
                  <Avatar 
                    src={avatarUrl}
                    sx={{ 
                      width: 36, 
                      height: 36, 
                      mr: 1,
                      border: `2px solid ${theme.palette.primary.main}`
                    }}
                  />
                )}
                <MessageBubble 
                  isUser={message.role === 'user'}
                  sx={{
                    ...(message.role === 'user' && {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                    }),
                  }}
                >
                  {message.content}
                  {message.role === 'assistant' && (
                    <IconButton
                      size="small"
                      onClick={() => playAudio(message.content, `msg-${index}`)}
                      disabled={isPlaying && currentPlayingId === `msg-${index}`}
                      sx={{
                        position: 'absolute',
                        right: 4,
                        bottom: 4,
                        color: 'inherit',
                        opacity: 0.7,
                        '&:hover': { opacity: 1 },
                      }}
                    >
                      {isPlaying && currentPlayingId === `msg-${index}` ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <VolumeUpIcon fontSize="small" />
                      )}
                    </IconButton>
                  )}
                </MessageBubble>
                {message.role === 'user' && (
                  <Avatar 
                    sx={{ 
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      ml: 1,
                      width: 36,
                      height: 36,
                      fontSize: '1rem',
                    }}
                  >
                    You
                  </Avatar>
                )}
              </Box>
            </Box>
          ))}
          
          {isLoading && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              bgcolor: 'grey.100',
              px: 2,
              py: 1.5,
              borderRadius: 4,
            }}>
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'text.secondary',
                    animation: `${bounce} 1.4s infinite ease-in-out both`,
                    animationDelay: `${i * 0.16}s`,
                  }}
                />
              ))}
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Voice input controls */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          pt: 2,
          borderTop: `1px solid ${theme.palette.divider}`
        }}>
          <IconButton
            onClick={toggleListening} 
            color={isListening ? 'error' : 'primary'}
            sx={{ 
              width: 80,
              height: 80,
              bgcolor: isListening ? 'error.main' : 'primary.main',
              '&:hover': {
                bgcolor: isListening ? 'error.dark' : 'primary.dark',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s',
              boxShadow: 3,
              mb: 1,
            }}
          >
            {isListening ? (
              <MicOffIcon sx={{ color: 'white', fontSize: 40 }} />
            ) : (
              <MicIcon sx={{ color: 'white', fontSize: 40 }} />
            )}
          </IconButton>
          {isListening && (
            <Typography
              variant="body2"
              color="textSecondary"
              align="center"
              sx={{ mb: 1 }}
            >
              Listening... Speak now
            </Typography>
          )}
          <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'center', maxWidth: '80%' }}>
            {isListening ? 'Click to stop' : 'Click and speak to chat'}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ChatInterface;
