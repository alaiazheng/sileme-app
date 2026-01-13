import cron from 'cron'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import logger from '../config/logger.js'

class NotificationService {
  constructor(io) {
    this.io = io
    this.jobs = new Map()
    this.init()
  }
  
  init() {
    // 每分钟检查待发送的通知
    const checkPendingJob = new cron.CronJob('0 * * * * *', async () => {
      await this.processPendingNotifications()
    }, null, true, 'Asia/Shanghai')
    
    // 每天凌晨2点清理过期通知
    const cleanupJob = new cron.CronJob('0 0 2 * * *', async () => {
      await this.cleanupExpiredNotifications()
    }, null, true, 'Asia/Shanghai')
    
    // 每天早上9点发送打卡提醒
    const reminderJob = new cron.CronJob('0 0 9 * * *', async () => {
      await this.sendDailyReminders()
    }, null, true, 'Asia/Shanghai')
    
    this.jobs.set('checkPending', checkPendingJob)
    this.jobs.set('cleanup', cleanupJob)
    this.jobs.set('reminder', reminderJob)
    
    logger.info('通知服务已启动')
  }
  
  // 处理待发送的通知
  async processPendingNotifications() {
    try {
      const pendingNotifications = await Notification.getPendingNotifications()
      
      for (const notification of pendingNotifications) {
        await this.sendNotification(notification)
      }
      
      if (pendingNotifications.length > 0) {
        logger.info(`处理了 ${pendingNotifications.length} 条待发送通知`)
      }
      
    } catch (error) {
      logger.error('处理待发送通知错误:', error)
    }
  }
  
  // 发送通知
  async sendNotification(notification) {
    try {
      const user = notification.user
      
      // 检查用户是否启用了通知
      if (!user.settings.notificationEnabled) {
        await notification.markAsSent()
        return
      }
      
      // 通过WebSocket发送实时通知
      if (notification.channels.includes('websocket')) {
        this.io.to(`user_${user._id}`).emit('notification', {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          createdAt: notification.createdAt
        })
      }
      
      // 这里可以添加其他通知渠道的实现
      // 如邮件、短信、推送通知等
      
      await notification.markAsSent()
      logger.info(`通知已发送: ${notification.title} -> ${user.username}`)
      
    } catch (error) {
      logger.error('发送通知错误:', error)
    }
  }
  
  // 清理过期通知
  async cleanupExpiredNotifications() {
    try {
      const result = await Notification.cleanupExpired()
      
      if (result.deletedCount > 0) {
        logger.info(`清理了 ${result.deletedCount} 条过期通知`)
      }
      
    } catch (error) {
      logger.error('清理过期通知错误:', error)
    }
  }
  
  // 发送每日打卡提醒
  async sendDailyReminders() {
    try {
      const users = await User.find({
        isActive: true,
        'settings.checkInReminder': true,
        'settings.notificationEnabled': true
      })
      
      let sentCount = 0
      
      for (const user of users) {
        // 检查今天是否已经打卡
        const CheckIn = (await import('../models/CheckIn.js')).default
        const hasCheckedIn = await CheckIn.hasCheckedInToday(user._id)
        
        if (!hasCheckedIn) {
          await Notification.createReminderNotification(user._id, new Date())
          sentCount++
        }
      }
      
      if (sentCount > 0) {
        logger.info(`发送了 ${sentCount} 条打卡提醒`)
      }
      
    } catch (error) {
      logger.error('发送每日提醒错误:', error)
    }
  }
  
  // 创建即时通知
  async createInstantNotification(userId, title, message, type = 'info', data = {}) {
    try {
      const notification = await Notification.create({
        user: userId,
        title,
        message,
        type,
        data,
        channels: ['websocket', 'push']
      })
      
      // 立即发送
      const populatedNotification = await Notification.findById(notification._id)
        .populate('user', 'username settings.notificationEnabled')
      
      await this.sendNotification(populatedNotification)
      
      return notification
      
    } catch (error) {
      logger.error('创建即时通知错误:', error)
      throw error
    }
  }
  
  // 创建计划通知
  async createScheduledNotification(userId, title, message, scheduledFor, type = 'info', data = {}) {
    try {
      const notification = await Notification.create({
        user: userId,
        title,
        message,
        type,
        scheduledFor,
        isScheduled: true,
        data,
        channels: ['websocket', 'push']
      })
      
      return notification
      
    } catch (error) {
      logger.error('创建计划通知错误:', error)
      throw error
    }
  }
  
  // 停止所有定时任务
  stop() {
    this.jobs.forEach((job, name) => {
      job.stop()
      logger.info(`停止定时任务: ${name}`)
    })
    this.jobs.clear()
  }
}

export default NotificationService