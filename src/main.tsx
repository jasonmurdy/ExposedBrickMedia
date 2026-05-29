import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { HelmetProvider } from 'react-helmet-async';

// Suppress benign ResizeObserver and cross-origin Script errors
window.addEventListener('error', (e) => {
  if (
    !e.message ||
    e.message === 'ResizeObserver loop completed with undelivered notifications.' ||
    e.message === 'ResizeObserver loop limit exceeded' ||
    e.message === 'Script error.' ||
    e.message === 'ResizeObserver loop limit exceeded.' ||
    e.message.includes('ResizeObserver') ||
    e.message.includes('Script error')
  ) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && (
    e.reason.message?.includes('ResizeObserver') ||
    e.reason.message?.includes('Script error')
  )) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' && 
    (args[0].includes('ResizeObserver loop completed with undelivered notifications.') ||
     args[0].includes('ResizeObserver loop limit exceeded') ||
     args[0].includes('Script error') ||
     args[0].includes('ResizeObserver'))
  ) {
    return;
  }
  originalError(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);
