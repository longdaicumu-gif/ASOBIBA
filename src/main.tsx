import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const root = document.getElementById('game-container')!;
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
