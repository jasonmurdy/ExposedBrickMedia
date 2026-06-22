import React, { Component, ErrorInfo, ReactNode } from 'react';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { HelmetProvider } from 'react-helmet-async';

// Suppress benign ResizeObserver and cross-origin Script errors
window.addEventListener('error', (e) => {
  if (
    e.message && (
      e.message === 'ResizeObserver loop completed with undelivered notifications.' ||
      e.message === 'ResizeObserver loop limit exceeded' ||
      e.message === 'Script error.' ||
      e.message === 'ResizeObserver loop limit exceeded.' ||
      e.message.includes('ResizeObserver') ||
      e.message.includes('Script error')
    )
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

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in React tree:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', fontFamily: 'monospace' }}>
          <h2>React Rendering Error</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
);
