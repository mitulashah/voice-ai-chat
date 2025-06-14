import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import axios from 'axios';

interface Stats {
  llmTokenCount: number;
  speechDurationSeconds: number;
  audioCharacterCount: number;
}

const StatsPanel: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get<Stats>('http://localhost:5000/api/stats');
        setStats(response.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <Paper elevation={2} sx={{ p: 2, my: 2, display: 'flex', justifyContent: 'space-around' }}>
      <Box>
        <Typography variant="subtitle2">Tokens</Typography>
        <Typography variant="h6">{stats.llmTokenCount}</Typography>
      </Box>
      <Box>
        <Typography variant="subtitle2">Speech (s)</Typography>
        <Typography variant="h6">{stats.speechDurationSeconds.toFixed(2)}</Typography>
      </Box>
      <Box>
        <Typography variant="subtitle2">Audio chars</Typography>
        <Typography variant="h6">{stats.audioCharacterCount}</Typography>
      </Box>
    </Paper>
  );
};

export default StatsPanel;
