import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ThemeProvider } from './components/ThemeContext.jsx'
import App from './App.jsx'
import Header from './components/header'
import { ClerkProvider } from '@clerk/clerk-react'
import { SensorDataProvider } from './context/SensorDataContext.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <SensorDataProvider>
          <Header/>
          <App />
        </SensorDataProvider>
      </ClerkProvider>
    </ThemeProvider>
  </StrictMode>,
)
