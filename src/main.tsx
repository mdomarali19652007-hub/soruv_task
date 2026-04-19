import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const root = document.getElementById('root');

/**
 * Render a plain-text fallback if the React root fails to mount.
 * We build the DOM imperatively (no innerHTML) so error messages
 * can never be interpreted as HTML -- which was a latent XSS sink.
 */
function renderFallback(target: HTMLElement, error: unknown) {
  target.textContent = '';

  const container = document.createElement('div');
  container.style.padding = '2rem';
  container.style.fontFamily = 'sans-serif';
  container.style.color = '#b91c1c';

  const heading = document.createElement('h1');
  heading.textContent = 'App failed to load';

  const message = document.createElement('pre');
  message.style.whiteSpace = 'pre-wrap';
  message.textContent = error instanceof Error ? error.message : String(error);

  container.appendChild(heading);
  container.appendChild(message);
  target.appendChild(container);
}

if (root) {
  try {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (error) {
    console.error('Failed to render app:', error);
    renderFallback(root, error);
  }
} else {
  console.error('Root element not found');
}
