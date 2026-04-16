import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const root = document.getElementById('root');

if (root) {
  try {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (error) {
    console.error('Failed to render app:', error);
    root.innerHTML = `<div style="padding:2rem;font-family:sans-serif;color:red;">
      <h1>App failed to load</h1>
      <pre>${error instanceof Error ? error.message : String(error)}</pre>
    </div>`;
  }
} else {
  console.error('Root element not found');
}
