import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { useEvaluation } from '../context/EvaluationContext';
import { copyToClipboard, buildConversationData, formatDuration } from '../utils/exportDialogUtils';
import { useCopySnackbar } from '../hooks/useCopySnackbar';
import { parseExportData } from '../utils/exportDataParser';
import type { ExportData } from '../utils/exportDataParser';
import { useAccordionState } from '../hooks/useAccordionState';
import ExportDialogEvaluationContext from './ExportDialogEvaluationContext';
import ExportDialogStatistics from './ExportDialogStatistics';
import ExportDialogEvaluationCriteria from './ExportDialogEvaluationCriteria';
import ExportDialogJsonTranscript from './ExportDialogJsonTranscript';
import ExportDialogEvaluationResults from './ExportDialogEvaluationResults';
import ExportDialogActions from './ExportDialogActions';
import ExportDialogSnackbar from './ExportDialogSnackbar';
import jsPDF from 'jspdf';
import { marked } from 'marked';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface ExportDialogProps {
  exportJson: string | null;
  onClose: () => void;
  onDownload: (json: string) => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ exportJson, onClose, onDownload }) => {
  const [stats, setStats] = useState<{ speechDurationSeconds: number; audioCharacterCount: number } | null>(null);
  const [copySuccess, showCopySuccess, closeCopySuccess] = useCopySnackbar();
  // Use evaluation context
  const { evaluateConversation, isEvaluating, lastEvaluation, error: evaluationError } = useEvaluation();
  // Accordion state management with custom hook
  const { isExpanded, handleChange, setPanels } = useAccordionState(['context', 'stats']);
  // Reset panels when dialog opens: open context and stats
  useEffect(() => {
    if (exportJson) {
      setPanels(['context', 'stats']);
    }
  }, [exportJson, setPanels]);
  // On AI evaluation complete, collapse all except evaluation
  useEffect(() => {
    if (lastEvaluation || evaluationError) {
      setPanels(['evaluation']);
    }
  }, [lastEvaluation, evaluationError, setPanels]);

  // Prepare markdown text for ReactMarkdown, ensure it's string
  const markdownText = lastEvaluation
    ? typeof lastEvaluation.markdown === 'string'
      ? lastEvaluation.markdown
      : (console.error('Expected markdown string but got', lastEvaluation.markdown), String(lastEvaluation.markdown))
    : '';

  // Parse the export data with type safety
  const exportData: ExportData | null = parseExportData(exportJson);

  // Legacy support for old export format
  const totalTokens = exportData?.stats?.totalTokensUsed || exportData?.totalTokensUsed || 0;
  const messageCount = exportData?.conversation?.messageCount || exportData?.messageCount || 0;
  const durationMs = exportData?.stats?.totalDurationMs || exportData?.totalDurationMs || 0;

  // New comprehensive data
  const context = exportData?.context || {};
  const evaluationCriteria = exportData?.evaluationCriteria || {};

  // Inline hasUserMessages usage for displayDuration
  const displayDuration = formatDuration(durationMs, messageCount > 0);

  // Copy to clipboard function
  const handleCopyToClipboard = async () => {
    if (!exportJson) return;
    try {
      await copyToClipboard(exportJson);
      showCopySuccess();
      setTimeout(() => closeCopySuccess(), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Handle AI evaluation
  const handleAIEvaluation = async () => {
    if (!exportData) return;
    // Collapse all except evaluation before starting
    setPanels(['evaluation']);
    const conversationData = buildConversationData(exportData);
    if (!conversationData) return;
    await evaluateConversation(conversationData);
  };

  useEffect(() => {
    if (!exportJson) return;
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/stats`);
        const data = await res.json();
        setStats({ speechDurationSeconds: data.speechDurationSeconds, audioCharacterCount: data.audioCharacterCount });
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      }
    };
    fetchStats();
  }, [exportJson]);

  // Ref for the markdown section
  const evaluationPdfRef = useRef<HTMLDivElement>(null!);

  // PDF download handler (markdown to PDF)
  const handleDownloadEvaluationPdf = async () => {
    if (!markdownText) return;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const html = await marked.parse(markdownText) as string;
    const container = document.createElement('div');
    container.innerHTML = html;
    doc.html(container, {
      callback: function (doc) {
        doc.save('evaluation-summary.pdf');
      },
      x: 32,
      y: 32,
      width: 530, // fit to A4
      windowWidth: 800,
    });
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
        <ExportDialogEvaluationContext
          expanded={isExpanded('context')}
          onChange={handleChange('context')}
          context={context}
        />

        {/* Statistics Section */}
        <ExportDialogStatistics
          expanded={isExpanded('stats')}
          onChange={handleChange('stats')}
          totalTokens={totalTokens}
          messageCount={messageCount}
          displayDuration={displayDuration}
          stats={stats}
        />

        {/* Evaluation Criteria Section */}
        <ExportDialogEvaluationCriteria
          expanded={isExpanded('criteria')}
          onChange={handleChange('criteria')}
          evaluationCriteria={evaluationCriteria}
        />

        {/* JSON Transcript Section */}
        <ExportDialogJsonTranscript
          expanded={isExpanded('transcript')}
          onChange={handleChange('transcript')}
          exportJson={exportJson}
          copySuccess={copySuccess}
          onCopy={handleCopyToClipboard}
        />

        {/* AI Evaluation Results Section */}
        <ExportDialogEvaluationResults
          expanded={isExpanded('evaluation')}
          onChange={handleChange('evaluation')}
          evaluationError={evaluationError}
          lastEvaluation={lastEvaluation}
          evaluationPdfRef={evaluationPdfRef}
          markdownText={markdownText}
          isEvaluating={isEvaluating}
        />

      </DialogContent>
      <ExportDialogActions
        onAIEvaluation={handleAIEvaluation}
        isEvaluating={isEvaluating}
        exportDataHasMessages={!!exportData?.conversation?.messages?.some((msg: any) => msg.role !== 'system')}
        onDownload={() => onDownload(exportJson!)}
        onDownloadPdf={handleDownloadEvaluationPdf}
        onClose={onClose}
      />
      <ExportDialogSnackbar open={copySuccess} onClose={closeCopySuccess} />
    </Dialog>
  );
};

export default ExportDialog;
