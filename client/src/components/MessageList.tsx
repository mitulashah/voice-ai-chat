import React from 'react';
import { Box, Avatar, Button, CircularProgress, IconButton, useTheme, styled } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { VolumeUp as VolumeUpIcon } from '@mui/icons-material';

const MessageBubble = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isUser',
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
  fontSize: '0.95em',
  wordBreak: 'break-word',
  textAlign: 'left',
}));

const SystemPromptBar = styled(Box)(({ theme }) => ({
  width: '100%',
  background: theme.palette.grey[200],
  color: theme.palette.text.primary,
  borderRadius: 0,
  boxShadow: theme.shadows[1],
  padding: '4px 16px 4px 32px', // reduce vertical and horizontal padding
  marginBottom: '8px',
  display: 'flex',
  alignItems: 'center',
  minHeight: 22, // half the previous height
  position: 'relative',
  fontSize: '0.75em', // 25% smaller font size
}));

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface MessageListProps {
  messages: Message[];
  expandedSystemIndexes: Set<number>;
  setExpandedSystemIndexes: React.Dispatch<React.SetStateAction<Set<number>>>;
  avatarUrl: string;
  playAudio: (content: string, id: string, gender: string) => void;
  isPlaying: boolean;
  currentPlayingId: string | null;
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  expandedSystemIndexes,
  setExpandedSystemIndexes,
  avatarUrl,
  playAudio,
  isPlaying,
  currentPlayingId,
  isLoading,
  messagesEndRef,
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }}>
      {messages.map((message, index) => {
        if (message.role === 'system') {
          const isExpanded = expandedSystemIndexes.has(index);
          return (
            <Box key={index} sx={{ mb: 2, width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
              <SystemPromptBar>                <Button
                  size="small"
                  onClick={() => {
                    const newSet = new Set(expandedSystemIndexes);
                    if (isExpanded) newSet.delete(index);
                    else newSet.add(index);
                    setExpandedSystemIndexes(newSet);
                  }}
                  sx={{
                    minWidth: 0,
                    position: 'absolute',
                    left: 4,
                    top: isExpanded ? 4 : '50%',
                    transform: isExpanded ? 'none' : 'translateY(-50%)',
                    fontSize: '.9rem',
                    p: 0,
                    width: 20,
                    height: 20
                  }}
                >
                  {isExpanded ? '−' : '+'}
                </Button>
                <Box sx={{ pl: 1.2, width: '100%' }}>
                  {isExpanded ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  ) : (
                    <Box sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8em', letterSpacing: 1, textTransform: 'uppercase' }}>SYSTEM PROMPT</Box>
                  )}
                </Box>
              </SystemPromptBar>
            </Box>
          );
        }
        return (
          <Box
            key={index}
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 1.2,
              width: '100%'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-end',
                maxWidth: '85%',
              }}
            >
              {message.role === 'assistant' && (
                <Avatar
                  src={avatarUrl}
                  sx={{
                    width: 36,
                    height: 36,
                    mr: 1.5,
                    border: `2px solid ${theme.palette.primary.main}`,
                  }}
                />
              )}
              <MessageBubble
                isUser={message.role === 'user'}
                sx={{
                  fontSize: '0.95em',
                  px: 1.2,
                  py: 0.7,
                  ...(message.role === 'user' && {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    ml: 'auto',  // push bubble to right
                  }),
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                {message.role === 'assistant' && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      const voiceGender = avatarUrl.includes('/men/') ? 'male' : 'female';
                      playAudio(message.content, `msg-${index}`, voiceGender);
                    }}
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
                    ml: 1.5,
                    width: 32,
                    height: 32,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    letterSpacing: 1,
                  }}
                >
                  YOU
                </Avatar>
              )}
            </Box>
          </Box>
        );
      })}
      {isLoading && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            bgcolor: 'grey.100',
            px: 2,
            py: 1.5,
            borderRadius: 4,
          }}
        >
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'text.secondary',
                animation: `${theme.transitions.create('transform', {
                  duration: 1400,
                  easing: theme.transitions.easing.easeInOut,
                })} 1.4s infinite both`,
                animationDelay: `${i * 0.16}s`,
              }}
            />
          ))}
        </Box>
      )}
      {/* anchor element for auto-scrolling */}
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default MessageList;
