import React, { useState, useRef, useEffect } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { 
  Box, 
  Button, 
  Container, 
  Paper, 
  TextField, 
  Typography, 
  IconButton, 
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  useTheme,
} from '@mui/material';
import { 
  Mic as MicIcon, 
  MicOff as MicOffIcon, 
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as AssistantIcon,
  VolumeUp as VolumeUpIcon
} from '@mui/icons-material';
import axios from 'axios';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Extend the Window interface to include webkitSpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! How can I assist you today? You can click the microphone to start speaking.' }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const recognitionRef = useRef<any>(null);
  const { playAudio, isPlaying, currentPlayingId, stopAudio } = useAudioPlayer();

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
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
    }
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Try using Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
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

  return (
    <Container maxWidth="md" sx={{ height: '100vh', display: 'flex', flexDirection: 'column', py: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 3 }}>
        Voice AI Chat
      </Typography>
      
      <Paper 
        elevation={3} 
        sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
          mb: 2
        }}
      >
        <List sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {messages.map((message, index) => (
            <React.Fragment key={index}>
              <ListItem 
                alignItems="flex-start"
                sx={{
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  textAlign: message.role === 'user' ? 'right' : 'left'
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{
                    bgcolor: message.role === 'user' 
                      ? theme.palette.primary.main 
                      : theme.palette.secondary.main
                  }}>
                    {message.role === 'user' ? <PersonIcon /> : <AssistantIcon />}
                  </Avatar>
                </ListItemAvatar>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="body1" 
                        component="div"
                        sx={{
                          display: 'inline-block',
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: message.role === 'user' 
                            ? theme.palette.primary.light 
                            : theme.palette.grey[200],
                          color: message.role === 'user' 
                            ? theme.palette.primary.contrastText 
                            : theme.palette.text.primary,
                          maxWidth: 'calc(100% - 48px)',
                          textAlign: 'left',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                          mr: 1
                        }}
                      >
                        {message.content}
                      </Typography>
                    }
                  />
                  {message.role === 'assistant' && (
                    <IconButton 
                      size="small" 
                      onClick={() => playAudio(message.content, `msg-${index}`)}
                      disabled={isPlaying && currentPlayingId === `msg-${index}`}
                      sx={{ 
                        alignSelf: 'center',
                        color: theme.palette.primary.main,
                        '&:hover': {
                          backgroundColor: 'rgba(25, 118, 210, 0.04)'
                        }
                      }}
                    >
                      {isPlaying && currentPlayingId === `msg-${index}` ? (
                        <CircularProgress size={20} />
                      ) : (
                        <VolumeUpIcon fontSize="small" />
                      )}
                    </IconButton>
                  )}
                </Box>
              </ListItem>
              {index < messages.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
          {isLoading && (
            <Box display="flex" justifyContent="center" my={2}>
              <CircularProgress size={24} />
            </Box>
          )}
          <div ref={messagesEndRef} />
        </List>
      </Paper>

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          multiline
          maxRows={4}
          sx={{ flex: 1 }}
        />
        <IconButton 
          color={isListening ? 'secondary' : 'default'}
          onClick={toggleListening}
          sx={{ alignSelf: 'flex-end', height: '56px' }}
        >
          {isListening ? <MicOffIcon /> : <MicIcon />}
        </IconButton>
        <Button 
          type="submit" 
          variant="contained" 
          color="primary"
          disabled={!input.trim() || isLoading}
          sx={{ alignSelf: 'flex-end', height: '56px' }}
        >
          <SendIcon />
        </Button>
      </Box>
    </Container>
  );
};

export default ChatInterface;
