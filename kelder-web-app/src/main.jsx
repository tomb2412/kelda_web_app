import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ThemeProvider } from './componants/ThemeContext.jsx'
import App from './App.jsx'
import Header from './componants/header'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <Header/>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
