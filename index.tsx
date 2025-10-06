import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { playAudio } from './utils/audioHelper';

// Expose for browser console testing
(window as any).playAudio = playAudio;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
