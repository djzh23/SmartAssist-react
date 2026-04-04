import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import HomePage from './pages/HomePage'
import ChatPage from './pages/ChatPage'
import ToolsPage from './pages/ToolsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="tools" element={<ToolsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
