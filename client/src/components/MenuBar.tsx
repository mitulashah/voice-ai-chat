import React, { useState } from 'react';
import { Box, IconButton, Collapse, Typography, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useTemplate } from '../context/TemplateContext';
import { usePersonaScenario } from '../context/PersonaScenarioContext';
import { useMood } from '../context/MoodContext';
import { useVoice } from '../context/VoiceContext';
import type { Template } from '../context/template-types';

const MenuBar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { templates, setCurrentTemplate, currentTemplate } = useTemplate();
  const { personas, scenarios, selectedPersona, setSelectedPersona, selectedScenario, setSelectedScenario } = usePersonaScenario();
  const { moods, selectedMood, setSelectedMood } = useMood();
  const theme = useTheme();
  const { selectedVoice, setSelectedVoice } = useVoice();

  // Voice options
  const voiceOptions = [
    { name: 'Jenny', value: 'JennyNeural', gender: 'female' },
    { name: 'Andrew', value: 'AndrewNeural', gender: 'male' },
    { name: 'Fable', value: 'FableNeural', gender: 'female' },
  ];

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
        <Box sx={{ px: 0.5, pb: 0.5, pt: 0.25, width: '100%', bgcolor: 'transparent', borderBottom: `1px solid ${theme.palette.divider}`, mt: 1.5, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'flex-start' }}>
          {/* Personas Section - Larger, tiled horizontally */}
          <Box sx={{ minWidth: 260, flex: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: theme.palette.primary.main }}>Personas</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 0.5, mb: 2 }}>
              {personas.map(p => (
                <Box
                  key={p.id}
                  onClick={() => setSelectedPersona(p)}
                  sx={{
                    p: 0.75,
                    cursor: 'pointer',
                    borderRadius: 1,
                    border: selectedPersona?.id === p.id ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.info.light}`,
                    textAlign: 'center',
                    background: selectedPersona?.id === p.id ? theme.palette.action.selected : theme.palette.background.paper,
                    transition: 'background 0.2s, border 0.2s',
                    fontSize: '0.85rem',
                    '&:hover': {
                      background: theme.palette.info.light,
                    },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.9rem', lineHeight: 1.1 }}>{p.name}</Typography>
                  {p.description && <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.1 }}>{p.description}</Typography>}
                </Box>
              ))}
            </Box>
          </Box>
          {/* Moods Section - Larger, tiled horizontally */}
          <Box sx={{ minWidth: 180, flex: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: theme.palette.warning.main }}>Moods</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 0.5, mb: 2 }}>
              {moods.map(m => (
                <Box
                  key={m.mood}
                  onClick={() => setSelectedMood(m)}
                  sx={{
                    p: 0.75,
                    cursor: 'pointer',
                    borderRadius: 1,
                    border: selectedMood?.mood === m.mood ? `2px solid ${theme.palette.warning.main}` : `1px solid ${theme.palette.warning.light}`,
                    textAlign: 'center',
                    background: selectedMood?.mood === m.mood ? theme.palette.action.selected : theme.palette.background.paper,
                    transition: 'background 0.2s, border 0.2s',
                    fontSize: '0.85rem',
                    '&:hover': {
                      background: theme.palette.warning.light,
                    },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.9rem', lineHeight: 1.1 }}>{m.mood}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
          {/* Scenarios & Templates - Stacked vertically, more compact */}
          <Box sx={{ minWidth: 200, flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Scenarios Section */}
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
                      border: selectedScenario?.id === s.id ? '2px solid #7B1FA2' : '1px solid #CE93D8',
                      textAlign: 'center',
                      background: selectedScenario?.id === s.id ? '#F3E5F5' : theme.palette.background.paper,
                      transition: 'background 0.2s, border 0.2s',
                      fontSize: '0.82rem',
                      '&:hover': {
                        background: '#E1BEE7',
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.82rem', lineHeight: 1.1, color: '#7B1FA2' }}>{s.name}</Typography>
                    {s.description && <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.1 }}>{s.description}</Typography>}
                  </Box>
                ))}
              </Box>
            </Box>
            {/* Templates Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: theme.palette.success.main }}>Templates</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 0.5 }}>
                {templates.map(t => (
                  <Box
                    key={t.id}
                    onClick={() => handleSelect(t)}
                    sx={{
                      p: 0.75,
                      cursor: 'pointer',
                      borderRadius: 1,
                      border: t.id === currentTemplate?.id
                        ? `1.5px solid ${theme.palette.primary.main}`
                        : `1px solid ${theme.palette.divider}`,
                      textAlign: 'center',
                      background: t.id === currentTemplate?.id ? theme.palette.action.selected : 'transparent',
                      transition: 'background 0.2s, border 0.2s',
                      fontSize: '0.82rem',
                      '&:hover': {
                        background: theme.palette.action.hover,
                      },
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontSize: '0.82rem', lineHeight: 1.1 }}>{t.name}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
            {/* Voices Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: theme.palette.info.main }}>Voices</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 0.5, mb: 2 }}>
                {voiceOptions.map(v => (
                  <Box
                    key={v.value}
                    onClick={() => setSelectedVoice(v.value)}
                    sx={{
                      p: 0.75,
                      cursor: 'pointer',
                      borderRadius: 1,
                      border: selectedVoice === v.value ? `2px solid ${theme.palette.info.main}` : `1px solid ${theme.palette.info.light}`,
                      textAlign: 'center',
                      background: selectedVoice === v.value ? theme.palette.action.selected : theme.palette.background.paper,
                      transition: 'background 0.2s, border 0.2s',
                      fontSize: '0.85rem',
                      '&:hover': {
                        background: theme.palette.info.light,
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.9rem', lineHeight: 1.1 }}>{v.name}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default MenuBar;
