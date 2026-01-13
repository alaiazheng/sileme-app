import { format, isToday, isYesterday, differenceInDays } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function formatRelativeDate(date) {
  const targetDate = new Date(date)
  
  if (isToday(targetDate)) {
    return '今天'
  }
  
  if (isYesterday(targetDate)) {
    return '昨天'
  }
  
  const daysDiff = differenceInDays(new Date(), targetDate)
  
  if (daysDiff <= 7) {
    return `${daysDiff}天前`
  }
  
  return format(targetDate, 'MM月dd日', { locale: zhCN })
}

export function formatTime(date) {
  return format(new Date(date), 'HH:mm')
}

export function formatDateTime(date) {
  return format(new Date(date), 'MM月dd日 HH:mm', { locale: zhCN })
}

export function getGreeting() {
  const hour = new Date().getHours()
  
  if (hour < 6) {
    return '夜深了'
  } else if (hour < 12) {
    return '早上好'
  } else if (hour < 14) {
    return '中午好'
  } else if (hour < 18) {
    return '下午好'
  } else if (hour < 22) {
    return '晚上好'
  } else {
    return '夜深了'
  }
}