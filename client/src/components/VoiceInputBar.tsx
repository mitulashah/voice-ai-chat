import React from 'react';
import { Box, IconButton, Typography, useTheme } from '@mui/material';
import { Mic as MicIcon, MicOff as MicOffIcon } from '@mui/icons-material';

interface VoiceInputBarProps {
  isListening: boolean;
  toggleListening: () => void;
}

const VoiceInputBar: React.FC<VoiceInputBarProps> = ({ isListening, toggleListening }) => {
  const theme = useTheme();
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      pt: 1,
      borderTop: `1px solid ${theme.palette.divider}`,
      minHeight: 0,
    }}>
      <IconButton
        onClick={toggleListening} 
        color={isListening ? 'error' : 'primary'}
        sx={{ 
          width: 56,
          height: 56,
          bgcolor: isListening ? 'error.main' : 'primary.main',
          '&:hover': {
            bgcolor: isListening ? 'error.dark' : 'primary.dark',
            transform: 'scale(1.05)',
          },
          transition: 'all 0.2s',
          boxShadow: 2,
          mb: 0.5,
        }}
      >
        {isListening ? (
          <MicOffIcon sx={{ color: 'white', fontSize: 28 }} />
        ) : (
          <MicIcon sx={{ color: 'white', fontSize: 28 }} />
        )}
      </IconButton>
      {isListening && (
        <Typography
          variant="body2"
          color="textSecondary"
          align="center"
          sx={{ mb: 0.5, fontSize: '0.85em' }}
        >
          Listening... Speak now
        </Typography>
      )}
      <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'center', maxWidth: '80%', fontSize: '0.85em' }}>
        {isListening ? 'Click to stop' : 'Click and speak to chat'}
      </Typography>
    </Box>
  );
};

export default VoiceInputBar;
