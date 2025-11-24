import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { MainLayout } from './layout/MainLayout'
import Dashboard from './pages/dashboard/Dashboard'
import Rules from './pages/Rules/Rules'
import { Toaster } from './components/ui/sonner'

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" closeButton />
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="rules" element={<Rules />} />
          <Route path="settings" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
