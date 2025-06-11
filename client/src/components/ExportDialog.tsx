import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, Button } from '@mui/material';

interface ExportDialogProps {
  exportJson: string | null;
  onClose: () => void;
  onDownload: (json: string) => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ exportJson, onClose, onDownload }) => {
  return (
    <Dialog
      open={Boolean(exportJson)}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Export Conversation as JSON</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" paragraph>
          Your conversation data is ready. Below is the JSON export of your chat:
        </Typography>
        <Box component="pre" sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, maxHeight: 300, overflow: 'auto' }}>
          {exportJson}
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={() => exportJson && onDownload(exportJson)}
          sx={{ mt: 1 }}
        >
          Download JSON
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;
