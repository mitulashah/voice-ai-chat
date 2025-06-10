import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { CssBaseline } from '@mui/material';
import './index.css';
import App from './App';

// Simple error fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div role="alert" style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Something went wrong</h2>
      <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

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
