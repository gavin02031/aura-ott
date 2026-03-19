import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

function BootErrorFallback({ error }) {
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui', color: '#fff', background: '#0A0E17', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Aura failed to start</h1>
      <p style={{ fontSize: 14, opacity: 0.9, marginBottom: 12 }}>
        A runtime error occurred. Open the browser console for details.
      </p>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#141A24', border: '1px solid rgba(255,255,255,0.1)', padding: 12, borderRadius: 12 }}>
        {String(error?.message || error)}
      </pre>
    </div>
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  try {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
  } catch (err) {
    ReactDOM.createRoot(rootEl).render(<BootErrorFallback error={err} />);
  }
}

// PWA install support (Add to Home Screen / standalone)
// Note: this repo does not include a real `sw.js`, so registering it causes noisy runtime errors.
// iOS can still "Add to Home Screen" using `manifest.webmanifest` and `apple-touch-icon`.

