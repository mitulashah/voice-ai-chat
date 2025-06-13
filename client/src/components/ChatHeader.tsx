import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, useTheme } from '@mui/material';
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
  const theme = useTheme();
  
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
  }, [avatarUrl]);
  
  // Fallback to a default avatar if no URL is provided
  const defaultAvatar = (
    <Avatar
      sx={{
        width: 90,
        height: 90,
        bgcolor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        border: `3px solid ${theme.palette.primary.dark}`,
        fontSize: '3rem',
        mb: 1,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </Avatar>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 1,
        px: 0.5,
        gap: 0.5,
        position: 'relative',
        zIndex: 10,
      }}
    >
     {randomAvatarUrl ? (
       <Avatar
         src={randomAvatarUrl}
         alt={name}
         sx={{ 
           width: 90, 
           height: 90, 
           mb: 1,
           border: `3px solid ${theme.palette.primary.main}`,
           '& img': {
             objectFit: 'cover',
           }
         }}
         onError={() => setRandomAvatarUrl('')}
       />
     ) : (
       defaultAvatar
     )}
     <Typography
       variant="h6"
       component="h1"
       sx={{
         fontWeight: 600,
         color: theme.palette.text.primary,
         textAlign: 'center',
       }}
     >
       {displayName}
     </Typography>
     <Typography
       variant="body2"
       color="textSecondary"
       sx={{ display: 'flex', alignItems: 'center' }}
     >
       <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', display: 'inline-block', mr: 1 }} />
       <Box component="span">Online</Box>
       <Box component="span" sx={{ mx: 1 }}>|</Box>
       <Box component="span">Voice: {voiceName}</Box>
     </Typography>
    </Box>
  );
};

export default ChatHeader;
