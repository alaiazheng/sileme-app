import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Settings, Bell, User, LogOut } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../hooks/useAuth.jsx'

const pageNames = {
  '/': '死了么',
  '/checkin': '一键打卡',
  '/notifications': '紧急通知',
  '/privacy': '隐私保护',
  '/settings': '设置'
}

export default function Header() {
  const location = useLocation()
  const { state } = useApp()
  const { user, isAuthenticated, logout } = useAuth()
  const unreadCount = state.notifications.filter(n => !n.read).length
  
  const handleLogout = async () => {
    await logout()
  }
  
  return (
    <header className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 safe-area-top">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-green to-brand-green-light rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full opacity-80"></div>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">
            {pageNames[location.pathname] || '死了么'}
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <div className="relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
              </div>
            </div>
          )}
          
          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">{user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                title="退出登录"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-sm text-brand-green hover:text-brand-green-dark transition-colors"
              >
                登录
              </Link>
              <Settings className="w-5 h-5 text-gray-600" />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}