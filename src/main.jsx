import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { DataProvider } from './context/DataContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <DataProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </DataProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
