import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, Button, Paper } from '@mui/material';

interface ExportDialogProps {
  exportJson: string | null;
  onClose: () => void;
  onDownload: (json: string) => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ exportJson, onClose, onDownload }) => {
  const [stats, setStats] = useState<{ speechDurationSeconds: number; audioCharacterCount: number } | null>(null);
  
  // Parse the export data to extract token information
  const exportData = exportJson ? JSON.parse(exportJson) : null;
  const totalTokens = exportData?.totalTokensUsed || 0;
  const messageCount = exportData?.messageCount || 0;
  const durationMs = exportData?.totalDurationMs || 0;
  const durationMinutes = Math.floor(durationMs / 60000);
  const durationSeconds = Math.floor((durationMs % 60000) / 1000);
  
  // Show "No conversation" if no user messages were sent
  const hasUserMessages = messageCount > 0;
  const displayDuration = hasUserMessages 
    ? `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`
    : '0:00';

  useEffect(() => {
    if (!exportJson) return;
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/stats');
        const data = await res.json();
        setStats({ speechDurationSeconds: data.speechDurationSeconds, audioCharacterCount: data.audioCharacterCount });
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      }
    };
    fetchStats();
  }, [exportJson]);

  return (
    <Dialog
      open={Boolean(exportJson)}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableRestoreFocus={false}
      disableEnforceFocus={false}
    >
      <DialogTitle sx={{ pb: 1, fontSize: '1.1rem' }}>Export Conversation</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>        
        {/* Conversation Statistics */}
        <Paper elevation={1} sx={{ p: 1.5, mb: 1.5, bgcolor: '#f8f9fa' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, fontSize: '0.875rem' }}>
            Statistics
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>  
            {/* First row: Tokens, Messages, Duration */}
            <Box textAlign="center" sx={{ flex: 1 }}>
              <Typography variant="h6" color="primary" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                {totalTokens.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                Tokens
              </Typography>
            </Box>
            <Box textAlign="center" sx={{ flex: 1 }}>
              <Typography variant="h6" color="secondary" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                {messageCount}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                Messages
              </Typography>
            </Box>
            <Box textAlign="center" sx={{ flex: 1 }}>
              <Typography variant="h6" color="success.main" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                {displayDuration}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                Duration
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
            {/* Second row: Avg/Msg, Speech Secs (export duration), Audio Chars */}
            <Box textAlign="center" sx={{ flex: 1 }}>
              <Typography variant="h6" color="warning.main" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                {messageCount > 0 ? Math.round(totalTokens / messageCount) : 0}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                Avg/Msg
              </Typography>
            </Box>
            {stats && (
              <>
                <Box textAlign="center" sx={{ flex: 1 }}>
                  <Typography variant="h6" color="info.main" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                    {stats.speechDurationSeconds.toFixed(2)} s
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                    Speech Secs
                  </Typography>
                </Box>
                <Box textAlign="center" sx={{ flex: 1 }}>
                  <Typography variant="h6" color="info.dark" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                    {stats.audioCharacterCount.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                    Audio Chars
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </Paper>

        {/* JSON Export */}
        <Box 
          component="pre" 
          sx={{ 
            bgcolor: '#f5f5f5', 
            p: 1, 
            borderRadius: 1, 
            maxHeight: 180, 
            overflow: 'auto',
            fontSize: '0.7rem',
            fontFamily: 'monospace',
            mb: 1.5,
            border: '1px solid #e0e0e0'
          }}
        >
          {exportJson}
        </Box>
        
        <Button
          variant="contained"
          color="primary"
          onClick={() => exportJson && onDownload(exportJson)}
          size="small"
          fullWidth
        >
          Download JSON
        </Button>
      </DialogContent>
      <DialogActions sx={{ pt: 0, pb: 1 }}>
        <Button onClick={onClose} size="small">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;
