import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { CssBaseline } from '@mui/material';
import './index.css';
import App from './App';
import ErrorFallback from './components/ErrorFallback';

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset the state of your app here
        window.location.href = '/';
      }}
    >
      <Router>
        <CssBaseline />
        <App />
      </Router>
    </ErrorBoundary>
  </StrictMode>
);
