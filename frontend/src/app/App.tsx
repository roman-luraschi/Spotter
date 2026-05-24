import { Navigate, Route, Routes } from 'react-router-dom'

import { LandingPage } from './routes/LandingPage'
import { PlanPage } from './routes/PlanPage'

export function App() {
  return (
    <Routes>
      <Route element={<LandingPage />} path="/" />
      <Route element={<PlanPage />} path="/plan" />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  )
}
