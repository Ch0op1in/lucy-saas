import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { MainLayout } from './layout/MainLayout'
import Dashboard from './pages/dashboard/Dashboard'



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="settings" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
