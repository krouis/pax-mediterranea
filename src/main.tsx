import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Foundation } from './app/Foundation';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Foundation />
  </StrictMode>,
);
