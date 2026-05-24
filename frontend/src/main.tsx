import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { BrowserRouter } from 'react-router-dom'

import { App } from './app/App'
import { TripPlanProvider } from './context/TripPlanContext'
import './styles/index.css'
import { theme } from './theme/theme'

const root = document.getElementById('app')

if (!root) {
  throw new Error('Root element #app was not found.')
}

createRoot(root).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <TripPlanProvider>
          <App />
        </TripPlanProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
