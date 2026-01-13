// 简单的内存数据库 - 用于开发测试
import logger from './logger.js'

class MemoryDB {
  constructor() {
    this.data = {
      users: [],
      checkins: [],
      notifications: []
    }
    this.connected = false
  }

  connect() {
    this.connected = true
    logger.info('内存数据库连接成功')
    return Promise.resolve()
  }

  disconnect() {
    this.connected = false
    logger.info('内存数据库断开连接')
    return Promise.resolve()
  }

  // 生成ID
  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  // 用户操作
  async createUser(userData) {
    const user = {
      _id: this.generateId(),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.data.users.push(user)
    return user
  }

  async findUserByEmail(email) {
    return this.data.users.find(user => user.email === email) || null
  }

  async findUserByUsername(username) {
    return this.data.users.find(user => user.username === username) || null
  }

  async findUserById(id) {
    return this.data.users.find(user => user._id === id) || null
  }

  async updateUser(id, updateData) {
    const index = this.data.users.findIndex(user => user._id === id)
    if (index !== -1) {
      this.data.users[index] = {
        ...this.data.users[index],
        ...updateData,
        updatedAt: new Date()
      }
      return this.data.users[index]
    }
    return null
  }

  // 打卡操作
  async createCheckIn(checkinData) {
    const checkin = {
      _id: this.generateId(),
      ...checkinData,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.data.checkins.push(checkin)
    return checkin
  }

  async findCheckInsByUser(userId, options = {}) {
    let checkins = this.data.checkins
      .filter(checkin => checkin.user === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
    if (options.limit) {
      checkins = checkins.slice(0, options.limit)
    }
    return checkins
  }

  async findTodayCheckIn(userId) {
    const today = new Date().toDateString()
    return this.data.checkins.find(checkin => 
      checkin.user === userId && 
      new Date(checkin.createdAt).toDateString() === today
    ) || null
  }

  // 通知操作
  async createNotification(notificationData) {
    const notification = {
      _id: this.generateId(),
      ...notificationData,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.data.notifications.push(notification)
    return notification
  }

  async findNotificationsByUser(userId, options = {}) {
    let notifications = this.data.notifications
      .filter(notification => notification.user === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
    if (options.limit) {
      notifications = notifications.slice(0, options.limit)
    }
    return notifications
  }

  async updateNotification(id, updateData) {
    const index = this.data.notifications.findIndex(notification => notification._id === id)
    if (index !== -1) {
      this.data.notifications[index] = {
        ...this.data.notifications[index],
        ...updateData,
        updatedAt: new Date()
      }
      return this.data.notifications[index]
    }
    return null
  }

  async deleteNotification(id) {
    const index = this.data.notifications.findIndex(notification => notification._id === id)
    if (index !== -1) {
      return this.data.notifications.splice(index, 1)[0]
    }
    return null
  }

  // 统计操作
  async getCheckInStats(userId) {
    const checkins = this.data.checkins.filter(checkin => checkin.user === userId)
    const totalCheckIns = checkins.length
    
    // 计算连续天数
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    
    const sortedCheckins = checkins
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(checkin => new Date(checkin.createdAt).toDateString())
    
    const uniqueDates = [...new Set(sortedCheckins)]
    
    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0 || this.isConsecutiveDay(uniqueDates[i-1], uniqueDates[i])) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak)
    
    // 检查当前连续天数
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()
    
    if (uniqueDates.includes(today)) {
      currentStreak = this.calculateCurrentStreak(uniqueDates, today)
    } else if (uniqueDates.includes(yesterday)) {
      currentStreak = this.calculateCurrentStreak(uniqueDates, yesterday)
    }
    
    return {
      totalCheckIns,
      currentStreak,
      longestStreak,
      lastCheckIn: checkins.length > 0 ? new Date(Math.max(...checkins.map(c => new Date(c.createdAt)))) : null
    }
  }

  isConsecutiveDay(date1, date2) {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    const diffTime = Math.abs(d2 - d1)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays === 1
  }

  calculateCurrentStreak(dates, endDate) {
    let streak = 0
    let currentDate = new Date(endDate)
    
    while (dates.includes(currentDate.toDateString())) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    }
    
    return streak
  }
}

export default new MemoryDB()