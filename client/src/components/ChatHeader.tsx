import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, useTheme, IconButton, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useTemplate } from '../context/TemplateContext';
import type { Template } from '../context/TemplateContext';

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
  const { templates, setCurrentTemplate, currentTemplate } = useTemplate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
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
  }, [avatarUrl]);
  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };
  const handleMenuClose = () => setAnchorEl(null);
  const handleSelect = (template: Template) => {
    setCurrentTemplate(template);
    handleMenuClose();
  };
  const theme = useTheme();
  
  // Fallback to a default avatar if no URL is provided
  const defaultAvatar = (
    <Avatar
      sx={{
        width: 112,
        height: 112,
        bgcolor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        border: `3px solid ${theme.palette.primary.dark}`,
        fontSize: '3.5rem',
        mb: 2,
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
        py: 2,
        px: 1,
        gap: 1,
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Hamburger menu for selecting agent templates */}
      <IconButton
        aria-label="select agent template"
        onClick={handleMenuOpen}
        sx={{ position: 'absolute', top: 8, right: 8 }}
      >
        <MenuIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
      >
        {templates.map((t, index) => (
          <MenuItem
            key={`${t.id}-${index}`}
            selected={currentTemplate?.id === t.id}
            onClick={() => handleSelect(t)}
          >
            {t.name}
          </MenuItem>
        ))}
      </Menu>
   
      {randomAvatarUrl ? (
        <Avatar
          src={randomAvatarUrl}
          alt={name}
          sx={{ 
            width: 112, 
            height: 112, 
            mb: 2,
            border: `3px solid ${theme.palette.primary.main}`,
            '& img': {
              objectFit: 'cover',
              width: '100%',
              height: '100%',
            }
          }}
          onError={() => {
            // Fallback to default avatar if image fails to load
            setRandomAvatarUrl('');
          }}
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
