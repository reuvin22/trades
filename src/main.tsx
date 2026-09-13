import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './components/ToastProvider'
import { ImageViewerProvider } from './components/ImageViewerProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <ImageViewerProvider>
        <App />
      </ImageViewerProvider>
    </ToastProvider>
  </StrictMode>,
)

