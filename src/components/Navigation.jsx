import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, CheckCircle, Bell, Shield, Settings } from 'lucide-react'

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/checkin', icon: CheckCircle, label: '打卡' },
  { path: '/notifications', icon: Bell, label: '通知' },
  { path: '/privacy', icon: Shield, label: '隐私' },
  { path: '/settings', icon: Settings, label: '设置' },
]

export default function Navigation() {
  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-gray-100 safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-brand-green bg-green-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}