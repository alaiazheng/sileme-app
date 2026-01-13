import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import CheckIn from './pages/CheckIn'
import Notifications from './pages/Notifications'
import Privacy from './pages/Privacy'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Register from './pages/Register'
import { AppProvider } from './context/AppContext'
import { AuthProvider } from './hooks/useAuth.jsx'

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <div className="App min-h-screen">
          <Routes>
            {/* 认证相关路由 */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* 主应用路由 */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="checkin" element={<CheckIn />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </div>
      </AppProvider>
    </AuthProvider>
  )
}

export default App