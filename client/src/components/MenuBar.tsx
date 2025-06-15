import React, { useState } from 'react';
import { Box, IconButton, Collapse, Typography, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useTemplate } from '../context/TemplateContext';
import type { Template } from '../context/template-types';

const MenuBar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { templates, setCurrentTemplate, currentTemplate } = useTemplate();
  const theme = useTheme();

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
        <Box
          sx={{
            px: 0.5,
            pb: 0.5,
            pt: 0.25,
            width: '100%',
            bgcolor: 'transparent',
            borderBottom: `1px solid ${theme.palette.divider}`,
            mt: 1.5, // Add vertical space between bar and tiles
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 0.5,
            }}
          >
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
                  '&:hover': {
                    background: theme.palette.action.hover,
                  },
                }}
              >
                <Typography variant="subtitle2">{t.name}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default MenuBar;
