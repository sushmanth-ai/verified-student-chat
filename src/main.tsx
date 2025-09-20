import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProfileProvider } from './contexts/ProfileContext'
import { Toaster } from './components/ui/toaster'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider>
          <App />
          <Toaster />
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
