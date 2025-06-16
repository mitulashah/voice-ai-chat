import React, { useState } from 'react';
import { Box, IconButton, Collapse, Typography, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useTemplate } from '../context/TemplateContext';
import { usePersonaScenario } from '../context/PersonaScenarioContext';
import { useMood } from '../context/MoodContext';
import { useVoice } from '../context/VoiceContext';
import type { Template } from '../context/template-types';

const MenuBar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { templates, setCurrentTemplate, currentTemplate } = useTemplate();  const { personas, scenarios, selectedPersona, setSelectedPersona, selectedScenario, setSelectedScenario } = usePersonaScenario();
  const { moods, selectedMood, setSelectedMood } = useMood();
  const theme = useTheme();
  const { voiceOptions, selectedVoice, setSelectedVoice } = useVoice();

  const handleToggle = () => {
    setOpen(prev => !prev);
  };

  const handleSelect = (template: Template) => {
    setCurrentTemplate(template);
    setOpen(false);
  };

  return (
    <Box sx={{ width: '100%', m: 0, p: 0 }}>
      {/* Header row for triggering the template menu */}
      <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5, pt: 0.25, pb: 0.25, bgcolor: theme.palette.background.default, m: 0 }}>
        <IconButton aria-label="open menu" onClick={handleToggle} size="small" sx={{ m: 0, p: 0.5 }}>
          <MenuIcon fontSize="small" />
        </IconButton>
        <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 500 }}>Scenarios</Typography>
      </Box>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ px: 0.5, pb: 0.5, pt: 0.25, width: '100%', bgcolor: 'transparent', borderBottom: `1px solid ${theme.palette.divider}`, mt: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Main content in a row */}
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'flex-start' }}>          {/* Personas Section - Larger, tiled horizontally */}
          <Box sx={{ minWidth: 260, flex: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: theme.palette.primary.main }}>Personas</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.5, mb: 2 }}>              {personas.map(p => (
                <Box
                  key={p.id}
                  onClick={() => setSelectedPersona(p)}
                  sx={{
                    p: 0.75,
                    cursor: 'pointer',
                    borderRadius: 1,
                    border: `2px solid ${theme.palette.primary.main}`,
                    textAlign: 'center',
                    background: selectedPersona?.id === p.id 
                      ? theme.palette.primary.light + '20' // Light blue background when selected
                      : 'transparent',
                    transition: 'background 0.2s, border 0.2s',
                    fontSize: '0.85rem',
                    '&:hover': {
                      background: theme.palette.primary.light + '10',
                    },
                  }}
                >                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500, 
                      fontSize: '0.75rem', // Standardized to 0.75rem
                      lineHeight: 1.1,
                      color: theme.palette.primary.main
                    }}
                  >
                    {p.name}
                  </Typography>
                  {p.description && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.65rem', // Reduced from 0.75rem
                        lineHeight: 1.1,
                        color: theme.palette.primary.dark
                      }}
                    >
                      {p.description}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
          {/* Moods Section - Larger, tiled horizontally */}
          <Box sx={{ minWidth: 180, flex: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: theme.palette.warning.main }}>Moods</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 0.5, mb: 2 }}>              {moods.map(m => (
                <Box
                  key={m.mood}
                  onClick={() => setSelectedMood(m)}
                  sx={{
                    p: 0.75,
                    cursor: 'pointer',
                    borderRadius: 1,
                    border: `2px solid ${theme.palette.warning.main}`,
                    textAlign: 'center',
                    background: selectedMood?.mood === m.mood 
                      ? theme.palette.warning.light + '40' // Light orange background when selected
                      : 'transparent',
                    transition: 'background 0.2s, border 0.2s',
                    fontSize: '0.85rem',
                    '&:hover': {
                      background: theme.palette.warning.light + '20',
                    },
                  }}
                >                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500, 
                      fontSize: '0.75rem', // Standardized to 0.75rem
                      lineHeight: 1.1,
                      color: theme.palette.warning.main
                    }}
                  >
                    {m.mood}
                  </Typography>
                </Box>
              ))}            </Box>
            
            {/* Voices Section - Moved under Moods */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: '#E91E63' /* pink/magenta */ }}>Voices</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 0.5, mb: 2 }}>
                {voiceOptions.map(v => (
                  <Box
                    key={v.value}
                    onClick={() => setSelectedVoice(v.value)}
                    sx={{
                      p: 0.75,
                      cursor: 'pointer',
                      borderRadius: 1,
                      border: '2px solid #E91E63', // Pink/magenta border
                      textAlign: 'center',
                      background: selectedVoice === v.value 
                        ? '#FCE4EC' // Light pink background when selected
                        : 'transparent',
                      transition: 'background 0.2s, border 0.2s',
                      fontSize: '0.85rem',
                      '&:hover': {
                        background: '#FCE4EC' + '80', // Lighter pink on hover
                      },
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500, 
                        fontSize: '0.75rem', // Standardized to 0.75rem
                        lineHeight: 1.1,
                        color: '#E91E63' // Pink/magenta text
                      }}
                    >
                      {v.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>          {/* Templates & Voices - Stacked vertically, more compact */}
          <Box sx={{ minWidth: 200, flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Templates Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: theme.palette.success.main }}>Templates</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 0.5 }}>                {templates.map(t => (
                  <Box
                    key={t.id}
                    onClick={() => handleSelect(t)}
                    sx={{
                      p: 0.75,
                      cursor: 'pointer',
                      borderRadius: 1,
                      border: `2px solid ${theme.palette.success.main}`,
                      textAlign: 'center',
                      background: t.id === currentTemplate?.id 
                        ? theme.palette.success.light + '40' // Light green background when selected
                        : 'transparent',
                      transition: 'background 0.2s, border 0.2s',
                      fontSize: '0.82rem',
                      '&:hover': {
                        background: theme.palette.success.light + '20',
                      },
                    }}
                  >                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontSize: '0.75rem', // Already at 0.75rem - no change needed
                        lineHeight: 1.1,
                        color: theme.palette.success.main                      }}
                    >
                      {t.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
            
            {/* Scenarios Section - Moved under Templates */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: '#7B1FA2' /* deep purple */ }}>Scenarios</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 0.5, mb: 2 }}>
                {scenarios.map(s => (
                  <Box
                    key={s.id}
                    onClick={() => setSelectedScenario(s)}
                    sx={{
                      p: 0.75,
                      cursor: 'pointer',
                      borderRadius: 1,
                      border: '2px solid #7B1FA2', // Deep purple border
                      textAlign: 'center',
                      background: selectedScenario?.id === s.id 
                        ? '#F3E5F5' // Light purple background when selected
                        : 'transparent',
                      transition: 'background 0.2s, border 0.2s',
                      fontSize: '0.82rem',
                      '&:hover': {
                        background: '#F3E5F5' + '80', // Lighter purple on hover
                      },
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500, 
                        fontSize: '0.75rem', 
                        lineHeight: 1.1, 
                        color: '#7B1FA2' 
                      }}
                    >
                      {s.name}
                    </Typography>
                    {s.description && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '0.6rem', 
                          lineHeight: 1.1,
                          color: '#6A1B9A' // Slightly darker purple for description
                        }}
                      >
                        {s.description}
                      </Typography>
                    )}
                  </Box>                ))}
              </Box>
            </Box>
          </Box>
          </Box>
          
          {/* Collapse Triangle - positioned above the gray line */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mt: 1,
            mb: -0.5 // Pull it up closer to content
          }}>
            <IconButton
              onClick={handleToggle}
              sx={{
                color: '#666', // Same color as the gray line
                padding: '4px',
                '&:hover': {
                  color: '#999',
                  backgroundColor: 'transparent',
                },
              }}
              size="small"
            >
              <KeyboardArrowUpIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default MenuBar;
