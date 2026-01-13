import React, { createContext, useContext, useReducer, useEffect } from 'react'

const AppContext = createContext()

const initialState = {
  user: {
    name: '用户',
    avatar: null,
    joinDate: new Date().toISOString(),
  },
  checkIns: JSON.parse(localStorage.getItem('sileme_checkins') || '[]'),
  notifications: JSON.parse(localStorage.getItem('sileme_notifications') || '[]'),
  settings: {
    notificationEnabled: true,
    emergencyContacts: JSON.parse(localStorage.getItem('sileme_emergency_contacts') || '[]'),
    checkInReminder: true,
    theme: 'light',
  },
  stats: {
    totalCheckIns: 0,
    currentStreak: 0,
    longestStreak: 0,
  }
}

function appReducer(state, action) {
  switch (action.type) {
    case 'ADD_CHECKIN':
      const newCheckIns = [...state.checkIns, action.payload]
      localStorage.setItem('sileme_checkins', JSON.stringify(newCheckIns))
      return {
        ...state,
        checkIns: newCheckIns,
        stats: calculateStats(newCheckIns)
      }
    
    case 'ADD_NOTIFICATION':
      const newNotifications = [...state.notifications, action.payload]
      localStorage.setItem('sileme_notifications', JSON.stringify(newNotifications))
      return {
        ...state,
        notifications: newNotifications
      }
    
    case 'MARK_NOTIFICATION_READ':
      const updatedNotifications = state.notifications.map(notif =>
        notif.id === action.payload ? { ...notif, read: true } : notif
      )
      localStorage.setItem('sileme_notifications', JSON.stringify(updatedNotifications))
      return {
        ...state,
        notifications: updatedNotifications
      }
    
    case 'UPDATE_SETTINGS':
      const newSettings = { ...state.settings, ...action.payload }
      Object.keys(action.payload).forEach(key => {
        if (key === 'emergencyContacts') {
          localStorage.setItem('sileme_emergency_contacts', JSON.stringify(action.payload[key]))
        }
      })
      return {
        ...state,
        settings: newSettings
      }
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      }
    
    case 'LOAD_DATA':
      return {
        ...state,
        stats: calculateStats(state.checkIns)
      }
    
    default:
      return state
  }
}

function calculateStats(checkIns) {
  const totalCheckIns = checkIns.length
  
  if (totalCheckIns === 0) {
    return { totalCheckIns: 0, currentStreak: 0, longestStreak: 0 }
  }
  
  // 按日期排序
  const sortedCheckIns = [...checkIns].sort((a, b) => new Date(a.date) - new Date(b.date))
  
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 1
  
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  // 计算当前连续天数
  const lastCheckIn = new Date(sortedCheckIns[sortedCheckIns.length - 1].date)
  const isToday = lastCheckIn.toDateString() === today.toDateString()
  const isYesterday = lastCheckIn.toDateString() === yesterday.toDateString()
  
  if (isToday || isYesterday) {
    currentStreak = 1
    
    // 向前查找连续天数
    for (let i = sortedCheckIns.length - 2; i >= 0; i--) {
      const currentDate = new Date(sortedCheckIns[i + 1].date)
      const prevDate = new Date(sortedCheckIns[i].date)
      const diffTime = currentDate - prevDate
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) {
        currentStreak++
      } else {
        break
      }
    }
  }
  
  // 计算最长连续天数
  for (let i = 1; i < sortedCheckIns.length; i++) {
    const currentDate = new Date(sortedCheckIns[i].date)
    const prevDate = new Date(sortedCheckIns[i - 1].date)
    const diffTime = currentDate - prevDate
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) {
      tempStreak++
    } else {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 1
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak)
  
  return { totalCheckIns, currentStreak, longestStreak }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  
  useEffect(() => {
    dispatch({ type: 'LOAD_DATA' })
  }, [])
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}