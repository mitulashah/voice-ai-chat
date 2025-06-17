import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, Button, Paper, IconButton, Tooltip, Snackbar, Alert, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { ContentCopy as ContentCopyIcon, Assessment as AssessmentIcon, ExpandMore as ExpandMoreIcon, Download as DownloadIcon } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEvaluation } from '../context/EvaluationContext';
import type { ConversationData, ConversationMessage } from '../context/evaluation-types';
import html2pdf from 'html2pdf.js';

interface ExportDialogProps {
  exportJson: string | null;
  onClose: () => void;
  onDownload: (json: string) => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ exportJson, onClose, onDownload }) => {
  const [stats, setStats] = useState<{ speechDurationSeconds: number; audioCharacterCount: number } | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  // Control which accordions are expanded (allow multiple)
  const [expanded, setExpanded] = useState<string[]>(['context', 'stats']);
  // Reset panels when dialog opens: open context and stats
  useEffect(() => {
    if (exportJson) {
      setExpanded(['context', 'stats']);
    }
  }, [exportJson]);

  // Toggle accordion panels
  const handleChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(prev =>
      isExpanded ? (prev.includes(panel) ? prev : [...prev, panel]) : prev.filter(p => p !== panel)
    );
  };

  // Use evaluation context
  const { evaluateConversation, isEvaluating, lastEvaluation, error: evaluationError } = useEvaluation();
  // Prepare markdown text for ReactMarkdown, ensure it's string
  const markdownText = lastEvaluation
    ? typeof lastEvaluation.markdown === 'string'
      ? lastEvaluation.markdown
      : (console.error('Expected markdown string but got', lastEvaluation.markdown), String(lastEvaluation.markdown))
    : '';

  // On AI evaluation complete, collapse all except evaluation
  useEffect(() => {
    if (lastEvaluation || evaluationError) {
      setExpanded(['evaluation']);
    }
  }, [lastEvaluation, evaluationError]);

  // Parse the export data
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

  // Copy to clipboard function
  const handleCopyToClipboard = async () => {
    if (!exportJson) return;

    try {
      await navigator.clipboard.writeText(exportJson);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };
  // Handle AI evaluation
  const handleAIEvaluation = async () => {
    if (!exportData?.conversation?.messages) return;
    
    // Convert export messages to evaluation format
    const conversationMessages: ConversationMessage[] = exportData.conversation.messages
      .filter((msg: any) => msg.role !== 'system') // Exclude system messages
      .map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.timestamp || Date.now()).toISOString()
      }));

    const conversationData: ConversationData = {
      conversationId: exportData.conversationId || `conversation-${Date.now()}`,
      messages: conversationMessages,
      metadata: {
        sessionDuration: exportData.performance?.conversationDurationMs ?
          Math.floor(exportData.performance.conversationDurationMs / 1000) : undefined,
        context: 'Exported conversation evaluation',
        ...exportData.context
      }
    };
    await evaluateConversation(conversationData);
  };

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

  // Ref for the markdown section
  const evaluationPdfRef = useRef<HTMLDivElement>(null);

  // PDF download handler
  const handleDownloadEvaluationPdf = () => {
    if (evaluationPdfRef.current) {
      html2pdf()
        .from(evaluationPdfRef.current)
        .set({ filename: 'evaluation-summary.pdf', margin: 0.5, html2canvas: { scale: 2 } })
        .save();
    }
  };

  return (
    <Dialog
      open={Boolean(exportJson)}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableRestoreFocus={false}
      disableEnforceFocus={false}
    >
      <DialogTitle>Evaluation Summary</DialogTitle>
      <DialogContent>
        {/* Evaluation Context Section */}
        <Accordion disableGutters square expanded={expanded.includes('context')} onChange={handleChange('context')} sx={{ boxShadow: 'none', mb: 1, '&:focus-within': { outline: 'none' } }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            disableRipple
            sx={{
              outline: 'none',
              '&:focus': { outline: 'none' },
              '&:focus-visible': { outline: 'none' },
              '&.Mui-focusVisible': { outline: 'none', backgroundColor: 'transparent' },
              '&.Mui-expanded': { backgroundColor: 'transparent' }
            }}
          >
            <Typography variant="subtitle2">Evaluation Context</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {exportData?.context && (
              <Paper elevation={0} sx={{ p: 1.5, mb: 1.5, bgcolor: '#e8f5e8' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, fontSize: '0.875rem' }}>
                  Evaluation Context
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, fontSize: '0.75rem' }}>
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
          </AccordionDetails>
        </Accordion>

        {/* Statistics Section */}
        <Accordion disableGutters square expanded={expanded.includes('stats')} onChange={handleChange('stats')} sx={{ boxShadow: 'none', mb: 1, '&:focus-within': { outline: 'none' } }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            disableRipple
            sx={{
              outline: 'none',
              '&:focus': { outline: 'none' },
              '&:focus-visible': { outline: 'none' },
              '&.Mui-focusVisible': { outline: 'none', backgroundColor: 'transparent' },
              '&.Mui-expanded': { backgroundColor: 'transparent' }
            }}
          >
            <Typography variant="subtitle2">Statistics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Paper elevation={0} sx={{ p: 1.5, mb: 1.5, bgcolor: '#f8f9fa' }}>
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
          </AccordionDetails>
        </Accordion>

        {/* Evaluation Criteria Section */}
        {evaluationCriteria.suggestedEvaluationAreas && (
        <Accordion disableGutters square expanded={expanded.includes('criteria')} onChange={handleChange('criteria')} sx={{ boxShadow: 'none', mb: 1, '&:focus-within': { outline: 'none' } }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            disableRipple
            sx={{
              outline: 'none',
              '&:focus': { outline: 'none' },
              '&:focus-visible': { outline: 'none' },
              '&.Mui-focusVisible': { outline: 'none', backgroundColor: 'transparent' },
              '&.Mui-expanded': { backgroundColor: 'transparent' }
            }}
          >
            <Typography variant="subtitle2">Evaluation Criteria</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ p: 1.5, mb: 1.5, bgcolor: '#fff3e0', borderRadius: 1 }}>
              {/* Title */}
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                {evaluationCriteria.scenarioDetails?.title
                  ? `Evaluation Criteria - ${evaluationCriteria.scenarioDetails.title}`
                  : 'Suggested Evaluation Areas'}
              </Typography>
              {/* Scenario details */}
              {evaluationCriteria.scenarioDetails && (
                <Box sx={{ mb: 1.5, p: 1, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    <strong>Type:</strong> {evaluationCriteria.scenarioDetails.scenarioType}
                    {evaluationCriteria.scenarioDetails.difficultyLevel && (
                      <span> | <strong>Difficulty:</strong> {evaluationCriteria.scenarioDetails.difficultyLevel}</span>
                    )}
                    {evaluationCriteria.scenarioDetails.expectedDurationSeconds && (
                      <span> | <strong>Expected Duration:</strong> {Math.round(evaluationCriteria.scenarioDetails.expectedDurationSeconds / 60)} min</span>
                    )}
                  </Typography>
                  {evaluationCriteria.scenarioDetails.description && (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                      {evaluationCriteria.scenarioDetails.description}
                    </Typography>
                  )}
                </Box>
              )}
              {/* Areas list */}
              {evaluationCriteria.suggestedEvaluationAreas?.length > 0 && (
                <Box sx={{ pl: 0 }}>
                  {evaluationCriteria.suggestedEvaluationAreas.map((area: string, idx: number) => (
                    <Typography
                      key={idx}
                      variant="body2"
                      sx={{ fontSize: '0.75rem', mb: 0.5, fontWeight: area.includes(':') ? 600 : 400 }}
                    >
                      {area}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
        )}

        {/* JSON Transcript Section */}
        <Accordion disableGutters square expanded={expanded.includes('transcript')} onChange={handleChange('transcript')} sx={{ boxShadow: 'none', mb: 1, '&:focus-within': { outline: 'none' } }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            disableRipple
            sx={{
              outline: 'none',
              '&:focus': { outline: 'none' },
              '&:focus-visible': { outline: 'none' },
              '&.Mui-focusVisible': { outline: 'none', backgroundColor: 'transparent' },
              '&.Mui-expanded': { backgroundColor: 'transparent' }
            }}
          >
            <Typography variant="subtitle2">JSON Transcript</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 0.5 }}>
              <Tooltip title={copySuccess ? 'Copied!' : 'Copy to clipboard'}>
                <IconButton onClick={handleCopyToClipboard} size="small">
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <Box
              component="pre"
              sx={{
                bgcolor: '#f5f5f5',
                p: 1,
                borderRadius: 1,
                maxHeight: 180,
                overflow: 'auto',
                fontSize: '0.7rem',
                fontFamily: 'monospace'
              }}
              // removed border outline for subtlety
            >
              {exportJson}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* AI Evaluation Results Section */}
        <Accordion disableGutters square expanded={expanded.includes('evaluation')} onChange={handleChange('evaluation')} sx={{ boxShadow: 'none', mb: 1, '&:focus-within': { outline: 'none' } }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            disableRipple
            sx={{
              outline: 'none',
              '&:focus': { outline: 'none' },
              '&:focus-visible': { outline: 'none' },
              '&.Mui-focusVisible': { outline: 'none', backgroundColor: 'transparent' },
              '&.Mui-expanded': { backgroundColor: 'transparent' }
            }}
          >
            <Typography variant="subtitle2">AI Evaluation Results</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Paper elevation={0} sx={{ mt: 3, p: 2, bgcolor: 'background.default' }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssessmentIcon color="primary" />
                AI Evaluation Results
              </Typography>
              {evaluationError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {String(evaluationError)}
                </Alert>
              )}
              {lastEvaluation && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Generated: {new Date(lastEvaluation.timestamp).toLocaleString()}
                  </Typography>
                  <Paper
                    ref={evaluationPdfRef}
                    sx={{
                      p: 2,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      maxHeight: '400px',
                      overflow: 'auto',
                      fontFamily: 'Segoe UI, -apple-system, BlinkMacSystemFont, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
                      fontSize: '0.93rem',
                      // Markdown element overrides
                      '& h1': {
                        fontSize: '1.18rem',
                        fontWeight: 700,
                        margin: '1.2em 0 0.7em 0',
                        lineHeight: 1.2,
                      },
                      '& h2': {
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        margin: '1.1em 0 0.6em 0',
                        lineHeight: 1.25,
                      },
                      '& h3, & h4, & h5, & h6': {
                        fontSize: '0.98rem',
                        fontWeight: 600,
                        margin: '1em 0 0.5em 0',
                        lineHeight: 1.3,
                      },
                      '& p, & li': {
                        fontSize: '0.91rem',
                        lineHeight: 1.6,
                        margin: '0.3em 0',
                      },
                      '& ul, & ol': {
                        paddingLeft: '1.15em',
                        margin: '0.5em 0 0.5em 0',
                      },
                      '& li': {
                        marginBottom: '0.2em',
                        paddingLeft: '0.1em',
                      },
                      '& strong': {
                        fontWeight: 700,
                      },
                      '& blockquote': {
                        borderLeft: '3px solid #b3c6e0',
                        margin: '0.7em 0',
                        padding: '0.5em 1em',
                        color: 'text.secondary',
                        background: '#f7faff',
                        fontSize: '0.89rem',
                      },
                      '& code': {
                        fontFamily: 'monospace',
                        fontSize: '0.89em',
                        background: '#f5f5f5',
                        px: 0.5,
                        borderRadius: 1,
                      },
                      '& table': {
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.91rem',
                      },
                      '& th, & td': {
                        border: '1px solid #e0e0e0',
                        padding: '0.4em 0.7em',
                      },
                      '& th': {
                        background: '#f5f7fa',
                        fontWeight: 700,
                      },
                      // Remove extra top margin from first element of type
                      '& > :first-of-type': {
                        marginTop: 0,
                      },
                      // Remove extra bottom margin from last element of type
                      '& > :last-of-type': {
                        marginBottom: 0,
                      },
                    }}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{ /* custom components */ }}
                    >
                      {markdownText}
                    </ReactMarkdown>
                  </Paper>
                </Box>
              )}
            </Paper>
          </AccordionDetails>
        </Accordion>

      </DialogContent>
      <DialogActions sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, pb: 1, gap: 2 }}>
        {/* Left-aligned: AI Evaluation button */}
        <Box>
          <Button
            onClick={handleAIEvaluation}
            disabled={isEvaluating || !exportData?.conversation?.messages?.some((msg: any) => msg.role !== 'system')}
            startIcon={<AssessmentIcon />}
            variant="outlined"
            size="small"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '.9rem',
              borderRadius: 2,
              px: 3,
              py: 1.5,
              color: 'primary.main',
              borderColor: 'primary.main',
              transition: 'all 0.3s ease',
              mr: 1,
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
              }
            }}
          >
            <span style={{ fontWeight: 600 }}>AI Evaluation</span>
          </Button>
        </Box>
        {/* Right-aligned: Download JSON, Download PDF, Close */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            onClick={() => onDownload(exportJson!)}
            startIcon={<DownloadIcon />}
            variant="outlined"
            size="small"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '.9rem',
              borderRadius: 2,
              px: 3,
              py: 1.5,
              color: 'primary.main',
              borderColor: 'primary.main',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
              }
            }}
          >
            <span style={{ fontWeight: 600 }}>JSON</span>
          </Button>
          <Button
            onClick={handleDownloadEvaluationPdf}
            startIcon={<DownloadIcon />}
            variant="outlined"
            size="small"
            disabled={isEvaluating || !exportData?.conversation?.messages?.some((msg: any) => msg.role !== 'system')}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '.9rem',
              borderRadius: 2,
              px: 3,
              py: 1.5,
              color: 'primary.main',
              borderColor: 'primary.main',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
              }
            }}
          >
            <span style={{ fontWeight: 600 }}>Evaluation</span>
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            onClick={onClose}
            size="small"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '.9rem',
              borderRadius: 2,
              px: 3,
              py: 1.5,
              color: 'grey.700',
              borderColor: 'grey.300',
              background: 'rgba(255,255,255,0.7)',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: theme => theme.palette.primary.main,
                backgroundColor: 'rgba(0, 102, 204, 0.04)',
                color: theme => theme.palette.primary.main,
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0, 102, 204, 0.15)',
              },
            }}
          >
            Close
          </Button>
        </Box>
      </DialogActions>

      {/* Copy success feedback */}
      <Snackbar
        open={copySuccess}
        autoHideDuration={2000}
        onClose={() => setCopySuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ fontSize: '0.875rem' }}>
          JSON copied to clipboard!
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default ExportDialog;
