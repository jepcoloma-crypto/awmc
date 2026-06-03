import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

async function startApp() {
  const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';
  if (useMocks) {
    const { worker } = await import('./mocks/browser');
    await worker.start({
      onUnhandledRequest: 'bypass',
      quiet: true,
    });
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

startApp();
