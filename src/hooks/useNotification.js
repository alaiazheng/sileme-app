import { useEffect } from 'react'
import { useApp } from '../context/AppContext'

export function useNotification() {
  const { state, dispatch } = useApp()
  
  useEffect(() => {
    // 请求通知权限
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])
  
  const sendNotification = (title, options = {}) => {
    if (!state.settings.notificationEnabled) return
    
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        ...options
      })
      
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
      
      // 自动关闭通知
      setTimeout(() => {
        notification.close()
      }, 5000)
    }
  }
  
  const scheduleCheckInReminder = () => {
    if (!state.settings.checkInReminder) return
    
    // 设置每日提醒（这里简化处理，实际应用中可能需要更复杂的调度逻辑）
    const now = new Date()
    const reminderTime = new Date()
    reminderTime.setHours(9, 0, 0, 0) // 每天9点提醒
    
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1)
    }
    
    const timeUntilReminder = reminderTime.getTime() - now.getTime()
    
    setTimeout(() => {
      sendNotification('打卡提醒', {
        body: '别忘了今天的打卡哦！',
        tag: 'checkin-reminder'
      })
    }, timeUntilReminder)
  }
  
  return {
    sendNotification,
    scheduleCheckInReminder,
    isSupported: 'Notification' in window,
    permission: 'Notification' in window ? Notification.permission : 'denied'
  }
}