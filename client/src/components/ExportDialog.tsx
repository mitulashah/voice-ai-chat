import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, Button, Paper } from '@mui/material';

interface ExportDialogProps {
  exportJson: string | null;
  onClose: () => void;
  onDownload: (json: string) => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ exportJson, onClose, onDownload }) => {
  const [stats, setStats] = useState<{ speechDurationSeconds: number; audioCharacterCount: number } | null>(null);
    // Parse the export data to extract comprehensive information
  const exportData = exportJson ? JSON.parse(exportJson) : null;
  
  // Legacy support for old export format
  const totalTokens = exportData?.stats?.totalTokensUsed || exportData?.totalTokensUsed || 0;
  const messageCount = exportData?.conversation?.messageCount || exportData?.messageCount || 0;
  const durationMs = exportData?.stats?.totalDurationMs || exportData?.totalDurationMs || 0;
  const durationMinutes = Math.floor(durationMs / 60000);
  const durationSeconds = Math.floor((durationMs % 60000) / 1000);
  
  // New comprehensive data
  const context = exportData?.context || {};
  const evaluationCriteria = exportData?.evaluationCriteria || {};
  
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
    >      <DialogTitle sx={{ pb: 1, fontSize: '1.1rem' }}>
        {exportData?.evaluationCriteria?.scenarioId 
          ? 'Scenario Evaluation Export' 
          : 'Export Conversation'
        }
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        
        {/* Context Information - Only show if comprehensive data is available */}
        {exportData?.context && (
          <Paper elevation={1} sx={{ p: 1.5, mb: 1.5, bgcolor: '#e8f5e8' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, fontSize: '0.875rem' }}>
              Evaluation Context
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, fontSize: '0.75rem' }}>
              {context.persona && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Persona:
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {context.persona.name}
                  </Typography>
                </Box>
              )}
              {context.scenario && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Scenario:
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {context.scenario.name}
                  </Typography>
                </Box>
              )}
              {context.mood && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Mood:
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {context.mood.mood}
                  </Typography>
                </Box>
              )}
              {context.voice && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Voice:
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {context.voice}
                  </Typography>
                </Box>
              )}
              {context.generatedName && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Generated Name:
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {context.generatedName.full} ({context.generatedName.gender})
                  </Typography>
                </Box>
              )}
              {context.template && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Template:
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {context.template.name}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        )}
        
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
          </Box>        </Paper>        {/* Evaluation Criteria - Only show if available */}
        {exportData?.evaluationCriteria?.suggestedEvaluationAreas && (
          <Paper elevation={1} sx={{ p: 1.5, mb: 1.5, bgcolor: '#fff3e0' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, fontSize: '0.875rem' }}>
              {exportData.evaluationCriteria.scenarioDetails?.title 
                ? `Evaluation Criteria - ${exportData.evaluationCriteria.scenarioDetails.title}`
                : 'Suggested Evaluation Areas'
              }
            </Typography>
            
            {/* Show scenario details if available */}
            {exportData.evaluationCriteria.scenarioDetails && (
              <Box sx={{ mb: 1.5, p: 1, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                  <strong>Type:</strong> {exportData.evaluationCriteria.scenarioDetails.scenarioType}
                  {exportData.evaluationCriteria.scenarioDetails.difficultyLevel && (
                    <span> | <strong>Difficulty:</strong> {exportData.evaluationCriteria.scenarioDetails.difficultyLevel}</span>
                  )}
                  {exportData.evaluationCriteria.scenarioDetails.expectedDurationSeconds && (
                    <span> | <strong>Expected Duration:</strong> {Math.round(exportData.evaluationCriteria.scenarioDetails.expectedDurationSeconds / 60)} min</span>
                  )}
                </Typography>
                {exportData.evaluationCriteria.scenarioDetails.description && (
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                    {exportData.evaluationCriteria.scenarioDetails.description}
                  </Typography>
                )}
              </Box>
            )}
            
            <Box component="div" sx={{ pl: 0 }}>
              {evaluationCriteria.suggestedEvaluationAreas.map((area: string, index: number) => (
                <Typography 
                  key={index} 
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.75rem', 
                    mb: 0.5,
                    fontWeight: area.includes(':') ? 600 : 400,
                    color: area.startsWith('  •') ? 'text.secondary' : 'text.primary',
                    fontFamily: area.startsWith('  •') ? 'monospace' : 'inherit'
                  }}
                >
                  {area}
                </Typography>
              ))}
            </Box>
          </Paper>
        )}

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
