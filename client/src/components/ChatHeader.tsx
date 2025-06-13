import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { useTemplate } from '../context/TemplateContext';

// Generate a random user ID for avatar
const getRandomUserId = () => Math.floor(Math.random() * 1000);

interface ChatHeaderProps {
  name?: string;
  avatarUrl?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  name = 'Training Agent',
  avatarUrl,
}) => {
  const [randomAvatarUrl, setRandomAvatarUrl] = useState<string>('');
  // Determine which TTS voice will be used based on avatar gender
  const voiceName = randomAvatarUrl.includes('/men/') ? 'AndrewNeural' : 'JennyNeural';
  const { currentTemplate } = useTemplate();
  const displayName = currentTemplate?.name || name;
  
  useEffect(() => {
    // Use the provided avatarUrl or generate a random one
    if (avatarUrl) {
      setRandomAvatarUrl(avatarUrl);
    } else {
      // Generate a random avatar URL from randomuser.me with timestamp to prevent caching
      const gender = Math.random() > 0.5 ? 'men' : 'women';
      const userId = getRandomUserId();
      const timestamp = new Date().getTime();
      setRandomAvatarUrl(`https://randomuser.me/api/portraits/${gender}/${userId}.jpg?t=${timestamp}`);
    }
  }, [avatarUrl]);  // Fallback to a default avatar with Spectrum styling
  const defaultAvatar = (
    <Avatar
      sx={{
        width: 81,
        height: 81,
        background: 'linear-gradient(135deg, #0066cc 0%, #004499 100%)',
        color: '#ffffff',
        border: '3px solid #ffffff',
        boxShadow: '0 4px 16px rgba(0, 102, 204, 0.3)',
        fontSize: '3rem',
        fontWeight: 600,        mb: 0.75,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'scale(1.05)',
          boxShadow: '0 6px 24px rgba(0, 102, 204, 0.4)',
        }
      }}
    >
      {name.charAt(0).toUpperCase()}
    </Avatar>
  );return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 1.5,
        px: 1,
        gap: 0.75,
        position: 'relative',
        zIndex: 10,
        mb: 1.5,
      }}
    >{randomAvatarUrl ? (
       <Avatar
         src={randomAvatarUrl}
         alt={name}         sx={{ 
           width: 81, 
           height: 81, 
           mb: 0.75,
           border: '3px solid #ffffff',
           boxShadow: '0 4px 16px rgba(0, 102, 204, 0.2)',
           transition: 'all 0.3s ease',
           '&:hover': {
             transform: 'scale(1.05)',
             boxShadow: '0 6px 24px rgba(0, 102, 204, 0.3)',
           },
           '& img': {
             objectFit: 'cover',
           }
         }}
         onError={() => setRandomAvatarUrl('')}
       />
     ) : (
       defaultAvatar
     )}     <Typography
       variant="h6"
       component="h1"
       sx={{
         fontWeight: 700,
         background: 'linear-gradient(135deg, #0066cc 0%, #004499 100%)',         WebkitBackgroundClip: 'text',
         WebkitTextFillColor: 'transparent',
         textAlign: 'center',
         mb: 0.375,
       }}
     >
       {displayName}
     </Typography>
     <Typography
       variant="body2"
       sx={{ 
         display: 'flex', 
         alignItems: 'center',
         color: 'grey.600',
         fontSize: '0.875rem',
         fontWeight: 500,
       }}
     >       <Box 
         component="span" 
         sx={{ 
           width: 8, 
           height: 8, 
           borderRadius: '50%', 
           background: 'linear-gradient(135deg, #28a745, #20c997)',
           display: 'inline-block', 
           mr: 1,
           boxShadow: '0 0 8px rgba(40, 167, 69, 0.4)',
         }} 
       />
       <Box component="span" sx={{ fontWeight: 600 }}>Online</Box>
       <Box component="span" sx={{ mx: 1, color: 'grey.400' }}>|</Box>
       <Box component="span">Voice: {voiceName}</Box>
     </Typography>
    </Box>
  );
};

export default ChatHeader;
